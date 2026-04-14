// src/components/ui.jsx
// All shared primitives used throughout the app.

// Detecta mobile (PWA/celular) vs desktop
export const isMobile = () =>
  window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Hook para reagir a mudanças de tamanho de tela
import { useState, useEffect } from "react";
export function useIsMobile() {
  const [mobile, setMobile] = useState(isMobile());
  useEffect(() => {
    const handler = () => setMobile(isMobile());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}

export const C = {
  bg:"#080b12", card:"#0e1420", subtle:"#1a2235",
  blue:"#2979FF", blueDim:"rgba(41,121,255,0.14)", blueGlow:"rgba(41,121,255,0.28)",
  text:"#e8edf8", muted:"#566074",
  success:"#00e676", successDim:"rgba(0,230,118,0.12)",
  danger:"#ff4f4f", dangerDim:"rgba(255,79,79,0.13)",
  warn:"#ffb300", warnDim:"rgba(255,179,0,0.13)",
  border:"rgba(41,121,255,0.14)", borderLight:"rgba(255,255,255,0.05)",
};

export function StarLogo({ size = 28, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      style={{ filter: glow ? `drop-shadow(0 0 6px ${C.blue})` : "none", flexShrink: 0 }}>
      <polygon
        points="16,2 19.5,12.5 30,12.5 21.5,19 24.5,29.5 16,23 7.5,29.5 10.5,19 2,12.5 12.5,12.5"
        fill={C.blue}
      />
    </svg>
  );
}

export function Avatar({ name, size = 36, style: s = {} }) {
  const cols = ["#2979FF","#7c4dff","#00bcd4","#ff6d00","#e91e63","#00897b"];
  const i = name ? name.charCodeAt(0) % cols.length : 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg,${cols[i]},${cols[(i+2)%cols.length]})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800, color: "#fff", flexShrink: 0, ...s,
    }}>
      {name ? name[0].toUpperCase() : "?"}
    </div>
  );
}

export function Badge({ label, color = C.blue }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
      background: `${color}22`, color, letterSpacing: 0.5,
      textTransform: "uppercase", whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

export function Btn({ children, onClick, variant = "primary", disabled, full, small, style: s = {} }) {
  const base = {
    border: "none", borderRadius: small ? 10 : 14,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", fontWeight: 700, letterSpacing: 0.3,
    transition: "all 0.18s",
    padding: small ? "7px 13px" : "13px 20px",
    fontSize: small ? 12 : 14,
    width: full ? "100%" : "auto",
    opacity: disabled ? 0.4 : 1, lineHeight: 1.2,
  };
  const v = {
    primary:  { background: C.blue,       color: "#fff" },
    ghost:    { background: C.blueDim,    color: C.blue },
    danger:   { background: C.dangerDim,  color: C.danger },
    success:  { background: C.successDim, color: C.success },
    subtle:   { background: C.subtle,     color: C.muted },
    warn:     { background: C.warnDim,    color: C.warn },
  };
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ ...base, ...(v[variant] || v.primary), ...s }}>
      {children}
    </button>
  );
}

export function Card({ children, style: s = {} }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, ...s }}>
      {children}
    </div>
  );
}

export function Input({ label, value, onChange, type = "text", placeholder, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <p style={{ margin: "0 0 6px", color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </p>
      )}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: C.subtle, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 16,
          fontFamily: "inherit", outline: "none", boxSizing: "border-box",
        }} />
      {hint && <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 11 }}>{hint}</p>}
    </div>
  );
}

export function Select({ label, value, onChange, children, style: s = {} }) {
  return (
    <div style={{ marginBottom: 14, ...s }}>
      {label && (
        <p style={{ margin: "0 0 6px", color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </p>
      )}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", background: C.subtle, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "12px 14px", color: C.text,
          fontFamily: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box",
        }}>
        {children}
      </select>
    </div>
  );
}

