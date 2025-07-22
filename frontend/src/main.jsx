import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { Toaster } from "sonner";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          richColors
          expand={true}
          duration={4000}
        />
      </BrowserRouter>
    </Provider>
  </ThemeProvider>
);
