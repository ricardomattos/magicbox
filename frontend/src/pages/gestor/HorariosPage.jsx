import { useEffect, useState, useCallback } from "react";
import { horariosApi } from "../../api/index.js";
import { Card, Btn, Modal, ConfirmModal, Avatar, Badge, Spinner, C, useIsMobile } from "../../components/ui.jsx";

const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const NOW = new Date();
// Backend uses Python weekday: 0=Mon…6=Sun; JS: 0=Sun…6=Sat
// We map: JS Sunday(0)→6, Mon(1)→0, …Sat(6)→5
const JS_TO_PY = [6,0,1,2,3,4,5];
const TODAY_PY  = JS_TO_PY[NOW.getDay()];
const HORAS = Array.from({length:41},(_,i)=>{const h=Math.floor(i/2)+5,m=i%2===0?"00":"30";return `${String(h).padStart(2,"0")}:${m}`;});

function todayStr() { return new Date().toISOString().split("T")[0]; }
function addDays(n) { const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0]; }

// ── Checkin detail modal ──────────────────────────────────────────────────────
function CheckinDetailModal({ horario, onClose, onSaveVagas }) {
  const [editing, setEditing] = useState(false);
  const [vagasVal, setVagasVal] = useState(horario.vagas);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function salvar() {
    const v = Math.max(horario.confirmados_count, parseInt(vagasVal) || 1);
    setSaving(true);
    await onSaveVagas(v);
    setVagasVal(v);
    setEditing(false);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <Modal onClose={onClose} title={`${horario.hora.slice(0,5)} — Check-ins`}>
      <div style={{ background: C.subtle, borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Limite de vagas</p>
            {!editing ? (
              <p style={{ margin: "2px 0 0", color: C.text, fontSize: 18, fontWeight: 900 }}>
                {horario.confirmados_count} <span style={{ color: C.muted, fontWeight: 400, fontSize: 14 }}>/ {vagasVal}</span>
                {saved && <span style={{ color: C.success, fontSize: 12, fontWeight: 600, marginLeft: 8 }}>✓ Salvo</span>}
              </p>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <input type="number" min={horario.confirmados_count || 1} max={100} value={vagasVal}
                  onChange={e => setVagasVal(e.target.value)} autoFocus
                  style={{ width: 70, background: C.card, border: `1px solid ${C.blue}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontFamily: "inherit", fontSize: 16, fontWeight: 700, outline: "none" }} />
                <Btn small onClick={salvar} disabled={saving}>{saving ? "..." : "Salvar"}</Btn>
                <Btn small variant="subtle" onClick={() => { setEditing(false); setVagasVal(horario.vagas); }}>Cancelar</Btn>
              </div>
            )}
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              style={{ background: C.blueDim, color: C.blue, border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
              ✏️ Editar
            </button>
          )}
        </div>
      </div>

      <p style={{ margin: "0 0 10px", color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {horario.confirmados_count === 0 ? "Nenhum check-in" : `${horario.confirmados_count} aluno${horario.confirmados_count !== 1 ? "s" : ""} confirmado${horario.confirmados_count !== 1 ? "s" : ""}`}
      </p>

      {horario.confirmados_count === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 14 }}>Nenhum aluno confirmado.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {(horario.confirmados || []).map((c, i) => (
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HorariosPage() {
  const mobile = useIsMobile();
  const [diaAtivo, setDiaAtivo] = useState(TODAY_PY);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novaHora, setNovaHora] = useState("06:00");
  const [novaVaga, setNovaVaga] = useState(12);
  const [checkinModal, setCheckinModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [adding, setAdding] = useState(false);

  // For concrete slots we show today's date; for templates we manage by weekday
  // This page manages HorarioTemplate (weekday schedule) for the gestor
  const [templates, setTemplates] = useState([]);

  const loadTemplates = useCallback(() => {
    setLoading(true);
    horariosApi.templates.list()
      .then(data => setTemplates(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Also load today's concrete slots (to show check-ins)
  const loadHorarios = useCallback(() => {
    horariosApi.list(todayStr())
      .then(setHorarios)
      .catch(() => {});
  }, []);

  useEffect(() => { loadTemplates(); loadHorarios(); }, [loadTemplates, loadHorarios]);

  const templatesDia = templates.filter(t => t.dia_semana === diaAtivo);
  const templatesDayCount = (d) => templates.filter(t => t.dia_semana === d).length;

  async function addTemplate() {
    setAdding(true);
    try {
      const [h, m] = novaHora.split(":");
      await horariosApi.templates.create({ dia_semana: diaAtivo, hora: `${novaHora}:00`, vagas: parseInt(novaVaga) || 12 });
      loadTemplates();
    } catch (e) { alert(e.message); }
    finally { setAdding(false); }
  }

  async function deleteTemplate(id) {
    try { await horariosApi.templates.delete(id); loadTemplates(); }
    catch (e) { alert(e.message); }
    setConfirm(null);
  }

  async function replicar() {
    try {
      await horariosApi.templates.replicate(diaAtivo);
      loadTemplates();
    } catch (e) { alert(e.message); }
    setConfirm(null);
  }

  async function saveVagas(templateId, novasVagas) {
    await horariosApi.templates.update(templateId, { vagas: novasVagas });
    loadTemplates();
  }

  // Today's concrete horario matching a template (for check-in modal)
  function getConcreteHorario(hora) {
    return horarios.find(h => h.hora.slice(0,5) === hora.slice(0,5));
  }

  return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 22px" : "28px 0 22px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Horários</h2>
        <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 12 }}>Grade semanal de aulas</p>
      </div>

      {/* Day selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto", paddingBottom: 6, paddingTop: 4 }}>
        {[0,1,2,3,4,5,6].map(d => {
          const count = templatesDayCount(d);
          return (
            <button key={d} onClick={() => setDiaAtivo(d)}
              style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 12, background: diaAtivo === d ? C.blue : C.subtle, color: diaAtivo === d ? "#fff" : C.muted, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 12, position: "relative" }}>
              {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][d]}
              {count > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: diaAtivo === d ? C.success : C.blue, color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add slot */}
      <Card style={{ marginBottom: 14 }}>
        <p style={{ margin: "0 0 12px", color: C.text, fontWeight: 700, fontSize: 14 }}>
          + Adicionar — {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][diaAtivo]}
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 100 }}>
            <p style={{ margin: "0 0 6px", color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Horário</p>
            <select value={novaHora} onChange={e => setNovaHora(e.target.value)}
              style={{ width: "100%", background: C.subtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", color: C.text, fontFamily: "inherit", fontSize: 14, outline: "none" }}>
              {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 80 }}>
            <p style={{ margin: "0 0 6px", color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Vagas</p>
            <input type="number" min="1" max="100" value={novaVaga} onChange={e => setNovaVaga(e.target.value)}
              style={{ width: "100%", background: C.subtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", color: C.text, fontFamily: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <Btn onClick={addTemplate} disabled={adding} style={{ flexShrink: 0 }}>Add</Btn>
        </div>
      </Card>

      <Btn full variant="ghost" style={{ marginBottom: 14 }}
        onClick={() => setConfirm({ label: `Replicar horários de ${["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][diaAtivo]} para toda a semana (Seg–Sex)?`, fn: replicar })}>
        🔁 Replicar para toda a semana
      </Btn>

      {/* Slot list */}
      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {templatesDia.length === 0 && (
            <p style={{ color: C.muted, textAlign: "center", fontSize: 14 }}>
              Nenhum horário para {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][diaAtivo]}.
            </p>
          )}
          {templatesDia.map(t => {
            const concrete = getConcreteHorario(t.hora);
            const count = concrete?.confirmados_count ?? 0;
            const pct = (count / t.vagas) * 100;
            return (
              <div key={t.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
                <button onClick={() => concrete ? setCheckinModal(concrete) : null}
                  style={{ width: "100%", background: "none", border: "none", padding: "18px 18px 12px", cursor: concrete ? "pointer" : "default", textAlign: "left", fontFamily: "inherit" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ color: C.text, fontSize: 19, fontWeight: 900 }}>{t.hora.slice(0,5)}</span>
                    <span style={{ color: C.muted, fontSize: 12 }}>{count}/{t.vagas} alunos</span>
                  </div>
                  <div style={{ background: C.subtle, borderRadius: 4, height: 6 }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: pct >= 100 ? C.danger : C.blue }} />
                  </div>
                  {concrete && count > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
                      {(concrete.confirmados || []).slice(0, 6).map((c, i) => (
                        <Avatar key={i} name={c.aluno_nome} size={24} style={{ marginLeft: i > 0 ? -6 : 0, border: `2px solid ${C.card}` }} />
                      ))}
                      <span style={{ color: C.blue, fontSize: 11, marginLeft: 8, fontWeight: 600 }}>ver lista →</span>
                    </div>
                  ) : (
                    <p style={{ margin: "10px 0 0", color: C.muted, fontSize: 12 }}>
                      {concrete ? "Nenhum check-in ainda" : "Toque para editar vagas"}
                    </p>
                  )}
                </button>
                <div style={{ borderTop: `1px solid ${C.borderLight}`, padding: "8px 18px", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => setConfirm({ label: `Apagar horário das ${t.hora.slice(0,5)}?`, fn: () => deleteTemplate(t.id) })}
                    style={{ background: C.dangerDim, color: C.danger, border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
                    ✕ Apagar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirm && <ConfirmModal label={confirm.label} onConfirm={() => { confirm.fn(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}

      {checkinModal && (
        <CheckinDetailModal
          horario={checkinModal}
          onClose={() => setCheckinModal(null)}
          onSaveVagas={async (v) => {
            await horariosApi.update(checkinModal.id, { vagas: v });
            loadHorarios();
          }}
        />
      )}
    </div>
  );
}
