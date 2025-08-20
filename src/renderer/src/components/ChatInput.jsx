// src/renderer/src/components/ChatInput.jsx
import { useState, useRef, useEffect } from 'react';

function ChatInput({ onSendMessage }) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);

  // This effect adjusts the textarea's height based on its content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`; // Set to new height
    }
  }, [prompt]); // Re-run this effect whenever the prompt changes

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    onSendMessage(prompt);
    setPrompt('');
  };

  const handleKeyDown = (e) => {
    // Submit on Enter, but allow new lines with Shift + Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line on submit
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl">
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        className="w-full p-3 rounded-xl bg-gray-700 text-white focus:outline-none resize-none overflow-y-auto"
        style={{ maxHeight: '12rem' }} // Equivalent to max-h-48
        rows="1"
      />
    </form>
  );
}

export default ChatInput;