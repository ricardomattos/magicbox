import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { horariosApi } from "../../api/index.js";
import { Card, Badge, Avatar, Spinner, C, useIsMobile } from "../../components/ui.jsx";

const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function todayStr() { return new Date().toISOString().split("T")[0]; }

export default function AgendaPage() {
  const { user } = useAuth();
  const mobile = useIsMobile();
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    horariosApi.list(todayStr())
      .then(setHorarios)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const meuCheckinId = horarios.find(h => h.meu_checkin_id)?.meu_checkin_id;

  return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "56px 0 18px" : "28px 0 18px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Agenda de Hoje</h2>
        <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>
          {DAYS[now.getDay()]}, {now.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
        </p>
      </div>

      {loading ? <Spinner /> : horarios.length === 0 ? (
        <Card><p style={{ margin: 0, color: C.muted, textAlign: "center" }}>Sem aulas hoje.</p></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {horarios.map(h => {
            const vagas = h.vagas_livres;
            const cheio = vagas === 0;
            const pct   = ((h.confirmados_count) / h.vagas) * 100;
            const euEstou = h.meu_checkin_id != null;
            return (
              <Card key={h.id} style={{ borderColor: euEstou ? `${C.success}50` : cheio ? `${C.danger}30` : C.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: C.text, fontSize: 20, fontWeight: 900 }}>{h.hora.slice(0,5)}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {euEstou && <Badge label="Você" color={C.success} />}
                    <Badge label={cheio ? "Lotado" : `${vagas} vagas`} color={cheio ? C.danger : C.blue} />
                  </div>
                </div>
                <div style={{ background: C.subtle, borderRadius: 4, height: 4, marginBottom: 8 }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: cheio ? C.danger : C.blue }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {(h.confirmados || []).slice(0, 6).map((c, i) => (
                    <Avatar key={i} name={c.aluno_nome} size={24}
                      style={{ marginLeft: i > 0 ? -6 : 0, border: `2px solid ${C.card}` }} />
                  ))}
                  {h.confirmados_count > 6 && (
                    <span style={{ color: C.muted, fontSize: 12, marginLeft: 4 }}>+{h.confirmados_count - 6}</span>
                  )}
                  <span style={{ color: C.muted, fontSize: 12, marginLeft: 6 }}>
                    {h.confirmados_count}/{h.vagas}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
