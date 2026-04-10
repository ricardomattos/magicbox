import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./hooks/useAuth.jsx";

// Suprime o prompt de instalação PWA em desktops
window.addEventListener("beforeinstallprompt", (e) => {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isMobile) e.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
