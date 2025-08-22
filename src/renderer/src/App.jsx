import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

import { useState, useRef, useEffect } from 'react';
import Message from './components/Message';             // Custom Message component (for the text field)
import ChatInput from './components/ChatInput';         // Custom ChatInput component (for chat queries)
import Sidebar from './components/Sidebar';             // Custom sidebar (React Component)
import ModelSelector from './components/ModelSelector'; // The dropdown for the LLM model (React Component)

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);     // add state for sidebar

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
    <div className="flex h-screen font-sans text-white bg-zinc-800">
      {/* Pass only the sidebar state props */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with Model Selector */}
        <div className="flex justify-center p-4">
          <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
        </div>

        {/* Message Container */}
        <div className="flex-1 flex justify-center overflow-y-auto">
          <div className="w-full max-w-4xl p-6 space-y-8">
            {messages.map((msg, index) => (
              <Message key={index} role={msg.role} content={msg.content} />
            ))}
          </div>
        </div>

        {/* Input Container */}
        <div className="flex justify-center p-4">
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}

export default App
