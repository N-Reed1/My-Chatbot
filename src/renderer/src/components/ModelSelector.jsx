// src/renderer/src/components/ModelSelector.jsx
import { useState, useRef, useEffect } from 'react'; // 1. Import useRef and useEffect

function ModelSelector({ selectedModel, setSelectedModel }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const models = ['llama3', 'mistral', 'codellama', 'phi'];
  const dropdownRef = useRef(null); // 2. Create a ref

  // 3. Add the useEffect hook to handle clicks outside
  useEffect(() => {
    // Function to call when a click is detected
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false); // Close the dropdown
      }
    };

    // Add the event listener when the dropdown is open
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]); // This effect depends on the dropdown's state

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    setIsDropdownOpen(false);
  };

  return (
    // 4. Attach the ref to the main container div
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-zinc-700"
      >
        <span className="font-semibold text-lg">{selectedModel}</span>
        <svg
          className="w-5 h-5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full mt-2 w-48 bg-zinc-900 rounded-lg shadow-lg z-10">
          <ul className="py-1">
            {models.map((model) => (
              <li
                key={model}
                onClick={() => handleSelectModel(model)}
                className="px-4 py-2 hover:bg-zinc-700 cursor-pointer"
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