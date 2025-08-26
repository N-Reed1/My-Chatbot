import React, { useMemo, useRef } from 'react'; // THE FIX: Add useMemo and useRef here
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Papa from 'papaparse';

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
    const paragraphs = content.split('\n').map(line => new Paragraph({ children: [new TextRun(line)] }));
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
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
      <div className="flex justify-end">
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
      className="group w-full p-4 rounded-lg"
      style={{ backgroundColor: '#27272a' }}
      ref={messageRef}
    >
      <div className="prose prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
      
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 mt-2 flex items-center space-x-2">
        <button onClick={handleExportPDF} className="p-1 text-gray-400 hover:text-white cursor-pointer" title="Export as PDF">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        </button>
        <button onClick={handleExportDOCX} className="p-1 text-gray-400 hover:text-white cursor-pointer" title="Export as DOCX">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm5.293 2.293a1 1 0 011.414 0l2 2a1 1 0 11-1.414 1.414L11 8.414V13a1 1 0 11-2 0V8.414L8.707 9.707a1 1 0 01-1.414-1.414l2-2z" clipRule="evenodd"></path></svg>
        </button>
        {hasTableData && (
          <button onClick={handleExportCSV} className="p-1 text-gray-400 hover:text-white cursor-pointer" title="Export as CSV">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V7zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd"></path></svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default Message;