import React, { useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Papa from 'papaparse';

// Helper function to parse markdown for DOCX export
const parseMarkdownForDocx = (markdown) => {
  const paragraphs = markdown.split('\n').map(line => {
    const trimmedLine = line.trim();
    const indentation = line.search(/\S|$/);
    const level = Math.floor(indentation / 2);

    // Handle Headings (e.g., #, ##)
    const headingMatch = trimmedLine.match(/^(#+)\s(.*)/);
    if (headingMatch) {
      const headingLevel = headingMatch[1].length;
      const headingText = headingMatch[2];
      let docxHeadingLevel;
      switch (headingLevel) {
        case 1: docxHeadingLevel = HeadingLevel.HEADING_1; break;
        case 2: docxHeadingLevel = HeadingLevel.HEADING_2; break;
        case 3: docxHeadingLevel = HeadingLevel.HEADING_3; break;
        default: docxHeadingLevel = HeadingLevel.HEADING_4; break;
      }
      return new Paragraph({ text: headingText, heading: docxHeadingLevel });
    }

    // Handle Bullet Points
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('+ ')) {
      const text = trimmedLine.substring(2);
      const children = [];
      const formattingRegex = /(\*\*(.*?)\*\*|\*(.*?)\*|_(.*?)_)/g;
      let lastIndex = 0;
      let match;
      while ((match = formattingRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          children.push(new TextRun(text.substring(lastIndex, match.index)));
        }
        if (match[2]) { children.push(new TextRun({ text: match[2], bold: true })); }
        else if (match[3]) { children.push(new TextRun({ text: match[3], italics: true })); }
        else if (match[4]) { children.push(new TextRun({ text: match[4], italics: true })); }
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        children.push(new TextRun(text.substring(lastIndex)));
      }
      return new Paragraph({ children: children, bullet: { level: level } });
    }

    // Handle Bold and Italics in regular paragraphs
    const children = [];
    const formattingRegex = /(\*\*(.*?)\*\*|\*(.*?)\*|_(.*?)_)/g;
    let lastIndex = 0;
    let match;

    while ((match = formattingRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        children.push(new TextRun(line.substring(lastIndex, match.index)));
      }
      if (match[2]) { children.push(new TextRun({ text: match[2], bold: true })); }
      else if (match[3]) { children.push(new TextRun({ text: match[3], italics: true })); }
      else if (match[4]) { children.push(new TextRun({ text: match[4], italics: true })); }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
      children.push(new TextRun(line.substring(lastIndex)));
    }
    
    return new Paragraph({ children });
  });

  return paragraphs;
};


function Message({ role, content, files }) {
  const messageRef = useRef(null);

  const hasTableData = useMemo(() => {
    return content.includes('|') && content.includes('---');
  }, [content]);

  const handleExportPDF = async () => {
    const input = messageRef.current;
    if (!input) return;
    const canvas = await html2canvas(input, {
      useCORS: true,
      backgroundColor: '#27272a'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const pdfData = pdf.output('arraybuffer');
    await window.api.saveFile(new Uint8Array(pdfData), {
      title: 'Save Chat Export as PDF',
      defaultPath: 'chat-export.pdf',
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
    });
  };

  const handleExportDOCX = async () => {
    const paragraphs = parseMarkdownForDocx(content);
    const doc = new Document({ sections: [{ children: paragraphs }] });
    const docxBlob = await Packer.toBlob(doc);
    const docxData = await docxBlob.arrayBuffer();
    await window.api.saveFile(new Uint8Array(docxData), {
      title: 'Save Chat Export as DOCX',
      defaultPath: 'chat-export.docx',
      filters: [{ name: 'Word Documents', extensions: ['docx'] }]
    });
  };


  const handleExportCSV = async () => {
    const lines = content.split('\n').filter(line => line.includes('|'));
    const dataLines = lines.filter(line => !line.match(/\|-{3,}\|/));

    if (dataLines.length === 0) {
      console.log("No table data found to export.");
      return;
    }

    const data = dataLines.map(line => 
      line.split('|').map(cell => cell.trim()).slice(1, -1)
    );

    const csv = Papa.unparse(data);
    const csvData = new TextEncoder().encode(csv);
    
    await window.api.saveFile(csvData, {
      title: 'Save Chat Export as CSV',
      defaultPath: 'chat-export.csv',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });
  };

  if (role === 'user') {
    return (
      <div className="flex justify-end animate-fadeInUp">
        <div className="max-w-lg bg-zinc-700 py-2 px-4 rounded-2xl">
          {files && files.length > 0 && (
            <div className="mb-2 flex flex-col gap-2">
              {files.map(file => (
                <div key={file.path} className="bg-zinc-800 p-2 rounded-lg flex items-center">
                  <div className="bg-pink-500 p-2 rounded-md flex-shrink-0 mr-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{file.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-white break-words whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div
      className="group w-full p-4 rounded-lg animate-fadeInUp"
      style={{ backgroundColor: '#27272a' }}
      ref={messageRef}
    >
      <div className="prose prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
      
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 mt-2 inline-flex items-center bg-zinc-700 rounded-md shadow-lg p-1 space-x-1">
        <button onClick={handleExportPDF} className="p-1 text-gray-400 hover:bg-zinc-600 hover:text-white rounded cursor-pointer" title="Export as PDF">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        </button>
        <button onClick={handleExportDOCX} className="p-1 text-gray-400 hover:bg-zinc-600 hover:text-white rounded cursor-pointer" title="Export as DOCX">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm5.293 2.293a1 1 0 011.414 0l2 2a1 1 0 11-1.414 1.414L11 8.414V13a1 1 0 11-2 0V8.414L8.707 9.707a1 1 0 01-1.414-1.414l2-2z" clipRule="evenodd"></path></svg>
        </button>
        {hasTableData && (
          <button onClick={handleExportCSV} className="p-1 text-gray-400 hover:bg-zinc-600 hover:text-white rounded cursor-pointer" title="Export as CSV">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm2 2v2h3V5H4zm0 4v2h3V9H4zm0 4v2h3v-2H4zm5-8v2h3V5H9zm0 4v2h3V9H9zm0 4v2h3v-2H9zm5-8v2h3V5h-3zm0 4v2h3V9h-3z"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default Message;