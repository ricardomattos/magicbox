import { useEffect, useState, useCallback } from "react";
import { usersApi, planosApi, inviteApi } from "../../api/index.js";
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
  const prevKey = prevMonthKey();

  // A month is "inadimplente" only if it's the previous month and unpaid
  function mesStatus(m) {
    if (m.pago) return { label: "Pago", bg: C.successDim, border: C.success, sub: null };
    if (m.isCurrentMonth) return { label: "Em aberto", bg: C.blueDim, border: C.blue, sub: null };
    if (m.isPast && m.key === prevKey) return { label: "Em atraso", bg: C.dangerDim, border: C.danger, sub: "Mês anterior não pago" };
    if (m.isPast) return { label: "Em aberto", bg: C.subtle, border: C.border, sub: null };
    return { label: "Em aberto", bg: C.subtle, border: C.border, sub: null };
  }

  return (
    <Modal onClose={onClose} title={`Pagamentos — ${aluno.name}`}>
      <div style={{ background: mesAtualPago ? C.successDim : C.blueDim, borderRadius: 14, padding: "14px 16px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Mês atual</p>
          <p style={{ margin: "2px 0 0", color: C.text, fontSize: 15, fontWeight: 700 }}>{MONTHS[CUR_M]} {CUR_Y}</p>
        </div>
        {mesAtualPago
          ? <Btn small variant="ghost" onClick={() => toggle(curMonthKey())} disabled={acting}>✓ Pago — Desfazer</Btn>
          : <Btn small onClick={darBaixaAtual} disabled={acting}>Dar baixa</Btn>}
      </div>
      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {meses.map(m => {
            const s = mesStatus(m);
            return (
              <button key={m.key} onClick={() => !acting && toggle(m.key)}
                style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 14, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit", transition: "all 0.18s" }}>
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: 0, color: C.text, fontSize: 14, fontWeight: m.isCurrentMonth ? 700 : 400 }}>
                    {MONTHS[m.month]} {m.year}{m.isCurrentMonth ? " (atual)" : ""}
                  </p>
                  {s.sub && <p style={{ margin: "2px 0 0", color: C.danger, fontSize: 11 }}>{s.sub}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: m.pago ? C.success : m.key === prevKey && m.isPast ? C.danger : C.muted }}>{s.label}</span>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${m.pago ? C.success : C.border}`, background: m.pago ? C.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {m.pago && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <Btn full variant="subtle" onClick={onClose}>Fechar</Btn>
    </Modal>
  );
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2)  return digits.replace(/^(\d{0,2})/, "($1");
  if (digits.length <= 7)  return digits.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

// ── Plan Select (coach form) ──────────────────────────────────────────────────
function PlanoSelect({ value, onChange, planos, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ margin: "0 0 6px", color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Plano{required && <span style={{ color: C.danger }}> *</span>}
      </p>
      <select value={String(value || "")} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: C.subtle, border: `1px solid ${!value && required ? C.danger : C.border}`, borderRadius: 12, padding: "12px 14px", color: value ? C.text : C.muted, fontFamily: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box" }}>
        <option value="">Selecione um plano...</option>
        {planos.map(p => (
          <option key={p.id} value={String(p.id)}>
            {p.nome} — R$ {Number(p.valor).toFixed(2).replace(".", ",")}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Aluno Form — fora do AlunosPage para evitar remount a cada keystroke ──────
function AlunoForm({ title, onSave, onCancel, form, setF, editando, planos, err, inviteUrl, inviteCopied, onCopyLink, onRegenLink }) {
  return (
    <Modal onClose={onCancel} title={title}>
      {/* Link de cadastro (só no modo "novo aluno") */}
      {!editando && (
        <div style={{ marginBottom: 18, padding: "12px 14px", background: C.subtle, borderRadius: 14, border: `1px solid ${C.border}` }}>
          <p style={{ margin: "0 0 6px", color: C.text, fontSize: 13, fontWeight: 700 }}>🔗 Link de cadastro</p>
          <p style={{ margin: "0 0 10px", color: C.muted, fontSize: 12 }}>
            Envie este link para o aluno se cadastrar sozinho, escolhendo o próprio plano.
          </p>
          {inviteUrl ? (
            <>
              <div style={{ background: C.bg, borderRadius: 10, padding: "8px 12px", marginBottom: 8, wordBreak: "break-all" }}>
                <p style={{ margin: 0, color: C.blue, fontSize: 12, fontFamily: "monospace" }}>{inviteUrl}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn small variant={inviteCopied ? "success" : "ghost"} onClick={onCopyLink} style={{ flex: 1 }}>
                  {inviteCopied ? "✓ Copiado!" : "Copiar link"}
                </Btn>
                <Btn small variant="subtle" onClick={onRegenLink}>Novo link</Btn>
              </div>
            </>
          ) : (
            <p style={{ margin: 0, color: C.muted, fontSize: 12 }}>Carregando link...</p>
          )}
          <div style={{ margin: "14px 0 0", height: 1, background: C.border }} />
          <p style={{ margin: "12px 0 0", color: C.muted, fontSize: 11, textAlign: "center" }}>
            ou preencha o formulário abaixo para cadastrar manualmente
          </p>
        </div>
      )}

      <Input label="Nome" value={form.name} onChange={v=>setF("name",v)} placeholder="Nome completo" />
      <Input label="E-mail" value={form.email} onChange={v=>setF("email",v)} placeholder="email@exemplo.com" />
      <Input label="WhatsApp" value={form.phone} onChange={v=>setF("phone", maskPhone(v))} placeholder="(16) 99999-9999" />
      <Input label={editando ? "Nova senha (deixe em branco para manter)" : "Senha temporária"} type="password" value={form.password} onChange={v=>setF("password",v)} placeholder="Senha" hint={editando ? "" : "O aluno será solicitado a trocar no 1º acesso"} />
      <PlanoSelect value={form.plano} onChange={v=>setF("plano",v)} planos={planos} required={!editando} />
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
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);
  const [pagModal, setPagModal] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", plano:"", must_change_pass:true });
  const [err, setErr] = useState("");
  const setF = (k,v) => setForm(p => ({...p,[k]:v}));

  async function abrirNovoAluno() {
    setForm({ name:"", email:"", phone:"", password:"", plano:"", must_change_pass:true });
    setErr("");
    setInviteUrl("");
    setNovoAluno(true);
    try {
      const { token } = await inviteApi.get();
      setInviteUrl(`${window.location.origin}/cadastro/${token}`);
    } catch { /* link indisponível, não bloqueia o form */ }
  }

  async function regenerarLink() {
    try {
      const { token } = await inviteApi.regenerate();
      setInviteUrl(`${window.location.origin}/cadastro/${token}`);
      setInviteCopied(false);
    } catch(e) { alert(e.message); }
  }

  function copiarLink() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    });
  }

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
    if (!form.plano) { setErr("Selecione um plano para o aluno."); return; }
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

      {/* ── Header ── */}
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 16px" : "28px 0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Alunos</h2>
          <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>
            {filtrados.length !== alunos.length
              ? `${filtrados.length} de ${alunos.length} aluno${alunos.length !== 1 ? "s" : ""}`
              : `${alunos.length} aluno${alunos.length !== 1 ? "s" : ""} cadastrado${alunos.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Btn small onClick={abrirNovoAluno}>+ Novo aluno</Btn>
      </div>

      {/* ── Controls ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: mobile ? "wrap" : "nowrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone..."
          style={{ flex: 1, minWidth: 0, background: C.subtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", color: C.text, fontFamily: "inherit", fontSize: 16, outline: "none", boxSizing: "border-box" }} />
        <button onClick={() => setSoloInad(v => !v)}
          style={{ flexShrink: 0, background: soloInad ? C.dangerDim : C.subtle, border: `1.5px solid ${soloInad ? C.danger : C.border}`, borderRadius: 12, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit", transition: "all 0.18s", whiteSpace: "nowrap" }}>
          <span style={{ color: soloInad ? C.danger : C.muted, fontWeight: 700, fontSize: 13 }}>⚠️ Inadimplentes</span>
          {inadCount > 0 && <Badge label={String(inadCount)} color={C.danger} />}
        </button>
      </div>

      {/* ── Grid ── */}
      {loading ? <Spinner /> : filtrados.length === 0 ? (
        <p style={{ color: C.muted, textAlign: "center", fontSize: 14, padding: "40px 0" }}>
          {soloInad ? "Nenhum inadimplente encontrado 🎉" : "Nenhum aluno encontrado."}
        </p>
      ) : (
        <div style={mobile ? {
          display: "flex", flexDirection: "column", gap: 8,
        } : {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: 14,
        }}>
          {filtrados.map(u => {
            const pags = pagamentosMap[u.id] || [];
            const mesAtualPago = pags.includes(curMonthKey());
            const inad = isInadimplente(pags, u.since_key);
            const plano = planos.find(p => p.id === u.plano);
            const statusColor = inad ? C.danger : mesAtualPago ? C.success : C.blue;
            const statusLabel = inad ? "Inadimplente" : mesAtualPago ? "Pago" : "Em aberto";

            if (mobile) {
              return (
                <Card key={u.id} style={{ borderColor: inad ? `${C.danger}35` : C.border, padding: 0, overflow: "visible" }}>
                  <div style={{ height: 3, background: statusColor, borderRadius: "inherit inherit 0 0" }} />
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <Avatar name={u.name} size={42} />
                        {u.must_change_pass && <span style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: C.warn, border: `2px solid ${C.card}` }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                            <p style={{ margin: 0, color: C.text, fontWeight: 800, fontSize: 14, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</p>
                            <Badge label={statusLabel} color={statusColor} />
                          </div>
                          {/* ⋮ menu */}
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <button onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 8, color: C.muted, fontSize: 18, lineHeight: 1, fontWeight: 700, letterSpacing: 1 }}>
                              ⋮
                            </button>
                            {openMenuId === u.id && (
                              <>
                                <div onClick={() => setOpenMenuId(null)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                                <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
                                  <button onClick={() => { setOpenMenuId(null); setResetConfirm(u); }}
                                    style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "10px 12px", borderRadius: 8, color: C.warn, fontSize: 13, fontWeight: 600, fontFamily: "inherit", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                                    🔑 Resetar senha
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 12 }}>{u.email}</p>
                        {u.phone && (
                          <a href={`https://wa.me/55${u.phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.success, fontSize: 12, textDecoration: "none", marginTop: 2 }}>
                            💬 {u.phone}
                          </a>
                        )}
                        <p style={{ margin: "2px 0 0", color: C.blue, fontSize: 12, fontWeight: 600 }}>{plano ? plano.nome : "Sem plano"}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <Btn small variant="ghost" onClick={() => abrirEdicao(u)} style={{ flex: 1 }}>✏️ Editar</Btn>
                      <Btn small variant="success" onClick={() => setPagModal(u)} style={{ flex: 1 }}>💰 Pagamentos</Btn>
                    </div>
                  </div>
                </Card>
              );
            }

            // ── Desktop card ──
            return (
              <div key={u.id} style={{
                background: C.card, borderRadius: 18, overflow: "visible",
                border: `1px solid ${inad ? C.danger + "40" : C.border}`,
                display: "flex", flexDirection: "column",
                transition: "border-color 0.2s", position: "relative",
              }}>
                {/* Status accent */}
                <div style={{ height: 3, background: statusColor, borderRadius: "18px 18px 0 0", flexShrink: 0 }} />

                {/* ⋮ menu */}
                <div style={{ position: "absolute", top: 10, right: 12, zIndex: 5 }}>
                  <button onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 8, color: C.muted, fontSize: 20, lineHeight: 1, fontWeight: 700, letterSpacing: 1 }}>
                    ⋮
                  </button>
                  {openMenuId === u.id && (
                    <>
                      <div onClick={() => setOpenMenuId(null)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                      <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6, minWidth: 170, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
                        <button onClick={() => { setOpenMenuId(null); setResetConfirm(u); }}
                          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "10px 12px", borderRadius: 8, color: C.warn, fontSize: 13, fontWeight: 600, fontFamily: "inherit", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                          🔑 Resetar senha
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: "18px 18px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>

                  {/* Top row: avatar + badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingRight: 28 }}>
                    <div style={{ position: "relative" }}>
                      <Avatar name={u.name} size={48} />
                      {u.must_change_pass && (
                        <span title="Deve trocar a senha" style={{ position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: "50%", background: C.warn, border: `2px solid ${C.card}` }} />
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                      <Badge label={statusLabel} color={statusColor} />
                      {plano && <Badge label={plano.nome} color={C.blue} />}
                    </div>
                  </div>

                  {/* Name */}
                  <p style={{ margin: "0 0 2px", color: C.text, fontWeight: 800, fontSize: 15, lineHeight: 1.3 }}>{u.name}</p>

                  {/* Email */}
                  <p style={{ margin: "0 0 4px", color: C.muted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>

                  {/* Phone */}
                  {u.phone ? (
                    <a href={`https://wa.me/55${u.phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.success, fontSize: 12, textDecoration: "none", marginBottom: 4 }}>
                      💬 {u.phone}
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Sem telefone</span>
                  )}

                  {/* Treinos stats */}
                  {(u.treinos_total > 0 || u.treinos_mes > 0) && (
                    <div style={{ display: "flex", gap: 12, marginTop: 10, padding: "8px 12px", background: C.subtle, borderRadius: 10 }}>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ margin: 0, color: C.text, fontWeight: 800, fontSize: 16 }}>{u.treinos_mes}</p>
                        <p style={{ margin: 0, color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>este mês</p>
                      </div>
                      <div style={{ width: 1, background: C.border }} />
                      <div style={{ textAlign: "center" }}>
                        <p style={{ margin: 0, color: C.text, fontWeight: 800, fontSize: 16 }}>{u.treinos_total}</p>
                        <p style={{ margin: 0, color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>total</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action bar */}
                <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.borderLight}`, display: "flex", gap: 8 }}>
                  <Btn small variant="ghost" onClick={() => abrirEdicao(u)} style={{ flex: 1 }}>✏️ Editar</Btn>
                  <Btn small variant="success" onClick={() => setPagModal(u)} style={{ flex: 1 }}>💰 Pagamentos</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editando && <AlunoForm title="Editar aluno" onSave={salvarEdicao} onCancel={() => setEditando(null)} form={form} setF={setF} editando={editando} planos={planos} err={err} />}
      {novoAluno && <AlunoForm title="Novo aluno" onSave={criarAluno} onCancel={() => setNovoAluno(false)} form={form} setF={setF} editando={null} planos={planos} err={err} inviteUrl={inviteUrl} inviteCopied={inviteCopied} onCopyLink={copiarLink} onRegenLink={regenerarLink} />}
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
