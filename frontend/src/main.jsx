import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./hooks/useAuth.jsx";

const globalStyle = document.createElement("style");
globalStyle.textContent = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } body { -webkit-font-smoothing: antialiased; }`;
document.head.appendChild(globalStyle);

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
