import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { horariosApi, configApi, planosApi } from "../../api/index.js";
import { Card, Badge, Btn, Avatar, C, StarLogo, useIsMobile } from "../../components/ui.jsx";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function todayStr()    { return new Date().toISOString().split("T")[0]; }
function curMonthKey() { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; }

export default function HomePage({ setTab }) {
  const { user } = useAuth();
  const mobile = useIsMobile();
  const [config, setConfig]   = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  useEffect(() => {
    configApi.get().then(setConfig).catch(() => {});
    horariosApi.list(todayStr()).then(setHorarios).catch(() => {});
    if (user) planosApi.getPagamentos(user.id).then(d => setPagamentos(d.meses_pagos || [])).catch(() => {});
  }, [user]);

  const mesAtualPago = pagamentos.includes(curMonthKey());
  const planoNome    = user?.plano_nome;
  const coachMsg     = config?.coach_msg || "";

  const releaseHour   = config?.checkin_release_hour ?? 18;
  const tomorrowOpen  = hora >= releaseHour;

  const meuCheckin = horarios.find(h => h.meu_checkin_id);
  const proximo    = horarios.find(h => h.vagas_livres > 0 && !h.meu_checkin_id);

  const now = new Date();
  const curMonth = now.getMonth();
  const curYear  = now.getFullYear();

  return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 18px" : "28px 0 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{saudacao},</p>
          <h2 style={{ margin: "2px 0 0", color: C.text, fontSize: 21, fontWeight: 900 }}>
            {user?.name?.split(" ")[0]} 👋
          </h2>
        </div>
        <Avatar name={user?.name} size={42} />
      </div>

      {/* Plano card */}
      {planoNome && (
        <div style={{ background: "linear-gradient(135deg,#2060e0 0%,#0e3090 100%)", borderRadius: 20, padding: "18px 20px", marginBottom: 14, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -20, top: -20, opacity: 0.07 }}><StarLogo size={110} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>Plano ativo</p>
              <h3 style={{ margin: "3px 0 0", color: "#fff", fontSize: 18, fontWeight: 900 }}>{planoNome}</h3>
            </div>
            <Badge label={mesAtualPago ? "Pago" : "Em aberto"} color={mesAtualPago ? C.success : C.blue} />
          </div>
          <div style={{ marginTop: 14 }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: 11 }}>{MONTHS[curMonth]} {curYear}</p>
            <p style={{ margin: "2px 0 0", color: "#fff", fontSize: 13, fontWeight: 600 }}>
              {mesAtualPago ? "Mensalidade em dia ✓" : "Mensalidade em aberto — entre em contato"}
            </p>
          </div>
        </div>
      )}

      {/* Coach message */}
      {coachMsg.trim() && (
        <Card style={{ marginBottom: 14, borderColor: "rgba(255,179,0,0.25)", background: "rgba(255,179,0,0.06)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>📣</span>
            <div>
              <p style={{ margin: "0 0 4px", color: C.warn, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Mensagem do coach</p>
              <p style={{ margin: 0, color: C.text, fontSize: 14, lineHeight: 1.5 }}>{coachMsg}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[["Treinos este mês", user?.treinos_mes ?? 0], ["Total de treinos", user?.treinos_total ?? 0]].map(([label, val], i) => (
          <Card key={i} style={{ padding: "14px 16px" }}>
            <p style={{ margin: 0, color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
            <p style={{ margin: "6px 0 0", color: C.blue, fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{val}</p>
          </Card>
        ))}
      </div>

      {/* Próximo / check-in */}
      {meuCheckin ? (
        <Card style={{ borderColor: `${C.success}40` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>✅</span>
            <div>
              <p style={{ margin: 0, color: C.success, fontWeight: 700, fontSize: 14 }}>Check-in confirmado!</p>
              <p style={{ margin: 0, color: C.muted, fontSize: 12 }}>
                {meuCheckin.data === todayStr() ? "Hoje" : "Amanhã"} às {meuCheckin.hora.slice(0,5)}
              </p>
            </div>
          </div>
        </Card>
      ) : proximo ? (
        <Card>
          <p style={{ margin: "0 0 10px", color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>Próxima vaga disponível</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, color: C.text, fontSize: 22, fontWeight: 900 }}>{proximo.hora.slice(0,5)}</p>
              <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>{proximo.vagas_livres} vagas livres</p>
            </div>
            <Btn onClick={() => setTab("checkin")}>Fazer Check-in</Btn>
          </div>
        </Card>
      ) : (
        <Card><p style={{ margin: 0, color: C.muted, textAlign: "center", fontSize: 14 }}>Sem horários disponíveis</p></Card>
      )}
    </div>
  );
}
