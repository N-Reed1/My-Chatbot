// src/renderer/src/components/Sidebar.jsx

function Sidebar({ isOpen, setIsOpen }) {
  const chats = ['React Frontend Setup', 'Ideas for a new project', 'Learning Ollama'];

  return (
    <div
      className={`bg-zinc-900 p-4 flex flex-col space-y-4 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header with Collapse Button */}
      <div className="flex items-center">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-zinc-800 rounded-lg">
          {/* Hamburger Icon */}
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
      </div>

      {/* Fading Container */}
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* New Chat Button */}
        <button className="flex items-center w-full p-2 mb-4 rounded-lg hover:bg-zinc-800">
          <svg
            className="w-6 h-6 mr-3 flex-shrink-0" // Add flex-shrink-0
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="whitespace-nowrap">New chat</span>
        </button>

        {/* Chats Section */}
        <div className="flex-1 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3 whitespace-nowrap">Chats</h2>
          <ul className="space-y-2">
            {chats.map((chat, index) => (
              <li
                key={index}
                className="p-2 rounded-lg hover:bg-zinc-800 cursor-pointer truncate"
              >
                {chat}
              </li>
            ))}
          </ul>
        </div>

        {/* Upload Global Section */}
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-3 whitespace-nowrap">Upload Global</h2>
          <button className="w-full p-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:bg-zinc-700 hover:border-gray-500 whitespace-nowrap">
            Upload Files
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;