export function Modal({ children, onClose, title, contentStyle }) {
  const mobile = useIsMobile();
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: mobile ? "flex-end" : "center",
        justifyContent: "center", zIndex: 300,
      }}>
      <div style={{
        background: C.card,
        borderRadius: mobile ? "20px 20px 0 0" : 20,
        padding: "24px 20px",
        width: "100%",
        maxWidth: mobile ? 430 : 520,
        maxHeight: "90vh", overflowY: "auto",
        ...contentStyle,
      }}>
        {title && <h3 style={{ margin: "0 0 18px", color: C.text, fontSize: 17, fontWeight: 800 }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({ label, onConfirm, onCancel, variant = "danger" }) {
  return (
    <Modal onClose={onCancel}>
      <p style={{ margin: "0 0 20px", color: C.text, fontSize: 15, fontWeight: 600, textAlign: "center" }}>{label}</p>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn full variant="subtle" onClick={onCancel}>Cancelar</Btn>
        <Btn full variant={variant} onClick={onConfirm}>Confirmar</Btn>
      </div>
    </Modal>
  );
}

export function TopBar({ user, onLogout }) {
  const mobile = useIsMobile();
  const [confirm, setConfirm] = useState(false);
  if (!mobile) return null;
  return (
    <>
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, zIndex: 99,
        background: `${C.bg}ee`, backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${C.border}`,
        paddingTop: "calc(env(safe-area-inset-top) + 10px)",
        paddingBottom: "10px", paddingLeft: "16px", paddingRight: "16px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <StarLogo size={20} glow />
        <span style={{ fontWeight: 900, fontSize: 14, color: C.text, flex: 1 }}>
          MAGIC BOX <span style={{ color: C.muted, fontWeight: 400 }}>Cross Training</span>
        </span>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user.role === "gestor" && <Badge label="Gestor" color={C.warn} />}
            <button onClick={() => setConfirm(true)} title="Sair"
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18, padding: 0 }}>
              ⏏
            </button>
          </div>
        )}
      </div>
      {confirm && (
        <ConfirmModal
          label="Deseja sair?"
          variant="danger"
          onConfirm={onLogout}
          onCancel={() => setConfirm(false)}
        />
      )}
    </>
  );
}

export function BottomNav({ tab, setTab, isGestor, user, onLogout }) {
  const mobile = useIsMobile();
  const [confirm, setConfirm] = useState(false);
  const items = isGestor
    ? [
        { id: "g_horarios", label: "Horários", icon: "📅" },
        { id: "g_alunos",   label: "Alunos",   icon: "👥" },
        { id: "g_planos",   label: "Planos",   icon: "📋" },
        { id: "g_config",   label: "Config",   icon: "⚙️" },
      ]
    : [
        { id: "home",    label: "Início",   icon: "🏠" },
        { id: "agenda",  label: "Agenda",   icon: "📅" },
        { id: "checkin", label: "Check-in", icon: "✅" },
        { id: "plano",   label: "Meu Plano",icon: "👤" },
      ];

  // Desktop: sidebar lateral
  if (!mobile) {
    return (
      <nav style={{
        position: "fixed", top: 0, left: 0, height: "100vh", width: 220, zIndex: 100,
        background: C.card, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", padding: "24px 0",
        boxSizing: "border-box",
      }}>
        {/* Logo */}
        <div style={{ padding: "0 20px 28px", display: "flex", alignItems: "center", gap: 10 }}>
          <StarLogo size={22} glow />
          <div>
            <div style={{ fontWeight: 900, fontSize: 13, color: C.text, lineHeight: 1.2 }}>MAGIC BOX</div>
            <div style={{ fontSize: 10, color: C.muted }}>Cross Training</div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "0 10px" }}>
          {items.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              width: "100%", padding: "10px 12px", border: "none", borderRadius: 12,
              background: tab === item.id ? C.blueDim : "none",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
              color: tab === item.id ? C.blue : C.muted,
              transition: "all 0.18s", fontFamily: "inherit", textAlign: "left",
            }}>
              <span style={{ fontSize: 18, width: 22, textAlign: "center" }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: tab === item.id ? 700 : 400 }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* User + logout */}
        {user && (
          <div style={{ padding: "16px 14px 0", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Avatar name={user.name} size={32} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.name}
                </div>
                {user.role === "gestor" && <Badge label="Gestor" color={C.warn} />}
              </div>
            </div>
            <button onClick={() => setConfirm(true)} style={{
              width: "100%", padding: "8px 12px", border: "none", borderRadius: 10,
              background: C.subtle, cursor: "pointer", color: C.muted,
              fontFamily: "inherit", fontSize: 12, fontWeight: 600, textAlign: "left",
            }}>
              ⏏ Sair
            </button>
            {confirm && (
              <ConfirmModal
                label="Deseja sair?"
                variant="danger"
                onConfirm={onLogout}
                onCancel={() => setConfirm(false)}
              />
            )}
          </div>
        )}
      </nav>
    );
  }

  // Mobile: bottom nav original
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, zIndex: 100,
      background: `${C.bg}f5`, backdropFilter: "blur(16px)",
      borderTop: `1px solid ${C.border}`, display: "flex",
      paddingBottom: "env(safe-area-inset-bottom, 10px)",
    }}>
      {items.map(item => (
        <button key={item.id} onClick={() => setTab(item.id)} style={{
          flex: 1, padding: "10px 0 6px", border: "none", background: "none",
          cursor: "pointer", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 2,
          color: tab === item.id ? C.blue : C.muted,
          transition: "color 0.2s", fontFamily: "inherit",
        }}>
          <span style={{ fontSize: 19 }}>{item.icon}</span>
          <span style={{ fontSize: 10, fontWeight: tab === item.id ? 700 : 400 }}>{item.label}</span>
          {tab === item.id && <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.blue }} />}
        </button>
      ))}
    </nav>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none"
        style={{ animation: "spin 1s linear infinite" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <polygon points="16,2 19.5,12.5 30,12.5 21.5,19 24.5,29.5 16,23 7.5,29.5 10.5,19 2,12.5 12.5,12.5"
          fill={C.blue} opacity="0.7" />
      </svg>
    </div>
  );
}

function shouldShowInstallPrompt() {
  const isPWA = window.matchMedia("(display-mode: standalone)").matches
             || navigator.standalone === true;
  if (isPWA) return false;
  const isIOS     = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  return isIOS || isAndroid;
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(() => shouldShowInstallPrompt());
  const [out, setOut]         = useState(false);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  if (!visible) return null;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  function dismiss() {
    setOut(true);
    setTimeout(() => setVisible(false), 280);
  }

  const steps = isIOS
    ? [
        { icon: "🧭", text: <>Abra esta página <strong>no Safari</strong> (obrigatório no iPhone/iPad)</> },
        { icon: "⬆️", text: <>Toque no botão <strong>Compartilhar</strong> na barra inferior</> },
        { icon: "➕", text: <>Selecione <strong>"Adicionar à Tela de Início"</strong></> },
      ]
    : [
        { icon: "⋮",  text: <>Toque nos <strong>três pontos</strong> no canto superior do Chrome</> },
        { icon: "➕", text: <>Selecione <strong>"Adicionar à tela inicial"</strong></> },
      ];

  return (
    <>
      <style>{`
        @keyframes slideUp   { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes slideDown { from { transform: translateY(0) }     to { transform: translateY(100%) } }
      `}</style>
      <div style={{
        position: "fixed", inset: 0, zIndex: 500, overflow: "hidden",
        background: "rgba(0,0,0,0.6)", display: "flex",
        alignItems: "flex-end", justifyContent: "center",
      }}>
        <div style={{
          width: "100%", maxWidth: 430,
          background: C.card, borderRadius: "22px 22px 0 0",
          padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
          boxSizing: "border-box",
          animation: `${out ? "slideDown" : "slideUp"} 0.28s ease`,
        }}>
          {/* Handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.subtle, margin: "0 auto 20px" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <StarLogo size={28} glow />
            <div>
              <p style={{ margin: 0, color: C.text, fontWeight: 900, fontSize: 16 }}>Instale o app</p>
              <p style={{ margin: 0, color: C.muted, fontSize: 12 }}>Acesse mais rápido direto da tela inicial</p>
            </div>
          </div>

          {isIOS && (
            <div style={{ background: C.warnDim, border: `1px solid ${C.warn}22`, borderRadius: 12, padding: "8px 12px", marginBottom: 14 }}>
              <p style={{ margin: 0, color: C.warn, fontSize: 12 }}>
                No iPhone/iPad, a instalação só funciona pelo <strong>Safari</strong>.
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, background: C.subtle,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>{s.icon}</div>
                <p style={{ margin: 0, color: C.text, fontSize: 13, lineHeight: 1.4 }}>{s.text}</p>
              </div>
            ))}
          </div>

          <Btn full variant="ghost" onClick={dismiss}>Agora não</Btn>
        </div>
      </div>
    </>
  );
}
