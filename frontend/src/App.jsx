import { useState } from "react";
import { useAuth } from "./hooks/useAuth.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import FirstAccessPage from "./pages/auth/FirstAccessPage.jsx";
import CadastroPage from "./pages/auth/CadastroPage.jsx";
import AlunoShell from "./pages/aluno/AlunoShell.jsx";
import GestorShell from "./pages/gestor/GestorShell.jsx";
import { InstallPrompt } from "./components/ui.jsx";

export default function App() {
  const { user, loading } = useAuth();

  // Public registration route — no auth required
  const cadastroMatch = window.location.pathname.match(/^\/cadastro\/([^/]+)/);
  if (cadastroMatch) return <CadastroPage token={cadastroMatch[1]} />;

  if (loading) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#080b12",
    }}>
      <svg width="40" height="40" viewBox="0 0 32 32" fill="none"
        style={{ animation: "spin 1.2s linear infinite" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <polygon points="16,2 19.5,12.5 30,12.5 21.5,19 24.5,29.5 16,23 7.5,29.5 10.5,19 2,12.5 12.5,12.5"
          fill="#2979FF" opacity="0.8"/>
      </svg>
    </div>
  );

  if (!user) return <LoginPage />;
  if (user.must_change_pass && user.role === "aluno") return <FirstAccessPage />;
  if (user.role === "gestor") return <GestorShell />;
  return (
    <>
      <InstallPrompt />
      <AlunoShell />
    </>
  );
}
