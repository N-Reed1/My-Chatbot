import { useState, useRef, useEffect } from 'react';
import Message from './components/Message';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import ModelSelector from './components/ModelSelector';
import ThinkingIndicator from './components/ThinkingIndicator';
import TitleBar from './components/TitleBar';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?' },
  ]);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) throw new Error('Could not fetch models from Ollama.');
        const data = await response.json();
        const modelNames = data.models.map(model => model.name.split(':')[0]);
        if (modelNames.length > 0) {
          setAvailableModels(modelNames);
          setSelectedModel(modelNames[0]);
        } else {
          setAvailableModels(['No models found']);
          setSelectedModel('No models found');
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        setAvailableModels(['No models found']);
        setSelectedModel('No models found');
      }
    };
    fetchModels();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages[messages.length - 1]?.content]);

  const handleSendMessage = async (content, attachedFiles) => {
    if (!selectedModel || selectedModel === 'No models found') return;
    setIsLoading(true);

    // THE FIX: Make a single call to the backend to process all files
    const { base64Images, textContents } = await window.api.processFiles(attachedFiles);

    // Join the text contents from all files
    const fileContentForPrompt = textContents.join('\n\n');
    const finalContent = fileContentForPrompt + content;

    const userMessageForUI = { role: 'user', content, files: attachedFiles };
    const userMessageForAPI = { role: 'user', content: finalContent, images: base64Images };

    const newMessagesForUI = [...messages, userMessageForUI, { role: 'assistant', content: '' }];
    setMessages(newMessagesForUI);

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessageForAPI],
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
              setMessages((prevMessages) => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                const updatedLastMessage = { ...lastMessage, content: lastMessage.content + parsed.message.content };
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
    <div className="flex flex-col h-screen font-sans text-white bg-zinc-800">
      <TitleBar />
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
                <Message key={index} role={msg.role} content={msg.content} files={msg.files} />
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

export default App;
