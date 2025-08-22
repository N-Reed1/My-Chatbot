// src/renderer/src/components/ChatInput.jsx
import { useState, useRef, useEffect } from 'react';

function ChatInput({ onSendMessage }) {
  const [prompt, setPrompt] = useState('');
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
    if (!prompt.trim()) return;
    onSendMessage(prompt);
    setPrompt('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl">
      {/* Use zinc for the textarea */}
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        className="w-full p-3 rounded-xl bg-zinc-700 text-white focus:outline-none resize-none overflow-y-auto"
        style={{ maxHeight: '12rem' }}
        rows="1"
      />
    </form>
  );
}

export default ChatInput;