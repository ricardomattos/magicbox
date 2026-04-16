import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { horariosApi, configApi, planosApi } from "../../api/index.js";
import { Card, Badge, Btn, Spinner, StarLogo, C, useIsMobile } from "../../components/ui.jsx";

function todayStr()    { return new Date().toISOString().split("T")[0]; }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; }
function curMonthKey() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; }
function prevMonthKey() { const n = new Date(); let m = n.getMonth()-1, y = n.getFullYear(); if(m<0){m=11;y--;} return `${y}-${String(m+1).padStart(2,"0")}`; }

const MOD_META = {
  crossfit: { label: "Crossfit", color: C.blue },
  hyrox:    { label: "Hyrox",    color: C.warn },
};

export default function CheckinPage() {
  const { user, refreshUser } = useAuth();
  const mobile = useIsMobile();

  const temCrossfit = user?.plano_tem_crossfit ?? false;
  const temHyrox    = user?.plano_tem_hyrox    ?? false;
  const temAmbos    = temCrossfit && temHyrox;
  const modalidades = [
    ...(temCrossfit ? ["crossfit"] : []),
    ...(temHyrox    ? ["hyrox"]    : []),
  ];
  const defaultMod = temCrossfit ? "crossfit" : "hyrox";

  const [tab, setTab]           = useState("today");
  const [modalidade, setMod]    = useState(defaultMod);
  const [config, setConfig]     = useState(null);
  // horariosPorMod[mod] = array of horarios for current dateStr
  const [horariosPorMod, setHorariosPorMod] = useState({});
  const [loading, setLoading]   = useState(true);
  const [sel, setSel]           = useState(null);
  const [acting, setActing]     = useState(false);
  const [podeCheckin, setPodeCheckin] = useState(null);

  const hora = new Date().getHours();

  useEffect(() => {
    configApi.get().then(setConfig).catch(() => {});
    if (user) {
      setPodeCheckin(null);
      planosApi.getPagamentos(user.id)
        .then(d => {
          const pagos = d.meses_pagos || [];
          const registradoEsteMes = (user.since_key || "") >= curMonthKey();
          const ok = registradoEsteMes || pagos.includes(curMonthKey()) || pagos.includes(prevMonthKey());
          setPodeCheckin(ok);
        })
        .catch(() => setPodeCheckin(false));
    }
  }, [user]);

  const releaseHour      = config?.checkin_release_hour ?? 18;
  const tomorrowUnlocked = hora >= releaseHour;
  const dateStr          = tab === "today" ? todayStr() : tomorrowStr();

  const loadHorarios = useCallback(() => {
    setLoading(true);
    setSel(null);
    const mods = modalidades.length > 0 ? modalidades : ["crossfit"];
    Promise.all(
      mods.map(mod =>
        horariosApi.list(dateStr, mod)
          .then(data => ({ mod, data }))
          .catch(() => ({ mod, data: [] }))
      )
    ).then(results => {
      const map = {};
      results.forEach(({ mod, data }) => { map[mod] = data; });
      setHorariosPorMod(map);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr, temCrossfit, temHyrox]);

  useEffect(() => { loadHorarios(); }, [loadHorarios]);

  // Search checkin across ALL modalities (student can only have one active)
  const todosHorarios = Object.values(horariosPorMod).flat();
  const meuCheckin    = todosHorarios.find(h => h.meu_checkin_id);

  // Horarios for the active modalidade tab
  const horariosAtivos = horariosPorMod[modalidade] || [];

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

  // ── Spinner while loading ──
  if (podeCheckin === null || loading) return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 20px" : "28px 0 20px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Check-in</h2>
      </div>
      <Spinner />
    </div>
  );

  // ── Bloqueado ──
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

  // ── Confirmado ──
  if (meuCheckin) {
    const modCheckin = meuCheckin.modalidade;
    const modMeta    = MOD_META[modCheckin] ?? MOD_META.crossfit;
    return (
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
          <p style={{ color: C.muted, fontSize: 14, margin: "0 0 4px" }}>
            {meuCheckin.data === todayStr() ? "Hoje" : "Amanhã"} 💪
          </p>
          {temAmbos && (
            <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
              background: `${modMeta.color}20`, color: modMeta.color,
              textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
              {modMeta.label}
            </span>
          )}
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
  }

  // ── Seleção de horário ──
  const modAtiva = MOD_META[modalidade] ?? MOD_META.crossfit;

  return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 16px" : "28px 0 16px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Fazer Check-in</h2>
      </div>

      {/* Abas de modalidade — só quando tem as duas */}
      {temAmbos && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {modalidades.map(mod => {
            const m = MOD_META[mod];
            return (
              <button key={mod} onClick={() => { setMod(mod); setSel(null); }}
                style={{
                  padding: "8px 20px", borderRadius: 12, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 700, fontSize: 13, transition: "all 0.15s",
                  background: modalidade === mod ? m.color : C.subtle,
                  color: modalidade === mod ? "#fff" : C.muted,
                }}>
                {m.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Abas Hoje / Amanhã */}
      <div style={{ display: "flex", background: C.subtle, borderRadius: 14, padding: 4, marginBottom: 18, gap: 4 }}>
        {[["today","Hoje"],["tomorrow", tomorrowUnlocked ? "Amanhã" : `Amanhã (a partir das ${releaseHour}h)`]].map(([val, label]) => (
          <button key={val}
            disabled={val === "tomorrow" && !tomorrowUnlocked}
            onClick={() => { setTab(val); setSel(null); }}
            style={{
              flex: 1, padding: "9px 0", border: "none", borderRadius: 11,
              cursor: val === "tomorrow" && !tomorrowUnlocked ? "not-allowed" : "pointer",
              fontFamily: "inherit", fontWeight: 700, fontSize: 13, transition: "all 0.2s",
              background: tab === val ? modAtiva.color : "transparent",
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

      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
        {horariosAtivos.length === 0 && (
          <Card><p style={{ margin: 0, color: C.muted, textAlign: "center" }}>Nenhum horário disponível.</p></Card>
        )}
        {horariosAtivos.map(h => {
          const vagas = h.vagas_livres;
          const cheio = vagas === 0;
          const ativo = sel === h.id;
          return (
            <button key={h.id} disabled={cheio} onClick={() => setSel(h.id)}
              style={{
                background: ativo ? `${modAtiva.color}18` : C.card,
                border: `2px solid ${ativo ? modAtiva.color : cheio ? `${C.danger}30` : C.border}`,
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
                border: `2px solid ${ativo ? modAtiva.color : C.muted}`,
                background: ativo ? modAtiva.color : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {ativo && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      <Btn full disabled={!sel || acting} onClick={doCheckin}
        style={{ background: sel ? modAtiva.color : undefined }}>
        {acting ? "Confirmando..." : "Confirmar Check-in"}
      </Btn>
    </div>
  );
}
