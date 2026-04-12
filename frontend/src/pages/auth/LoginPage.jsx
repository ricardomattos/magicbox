import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { StarLogo, Input, Btn, C } from "../../components/ui.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!email || !pass) { setErr("Preencha e-mail e senha."); return; }
    setLoading(true);
    setErr("");
    try {
      await login(email.trim(), pass);
    } catch (e) {
      setErr(e.message || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 28px", background: C.bg,
      fontFamily: "'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif",
    }}>
      <div style={{ marginBottom: 36, textAlign: "center" }}>
        <StarLogo size={52} glow />
        <h1 style={{ margin: "14px 0 4px", fontSize: 26, fontWeight: 900, color: C.text }}>
          MAGIC BOX
        </h1>
        <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Cross Training · Araraquara</p>
      </div>

      <form onSubmit={e => { e.preventDefault(); handle(); }}
        style={{ width: "100%", maxWidth: 340 }}>
        <Input label="E-mail" value={email} onChange={setEmail} placeholder="seu@email.com" />
        <Input label="Senha" type="password" value={pass} onChange={setPass} placeholder="••••••" />
        {err && <p style={{ color: C.danger, fontSize: 13, margin: "-6px 0 12px" }}>{err}</p>}
        <Btn full onClick={handle} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Btn>
      </form>
    </div>
  );
}
