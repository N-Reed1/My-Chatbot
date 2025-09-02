// src/renderer/src/components/Sidebar.jsx

import { useState, useRef, useEffect } from 'react'

// Helper component for menu items
const MenuItem = ({ icon, text, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 hover:bg-zinc-700 rounded-md ${className}`}
  >
    {icon}
    {text}
  </button>
)

function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  isOpen,
  setIsOpen
}) {
  const [menuOpenFor, setMenuOpenFor] = useState(null)
  const [renamingChatId, setRenamingChatId] = useState(null)
  const menuRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-focus the input field when renaming starts
  useEffect(() => {
    if (renamingChatId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [renamingChatId])

  const toggleMenu = (e, chatId) => {
    e.stopPropagation()
    setMenuOpenFor(menuOpenFor === chatId ? null : chatId)
  }

  const handleStartRename = (e, chatId) => {
    e.stopPropagation()
    setRenamingChatId(chatId)
    setMenuOpenFor(null)
  }

  const handleFinishRename = (e, chatId) => {
    const newTitle = e.target.value
    onRenameChat(chatId, newTitle)
    setRenamingChatId(null)
  }

  const handleKeyDown = (e, chatId) => {
    if (e.key === 'Enter') {
      handleFinishRename(e, chatId)
    } else if (e.key === 'Escape') {
      setRenamingChatId(null)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenFor(null)
      }
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setRenamingChatId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div
      className={`bg-zinc-900 p-3 flex flex-col space-y-4 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
      </div>

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={onNewChat}
          className="flex items-center w-full p-3 mb-4 rounded-lg text-zinc-100 hover:bg-zinc-800 cursor-pointer"
        >
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="whitespace-nowrap font-medium">New chat</span>
        </button>

        <div className="flex-1 overflow-y-auto">
          <h2 className="text-xs font-semibold text-zinc-500 mb-3 px-3 whitespace-nowrap">Chats</h2>
          <ul className="space-y-1">
            {chats.map((chat) => (
              <li
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                // THE FIX: Removed 'truncate' and added conditional 'overflow-visible'
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                  chat.id === activeChatId ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                } ${menuOpenFor === chat.id ? 'overflow-visible' : ''}`}
              >
                <div className="flex-1 truncate">
                  {renamingChatId === chat.id ? (
                    <input
                      ref={inputRef}
                      type="text"
                      defaultValue={chat.title || 'New Chat'}
                      onBlur={(e) => handleFinishRename(e, chat.id)}
                      onKeyDown={(e) => handleKeyDown(e, chat.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-zinc-700 text-white text-sm font-medium p-0 m-0 border-0 focus:ring-0"
                    />
                  ) : (
                    <span className="truncate text-sm font-medium">{chat.title || 'New Chat'}</span>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={(e) => toggleMenu(e, chat.id)}
                    className={`p-1 rounded-full text-zinc-400 hover:bg-zinc-700 ${
                      activeChatId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                    </svg>
                  </button>
                  {menuOpenFor === chat.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 rounded-lg shadow-lg z-20 p-2"
                    >
                      <MenuItem
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>}
                        text="Share"
                        onClick={(e) => { e.stopPropagation(); console.log('Share clicked'); setMenuOpenFor(null); }}
                      />
                      <MenuItem
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg>}
                        text="Rename"
                        onClick={(e) => handleStartRename(e, chat.id)}
                      />
                      <MenuItem
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"></path></svg>}
                        text="Archive"
                        onClick={(e) => { e.stopPropagation(); console.log('Archive clicked'); setMenuOpenFor(null); }}
                      />
                       <div className="my-1 border-t border-zinc-700"></div>
                      <MenuItem
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>}
                        text="Delete"
                        onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); setMenuOpenFor(null); }}
                        className="text-red-500"
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800">
          <h2 className="text-xs font-semibold text-zinc-500 mb-3 px-3 whitespace-nowrap">Upload Global</h2>
          <button className="w-full p-3 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600 whitespace-nowrap cursor-pointer text-sm font-medium">
            Upload Files
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar