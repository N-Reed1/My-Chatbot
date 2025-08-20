import { useState } from 'react';

function ModelSelector({ selectedModel, setSelectedModel }) {

    const [isOpen, setIsOpen] = useState(false);

    // This is a mock list of models for the frontend, this will be replaced later
    const models = ['llama3', 'mistral', 'codellama', 'phi'];

    const handleSelectModel = (model) => {
        setSelectedModel(model);
        setIsOpen(false); // close the dropdown after selection
    };

    return (
    <div className="relative">
      {/* The button that shows the current model and toggles the dropdown */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
      >
        <span className="font-semibold">{selectedModel}</span>
        {/* Chevron down icon */}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {/* The dropdown menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-48 bg-gray-700 rounded-lg shadow-lg z-10">
          <ul className="py-1">
            {models.map((model) => (
              <li
                key={model}
                onClick={() => handleSelectModel(model)}
                className="px-4 py-2 hover:bg-gray-600 cursor-pointer"
              >
                {model}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ModelSelector;