import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { horariosApi, configApi, planosApi } from "../../api/index.js";
import { Card, Badge, Btn, Spinner, StarLogo, C, useIsMobile } from "../../components/ui.jsx";

function todayStr()    { return new Date().toISOString().split("T")[0]; }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; }
function curMonthKey() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; }
function prevMonthKey() { const n = new Date(); let m = n.getMonth()-1, y = n.getFullYear(); if(m<0){m=11;y--;} return `${y}-${String(m+1).padStart(2,"0")}`; }

export default function CheckinPage() {
  const { user, refreshUser } = useAuth();
  const mobile = useIsMobile();
  const [tab, setTab]         = useState("today");
  const [config, setConfig]   = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel]         = useState(null);
  const [acting, setActing]   = useState(false);
  const [podeCheckin, setPodeCheckin] = useState(null); // null = carregando

  const hora = new Date().getHours();

  useEffect(() => {
    configApi.get().then(setConfig).catch(() => {});
    if (user) {
      setPodeCheckin(null);
      planosApi.getPagamentos(user.id)
        .then(d => {
          const pagos = d.meses_pagos || [];
          // Espelha a lógica do backend:
          // - cadastrado este mês → sempre liberado
          // - pagou o mês atual OU o mês anterior → liberado
          const registradoEsteMes = (user.since_key || "") >= curMonthKey();
          const ok = registradoEsteMes
            || pagos.includes(curMonthKey())
            || pagos.includes(prevMonthKey());
          setPodeCheckin(ok);
        })
        .catch(() => setPodeCheckin(false));
    }
  }, [user]);

  const releaseHour     = config?.checkin_release_hour ?? 18;
  const tomorrowUnlocked = hora >= releaseHour;
  const dateStr          = tab === "today" ? todayStr() : tomorrowStr();

  const loadHorarios = useCallback(() => {
    setLoading(true);
    horariosApi.list(dateStr)
      .then(setHorarios)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dateStr]);

  useEffect(() => { loadHorarios(); }, [loadHorarios]);

  const meuCheckin = horarios.find(h => h.meu_checkin_id);

  async function doCheckin() {
    if (!sel) return;
    setActing(true);
    try {
      await horariosApi.checkin(sel);
      await refreshUser();
      loadHorarios();
      setSel(null);
    } catch (e) {
      alert(e.message || "Erro ao fazer check-in.");
    } finally {
      setActing(false);
    }
  }

  async function cancelarCheckin() {
    if (!meuCheckin) return;
    setActing(true);
    try {
      await horariosApi.release(meuCheckin.id);
      await refreshUser();
      loadHorarios();
    } catch (e) {
      alert(e.message || "Erro ao liberar vaga.");
    } finally {
      setActing(false);
    }
  }

  // Show spinner while payment status or horarios are still loading
  if (podeCheckin === null || loading) return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 20px" : "28px 0 20px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Check-in</h2>
      </div>
      <Spinner />
    </div>
  );

  // Blocked: genuinely delinquent (neither current nor previous month paid)
  if (!podeCheckin && !meuCheckin) return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 20px" : "28px 0 20px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Check-in</h2>
      </div>
      <Card style={{ borderColor: `${C.danger}40`, textAlign: "center", padding: "36px 20px" }}>
        <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>🔒</span>
        <Badge label="Acesso bloqueado" color={C.danger} />
        <h3 style={{ color: C.text, fontSize: 20, fontWeight: 900, margin: "14px 0 8px" }}>
          Mensalidade em aberto
        </h3>
        <p style={{ color: C.muted, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Seu pagamento ainda não foi confirmado. Entre em contato com o coach para regularizar.
        </p>
      </Card>
    </div>
  );

  // Confirmed
  if (meuCheckin) return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 20px" : "28px 0 20px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Check-in</h2>
      </div>
      <Card style={{ borderColor: `${C.success}40`, textAlign: "center", padding: "36px 20px" }}>
        <div style={{ marginBottom: 16 }}><StarLogo size={48} glow /></div>
        <Badge label="Confirmado" color={C.success} />
        <h3 style={{ color: C.text, fontSize: 28, fontWeight: 900, margin: "12px 0 4px" }}>
          {meuCheckin.hora.slice(0,5)}
        </h3>
        <p style={{ color: C.muted, fontSize: 14, margin: "0 0 6px" }}>
          {meuCheckin.data === todayStr() ? "Hoje" : "Amanhã"} 💪
        </p>
        <p style={{ color: C.muted, fontSize: 13, margin: "0 0 28px" }}>
          Você está confirmado para esta aula.
        </p>
        <Btn variant="danger" onClick={cancelarCheckin} disabled={acting} full>
          {acting ? "Liberando..." : "Liberar minha vaga"}
        </Btn>
        <p style={{ color: C.muted, fontSize: 11, marginTop: 10 }}>
          Não conseguirá ir? Libere para outro aluno.
        </p>
      </Card>
    </div>
  );

  return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 16px" : "28px 0 16px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Fazer Check-in</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: C.subtle, borderRadius: 14, padding: 4, marginBottom: 18, gap: 4 }}>
        {[["today","Hoje"],["tomorrow", tomorrowUnlocked ? "Amanhã" : `Amanhã (a partir das ${releaseHour}h)`]].map(([val, label]) => (
          <button key={val}
            disabled={val === "tomorrow" && !tomorrowUnlocked}
            onClick={() => { setTab(val); setSel(null); }}
            style={{
              flex: 1, padding: "9px 0", border: "none", borderRadius: 11,
              cursor: val === "tomorrow" && !tomorrowUnlocked ? "not-allowed" : "pointer",
              fontFamily: "inherit", fontWeight: 700, fontSize: 13, transition: "all 0.2s",
              background: tab === val ? C.blue : "transparent",
              color: tab === val ? "#fff" : val === "tomorrow" && !tomorrowUnlocked ? C.muted : C.text,
              opacity: val === "tomorrow" && !tomorrowUnlocked ? 0.5 : 1,
            }}>
            {label}
          </button>
        ))}
      </div>

      {!tomorrowUnlocked && tab === "today" && (
        <div style={{ background: C.blueDim, borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <p style={{ margin: 0, color: C.blue, fontSize: 12 }}>
            Check-in para amanhã será liberado a partir das {releaseHour}h.
          </p>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
          {horarios.length === 0 && (
            <Card><p style={{ margin: 0, color: C.muted, textAlign: "center" }}>Nenhum horário disponível.</p></Card>
          )}
          {horarios.map(h => {
            const vagas = h.vagas_livres;
            const cheio = vagas === 0;
            const ativo = sel === h.id;
            return (
              <button key={h.id} disabled={cheio} onClick={() => setSel(h.id)}
                style={{
                  background: ativo ? C.blueDim : C.card,
                  border: `2px solid ${ativo ? C.blue : cheio ? `${C.danger}30` : C.border}`,
                  borderRadius: 16, padding: "14px 16px",
                  cursor: cheio ? "not-allowed" : "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  opacity: cheio ? 0.5 : 1, fontFamily: "inherit", transition: "all 0.18s",
                }}>
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: 0, color: C.text, fontSize: 20, fontWeight: 900 }}>{h.hora.slice(0,5)}</p>
                  <p style={{ margin: "2px 0 0", color: cheio ? C.danger : C.muted, fontSize: 12 }}>
                    {cheio ? "Sem vagas" : `${vagas} vagas disponíveis`}
                  </p>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  border: `2px solid ${ativo ? C.blue : C.muted}`,
                  background: ativo ? C.blue : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {ativo && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Btn full disabled={!sel || acting} onClick={doCheckin}>
        {acting ? "Confirmando..." : "Confirmar Check-in"}
      </Btn>
    </div>
  );
}
