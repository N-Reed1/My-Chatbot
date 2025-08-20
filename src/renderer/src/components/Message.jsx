// src/renderer/src/components/Message.jsx

function Message({ role, content }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-lg bg-gray-700 py-2 px-4 rounded-2xl">
          {/* Add break-words to handle long text */}
          <p className="text-white break-words whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Also add it here for the assistant's messages */}
      <p className="whitespace-pre-wrap text-white break-words">{content}</p>
    </div>
  );
}

export default Message;