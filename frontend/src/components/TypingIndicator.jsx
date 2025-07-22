import { useSocketContext } from "@/providers/SocketProvider";

const TypingIndicator = ({ roomId, className = "" }) => {
  const { typingUsers } = useSocketContext();

  const typingInRoom = Array.from(typingUsers.entries())
    .filter(([userId, userName]) => {
      if (!roomId) return true;
      return userId && userName;
    })
    .map(([userId, userName]) => ({ userId, userName }));

  if (typingInRoom.length === 0) return null;

  const getTypingText = () => {
    const names = typingInRoom.map((user) => user.userName);

    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]} and ${names[2]} are typing...`;
    } else {
      return `${names[0]}, ${names[1]} and ${
        names.length - 2
      } others are typing...`;
    }
  };

  const roomDisplay = roomId ? ` in ${roomId}` : "";

  return (
    <div
      className={`flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 ${className}`}
      data-room={roomId || "global"}
      data-user-ids={typingInRoom.map((user) => user.userId).join(",")}
    >
      <div className="flex space-x-1">
        <div
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span>
        {getTypingText()}
        {roomDisplay}
      </span>
    </div>
  );
};

export default TypingIndicator;
