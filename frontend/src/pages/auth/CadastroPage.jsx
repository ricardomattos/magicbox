import { useState, useEffect } from "react";
import { registerApi } from "../../api/index.js";
import { Card, Btn, Input, StarLogo, C } from "../../components/ui.jsx";

function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2)  return digits.replace(/^(\d{0,2})/, "($1");
  if (digits.length <= 7)  return digits.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function PlanPicker({ value, onChange, planos }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ margin: "0 0 8px", color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Plano
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {planos.map(p => {
          const active = String(p.id) === String(value);
          return (
            <button key={p.id} type="button" onClick={() => onChange(String(p.id))}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                fontFamily: "inherit", fontSize: 14, textAlign: "left",
                background: active ? C.blueDim : C.subtle,
                border: `1.5px solid ${active ? C.blue : C.border}`,
                color: C.text, transition: "border-color 0.15s, background 0.15s",
              }}>
              <div>
                <span style={{ fontWeight: active ? 700 : 400 }}>{p.nome}</span>
                {p.frequencia && (
                  <span style={{ display: "block", fontSize: 11, color: C.muted, marginTop: 1 }}>{p.frequencia}</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: active ? C.blue : C.muted }}>
                  R$ {Number(p.valor).toFixed(2).replace(".", ",")}
                </span>
                {active && <span style={{ color: C.blue, fontSize: 16 }}>✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CadastroPage({ token }) {
  const [state, setState] = useState("loading"); // loading | invalid | form | success
  const [planos, setPlanos]   = useState([]);
  const [form, setForm]       = useState({ name: "", email: "", password: "", phone: "", plano: "" });
  const [err, setErr]         = useState("");
  const [saving, setSaving]   = useState(false);
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    registerApi.validate(token)
      .then(d => { setPlanos(d.planos || []); setState("form"); })
      .catch(() => setState("invalid"));
  }, [token]);

  async function cadastrar(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setErr("Preencha nome, e-mail e senha."); return; }
    if (form.password.length < 6) { setErr("A senha deve ter ao menos 6 caracteres."); return; }
    setSaving(true); setErr("");
    try {
      await registerApi.register(token, {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone,
        plano: form.plano ? parseInt(form.plano) : null,
      });
      setState("success");
    } catch (e) {
      setErr(e.message || "Erro ao realizar cadastro.");
    } finally {
      setSaving(false);
    }
  }

  const wrapper = {
    minHeight: "100vh", background: C.bg, display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
    padding: "32px 18px 60px", boxSizing: "border-box",
  };

  if (state === "loading") return (
    <div style={{ ...wrapper, justifyContent: "center" }}>
      <svg width="36" height="36" viewBox="0 0 32 32" fill="none" style={{ animation: "spin 1s linear infinite" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <polygon points="16,2 19.5,12.5 30,12.5 21.5,19 24.5,29.5 16,23 7.5,29.5 10.5,19 2,12.5 12.5,12.5" fill={C.blue} opacity="0.8" />
      </svg>
    </div>
  );

  if (state === "invalid") return (
    <div style={{ ...wrapper, justifyContent: "center" }}>
      <StarLogo size={40} glow />
      <h2 style={{ color: C.text, margin: "20px 0 8px", fontWeight: 900 }}>Link inválido</h2>
      <p style={{ color: C.muted, fontSize: 14, textAlign: "center" }}>
        Este link de cadastro não existe ou foi desativado.<br />Peça ao seu coach um novo link.
      </p>
    </div>
  );

  if (state === "success") return (
    <div style={{ ...wrapper, justifyContent: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
      <h2 style={{ color: C.text, margin: "0 0 10px", fontWeight: 900, textAlign: "center" }}>Cadastro realizado!</h2>
      <p style={{ color: C.muted, fontSize: 14, textAlign: "center", marginBottom: 28 }}>
        Agora é só fazer login e começar a treinar.
      </p>
      <Btn onClick={() => window.location.href = "/"}>Ir para o login</Btn>
    </div>
  );

  return (
    <div style={wrapper}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <StarLogo size={32} glow />
          <div>
            <p style={{ margin: 0, color: C.text, fontWeight: 900, fontSize: 18, lineHeight: 1.2 }}>Magic Box</p>
            <p style={{ margin: 0, color: C.muted, fontSize: 12 }}>Criar conta</p>
          </div>
        </div>

        <Card>
          <form onSubmit={cadastrar}>
            <Input label="Nome completo" value={form.name} onChange={v => setF("name", v)} placeholder="Seu nome" />
            <Input label="E-mail" value={form.email} onChange={v => setF("email", v)} placeholder="email@exemplo.com" />
            <Input label="Senha" type="password" value={form.password} onChange={v => setF("password", v)} placeholder="Mínimo 6 caracteres" />
            <Input label="WhatsApp (opcional)" value={form.phone} onChange={v => setF("phone", maskPhone(v))} placeholder="(16) 99999-9999" />

            {planos.length > 0 && (
              <PlanPicker value={form.plano} onChange={v => setF("plano", v)} planos={planos} />
            )}

            {err && <p style={{ color: C.danger, fontSize: 13, margin: "-6px 0 12px" }}>{err}</p>}

            <Btn full type="submit" disabled={saving}>
              {saving ? "Cadastrando..." : "Criar conta"}
            </Btn>
          </form>
        </Card>

        <p style={{ textAlign: "center", color: C.muted, fontSize: 12, marginTop: 16 }}>
          Já tem conta?{" "}
          <button onClick={() => window.location.href = "/"}
            style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 12, fontFamily: "inherit", padding: 0 }}>
            Fazer login
          </button>
        </p>
      </div>
    </div>
  );
}
