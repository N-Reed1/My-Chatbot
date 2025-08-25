import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun } from 'docx';

function Message({ role, content, files }) { // Accept a 'files' prop
  const messageRef = React.useRef(null);

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


  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-lg bg-zinc-700 py-2 px-4 rounded-2xl">
          {/* Display attached files for user messages */}
          {files && files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map(file => (
                <div key={file.path} className="bg-zinc-600 text-sm rounded-full px-3 py-1">
                  <span>{file.name}</span>
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
      <p className="whitespace-pre-wrap text-white break-words">{content}</p>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 mt-2 flex items-center space-x-2">
        <button onClick={handleExportPDF} className="p-1 text-gray-400 hover:text-white cursor-pointer" title="Export as PDF">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        </button>
        <button onClick={handleExportDOCX} className="p-1 text-gray-400 hover:text-white cursor-pointer" title="Export as DOCX">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm5.293 2.293a1 1 0 011.414 0l2 2a1 1 0 11-1.414 1.414L11 8.414V13a1 1 0 11-2 0V8.414L8.707 9.707a1 1 0 01-1.414-1.414l2-2z" clipRule="evenodd"></path></svg>
        </button>
      </div>
    </div>
  );
}

export default Message;