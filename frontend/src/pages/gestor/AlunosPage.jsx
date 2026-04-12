import { useEffect, useState, useCallback } from "react";
import { usersApi, planosApi } from "../../api/index.js";
import { Card, Badge, Btn, Avatar, Modal, ConfirmModal, Input, Select, Spinner, C, useIsMobile } from "../../components/ui.jsx";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTH_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function curMonthKey() { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; }
function parseKey(k) { const [y,m]=k.split("-"); return {year:parseInt(y),month:parseInt(m)-1}; }
function prevMonthKey() { let m=new Date().getMonth()-1,y=new Date().getFullYear(); if(m<0){m=11;y--;} return `${y}-${String(m+1).padStart(2,"0")}`; }

function isInadimplente(pagamentos, sinceKey) {
  const prevKey = prevMonthKey();
  if (!sinceKey || sinceKey > prevKey) return false;
  return !pagamentos.includes(prevKey);
}

// ── Pagamentos Modal ──────────────────────────────────────────────────────────
function PagamentosModal({ aluno, planos, onClose, onRefresh }) {
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    planosApi.getPagamentos(aluno.id)
      .then(d => setPagamentos(d.meses_pagos || []))
      .finally(() => setLoading(false));
  }, [aluno.id]);

  // Build month list: max(sinceKey, 2 months ago) → +12 months
  const now = new Date();
  const CUR_M = now.getMonth(), CUR_Y = now.getFullYear();
  const sinceKey = aluno.since_key || curMonthKey();
  let startM = CUR_M - 2, startY = CUR_Y;
  if (startM < 0) { startM += 12; startY--; }
  const twoAgoKey = `${startY}-${String(startM+1).padStart(2,"0")}`;
  const effectiveStart = sinceKey > twoAgoKey ? sinceKey : twoAgoKey;
  const {year:sy,month:sm} = parseKey(effectiveStart);
  const meses = [];
  let y=sy,m=sm;
  let endM=CUR_M+12,endY=CUR_Y; while(endM>11){endM-=12;endY++;}
  while(y<endY||(y===endY&&m<=endM)) {
    const key=`${y}-${String(m+1).padStart(2,"0")}`;
    meses.push({key,month:m,year:y,pago:pagamentos.includes(key),isCurrentMonth:m===CUR_M&&y===CUR_Y,isPast:y<CUR_Y||(y===CUR_Y&&m<CUR_M)});
    m++; if(m>11){m=0;y++;}
  }

  async function toggle(key) {
    setActing(true);
    try {
      await planosApi.togglePagamento(aluno.id, key);
      const d = await planosApi.getPagamentos(aluno.id);
      setPagamentos(d.meses_pagos || []);
      onRefresh();
    } catch(e) { alert(e.message); }
    finally { setActing(false); }
  }

  async function darBaixaAtual() {
    const key = curMonthKey();
    if (!pagamentos.includes(key)) await toggle(key);
  }

  const mesAtualPago = pagamentos.includes(curMonthKey());

  return (
    <Modal onClose={onClose} title={`Pagamentos — ${aluno.name}`}>
      <div style={{ background: mesAtualPago ? C.successDim : C.dangerDim, borderRadius: 14, padding: "14px 16px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Mês atual</p>
          <p style={{ margin: "2px 0 0", color: C.text, fontSize: 15, fontWeight: 700 }}>{MONTHS[CUR_M]} {CUR_Y}</p>
        </div>
        {mesAtualPago ? <Badge label="✓ Pago" color={C.success} /> : <Btn small onClick={darBaixaAtual} disabled={acting}>Dar baixa</Btn>}
      </div>
      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {meses.map(m => (
            <button key={m.key} onClick={() => !acting && toggle(m.key)}
              style={{ background: m.pago ? C.successDim : m.isPast||m.isCurrentMonth ? C.dangerDim : C.subtle, border: `1.5px solid ${m.pago ? C.success : m.isPast||m.isCurrentMonth ? C.danger : C.border}`, borderRadius: 14, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit", transition: "all 0.18s" }}>
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, color: C.text, fontSize: 14, fontWeight: m.isCurrentMonth ? 700 : 400 }}>
                  {MONTHS[m.month]} {m.year}{m.isCurrentMonth ? " (atual)" : ""}
                </p>
                {m.isPast && !m.pago && <p style={{ margin: "2px 0 0", color: C.danger, fontSize: 11 }}>Em atraso</p>}
              </div>
              <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${m.pago ? C.success : C.muted}`, background: m.pago ? C.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {m.pago && <span style={{ color: "#fff", fontSize: 13 }}>✓</span>}
              </div>
            </button>
          ))}
        </div>
      )}
      <Btn full variant="subtle" onClick={onClose}>Fechar</Btn>
    </Modal>
  );
}

// ── Aluno Form — fora do AlunosPage para evitar remount a cada keystroke ──────
function AlunoForm({ title, onSave, onCancel, form, setF, editando, planos, err }) {
  return (
    <Modal onClose={onCancel} title={title}>
      <Input label="Nome" value={form.name} onChange={v=>setF("name",v)} placeholder="Nome completo" />
      <Input label="E-mail" value={form.email} onChange={v=>setF("email",v)} placeholder="email@exemplo.com" />
      <Input label="WhatsApp" value={form.phone} onChange={v=>setF("phone",v)} placeholder="(16) 99999-9999" />
      <Input label={editando ? "Nova senha (deixe em branco para manter)" : "Senha temporária"} type="password" value={form.password} onChange={v=>setF("password",v)} placeholder="Senha" hint={editando ? "" : "O aluno será solicitado a trocar no 1º acesso"} />
      <Select label="Plano" value={String(form.plano||"")} onChange={v=>setF("plano",v)}>
        <option value="">Sem plano</option>
        {planos.map(p => <option key={p.id} value={String(p.id)}>{p.nome} — R${p.valor}</option>)}
      </Select>
      {err && <p style={{ color: C.danger, fontSize: 13, margin: "-6px 0 10px" }}>{err}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <Btn full variant="subtle" onClick={onCancel}>Cancelar</Btn>
        <Btn full onClick={onSave}>Salvar</Btn>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AlunosPage() {
  const mobile = useIsMobile();
  const [alunos, setAlunos] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [pagamentosMap, setPagamentosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [soloInad, setSoloInad] = useState(false);
  const [editando, setEditando] = useState(null);
  const [novoAluno, setNovoAluno] = useState(false);
  const [pagModal, setPagModal] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(null);
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", plano:"", must_change_pass:true });
  const [err, setErr] = useState("");
  const setF = (k,v) => setForm(p => ({...p,[k]:v}));

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [us, ps] = await Promise.all([usersApi.list(), planosApi.list ? planosApi.list() : Promise.resolve([])]);
      setAlunos(us.results || us);
      setPlanos(ps.results || ps);
      // Load all payments in parallel
      const entries = await Promise.all(
        (us.results || us).map(u => planosApi.getPagamentos(u.id).then(d => [u.id, d.meses_pagos || []]).catch(() => [u.id, []]))
      );
      setPagamentosMap(Object.fromEntries(entries));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filtrados = alunos.filter(u => {
    const matchS = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.phone||"").includes(search);
    const matchI = !soloInad || isInadimplente(pagamentosMap[u.id] || [], u.since_key);
    return matchS && matchI;
  });
  const inadCount = alunos.filter(u => isInadimplente(pagamentosMap[u.id] || [], u.since_key)).length;

  function abrirEdicao(u) { setForm({ name:u.name, email:u.email, phone:u.phone||"", password:"", plano:u.plano||"", must_change_pass:u.must_change_pass||false }); setEditando(u.id); setErr(""); }

  async function salvarEdicao() {
    if (!form.name||!form.email) { setErr("Nome e e-mail são obrigatórios."); return; }
    const payload = { name:form.name, email:form.email, phone:form.phone, plano:form.plano||null, must_change_pass:form.must_change_pass };
    if (form.password) payload.password = form.password;
    try { await usersApi.update(editando, payload); setEditando(null); loadAll(); }
    catch(e) { setErr(e.message); }
  }

  async function criarAluno() {
    if (!form.name||!form.email||!form.password) { setErr("Preencha nome, e-mail e senha."); return; }
    try {
      await usersApi.create({ name:form.name, email:form.email, phone:form.phone, password:form.password, role:"aluno", plano:form.plano||null, must_change_pass:true });
      setNovoAluno(false); setForm({ name:"",email:"",phone:"",password:"",plano:"",must_change_pass:true }); setErr(""); loadAll();
    } catch(e) { setErr(e.message); }
  }

  async function resetarSenha(id) {
    try { await usersApi.resetPassword(id); setResetConfirm(null); loadAll(); }
    catch(e) { alert(e.message); }
  }

  return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 16px" : "28px 0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Alunos</h2>
          <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>{alunos.length} aluno{alunos.length !== 1 ? "s" : ""} cadastrado{alunos.length !== 1 ? "s" : ""}</p>
        </div>
        <Btn small onClick={() => { setForm({ name:"",email:"",phone:"",password:"",plano:"",must_change_pass:true }); setNovoAluno(true); setErr(""); }}>+ Novo</Btn>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone..."
        style={{ width: "100%", background: C.subtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", color: C.text, fontFamily: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />

      <button onClick={() => setSoloInad(v => !v)}
        style={{ width: "100%", background: soloInad ? C.dangerDim : C.subtle, border: `1.5px solid ${soloInad ? C.danger : C.border}`, borderRadius: 12, padding: "9px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit", marginBottom: 14, transition: "all 0.18s" }}>
        <span style={{ color: soloInad ? C.danger : C.muted, fontWeight: 700, fontSize: 13 }}>⚠️ Mostrar só inadimplentes</span>
        {inadCount > 0 && <Badge label={`${inadCount} aluno${inadCount > 1 ? "s" : ""}`} color={C.danger} />}
      </button>

      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtrados.length === 0 && (
            <p style={{ color: C.muted, textAlign: "center", fontSize: 14, padding: "20px 0" }}>
              {soloInad ? "Nenhum inadimplente encontrado 🎉" : "Nenhum aluno encontrado."}
            </p>
          )}
          {filtrados.map(u => {
            const pags = pagamentosMap[u.id] || [];
            const mesAtualPago = pags.includes(curMonthKey());
            const inad = isInadimplente(pags, u.since_key);
            const plano = planos.find(p => p.id === u.plano);
            return (
              <Card key={u.id} style={{ borderColor: inad ? `${C.danger}35` : C.border }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ position: "relative" }}>
                    <Avatar name={u.name} size={40} />
                    {u.must_change_pass && <span style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: C.warn, border: `2px solid ${C.card}` }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                      <p style={{ margin: 0, color: C.text, fontWeight: 700, fontSize: 14 }}>{u.name}</p>
                      <div style={{ display: "flex", gap: 4 }}>
                        {inad ? <Badge label="Inadimplente" color={C.danger} /> : <Badge label={mesAtualPago ? "Pago" : "Em aberto"} color={mesAtualPago ? C.success : C.blue} />}
                      </div>
                    </div>
                    <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>{u.email}</p>
                    {u.phone && (
                      <a href={`https://wa.me/55${u.phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.success, fontSize: 12, textDecoration: "none", marginTop: 2 }}>
                        <span>💬</span>{u.phone}
                      </a>
                    )}
                    <p style={{ margin: "2px 0 0", color: C.blue, fontSize: 12 }}>{plano ? plano.nome : "Sem plano"}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  <Btn small variant="ghost" onClick={() => abrirEdicao(u)} style={{ flex: 1 }}>✏️ Editar</Btn>
                  <Btn small variant="success" onClick={() => setPagModal(u)} style={{ flex: 1 }}>💰 Pgto</Btn>
                  <Btn small variant="warn" onClick={() => setResetConfirm(u)} style={{ flex: 1 }}>🔑 Reset</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editando && <AlunoForm title="Editar aluno" onSave={salvarEdicao} onCancel={() => setEditando(null)} form={form} setF={setF} editando={editando} planos={planos} err={err} />}
      {novoAluno && <AlunoForm title="Novo aluno" onSave={criarAluno} onCancel={() => setNovoAluno(false)} form={form} setF={setF} editando={editando} planos={planos} err={err} />}
      {pagModal && <PagamentosModal aluno={pagModal} planos={planos} onClose={() => setPagModal(null)} onRefresh={loadAll} />}
      {resetConfirm && (
        <ConfirmModal
          label={`Resetar senha de ${resetConfirm.name}? Será redefinida para "1234" e o aluno deverá criar uma nova no próximo acesso.`}
          variant="warn"
          onConfirm={() => resetarSenha(resetConfirm.id)}
          onCancel={() => setResetConfirm(null)} />
      )}
    </div>
  );
}
