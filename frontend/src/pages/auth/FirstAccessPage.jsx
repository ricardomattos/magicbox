import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { authApi } from "../../api/index.js";
import { StarLogo, Input, Btn, C } from "../../components/ui.jsx";

export default function FirstAccessPage() {
  const { refreshUser } = useAuth();
  const [pass, setPass]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (pass.length < 6) { setErr("Mínimo 6 caracteres."); return; }
    if (pass !== confirm) { setErr("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      await authApi.changePassword(pass);
      await refreshUser();
    } catch (e) {
      setErr(e.message || "Erro ao salvar senha.");
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
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <StarLogo size={44} glow />
        <h2 style={{ margin: "14px 0 6px", fontSize: 22, fontWeight: 900, color: C.text }}>
          Bem-vindo(a)!
        </h2>
        <p style={{ margin: 0, color: C.muted, fontSize: 13, maxWidth: 280 }}>
          Este é seu primeiro acesso. Por segurança, crie uma senha pessoal.
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 340 }}>
        <Input label="Nova senha" type="password" value={pass} onChange={setPass}
          placeholder="Mínimo 6 caracteres" hint="Escolha uma senha que só você conheça" />
        <Input label="Confirmar senha" type="password" value={confirm} onChange={setConfirm}
          placeholder="Repita a senha" />
        {err && <p style={{ color: C.danger, fontSize: 13, margin: "-6px 0 12px" }}>{err}</p>}
        <Btn full onClick={handle} disabled={loading}>
          {loading ? "Salvando..." : "Definir minha senha"}
        </Btn>
      </div>
    </div>
  );
}
