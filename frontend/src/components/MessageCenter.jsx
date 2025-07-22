import React, { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocketContext } from "./SocketProvider";
import TypingIndicator from "./TypingIndicator";

const MessageCenter = ({ receiverId, receiverName, onClose }) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { messages, sendMessage, sendTyping, clearMessages } =
    useSocketContext();

  const filteredMessages = messages.filter(
    (msg) => msg.senderId === receiverId || msg.receiverId === receiverId
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        sendTyping(`user:${receiverId}`, false);
      }
    };
  }, [isTyping, receiverId, sendTyping]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      sendTyping(`user:${receiverId}`, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTyping(`user:${receiverId}`, false);
      }
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    sendMessage(receiverId, message.trim(), "DIRECT");
    setMessage("");

    if (isTyping) {
      setIsTyping(false);
      sendTyping(`user:${receiverId}`, false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleFileAttach = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("File selected:", file.name);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {receiverName}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-xs"
            >
              Clear
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-80 p-3">
          <div className="space-y-3">
            {filteredMessages.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              filteredMessages.map((msg, index) => {
                const isOwn = msg.senderId !== receiverId;

                return (
                  <div
                    key={index}
                    className={`flex ${
                      isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        isOwn
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn
                            ? "text-blue-100"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {formatTime(msg.sentAt || msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <TypingIndicator
            roomId={`user:${receiverId}`}
            className="mb-2 min-h-[20px]"
          />

          <form
            onSubmit={handleSendMessage}
            className="flex items-center space-x-2"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 w-9 p-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <Input
              value={message}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 h-9"
              maxLength={1000}
            />

            <Button
              type="submit"
              disabled={!message.trim()}
              className="h-9 w-9 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileAttach}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageCenter;
