// src/renderer/src/components/Sidebar.jsx
import ModelSelector from './ModelSelector';

function Sidebar({ selectedModel, setSelectedModel }) {
  // Mock data for the chat history
  const chats = ['React Frontend Setup', 'Ideas for a new project', 'Learning Ollama'];

  return (
    <div className="w-64 bg-gray-900 p-4 flex flex-col">
      <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} />

      {/* Chats Section */}
      <div className="flex-1 mt-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-3">Chats</h2>
        <ul className="space-y-2">
          {chats.map((chat, index) => (
            <li
              key={index}
              className="p-2 rounded-lg hover:bg-gray-800 cursor-pointer truncate"
            >
              {chat}
            </li>
          ))}
        </ul>
      </div>

      {/* Upload Global Section */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-3">Upload Global</h2>
        <button className="w-full p-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:bg-gray-800 hover:border-gray-500">
          Upload Files
        </button>
      </div>
    </div>
  );
}

export default Sidebar;