import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LojaProvider } from "./context/LojaContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LojaProvider>
          <App />
        </LojaProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
