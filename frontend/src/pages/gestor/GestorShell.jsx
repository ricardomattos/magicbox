import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { TopBar, BottomNav, C, useIsMobile } from "../../components/ui.jsx";
import HorariosPage from "./HorariosPage.jsx";
import AlunosPage from "./AlunosPage.jsx";
import PlanosPage from "./PlanosPage.jsx";
import ConfigPage from "./ConfigPage.jsx";

export default function GestorShell() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("g_horarios");
  const mobile = useIsMobile();

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'SF Pro Display',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif",
      color: C.text, display: "flex",
    }}>
      <BottomNav tab={tab} setTab={setTab} isGestor={true} user={user} onLogout={logout} />
      <div style={{
        flex: 1,
        maxWidth: mobile ? 430 : "none",
        margin: mobile ? "0 auto" : undefined,
        marginLeft: mobile ? undefined : 220,
        position: "relative",
      }}>
        <TopBar user={user} onLogout={logout} />
        {tab === "g_horarios" && <HorariosPage />}
        {tab === "g_alunos"   && <AlunosPage />}
        {tab === "g_planos"   && <PlanosPage />}
        {tab === "g_config"   && <ConfigPage />}
      </div>
    </div>
  );
}
