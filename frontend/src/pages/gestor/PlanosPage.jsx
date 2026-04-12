import { useState, useCallback } from "react";
import { planosApi } from "../../api/index.js";
import { useFetch } from "../../hooks/useFetch.js";
import { Card, Btn, Modal, Input, Spinner, C, useIsMobile } from "../../components/ui.jsx";

const COR_OPTS = ["#2979FF","#7c4dff","#00bcd4","#ff6d00","#e91e63","#00897b"];

export default function PlanosPage() {
  const mobile = useIsMobile();
  const { data, loading, refetch } = useFetch(() => planosApi.list(), []);
  const planos = data?.results || data || [];

  const [editando, setEditando] = useState(null);
  const [novo, setNovo] = useState(false);
  const [form, setForm] = useState({ nome:"", frequencia:"", valor:"", cor: C.blue });
  const [err, setErr] = useState("");
  const setF = (k,v) => setForm(p => ({...p,[k]:v}));

  function abrirEdicao(p) {
    setForm({ nome:p.nome, frequencia:p.frequencia, valor:String(p.valor), cor:p.cor });
    setEditando(p.id); setErr("");
  }

  async function salvar() {
    if (!form.nome || !form.valor) { setErr("Nome e valor são obrigatórios."); return; }
    const payload = { nome:form.nome, frequencia:form.frequencia, valor:parseFloat(form.valor), cor:form.cor };
    try {
      if (editando) { await planosApi.update(editando, payload); setEditando(null); }
      else          { await planosApi.create(payload); setNovo(false); }
      setForm({ nome:"", frequencia:"", valor:"", cor: C.blue }); setErr(""); refetch();
    } catch(e) { setErr(e.message); }
  }

  async function deletar(id) {
    try { await planosApi.delete(id); refetch(); } catch(e) { alert(e.message); }
  }

  return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 16px" : "28px 0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Planos</h2>
        <Btn small onClick={() => { setForm({ nome:"",frequencia:"",valor:"",cor:C.blue }); setNovo(true); setErr(""); }}>+ Novo</Btn>
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {planos.map(p => (
            <Card key={p.id} style={{ borderLeft: `4px solid ${p.cor}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: "0 0 2px", color: C.text, fontSize: 16, fontWeight: 800 }}>{p.nome}</h3>
                  <p style={{ margin: "0 0 4px", color: C.muted, fontSize: 13 }}>{p.frequencia}</p>
                  <p style={{ margin: 0, color: p.cor, fontSize: 18, fontWeight: 900 }}>R$ {parseFloat(p.valor).toFixed(2)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
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
