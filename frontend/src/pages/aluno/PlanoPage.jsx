import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { planosApi } from "../../api/index.js";
import { Card, Badge, Avatar, Spinner, C } from "../../components/ui.jsx";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTH_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function curMonthKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;
}

function getMeses(pagamentos, sinceKey) {
  const pagos = pagamentos || [];
  const now = new Date();
  const CUR_MONTH = now.getMonth();
  const CUR_YEAR  = now.getFullYear();
  const result = [];

  // Previous month — only if user was registered then
  let pm = CUR_MONTH - 1, py = CUR_YEAR;
  if (pm < 0) { pm = 11; py--; }
  const prevKey = `${py}-${String(pm+1).padStart(2,"0")}`;
  const showPrev = sinceKey && sinceKey <= prevKey;
  if (showPrev) {
    result.push({ key: prevKey, month: pm, year: py, pago: pagos.includes(prevKey), isCurrentMonth: false, isPast: true });
  }

  // Current + next 4
  for (let i = 0; i <= 4; i++) {
    let m = CUR_MONTH + i, y = CUR_YEAR;
    if (m > 11) { m -= 12; y++; }
    const key = `${y}-${String(m+1).padStart(2,"0")}`;
    result.push({ key, month: m, year: y, pago: pagos.includes(key), isCurrentMonth: i === 0, isPast: false });
  }
  return result;
}

export default function PlanoPage() {
  const { user } = useAuth();
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    planosApi.getPagamentos(user.id)
      .then(d => setPagamentos(d.meses_pagos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const mesAtualPago = pagamentos.includes(curMonthKey());
  const sinceKey = user?.since_key;
  const meses = getMeses(pagamentos, sinceKey);

  return (
    <div style={{ padding: "0 18px 100px" }}>
      <div style={{ padding: "56px 0 20px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Meu Plano</h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <Avatar name={user?.name} size={56} style={{ boxShadow: `0 0 20px ${C.blueGlow}` }} />
        <div>
          <h3 style={{ margin: 0, color: C.text, fontSize: 17, fontWeight: 800 }}>{user?.name}</h3>
          <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>
            Aluno(a) desde {user?.since ? new Date(user.since).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "—"}
          </p>
        </div>
      </div>

      {user?.plano_nome ? (
        <div style={{ background: "linear-gradient(135deg,#2060e0 0%,#0e3090 100%)", borderRadius: 20, padding: 20, marginBottom: 14, position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>Plano ativo</p>
              <h3 style={{ margin: "3px 0 0", color: "#fff", fontSize: 20, fontWeight: 900 }}>{user.plano_nome}</h3>
            </div>
            <Badge label={mesAtualPago ? "Pago" : "Em aberto"} color={mesAtualPago ? C.success : C.danger} />
          </div>
        </div>
      ) : (
        <Card style={{ marginBottom: 14 }}>
          <p style={{ margin: 0, color: C.muted, textAlign: "center" }}>Nenhum plano associado.</p>
        </Card>
      )}

      {loading ? <Spinner /> : (
        <Card style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 14px", color: C.text, fontWeight: 700, fontSize: 14 }}>Situação de pagamentos</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {meses.map(m => {
              const isFuture = !m.isPast && !m.isCurrentMonth;
              const statusLabel = m.pago ? "Pago" : m.isPast ? "Atrasado" : m.isCurrentMonth ? "Em aberto" : "Em aberto";
              const statusColor = m.pago ? C.success : m.isPast ? C.danger : m.isCurrentMonth ? C.warn : C.muted;
              const dotColor    = m.pago ? C.success : m.isPast ? C.danger : m.isCurrentMonth ? C.warn : C.border;
              return (
                <div key={m.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                    <span style={{ color: isFuture ? C.muted : C.text, fontSize: 14, fontWeight: m.isCurrentMonth ? 700 : 400 }}>
                      {MONTHS[m.month]} {m.year}{m.isCurrentMonth ? " (atual)" : ""}
                    </span>
                  </div>
                  <Badge label={statusLabel} color={statusColor} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[["🏆","Total de treinos", user?.treinos_total ?? 0], ["📅","Este mês", `${user?.treinos_mes ?? 0} aulas`]].map(([ico, label, val], i) => (
          <Card key={i} style={{ padding: "14px 16px" }}>
            <span style={{ fontSize: 22 }}>{ico}</span>
            <p style={{ margin: "6px 0 2px", color: C.muted, fontSize: 11 }}>{label}</p>
            <p style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 800 }}>{val}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
