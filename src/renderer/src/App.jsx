import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

import { useState, useRef, useEffect } from 'react';
import Message from './components/Message';     // Custom Message component (for the text field)
import ChatInput from './components/ChatInput'; // Custom ChatInput component (for chat queries)
import Sidebar from './components/Sidebar';     // Custom sidebar (React Component)

function App() {

  const ipcHandle = () => window.electron.ipcRenderer.send('ping')
  
  // Setting up a state for our messages
  // These are only here since we don't have ollama setup yet

  const [messages, setmessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?' },
    { role: 'user', content: 'I want to learn about setting up a React frontent.' },
    { role: 'assistant', content: 'Great! We can start by planning the component structure! '},
  ]);

  const [selectedModel, setSelectedModel] = useState('llama3'); // add state for the model
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // This function handles new messages
  const handleSendMessage = (content) => {
    const userMessage = { role: 'user', content };
    setmessages((prevMessages) => [...prevMessages, userMessage]);

    // TODO: This is where you will eventually call the Ollama API
  };

  return (
    <div className="flex h-screen font-sans text-white">
      <Sidebar selectedModel={selectedModel} setSelectedModel={setSelectedModel} />

      <div className="flex-1 flex flex-col bg-gray-800">
        <div className="flex-1 flex justify-center overflow-y-auto">
          <div className="w-full max-w-4xl p-6 space-y-8">
            {messages.map((msg, index) => (
              <Message key={index} role={msg.role} content={msg.content} />
            ))}
            {/* 5. Add the invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="flex justify-center p-4">
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}

export default App
