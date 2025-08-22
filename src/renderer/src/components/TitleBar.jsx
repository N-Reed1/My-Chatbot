import { useState, useEffect } from 'react';

function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Note: For a more robust solution in a real app, you'd use ipcRenderer
  // to get the initial maximized state and listen for changes.
  // For this project, a local state is sufficient.

  const handleMinimize = () => window.api.windowControl('minimize');
  const handleMaximize = () => {
    window.api.windowControl('maximize');
    setIsMaximized(!isMaximized);
  };
  const handleClose = () => window.api.windowControl('close');

  return (
    <div
      className="w-full h-8 bg-zinc-700 flex items-center justify-between"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* This empty div helps center the title or can be used for a menu later */}
      <div></div>

      {/* Window control buttons (only show on non-Mac platforms) */}
      {!isMac && (
        <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' }}>
          <button onClick={handleMinimize} className="w-8 h-8 flex justify-center items-center hover:bg-zinc-600">
            {/* Minimize Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="1" viewBox="0 0 10 1"><path fill="#fff" d="M0 0h10v1H0z"/></svg>
          </button>
          <button onClick={handleMaximize} className="w-8 h-8 flex justify-center items-center hover:bg-zinc-600">
            {/* Maximize/Restore Icon */}
            {isMaximized ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path fill="#fff" d="M2 0v2H0v8h8V8h2V0H2zm6 8H2V4h6v4z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path fill="#fff" d="M0 0v10h10V0H0zm8 8H2V2h6v6z"/></svg>
            )}
          </button>
          <button onClick={handleClose} className="w-8 h-8 flex justify-center items-center hover:bg-red-500">
            {/* Close Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path fill="#fff" d="M10 1.01L8.99 0 5 3.99 1.01 0 0 1.01 3.99 5 0 8.99 1.01 10 5 6.01 8.99 10 10 8.99 6.01 5z"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default TitleBar;