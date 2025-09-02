import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Message from './components/Message'
import ChatInput from './components/ChatInput'
import Sidebar from './components/Sidebar'
import ModelSelector from './components/ModelSelector'
import TitleBar from './components/TitleBar'
import ThinkingIndicator from './components/ThinkingIndicator'
import WelcomeMessage from './components/WelcomeMessage'

function App() {
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)

  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const loadInitialData = async () => {
      const loadedChats = await window.api.loadChats()
      setChats(loadedChats)
    }
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags')
        const data = await response.json()
        if (data.models && data.models.length > 0) {
          const modelNames = data.models.map((model) => model.name.split(':')[0])
          setModels(modelNames)
          setSelectedModel(modelNames[0])
        } else {
          setModels(['No models found'])
          setSelectedModel('No models found')
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
        setModels(['Ollama not running'])
        setSelectedModel('Ollama not running')
      }
    }
    loadInitialData()
    fetchModels()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats, activeChatId])

  // --- Chat Management Functions ---
  const startNewChat = () => {
    setActiveChatId(null)
  }

  const handleDeleteChat = (chatId) => {
    const updatedChats = chats.filter((chat) => chat.id !== chatId)
    setChats(updatedChats)
    window.api.deleteChat(chatId)
    // THE FIX: If the deleted chat is the active one, always go to the new chat screen.
    if (activeChatId === chatId) {
      setActiveChatId(null)
    }
  }

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId)
  }

  const handleRenameChat = (chatId, newTitle) => {
    const updatedChats = chats.map((chat) => {
      if (chat.id === chatId) {
        return { ...chat, title: newTitle.trim() || 'Renamed Chat' }
      }
      return chat
    })
    setChats(updatedChats)
    window.api.saveChats(updatedChats)
  }

  // --- Message Handling ---
  const handleSendMessage = async (prompt, attachedFiles) => {
    if (!selectedModel || selectedModel.includes(' ') || models.length === 0) {
      console.error('Attempted to send message without a valid model selected.')
      return
    }

    setIsLoading(true)
    abortControllerRef.current = new AbortController()
    const userMessage = { role: 'user', content: prompt, files: attachedFiles }
    let currentChatId = activeChatId
    let updatedChats

    if (!currentChatId) {
      const newChat = {
        id: uuidv4(),
        title: prompt.substring(0, 40) + (prompt.length > 40 ? '...' : ''),
        messages: [userMessage],
        createdAt: new Date().toISOString()
      }
      updatedChats = [newChat, ...chats]
      currentChatId = newChat.id
      setActiveChatId(newChat.id)
    } else {
      updatedChats = chats.map((chat) => {
        if (chat.id === currentChatId) {
          return { ...chat, messages: [...chat.messages, userMessage] }
        }
        return chat
      })
    }
    setChats(updatedChats)

    const currentChat = updatedChats.find((chat) => chat.id === currentChatId)
    if (!currentChat) {
      setIsLoading(false)
      return
    }

    try {
      const apiMessages = []
      for (const message of currentChat.messages) {
        if (message.files && message.files.length > 0) {
          const processedFiles = await window.api.processFiles(message.files)
          const textContents = processedFiles.filter((f) => f.type === 'text').map((f) => f.content)
          const base64Images = processedFiles.filter((f) => f.type === 'image').map((f) => f.content)
          apiMessages.push({
            role: message.role,
            content: [message.content, ...textContents].join('\n\n'),
            images: base64Images.length > 0 ? base64Images : undefined
          })
        } else {
          apiMessages.push({ role: message.role, content: message.content })
        }
      }

      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, messages: apiMessages, stream: true }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Ollama API error (${response.status}): ${errorBody}`)
      }

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === currentChatId) {
            return { ...chat, messages: [...chat.messages, { role: 'assistant', content: '' }] }
          }
          return chat
        })
      )

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.trim()) {
            const data = JSON.parse(line)
            if (data.message && data.message.content) {
              setChats((prevChats) =>
                prevChats.map((c) => {
                  if (c.id === currentChatId) {
                    const lastMessage = c.messages[c.messages.length - 1]
                    const updatedLastMessage = { ...lastMessage, content: lastMessage.content + data.message.content }
                    return { ...c, messages: [...c.messages.slice(0, -1), updatedLastMessage] }
                  }
                  return c
                })
              )
            }
          }
        }
      }

      setChats((currentChats) => {
        window.api.saveChats(currentChats)
        return currentChats
      })
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted by user.')
        setChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat.id === currentChatId) {
              return { ...chat, messages: chat.messages.slice(0, -1) }
            }
            return chat
          })
        )
      } else {
        console.error('Failed to fetch from Ollama:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const activeChat = chats.find((chat) => chat.id === activeChatId)
  const messages = activeChat ? activeChat.messages : []
  const isInputDisabled = isLoading || !selectedModel || models.length === 0 || models[0].includes(' ')

  return (
    <div className="flex h-screen flex-col font-sans text-white bg-zinc-800">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          chats={chats} activeChatId={activeChatId} onNewChat={startNewChat}
          onSelectChat={handleSelectChat} onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
        />
        <div className="flex flex-1 flex-col">
          <div className="flex justify-center p-4">
            <ModelSelector models={models} selectedModel={selectedModel} setSelectedModel={setSelectedModel}/>
          </div>
          <div className="flex-1 flex justify-center items-center overflow-y-auto p-6">
            {messages.length === 0 ? (
              <WelcomeMessage />
            ) : (
              <div className="w-full max-w-4xl space-y-8 self-start">
                {messages.map((msg, index) => (
                  <Message key={index} role={msg.role} content={msg.content} files={msg.files}/>
                ))}
                {isLoading && messages.length > 0 && messages[messages.length - 1]?.content === '' && <ThinkingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          <div className="flex justify-center p-4">
            <ChatInput
              onSendMessage={handleSendMessage} isLoading={isLoading}
              isDisabled={isInputDisabled} onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App