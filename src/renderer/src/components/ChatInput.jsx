import { useState, useRef, useEffect } from 'react';

function ChatInput({ onSendMessage, isLoading, onCancel }) {
  const [prompt, setPrompt] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [prompt]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading || (!prompt.trim() && attachedFiles.length === 0)) return;
    onSendMessage(prompt, attachedFiles);
    setPrompt('');
    setAttachedFiles([]);
  };

  const handleAttachClick = async () => {
    const newFiles = await window.api.openFileDialog();
    if (newFiles && newFiles.length > 0) {
      setAttachedFiles(prevFiles => {
        const combined = [...prevFiles, ...newFiles.map(path => ({
          path,
          name: path.split(/[\\/]/).pop(),
          type: path.split('.').pop().toUpperCase()
        }))];
        return combined.slice(0, 10);
      });
    }
  };

  const handleRemoveFile = (filePathToRemove) => {
    setAttachedFiles(prevFiles => prevFiles.filter(file => file.path !== filePathToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl">
      {attachedFiles.length > 0 && (
        <div className="mb-2 p-2 bg-zinc-800 rounded-lg flex flex-col gap-2">
          {attachedFiles.map(file => (
            <div key={file.path} className="bg-zinc-700 p-2 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-pink-500 p-2 rounded-md flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{file.type}</p>
                </div>
              </div>
              <button onClick={() => handleRemoveFile(file.path)} type="button" className="ml-2 text-gray-400 hover:text-white cursor-pointer flex-shrink-0">
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end bg-zinc-700 rounded-xl p-2">
        <button
          type="button"
          onClick={handleAttachClick}
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 mr-2 rounded-full text-gray-400 hover:bg-zinc-600 hover:text-white transition-colors cursor-pointer"
          disabled={isLoading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
        </button>

        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? 'Waiting for response...' : 'Ask anything...'}
          className="flex-1 p-1 bg-transparent text-white focus:outline-none resize-none overflow-y-auto"
          style={{ maxHeight: '12rem' }}
          rows="1"
          disabled={isLoading}
        />

        <div className="relative w-8 h-8 ml-2 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className={`absolute inset-0 flex items-center justify-center w-8 h-8 rounded-full bg-zinc-600 text-white hover:bg-zinc-500 transition-all duration-200 cursor-pointer ${isLoading ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
          <button
            type="submit"
            className={`absolute inset-0 flex items-center justify-center w-8 h-8 rounded-full bg-white text-black hover:bg-gray-200 transition-all duration-200 cursor-pointer ${!isLoading && (prompt.trim() || attachedFiles.length > 0) ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
          </button>
        </div>
      </div>
    </form>
  );
}

export default ChatInput;