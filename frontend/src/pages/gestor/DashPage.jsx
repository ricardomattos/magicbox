import { useState, useEffect } from "react";
import { usersApi } from "../../api/index.js";
import { Spinner, C, useIsMobile } from "../../components/ui.jsx";

// Retorna {start, end} da semana atual (seg–dom) como objetos {month:1-12, day:1-31}
function getWeekRange() {
  const today = new Date();
  const dow = today.getDay(); // 0=dom, 1=seg...
  const diffToMon = (dow === 0 ? -6 : 1 - dow);
  const mon = new Date(today); mon.setDate(today.getDate() + diffToMon);
  const sun = new Date(mon);  sun.setDate(mon.getDate() + 6);
  return { start: mon, end: sun };
}

function birthInRange(birthDateISO, start, end) {
  if (!birthDateISO) return false;
  const [, bm, bd] = birthDateISO.split("-").map(Number);

  const sm = start.getMonth() + 1, sd = start.getDate();
  const em = end.getMonth()   + 1, ed = end.getDate();

  const bVal = bm * 100 + bd;
  const sVal = sm * 100 + sd;
  const eVal = em * 100 + ed;

  if (sVal <= eVal) {
    // semana não cruza virada de ano
    return bVal >= sVal && bVal <= eVal;
  } else {
    // cruza 31/12 → 01/01
    return bVal >= sVal || bVal <= eVal;
  }
}

function formatDate(dateISO) {
  const [, m, d] = dateISO.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

function dayLabel(dateISO, weekStart) {
  const [, bm, bd] = dateISO.split("-").map(Number);
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    if (d.getMonth() + 1 === bm && d.getDate() === bd) {
      const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const today = new Date();
      const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
      return isToday ? "Hoje!" : DAYS[d.getDay()];
    }
  }
  return "";
}

function AvatarInitials({ name, size = 38 }) {
  const initials = name.trim().split(" ").slice(0, 2).map(w => w[0].toUpperCase()).join("");
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${hue},55%,38%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontSize: size * 0.36, fontWeight: 700, color: "#fff",
    }}>
      {initials}
    </div>
  );
}

function BirthdayCard({ alunos, weekStart, weekEnd }) {
  const { start, end } = { start: weekStart, end: weekEnd };

  const aniversariantes = alunos
    .filter(u => u.birth_date && birthInRange(u.birth_date, start, end))
    .sort((a, b) => {
      const [, am, ad] = a.birth_date.split("-").map(Number);
      const [, bm, bd] = b.birth_date.split("-").map(Number);
      return (am * 100 + ad) - (bm * 100 + bd);
    });

  const today = new Date();
  const fmt = d => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;

  return (
    <div style={{
      background: C.card, borderRadius: 18, padding: "18px 20px",
      border: `1px solid ${C.border}`, marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>🎂</span>
        <div>
          <p style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 800 }}>Aniversariantes da semana</p>
          <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 11 }}>
            {fmt(start)} – {fmt(end)}
          </p>
        </div>
      </div>

      {aniversariantes.length === 0 ? (
        <div style={{
          background: C.subtle, borderRadius: 12, padding: "20px 16px",
          textAlign: "center",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 28 }}>🎉</p>
          <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>
            Nenhum aniversariante essa semana.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {aniversariantes.map(u => {
            const label = dayLabel(u.birth_date, start);
            const isToday = label === "Hoje!";
            return (
              <div key={u.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: isToday ? C.blueDim : C.subtle,
                borderRadius: 14, padding: "10px 14px",
                border: `1.5px solid ${isToday ? C.blue : C.border}`,
              }}>
                <AvatarInitials name={u.name} size={38} />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <p style={{ margin: 0, color: C.text, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.name}
                  </p>
                  <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>
                    {formatDate(u.birth_date)}
                  </p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                  background: isToday ? C.blue : C.border,
                  color: isToday ? "#fff" : C.muted,
                  flexShrink: 0,
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

export default function DashPage() {
  const mobile = useIsMobile();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);

  const { start, end } = getWeekRange();

  useEffect(() => {
    usersApi.list()
      .then(d => setAlunos((d.results || d).filter(u => u.role === "aluno")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 20px" : "28px 0 24px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Dashboard</h2>
        <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>
          Visão geral da Magic Box
        </p>
      </div>

      {loading ? <Spinner /> : (
        <>
          <BirthdayCard alunos={alunos} weekStart={start} weekEnd={end} />
        </>
      )}
    </div>
  );
}
