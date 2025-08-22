import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

import { useState, useRef, useEffect } from 'react';
import Message from './components/Message';                     // Custom Message component (for the text field)
import ChatInput from './components/ChatInput';                 // Custom ChatInput component (for chat queries)
import Sidebar from './components/Sidebar';                     // Custom sidebar (React Component)
import ModelSelector from './components/ModelSelector';         // The dropdown for the LLM model (React Component)
import ThinkingIndicator from './components/ThinkingIndicator'; // Displays the words "Thinking" while waiting for response (React Component)
import TitleBar from './components/TitleBar';                   // This is the top bar where the user can exit and minimize (React Component)

function App() {

  const ipcHandle = () => window.electron.ipcRenderer.send('ping')
  
  // Setting up a state for our messages
  // These are only here since we don't have ollama setup yet

  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?' },
  ]);

  const [availableModels, setAvailableModels] = useState([]);   // State for the list of models
  const [selectedModel, setSelectedModel] = useState('');       // Will be set dynamically 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);     // add state for sidebar
  const [isLoading, setIsLoading] = useState(false);            // state to track if AI is thinking

  const messagesEndRef = useRef(null);

  // Fetch available models from Ollama when the app loads
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) {
          throw new Error('Could not fetch models from Ollama.');
        }
        const data = await response.json();
        const modelNames = data.models.map(model => model.name.split(':')[0]);
        
        // Handle the case where the models array is empty
        if (modelNames.length > 0) {
          setAvailableModels(modelNames);
          setSelectedModel(modelNames[0]);
        } else {
          // If no models are installed, set the placeholder text
          setAvailableModels(['No models found']);
          setSelectedModel('No models found');
        }
        
      } catch (error) {
        console.error('Error fetching models:', error);
        // Handle case where Ollama might not be running on startup
        setAvailableModels(['No models found']);
        setSelectedModel('No models found');
      }
    };

    fetchModels();
  }, []); // The empty array ensures this effect runs only once on mount

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages[messages.length - 1]?.content]); // Scrolls to the bottom with the response

  // This function handles new messages
  const handleSendMessage = async (content) => {
    if (!selectedModel || selectedModel === 'No models found') return;
    setIsLoading(true);
    const userMessage = { role: 'user', content };
    const newMessages = [...messages, userMessage, { role: 'assistant', content: '' }];
    setMessages(newMessages);

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessage],
          stream: true,
        }),
      });

      if (!response.body) throw new Error('Response body is null');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        const jsonChunks = chunk.split('\n').filter(Boolean);
        for (const jsonChunk of jsonChunks) {
          try {
            const parsed = JSON.parse(jsonChunk);
            if (parsed.message && parsed.message.content) {
              // THIS IS THE FIX: We now create a new object and array
              // instead of modifying the existing state directly.
              setMessages((prevMessages) => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                const updatedLastMessage = {
                  ...lastMessage,
                  content: lastMessage.content + parsed.message.content,
                };
                return [...prevMessages.slice(0, -1), updatedLastMessage];
              });
            }
          } catch (e) { console.error('Failed to parse JSON chunk:', jsonChunk); }
        }
      }
    } catch (error) {
      console.error('Failed to fetch from Ollama:', error);
      const errorMessage = { role: 'assistant', content: "Sorry, I couldn't connect. Please ensure Ollama is running." };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 1. The main container is now a column
    <div className="flex flex-col h-screen font-sans text-white bg-zinc-800">
      {/* 2. The TitleBar is at the top, outside of the main content flow */}
      <TitleBar />
      {/* 3. A new container for the rest of the app */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <div className="flex justify-center p-4">
            <ModelSelector
              models={availableModels}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </div>
          <div className="flex-1 flex justify-center overflow-y-auto">
            <div className="w-full max-w-4xl p-6 space-y-8">
              {messages.map((msg, index) => (
                <Message key={index} role={msg.role} content={msg.content} />
              ))}
              {isLoading && messages[messages.length - 1]?.content === '' && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="flex justify-center p-4">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
