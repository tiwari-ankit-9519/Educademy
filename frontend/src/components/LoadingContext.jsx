/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import { Loader2 } from "lucide-react";

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const showLoading = (message = "Loading...") => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setLoadingMessage("");
  };

  return (
    <LoadingContext.Provider
      value={{ isLoading, showLoading, hideLoading, loadingMessage }}
    >
      {children}

      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-lg p-6 shadow-lg border flex flex-col items-center space-y-4 min-w-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              {loadingMessage}
            </p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};
