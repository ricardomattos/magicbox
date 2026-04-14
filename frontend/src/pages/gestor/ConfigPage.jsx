import { useState, useEffect } from "react";
import { configApi } from "../../api/index.js";
import { Card, Btn, Select, Spinner, C, useIsMobile } from "../../components/ui.jsx";

export default function ConfigPage() {
  const mobile = useIsMobile();
  const [config, setConfig] = useState(null);
  const [hour, setHour]     = useState(18);
  const [msg, setMsg]       = useState("");
  const [pix, setPix]       = useState("");
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configApi.get()
      .then(c => { setConfig(c); setHour(c.checkin_release_hour ?? 18); setMsg(c.coach_msg || ""); setPix(c.pix_key || ""); })
      .finally(() => setLoading(false));
  }, []);

  async function salvar() {
    if (msg.length > 150) return;
    try {
      await configApi.update({ checkin_release_hour: parseInt(hour), coach_msg: msg.trim(), pix_key: pix.trim() });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch(e) { alert(e.message); }
  }

  const HOUR_OPTS = Array.from({ length: 24 }, (_,i) => i);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: mobile ? "0 18px 100px" : "0 32px 40px" }}>
      <div style={{ padding: mobile ? "calc(env(safe-area-inset-top) + 56px) 0 16px" : "28px 0 16px" }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 900 }}>Configurações</h2>
      </div>

      <Card style={{ marginBottom: 14 }}>
        <p style={{ margin: "0 0 4px", color: C.text, fontWeight: 700, fontSize: 15 }}>🔒 Liberação do Check-in</p>
        <p style={{ margin: "0 0 14px", color: C.muted, fontSize: 13 }}>
          A partir deste horário os alunos podem fazer check-in para o dia seguinte.
        </p>
        <Select label="Hora de liberação" value={String(hour)} onChange={v => setHour(v)}>
          {HOUR_OPTS.map(h => <option key={h} value={String(h)}>{String(h).padStart(2,"0")}:00</option>)}
        </Select>
        <div style={{ background: C.blueDim, borderRadius: 12, padding: "10px 14px" }}>
          <p style={{ margin: 0, color: C.blue, fontSize: 13 }}>
            Atual: check-in de amanhã liberado às <strong>{String(config?.checkin_release_hour ?? 18).padStart(2,"0")}:00</strong>
          </p>
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <p style={{ margin: "0 0 4px", color: C.text, fontWeight: 700, fontSize: 15 }}>📣 Mensagem para os alunos</p>
        <p style={{ margin: "0 0 12px", color: C.muted, fontSize: 13 }}>
          Aparece na tela inicial dos alunos. Deixe em branco para não exibir.
        </p>
        <textarea value={msg} onChange={e => setMsg(e.target.value.slice(0,150))}
          placeholder="Ex: Treino pesado essa semana! Bora superar os limites 💪" rows={3}
          style={{ width: "100%", background: C.subtle, border: `1px solid ${msg.length > 140 ? C.warn : C.border}`, borderRadius: 12, padding: "12px 14px", color: C.text, fontFamily: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box", resize: "none", lineHeight: 1.5 }} />
        <p style={{ margin: "4px 0 0", color: msg.length > 140 ? C.warn : C.muted, fontSize: 11, textAlign: "right" }}>{msg.length}/150</p>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <p style={{ margin: "0 0 4px", color: C.text, fontWeight: 700, fontSize: 15 }}>💸 Chave PIX</p>
        <p style={{ margin: "0 0 12px", color: C.muted, fontSize: 13 }}>
          Exibida para os alunos na tela "Meu Plano" para facilitar o pagamento.
        </p>
        <input value={pix} onChange={e => setPix(e.target.value.slice(0,150))}
          placeholder="Ex: 11999999999 ou email@exemplo.com"
          style={{ width: "100%", background: C.subtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", color: C.text, fontFamily: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
      </Card>

      <Btn full onClick={salvar} variant={saved ? "success" : "primary"}>
        {saved ? "✓ Configurações salvas!" : "Salvar configurações"}
      </Btn>

      <Card style={{ marginTop: 14 }}>
        <p style={{ margin: "0 0 2px", color: C.text, fontWeight: 700, fontSize: 15 }}>ℹ️ Magic Box Cross Training</p>
        <p style={{ margin: "0 0 2px", color: C.muted, fontSize: 12 }}>Araraquara · SP · Av. Manuel de Abreu, 1833 B</p>
        <p style={{ margin: "8px 0 0", color: C.muted, fontSize: 11 }}>Versão 1.0</p>
      </Card>
    </div>
  );
}
