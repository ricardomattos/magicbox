import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { horariosApi } from "../../api/index.js";
import { Card, Badge, Avatar, Btn, Modal, Spinner, C, useIsMobile } from "../../components/ui.jsx";

const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function todayStr() { return new Date().toISOString().split("T")[0]; }

function CheckinsModal({ horario, onClose }) {
  const { confirmados = [], confirmados_count, vagas, hora } = horario;
  return (
    <Modal onClose={onClose} title={`${hora.slice(0, 5)} — Confirmados`}>
      <p style={{ margin: "0 0 14px", color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {confirmados_count === 0 ? "Nenhum aluno confirmado" : `${confirmados_count} de ${vagas} vagas ocupadas`}
      </p>
      {confirmados_count === 0 ? (
        <p style={{ color: C.muted, textAlign: "center", fontSize: 14, padding: "16px 0" }}>Nenhum check-in ainda.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {confirmados.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: C.subtle, borderRadius: 12, padding: "10px 14px" }}>
              <Avatar name={c.aluno_nome} size={36} />
              <div>
                <p style={{ margin: 0, color: C.text, fontSize: 14, fontWeight: 700 }}>{c.aluno_nome}</p>
                {c.aluno_plano && <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>{c.aluno_plano}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      <Btn full variant="subtle" onClick={onClose}>Fechar</Btn>
    </Modal>
  );
}

function HorarioList({ horarios, loading, modal, setModal }) {
  if (loading) return <Spinner />;
  if (horarios.length === 0) return (
    <Card><p style={{ margin: 0, color: C.muted, textAlign: "center" }}>Sem aulas hoje.</p></Card>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {horarios.map(h => {
        const vagas = h.vagas_livres;
        const cheio = vagas === 0;
        const pct   = (h.confirmados_count / h.vagas) * 100;
        const euEstou = h.meu_checkin_id != null;
        return (
          <button key={h.id} onClick={() => setModal(h)}
            style={{ all: "unset", display: "block", cursor: "pointer", borderRadius: 18 }}>
            <Card style={{ borderColor: euEstou ? `${C.success}50` : cheio ? `${C.danger}30` : C.border }}>
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
                {h.confirmados_count > 0 && (
                  <span style={{ color: C.blue, fontSize: 11, marginLeft: "auto", fontWeight: 600 }}>ver lista →</span>
                )}
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

export default function AgendaPage() {
  const { user } = useAuth();
  const mobile = useIsMobile();
  const now = new Date();

  const temCrossfit = user?.plano_tem_crossfit ?? false;
  const temHyrox    = user?.plano_tem_hyrox    ?? false;
  const temAmbos    = temCrossfit && temHyrox;

  // Determine which modalities this student can see
  const modalidadesDisponiveis = [
    ...(temCrossfit ? [{ key: "crossfit", label: "Crossfit", color: C.blue }] : []),
    ...(temHyrox    ? [{ key: "hyrox",    label: "Hyrox",    color: C.warn }] : []),
  ];

  const defaultMod = temCrossfit ? "crossfit" : temHyrox ? "hyrox" : "crossfit";
  const [modalidade, setModalidade] = useState(defaultMod);
  const [horariosPorMod, setHorariosPorMod] = useState({});
  const [loadingPorMod, setLoadingPorMod] = useState({});
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const mods = modalidadesDisponiveis.map(m => m.key);
    mods.forEach(mod => {
      setLoadingPorMod(prev => ({ ...prev, [mod]: true }));
      horariosApi.list(todayStr(), mod)
        .then(data => setHorariosPorMod(prev => ({ ...prev, [mod]: data })))
        .catch(() => setHorariosPorMod(prev => ({ ...prev, [mod]: [] })))
        .finally(() => setLoadingPorMod(prev => ({ ...prev, [mod]: false })));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const horarios = horariosPorMod[modalidade] || [];
  const loading  = loadingPorMod[modalidade] ?? true;

  return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 18px" : "28px 0 18px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Agenda de Hoje</h2>
        <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>
          {DAYS[now.getDay()]}, {now.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Tabs de modalidade — só aparecem se o aluno tiver as duas */}
      {temAmbos && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {modalidadesDisponiveis.map(m => (
            <button key={m.key} onClick={() => setModalidade(m.key)}
              style={{
                padding: "8px 20px", borderRadius: 12, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 700, fontSize: 13, transition: "all 0.15s",
                background: modalidade === m.key ? m.color : C.subtle,
                color: modalidade === m.key ? "#fff" : C.muted,
              }}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      <HorarioList horarios={horarios} loading={loading} modal={modal} setModal={setModal} />

      {modal && <CheckinsModal horario={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
