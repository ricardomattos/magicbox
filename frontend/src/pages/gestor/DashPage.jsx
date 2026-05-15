import { useState, useEffect } from "react";
import { usersApi, planosApi } from "../../api/index.js";
import { Avatar, Spinner, Modal, C, useIsMobile } from "../../components/ui.jsx";

function curMonthKey() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; }

function getWeekRange() {
  const today = new Date();
  const dow = today.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(today); mon.setDate(today.getDate() + diffToMon);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: mon, end: sun };
}

function birthInRange(birthDateISO, start, end) {
  if (!birthDateISO) return false;
  const [, bm, bd] = birthDateISO.split("-").map(Number);
  const sm = start.getMonth()+1, sd = start.getDate();
  const em = end.getMonth()+1,   ed = end.getDate();
  const bVal = bm*100+bd, sVal = sm*100+sd, eVal = em*100+ed;
  return sVal <= eVal ? (bVal >= sVal && bVal <= eVal) : (bVal >= sVal || bVal <= eVal);
}

function fmt2(d) { return String(d).padStart(2,"0"); }
function formatDate(iso) { const [,m,d] = iso.split("-").map(Number); return `${fmt2(d)}/${fmt2(m)}`; }

function dayLabel(dateISO, weekStart) {
  const [,bm,bd] = dateISO.split("-").map(Number);
  for (let i=0;i<7;i++) {
    const d = new Date(weekStart); d.setDate(weekStart.getDate()+i);
    if (d.getMonth()+1===bm && d.getDate()===bd) {
      const DAYS=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
      const today=new Date();
      return d.getDate()===today.getDate()&&d.getMonth()===today.getMonth() ? "Hoje!" : DAYS[d.getDay()];
    }
  }
  return "";
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = C.blue }) {
  return (
    <div style={{
      background: C.card, borderRadius: 18, padding: "18px 20px",
      border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div>
        <p style={{ margin: 0, color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>{label}</p>
      </div>
      <p style={{ margin: 0, color, fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: 0, color: C.muted, fontSize: 12 }}>{sub}</p>}
    </div>
  );
}

// ── Seção: Top frequentes ──────────────────────────────────────────────────────
const MEDALS = ["🥇", "🥈", "🥉"];
const AVATAR_SIZE = 32;
const AVATAR_OVERLAP = 18;

function StackedAvatars({ group }) {
  const visible = group.slice(0, 3);
  const extra = group.length - visible.length;
  const width = AVATAR_SIZE + (visible.length - 1) * AVATAR_OVERLAP + (extra > 0 ? 22 : 0);
  return (
    <div style={{ position: "relative", width, height: AVATAR_SIZE, flexShrink: 0 }}>
      {visible.map((u, ai) => (
        <div key={u.id} style={{ position: "absolute", left: ai * AVATAR_OVERLAP, zIndex: visible.length - ai }}>
          <Avatar name={u.name} size={AVATAR_SIZE} style={{ border: `2px solid ${C.card}`, boxSizing: "content-box" }} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          position: "absolute", left: visible.length * AVATAR_OVERLAP, zIndex: 0,
          width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: "50%",
          background: C.subtle, border: `2px solid ${C.card}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 800, color: C.muted, boxSizing: "content-box",
        }}>+{extra}</div>
      )}
    </div>
  );
}

function TopFrequentesCard({ alunos }) {
  const [modalRank, setModalRank] = useState(null);

  const sorted = [...alunos]
    .filter(u => u.treinos_mes > 0)
    .sort((a, b) => b.treinos_mes - a.treinos_mes);

  // Agrupa empates em ranks
  const ranks = [];
  for (const u of sorted) {
    const last = ranks[ranks.length - 1];
    if (last && last.count === u.treinos_mes) last.group.push(u);
    else ranks.push({ count: u.treinos_mes, group: [u] });
  }
  const topRanks = ranks.slice(0, 3);
  const max = topRanks[0]?.count || 1;

  return (
    <div style={{ background: C.card, borderRadius: 18, padding: "18px 20px", border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>🏆</span>
        <div>
          <p style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 800 }}>Mais frequentes</p>
          <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 11 }}>este mês</p>
        </div>
      </div>

      {topRanks.length === 0 ? (
        <p style={{ margin: 0, color: C.muted, fontSize: 13, textAlign: "center", padding: "16px 0" }}>Nenhum treino registrado ainda.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {topRanks.map((rank, ri) => {
            const tied = rank.group.length > 1;
            return (
              <div
                key={ri}
                onClick={() => tied && setModalRank(rank)}
                style={{ display: "flex", alignItems: "center", gap: 12, cursor: tied ? "pointer" : "default" }}
              >
                <span style={{ width: 20, textAlign: "center", fontSize: 14, flexShrink: 0 }}>
                  {ri < 3 ? MEDALS[ri] : `${ri + 1}º`}
                </span>

                <StackedAvatars group={rank.group} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 4px", color: C.text, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {tied ? `${rank.group.length} empatados` : rank.group[0].name}
                  </p>
                  <div style={{ height: 4, background: C.subtle, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(rank.count / max) * 100}%`, background: C.blue, borderRadius: 4, transition: "width 0.4s" }} />
                  </div>
                </div>

                <span style={{ color: C.blue, fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{rank.count}</span>
                {tied && <span style={{ color: C.muted, fontSize: 16, flexShrink: 0 }}>›</span>}
              </div>
            );
          })}
        </div>
      )}

      {modalRank && (
        <Modal
          title={`${modalRank.group.length} empatados — ${modalRank.count} treino${modalRank.count !== 1 ? "s" : ""}`}
          onClose={() => setModalRank(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {modalRank.group.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, background: C.subtle, borderRadius: 12, padding: "10px 14px" }}>
                <Avatar name={u.name} size={32} />
                <span style={{ color: C.text, fontSize: 14 }}>{u.name}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Seção: Distribuição por plano ─────────────────────────────────────────────
function DistribuicaoPlanoCard({ alunos }) {
  const map = {};
  for (const u of alunos) {
    const key = u.plano_nome || "Sem plano";
    const cor = u.plano_cor || C.muted;
    if (!map[key]) map[key] = { count: 0, cor };
    map[key].count++;
  }
  const entries = Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  const total = alunos.length || 1;

  return (
    <div style={{ background: C.card, borderRadius: 18, padding: "18px 20px", border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>📊</span>
        <div>
          <p style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 800 }}>Distribuição por plano</p>
          <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 11 }}>{alunos.length} aluno{alunos.length !== 1 ? "s" : ""} no total</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {entries.map(([nome, { count, cor }]) => (
          <div key={nome}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: cor, flexShrink: 0 }} />
                <span style={{ color: C.text, fontSize: 13 }}>{nome}</span>
              </div>
              <span style={{ color: C.muted, fontSize: 12 }}>{count} ({Math.round(count/total*100)}%)</span>
            </div>
            <div style={{ height: 4, background: C.subtle, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(count/total)*100}%`, background: cor, borderRadius: 4, transition: "width 0.4s" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Seção: Inadimplentes ──────────────────────────────────────────────────────
function InadimplentesCard({ resumo }) {
  const [expanded, setExpanded] = useState(false);
  const { inadimplentes_count: count, inadimplentes: lista } = resumo;

  if (count === 0) {
    return (
      <div style={{ background: C.successDim, borderRadius: 18, padding: "16px 20px", border: `1px solid ${C.success}`, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>✅</span>
        <div>
          <p style={{ margin: 0, color: C.success, fontSize: 14, fontWeight: 800 }}>Nenhum inadimplente</p>
          <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>Todos os alunos estão em dia.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.dangerDim, borderRadius: 18, padding: "18px 20px", border: `1px solid ${C.danger}` }}>
      <button onClick={() => setExpanded(v => !v)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0, fontFamily: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, color: C.danger, fontSize: 15, fontWeight: 800 }}>{count} inadimplente{count !== 1 ? "s" : ""}</p>
            <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>Mês anterior em aberto</p>
          </div>
        </div>
        <span style={{ color: C.muted, fontSize: 18, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {expanded && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {lista.map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "8px 12px" }}>
              <Avatar name={u.name} size={28} />
              <span style={{ color: C.text, fontSize: 13 }}>{u.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Seção: Aniversariantes ────────────────────────────────────────────────────
function AniversariantesCard({ alunos, weekStart, weekEnd }) {
  const aniversariantes = alunos
    .filter(u => u.birth_date && birthInRange(u.birth_date, weekStart, weekEnd))
    .sort((a, b) => {
      const [,am,ad] = a.birth_date.split("-").map(Number);
      const [,bm,bd] = b.birth_date.split("-").map(Number);
      return (am*100+ad) - (bm*100+bd);
    });

  const fmt = d => `${fmt2(d.getDate())}/${fmt2(d.getMonth()+1)}`;

  return (
    <div style={{ background: C.card, borderRadius: 18, padding: "18px 20px", border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>🎂</span>
        <div>
          <p style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 800 }}>Aniversariantes da semana</p>
          <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 11 }}>{fmt(weekStart)} – {fmt(weekEnd)}</p>
        </div>
      </div>

      {aniversariantes.length === 0 ? (
        <div style={{ background: C.subtle, borderRadius: 12, padding: "20px 16px", textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 28 }}>🎉</p>
          <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Nenhum aniversariante essa semana.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {aniversariantes.map(u => {
            const label = dayLabel(u.birth_date, weekStart);
            const isToday = label === "Hoje!";
            return (
              <div key={u.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: isToday ? C.blueDim : C.subtle,
                borderRadius: 14, padding: "10px 14px",
                border: `1.5px solid ${isToday ? C.blue : C.border}`,
              }}>
                <Avatar name={u.name} size={38} />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <p style={{ margin: 0, color: C.text, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</p>
                  <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>{formatDate(u.birth_date)}</p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                  background: isToday ? C.blue : C.border,
                  color: isToday ? "#fff" : C.muted, flexShrink: 0,
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashPage() {
  const mobile = useIsMobile();
  const [alunos, setAlunos] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);

  const { start, end } = getWeekRange();
  const curKey = curMonthKey();

  useEffect(() => {
    Promise.all([
      usersApi.list().then(d => (d.results || d).filter(u => u.role === "aluno")),
      planosApi.resumo().catch(() => ({ inadimplentes_count: 0, inadimplentes: [] })),
    ])
      .then(([us, res]) => { setAlunos(us); setResumo(res); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalTreinosMes = alunos.reduce((s, u) => s + (u.treinos_mes || 0), 0);
  const novosMes = alunos.filter(u => u.since_key === curKey).length;
  const acessoPendente = alunos.filter(u => u.must_change_pass).length;

  return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 20px" : "28px 0 24px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Dashboard</h2>
        <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>Visão geral do Magicbox</p>
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* KPIs */}
          <div style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 12,
          }}>
            <KpiCard label="Total de alunos" value={alunos.length} color={C.text} sub="cadastrados" />
            <KpiCard label="Novos este mês" value={novosMes} color={C.blue} sub={novosMes > 0 ? "bem-vindos!" : "ainda nenhum"} />
            <KpiCard label="Treinos este mês" value={totalTreinosMes} color={C.success} sub="check-ins ativos" />
            <KpiCard label="1º acesso pendente" value={acessoPendente} color={acessoPendente > 0 ? C.warn : C.muted} sub={acessoPendente > 0 ? "ainda não logaram" : "todos acessaram"} />
          </div>

          {/* Inadimplentes */}
          {resumo && <InadimplentesCard resumo={resumo} />}

          {/* Top frequentes + Distribuição */}
          <div style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
            gap: 12,
          }}>
            <TopFrequentesCard alunos={alunos} />
            <DistribuicaoPlanoCard alunos={alunos} />
          </div>

          {/* Aniversariantes */}
          <AniversariantesCard alunos={alunos} weekStart={start} weekEnd={end} />

        </div>
      )}
    </div>
  );
}
