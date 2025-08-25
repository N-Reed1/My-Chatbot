import { useState, useRef, useEffect } from 'react';

function ChatInput({ onSendMessage, isLoading }) {
  const [prompt, setPrompt] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]); // State for attached files
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
    // Don't send if loading or if there's no text AND no files
    if (isLoading || (!prompt.trim() && attachedFiles.length === 0)) return;
    
    // Pass both prompt and files to the parent
    onSendMessage(prompt, attachedFiles);
    
    setPrompt('');
    setAttachedFiles([]); // Clear files after sending
  };

  const handleAttachClick = async () => {
    const newFiles = await window.api.openFileDialog();
    if (newFiles && newFiles.length > 0) {
      // Combine new files with existing ones, enforcing a 10-file limit
      setAttachedFiles(prevFiles => {
        const combined = [...prevFiles, ...newFiles.map(path => ({ path, name: path.split(/[\\/]/).pop() }))];
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
      {/* Display for attached files */}
      {attachedFiles.length > 0 && (
        <div className="mb-2 p-2 bg-zinc-800 rounded-lg flex flex-wrap gap-2">
          {attachedFiles.map(file => (
            <div key={file.path} className="bg-zinc-700 text-sm rounded-full px-3 py-1 flex items-center">
              <span>{file.name}</span>
              <button onClick={() => handleRemoveFile(file.path)} type="button" className="ml-2 text-gray-400 hover:text-white">
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end bg-zinc-700 rounded-xl p-2">
        <button
          type="button"
          onClick={handleAttachClick} // Attach the click handler
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

        {(prompt.trim() || attachedFiles.length > 0) && !isLoading && (
          <button
            type="submit"
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 ml-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
          </button>
        )}
      </div>
    </form>
  );
}

export default ChatInput;