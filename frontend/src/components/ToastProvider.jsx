import { Toaster } from "react-hot-toast";
import { useTheme } from "@/components/theme-provider";

export const ToastProvider = () => {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        className: "",
        duration: 4000,
        style: {
          background: theme === "dark" ? "#1e293b" : "#ffffff",
          color: theme === "dark" ? "#f1f5f9" : "#0f172a",
          border: theme === "dark" ? "1px solid #334155" : "1px solid #e2e8f0",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: "500",
          padding: "12px 16px",
          boxShadow:
            theme === "dark"
              ? "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)"
              : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
        success: {
          duration: 3000,
          style: {
            background: theme === "dark" ? "#064e3b" : "#ecfdf5",
            color: theme === "dark" ? "#6ee7b7" : "#065f46",
            border:
              theme === "dark" ? "1px solid #047857" : "1px solid #a7f3d0",
          },
          iconTheme: {
            primary: theme === "dark" ? "#10b981" : "#059669",
            secondary: theme === "dark" ? "#064e3b" : "#ecfdf5",
          },
        },
        error: {
          duration: 4000,
          style: {
            background: theme === "dark" ? "#7f1d1d" : "#fef2f2",
            color: theme === "dark" ? "#fca5a5" : "#991b1b",
            border:
              theme === "dark" ? "1px solid #dc2626" : "1px solid #fecaca",
          },
          iconTheme: {
            primary: theme === "dark" ? "#ef4444" : "#dc2626",
            secondary: theme === "dark" ? "#7f1d1d" : "#fef2f2",
          },
        },
        loading: {
          duration: Infinity,
          style: {
            background: theme === "dark" ? "#1e40af" : "#eff6ff",
            color: theme === "dark" ? "#93c5fd" : "#1e40af",
            border:
              theme === "dark" ? "1px solid #3b82f6" : "1px solid #bfdbfe",
          },
        },
      }}
    />
  );
};
