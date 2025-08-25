import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function Message({ role, content }) {
  const messageRef = React.useRef(null);

  const handleExportPDF = async () => {
    const input = messageRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, {
      useCORS: true,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    const pdfData = pdf.output('arraybuffer');
    
    await window.api.saveFile(new Uint8Array(pdfData), {
      title: 'Save Chat Export',
      defaultPath: 'chat-export.pdf',
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
    });
  };

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-lg bg-zinc-700 py-2 px-4 rounded-2xl">
          <p className="text-white break-words whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    // THE FIX: Replaced `bg-zinc-800` with an inline style using a hex code
    // that html2canvas can reliably parse.
    <div
      className="group w-full p-4 rounded-lg"
      style={{ backgroundColor: '#27272a' }}
      ref={messageRef}
    >
      <p className="whitespace-pre-wrap text-white break-words">{content}</p>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
        <button onClick={handleExportPDF} className="p-1 text-gray-400 hover:text-white cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        </button>
      </div>
    </div>
  );
}

export default Message;