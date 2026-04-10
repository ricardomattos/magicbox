import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { TopBar, BottomNav, C, useIsMobile } from "../../components/ui.jsx";
import HomePage from "./HomePage.jsx";
import AgendaPage from "./AgendaPage.jsx";
import CheckinPage from "./CheckinPage.jsx";
import PlanoPage from "./PlanoPage.jsx";

export default function AlunoShell() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("home");
  const mobile = useIsMobile();

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'SF Pro Display',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif",
      color: C.text, display: "flex",
    }}>
      <BottomNav tab={tab} setTab={setTab} isGestor={false} user={user} onLogout={logout} />
      <div style={{
        flex: 1,
        maxWidth: mobile ? 430 : "none",
        margin: mobile ? "0 auto" : undefined,
        marginLeft: mobile ? undefined : 220,
        position: "relative",
      }}>
        <TopBar user={user} onLogout={logout} />
        {tab === "home"    && <HomePage    setTab={setTab} />}
        {tab === "agenda"  && <AgendaPage  />}
        {tab === "checkin" && <CheckinPage />}
        {tab === "plano"   && <PlanoPage   />}
      </div>
    </div>
  );
}
