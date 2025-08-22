// src/renderer/src/components/Message.jsx

function Message({ role, content }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        {/* Use zinc for the user message bubble */}
        <div className="max-w-lg bg-zinc-700 py-2 px-4 rounded-2xl">
          <p className="text-white break-words whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="whitespace-pre-wrap text-white break-words">{content}</p>
    </div>
  );
}

export default Message;