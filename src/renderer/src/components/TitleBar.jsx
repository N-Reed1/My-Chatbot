// src/renderer/src/components/TitleBar.jsx

function TitleBar() {
  return (
    <div
      className="w-full h-8 bg-zinc-700 draggable"
      style={{ WebkitAppRegion: 'drag' }} // Alternative way to set draggable region
    >
      {/* This div is the draggable handle for the window */}
    </div>
  );
}

export default TitleBar;