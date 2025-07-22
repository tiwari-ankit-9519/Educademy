/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect } from "react";
import useSocket from "./useSocket";

const SocketContext = createContext(null);

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const socket = useSocket();

  useEffect(() => {
    if (socket.isConnected) {
      const interval = setInterval(() => {
        socket.ping();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [socket.isConnected, socket.ping, socket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
