import { useState, useCallback } from "react";
import { planosApi } from "../../api/index.js";
import { useFetch } from "../../hooks/useFetch.js";
import { Card, Btn, Modal, Input, Spinner, C, useIsMobile } from "../../components/ui.jsx";

const COR_OPTS = ["#2979FF","#7c4dff","#00bcd4","#ff6d00","#e91e63","#00897b"];

const FORM_VAZIO = { nome:"", frequencia:"", valor:"", cor: C.blue, tem_crossfit: false, tem_hyrox: false };

function ModalidadeCheck({ label, checked, onChange, color }) {
  return (
    <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"10px 14px",
      background: checked ? `${color}18` : C.subtle,
      border: `1.5px solid ${checked ? color : C.border}`,
      borderRadius:12, flex:1, userSelect:"none", transition:"all 0.15s" }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ display:"none" }} />
      <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${checked ? color : C.muted}`,
        background: checked ? color : "transparent", display:"flex", alignItems:"center",
        justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
        {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>}
      </div>
      <span style={{ fontSize:13, fontWeight:700, color: checked ? color : C.muted }}>{label}</span>
    </label>
  );
}

export default function PlanosPage() {
  const mobile = useIsMobile();
  const { data, loading, refetch } = useFetch(() => planosApi.list(), []);
  const planos = data?.results || data || [];

  const [editando, setEditando] = useState(null);
  const [novo, setNovo] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [err, setErr] = useState("");
  const setF = (k,v) => setForm(p => ({...p,[k]:v}));

  function abrirEdicao(p) {
    setForm({ nome:p.nome, frequencia:p.frequencia, valor:String(p.valor), cor:p.cor,
              tem_crossfit: p.tem_crossfit, tem_hyrox: p.tem_hyrox });
    setEditando(p.id); setErr("");
  }

  async function salvar() {
    if (!form.nome || !form.valor) { setErr("Nome e valor são obrigatórios."); return; }
    if (!form.tem_crossfit && !form.tem_hyrox) { setErr("Selecione ao menos uma modalidade."); return; }
    const payload = { nome:form.nome, frequencia:form.frequencia, valor:parseFloat(form.valor),
                      cor:form.cor, tem_crossfit:form.tem_crossfit, tem_hyrox:form.tem_hyrox };
    try {
      if (editando) { await planosApi.update(editando, payload); setEditando(null); }
      else          { await planosApi.create(payload); setNovo(false); }
      setForm(FORM_VAZIO); setErr(""); refetch();
    } catch(e) { setErr(e.message); }
  }

  async function deletar(id) {
    try { await planosApi.delete(id); refetch(); } catch(e) { alert(e.message); }
  }

  return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 16px" : "28px 0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Planos</h2>
        <Btn small onClick={() => { setForm(FORM_VAZIO); setNovo(true); setErr(""); }}>+ Novo</Btn>
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {planos.map(p => (
            <Card key={p.id} style={{ borderLeft: `4px solid ${p.cor}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 4px", color: C.text, fontSize: 16, fontWeight: 800 }}>{p.nome}</h3>
                  <p style={{ margin: "0 0 6px", color: C.muted, fontSize: 13 }}>{p.frequencia}</p>
                  <div style={{ display:"flex", gap:6, marginBottom:6, flexWrap:"wrap" }}>
                    {p.tem_crossfit && (
                      <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20,
                        background:"rgba(41,121,255,0.15)", color:C.blue, textTransform:"uppercase", letterSpacing:0.5 }}>
                        Crossfit
                      </span>
                    )}
                    {p.tem_hyrox && (
                      <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20,
                        background:"rgba(255,179,0,0.15)", color:C.warn, textTransform:"uppercase", letterSpacing:0.5 }}>
                        Hyrox
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: p.cor, fontSize: 18, fontWeight: 900 }}>R$ {parseFloat(p.valor).toFixed(2)}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink:0 }}>
                  <p style={{ margin: "0 0 8px", color: C.muted, fontSize: 12 }}>{p.alunos_count ?? 0} aluno{p.alunos_count !== 1 ? "s" : ""}</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn small variant="ghost" onClick={() => abrirEdicao(p)}>Editar</Btn>
                    <Btn small variant="danger" onClick={() => deletar(p.id)}>✕</Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(editando || novo) && (
        <Modal onClose={() => { setEditando(null); setNovo(false); }} title={editando ? "Editar plano" : "Novo plano"}>
          <Input label="Nome do plano" value={form.nome} onChange={v=>setF("nome",v)} placeholder="Ex: Mensal Plus" />
          <Input label="Frequência" value={form.frequencia} onChange={v=>setF("frequencia",v)} placeholder="Ex: Ilimitado" />
          <Input label="Valor (R$)" type="number" value={form.valor} onChange={v=>setF("valor",v)} placeholder="199" />
          <p style={{ margin: "0 0 8px", color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing:0.5 }}>Modalidades</p>
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            <ModalidadeCheck label="Crossfit" checked={form.tem_crossfit} onChange={v=>setF("tem_crossfit",v)} color={C.blue} />
            <ModalidadeCheck label="Hyrox" checked={form.tem_hyrox} onChange={v=>setF("tem_hyrox",v)} color={C.warn} />
          </div>
          <p style={{ margin: "0 0 8px", color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Cor</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {COR_OPTS.map(cor => (
              <button key={cor} onClick={() => setF("cor", cor)}
                style={{ width: 32, height: 32, borderRadius: "50%", background: cor, border: `3px solid ${form.cor === cor ? "#fff" : "transparent"}`, cursor: "pointer" }} />
            ))}
          </div>
          {err && <p style={{ color: C.danger, fontSize: 13, margin: "-6px 0 10px" }}>{err}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn full variant="subtle" onClick={() => { setEditando(null); setNovo(false); }}>Cancelar</Btn>
            <Btn full onClick={salvar}>Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
