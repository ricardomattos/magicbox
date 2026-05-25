import { useState, useEffect, useRef } from "react";

// ── Paleta ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#080b12",
  card: "#0e1420",
  subtle: "#131c2e",
  blue: "#2979FF",
  blueDim: "rgba(41,121,255,0.14)",
  blueGlow: "rgba(41,121,255,0.35)",
  text: "#e8edf8",
  muted: "#7a8ba0",
  border: "rgba(41,121,255,0.14)",
  borderLight: "rgba(255,255,255,0.06)",
  white: "#ffffff",
};

// ── Hook: mobile breakpoint ─────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

// ── Hook: scroll reveal ──────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Hook: scroll position ────────────────────────────────────────────────────
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return scrolled;
}

// ── Star logo SVG ────────────────────────────────────────────────────────────
function StarLogo({ size = 32, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      style={{ filter: glow ? `drop-shadow(0 0 8px ${C.blue})` : "none", flexShrink: 0 }}>
      <polygon
        points="16,2 19.5,12.5 30,12.5 21.5,19 24.5,29.5 16,23 7.5,29.5 10.5,19 2,12.5 12.5,12.5"
        fill={C.blue}
      />
    </svg>
  );
}

// ── Reveal wrapper ───────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, direction = "up", style: s = {} }) {
  const [ref, visible] = useReveal();
  const translateMap = { up: "translateY(40px)", down: "translateY(-40px)", left: "translateX(-40px)", right: "translateX(40px)" };
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : (translateMap[direction] || "translateY(40px)"),
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      ...s,
    }}>
      {children}
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const scrolled = useScrolled();
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 24px",
      background: scrolled ? "rgba(8,11,18,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
      transition: "all 0.3s ease",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 64,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <StarLogo size={28} glow />
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800, fontSize: 20, color: C.white, letterSpacing: 1,
          textTransform: "uppercase",
        }}>
          Magic Box
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <a href="#modalidades" style={{
          color: C.muted, fontSize: 13, fontWeight: 600, textDecoration: "none",
          letterSpacing: 0.5, transition: "color 0.2s",
        }}
          onMouseEnter={e => e.target.style.color = C.white}
          onMouseLeave={e => e.target.style.color = C.muted}>
          Modalidades
        </a>
        <a href="#localizacao" style={{
          color: C.muted, fontSize: 13, fontWeight: 600, textDecoration: "none",
          letterSpacing: 0.5, transition: "color 0.2s",
          display: window.innerWidth < 480 ? "none" : "block",
        }}
          onMouseEnter={e => e.target.style.color = C.white}
          onMouseLeave={e => e.target.style.color = C.muted}>
          Localização
        </a>
        <a href="https://wa.me/5516992062787" target="_blank" rel="noopener noreferrer"
          style={{
            background: C.blue, color: "#fff", padding: "8px 18px",
            borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none",
            letterSpacing: 0.5, transition: "all 0.2s", cursor: "pointer",
          }}
          onMouseEnter={e => e.target.style.background = "#4a8fff"}
          onMouseLeave={e => e.target.style.background = C.blue}>
          Começar agora
        </a>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [titleVisible, setTitleVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setTitleVisible(true), 100); return () => clearTimeout(t); }, []);

  return (
    <section style={{
      position: "relative", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", background: C.bg,
    }}>
      {/* Background image */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: `url(https://lh3.googleusercontent.com/p/AF1QipMF5u4dMjVJMSKld2O80n_y9JBwvqw-wRlppKhj=s1360-w1360-h1020-rw)`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.25,
        filter: "saturate(0.5)",
      }} />

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: `linear-gradient(180deg, rgba(8,11,18,0.4) 0%, rgba(8,11,18,0.7) 60%, ${C.bg} 100%)`,
      }} />

      {/* Blue accent glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        width: 600, height: 600, borderRadius: "50%", zIndex: 1,
        background: "radial-gradient(circle, rgba(41,121,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 2, textAlign: "center",
        padding: "120px 24px 80px", maxWidth: 900, margin: "0 auto",
      }}>
        <div style={{
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? "none" : "translateY(20px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
          display: "inline-flex", alignItems: "center", gap: 8,
          background: C.blueDim, border: `1px solid ${C.border}`,
          borderRadius: 999, padding: "6px 16px", marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue, display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.blue, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Araraquara, SP
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, fontSize: "clamp(56px, 12vw, 120px)",
          lineHeight: 0.9, letterSpacing: -2, color: C.white,
          textTransform: "uppercase", margin: "0 0 8px",
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? "none" : "translateY(30px)",
          transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
        }}>
          Magic
        </h1>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, fontSize: "clamp(56px, 12vw, 120px)",
          lineHeight: 0.9, letterSpacing: -2,
          textTransform: "uppercase", margin: "0 0 32px",
          background: `linear-gradient(135deg, ${C.blue} 0%, #66aaff 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? "none" : "translateY(30px)",
          transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
        }}>
          Box
        </h1>

        <p style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(20px, 4vw, 32px)", fontWeight: 500,
          color: C.text, letterSpacing: 1, marginBottom: 16,
          textTransform: "uppercase",
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? "none" : "translateY(20px)",
          transition: "opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s",
        }}>
          Um Box como você nunca viu igual
        </p>
        <p style={{
          fontSize: 16, color: C.muted, maxWidth: 500, margin: "0 auto 48px",
          lineHeight: 1.6,
          opacity: titleVisible ? 1 : 0,
          transition: "opacity 0.7s ease 0.5s",
        }}>
          Cross training de alta performance em Araraquara. Resultados reais, comunidade forte.
        </p>

        <div style={{
          display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap",
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? "none" : "translateY(20px)",
          transition: "opacity 0.7s ease 0.6s, transform 0.7s ease 0.6s",
        }}>
          <a href="https://wa.me/5516992062787" target="_blank" rel="noopener noreferrer"
            style={{
              background: C.blue, color: "#fff",
              padding: "16px 36px", borderRadius: 14,
              fontSize: 15, fontWeight: 800, letterSpacing: 0.5,
              textDecoration: "none", cursor: "pointer",
              textTransform: "uppercase",
              transition: "all 0.2s",
              boxShadow: `0 4px 24px ${C.blueGlow}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${C.blueGlow}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 4px 24px ${C.blueGlow}`; }}>
            Começar agora
          </a>
          <a href="#modalidades"
            style={{
              background: "transparent", color: C.text,
              padding: "16px 36px", borderRadius: 14,
              fontSize: 15, fontWeight: 700, letterSpacing: 0.5,
              textDecoration: "none", cursor: "pointer",
              textTransform: "uppercase",
              border: `1.5px solid ${C.borderLight}`,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.text; }}>
            Conhecer modalidades
          </a>
        </div>

        {/* Scroll indicator */}
        <div style={{
          marginTop: 80, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 8,
          opacity: titleVisible ? 0.5 : 0,
          transition: "opacity 0.7s ease 1s",
        }}>
          <span style={{ fontSize: 11, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>Scroll</span>
          <div style={{
            width: 1, height: 40, background: `linear-gradient(${C.blue}, transparent)`,
            animation: "scrollPulse 1.5s ease-in-out infinite",
          }} />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=Barlow:wght@300;400;500;600;700&display=swap');
        @keyframes scrollPulse { 0%,100%{opacity:0.3;transform:scaleY(0.8)} 50%{opacity:1;transform:scaleY(1)} }
        @keyframes floatAnim { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </section>
  );
}

// ── Stats ────────────────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { value: "200+", label: "Alunos ativos" },
    { value: "3", label: "Anos de história" },
    { value: "20+", label: "Aulas por semana" },
    { value: "5★", label: "Avaliação Google" },
  ];
  return (
    <section style={{ background: C.blue, padding: "40px 24px" }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 24,
      }}>
        {stats.map((s, i) => (
          <Reveal key={i} delay={i * 80}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900, fontSize: 48, color: "#fff", lineHeight: 1,
                letterSpacing: -1,
              }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500, marginTop: 4, letterSpacing: 0.5 }}>
                {s.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── About ────────────────────────────────────────────────────────────────────
function About() {
  const isMobile = useIsMobile();
  return (
    <section style={{ background: C.bg, padding: "100px 24px" }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 40 : 80,
        alignItems: "center",
      }}>
        {/* Image side */}
        <Reveal direction="left">
          <div style={{ position: "relative" }}>
            <div style={{
              borderRadius: 24, overflow: "hidden",
              aspectRatio: "4/5",
              background: C.card,
            }}>
              <img
                src="/coach_photo.jpg"
                alt="Magic Box Cross Training Araraquara"
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
                loading="lazy"
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(8,11,18,0.6) 0%, transparent 50%)",
              }} />
            </div>
          </div>
        </Reveal>

        {/* Text side */}
        <div>
          <Reveal delay={100}>
            <span style={{
              fontSize: 12, fontWeight: 700, color: C.blue,
              letterSpacing: 3, textTransform: "uppercase",
            }}>Nossa missão</span>
          </Reveal>
          <Reveal delay={150}>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: "clamp(36px, 5vw, 64px)",
              color: C.white, lineHeight: 0.95, letterSpacing: -1,
              textTransform: "uppercase", margin: "16px 0 24px",
            }}>
              Mudando vidas através do exercício e da{" "}
              <span style={{
                background: `linear-gradient(135deg, ${C.blue}, #66aaff)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                relação humana
              </span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
              O Magic Box Cross Training nasceu com um propósito simples e poderoso: transformar vidas. Não apenas físicamente — mas através das conexões genuínas que a comunidade do cross training proporciona.
            </p>
          </Reveal>
          <Reveal delay={250}>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, marginBottom: 40 }}>
              Localizada em Araraquara, somos uma família de atletas, iniciantes e apaixonados pelo movimento. Cada aula é desafiadora, cada conquista é celebrada junto.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "★", text: "Comunidade acolhedora para todos os níveis" },
                { icon: "★", text: "Programação WOD diária variada e desafiadora" },
                { icon: "★", text: "Cross Training e Hyrox em um só lugar" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: C.blueDim, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 32 32" fill={C.blue}>
                      <polygon points="16,2 19.5,12.5 30,12.5 21.5,19 24.5,29.5 16,23 7.5,29.5 10.5,19 2,12.5 12.5,12.5" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 15, color: C.text, fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Responsive grid fix for mobile */}
      <style>{`
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .floating-card { right: 0 !important; bottom: -16px !important; }
        }
      `}</style>
    </section>
  );
}

// ── Modalidades ───────────────────────────────────────────────────────────────
const CLASSES = [
  {
    title: "Cross Training",
    desc: "Treinos funcionais de alta intensidade com variações diárias. Força, condicionamento e habilidade em cada WOD.",
    img: "https://lh3.googleusercontent.com/p/AF1QipNqjz32oaedQ-UEBUEZbG481McxBpr7uTxiDiWd=s1360-w1360-h1020-rw",
    tagColor: C.blue,
  },
  {
    title: "Hyrox",
    desc: "Combinação de corrida e estações de exercícios funcionais — remo, ski erg, sandbag, wall balls e mais. Uma metodologia que desenvolve resistência, força e capacidade cardiovascular de forma completa.",
    img: "https://lh3.googleusercontent.com/p/AF1QipMF5u4dMjVJMSKld2O80n_y9JBwvqw-wRlppKhj=s1360-w1360-h1020-rw",
    tagColor: "#ff6d00",
  },
];

function Modalidades() {
  const [hover, setHover] = useState(null);

  return (
    <section id="modalidades" style={{ position: "relative", background: C.card, padding: "100px 24px", overflow: "hidden" }}>
      {/* Background image — very faint */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: `url(https://lh3.googleusercontent.com/p/AF1QipNqjz32oaedQ-UEBUEZbG481McxBpr7uTxiDiWd=s1360-w1360-h1020-rw)`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.07,
        filter: "saturate(0.3)",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.blue, letterSpacing: 3, textTransform: "uppercase" }}>
              O que oferecemos
            </span>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: "clamp(40px, 6vw, 72px)",
              color: C.white, lineHeight: 0.95, letterSpacing: -1,
              textTransform: "uppercase", margin: "16px 0 16px",
            }}>
              Nossas Modalidades
            </h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 480, margin: "0 auto" }}>
              Do iniciante ao atleta avançado — temos o programa certo para você.
            </p>
          </div>
        </Reveal>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {CLASSES.map((cls, i) => (
            <Reveal key={i} delay={i * 100} style={{ height: "100%" }}>
              <div
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{
                  height: "100%",
                  borderRadius: 20,
                  border: `1px solid ${hover === i ? cls.tagColor + "66" : C.borderLight}`,
                  transition: "all 0.3s ease",
                  transform: hover === i ? "translateY(-4px)" : "none",
                  cursor: "default",
                  background: hover === i ? C.bg : "rgba(14,20,32,0.85)",
                  boxShadow: hover === i ? `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${cls.tagColor}22` : "none",
                  padding: "36px 36px 38px",
                  position: "relative", overflow: "hidden",
                }}>
                {/* Top accent line */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${cls.tagColor}, transparent)`,
                  opacity: hover === i ? 1 : 0.4,
                  transition: "opacity 0.3s",
                }} />
                <h3 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900, fontSize: "clamp(40px, 5vw, 56px)",
                  color: C.white, textTransform: "uppercase",
                  letterSpacing: -0.5, lineHeight: 0.95,
                  margin: "0 0 16px",
                }}>
                  {cls.title}
                </h3>
                <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: 0 }}>
                  {cls.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Diferenciais ──────────────────────────────────────────────────────────────
const DIFFS = [
  {
    title: "Comunidade Real",
    desc: "Mais de 200 alunos que se motivam, comemoram conquistas e evoluem juntos todos os dias.",
    color: C.blue,
  },
  {
    title: "Hyrox",
    desc: "Uma metodologia que combina corrida e estações funcionais para desenvolver resistência, força e condicionamento de forma completa.",
    color: "#ff6d00",
  },
  {
    title: "Programação Inteligente",
    desc: "WODs diários planejados com periodização para garantir evolução consistente e segura.",
    color: "#00c853",
  },
  {
    title: "Estrutura Completa",
    desc: "Equipamentos de ponta, espaço amplo e ambiente climatizado para o melhor treino.",
    color: "#ff6d00",
  },
  {
    title: "Para Todos os Níveis",
    desc: "Nunca treinou antes? Sem problema. Cada movimento tem uma adaptação para o seu nível — do primeiro dia até onde você quiser chegar.",
    color: "#e91e63",
  },
  {
    title: "Localização Privilegiada",
    desc: "No coração de Araraquara, fácil acesso e estacionamento. Sem desculpa para não vir.",
    color: "#00bcd4",
  },
];

function Diferenciais() {
  const [hover, setHover] = useState(null);

  return (
    <section style={{ background: C.bg, padding: "100px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.blue, letterSpacing: 3, textTransform: "uppercase" }}>
              Por que o Magic Box
            </span>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: "clamp(40px, 6vw, 72px)",
              color: C.white, lineHeight: 0.95, letterSpacing: -1,
              textTransform: "uppercase", margin: "16px 0 16px",
            }}>
              Um Box<br />
              <span style={{
                background: `linear-gradient(135deg, ${C.blue}, #66aaff)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                diferente
              </span>
            </h2>
          </div>
        </Reveal>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
        }}>
          {DIFFS.map((d, i) => (
            <Reveal key={i} delay={i * 60}>
              <div
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{
                  background: hover === i ? C.card : C.subtle,
                  border: `1px solid ${hover === i ? d.color + "44" : C.borderLight}`,
                  borderRadius: 18, padding: "28px 28px 30px",
                  transition: "all 0.25s ease",
                  transform: hover === i ? "translateY(-3px)" : "none",
                  cursor: "default",
                  position: "relative", overflow: "hidden",
                }}>
                {/* Accent line */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: d.color,
                  opacity: hover === i ? 1 : 0,
                  transition: "opacity 0.25s",
                }} />
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 18,
                  background: d.color + "1a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 32 32" fill={d.color}>
                    <polygon points="16,2 19.5,12.5 30,12.5 21.5,19 24.5,29.5 16,23 7.5,29.5 10.5,19 2,12.5 12.5,12.5" />
                  </svg>
                </div>
                <h3 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800, fontSize: 22, color: C.white,
                  textTransform: "uppercase", letterSpacing: 0.5,
                  margin: "0 0 10px",
                }}>
                  {d.title}
                </h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: 0 }}>
                  {d.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section style={{
      background: `linear-gradient(135deg, ${C.blue} 0%, #1a4fd6 100%)`,
      padding: "80px 24px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.07,
        backgroundImage: `repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 20px)`,
      }} />

      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <Reveal>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900, fontSize: "clamp(36px, 6vw, 72px)",
            color: "#fff", lineHeight: 0.95, letterSpacing: -1,
            textTransform: "uppercase", margin: "0 0 20px",
          }}>
            Pronto para começar<br />sua transformação?
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.85)", marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
            Sua primeira aula é por nossa conta. Venha conhecer o Magic Box e sentir a energia que só uma comunidade de verdade tem.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://wa.me/5516992062787" target="_blank" rel="noopener noreferrer"
              style={{
                background: "#fff", color: C.blue,
                padding: "16px 36px", borderRadius: 14,
                fontSize: 15, fontWeight: 800, letterSpacing: 0.5,
                textDecoration: "none", cursor: "pointer",
                textTransform: "uppercase",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              Fale com a gente
            </a>
            <a href="#localizacao"
              style={{
                background: "transparent", color: "#fff",
                padding: "16px 36px", borderRadius: 14,
                fontSize: 15, fontWeight: 700, letterSpacing: 0.5,
                textDecoration: "none", cursor: "pointer",
                textTransform: "uppercase",
                border: "1.5px solid rgba(255,255,255,0.4)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#fff"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"}>
              Ver localização
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Localização ───────────────────────────────────────────────────────────────
function Localizacao() {
  const isMobile = useIsMobile();
  return (
    <section id="localizacao" style={{ background: C.card, padding: "100px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.blue, letterSpacing: 3, textTransform: "uppercase" }}>
              Onde estamos
            </span>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: "clamp(40px, 6vw, 72px)",
              color: C.white, lineHeight: 0.95, letterSpacing: -1,
              textTransform: "uppercase", margin: "16px 0 0",
            }}>
              Localização
            </h2>
          </div>
        </Reveal>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 32 : 40,
          alignItems: "start",
        }}>
          {/* Map */}
          <Reveal direction="left">
            <div style={{
              borderRadius: 20, overflow: "hidden",
              border: `1px solid ${C.borderLight}`,
              aspectRatio: "4/3",
            }}>
              <iframe
                title="Localização Magic Box Araraquara"
                src="https://maps.google.com/maps?q=Av+Manuel+de+Abreu+1833+Araraquara+SP&output=embed"
                width="100%" height="100%"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>

          {/* Info */}
          <Reveal direction="right" delay={100}>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {[
                {
                  icon: (
                    <svg width="20" height="20" fill="none" stroke={C.blue} strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill={C.blue} />
                    </svg>
                  ),
                  label: "Endereço",
                  value: "Av. Manuel de Abreu, 1833 B\nAraraquara — SP",
                },
                {
                  icon: (
                    <svg width="20" height="20" fill="none" stroke={C.blue} strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke={C.blue} strokeWidth="2" />
                      <path d="M12 6v6l4 2" stroke={C.blue} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ),
                  label: "Horário de funcionamento",
                  value: "Segunda a Sexta: 6h — 21h\nSábado: 8h — 12h",
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={C.blue}>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  ),
                  label: "Instagram",
                  value: "@magicbox.cross",
                  link: "https://www.instagram.com/magicbox.cross/",
                },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", gap: 18, alignItems: "flex-start",
                  background: C.bg, borderRadius: 16,
                  padding: "20px 22px",
                  border: `1px solid ${C.borderLight}`,
                }}>
                  <div style={{
                    width: 44, height: 44, flexShrink: 0, borderRadius: 12,
                    background: C.blueDim,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
                      {item.label}
                    </div>
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 16, color: C.text, fontWeight: 600, textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.color = C.blue}
                        onMouseLeave={e => e.currentTarget.style.color = C.text}>
                        {item.value}
                      </a>
                    ) : (
                      <div style={{ fontSize: 15, color: C.text, fontWeight: 500, whiteSpace: "pre-line", lineHeight: 1.6 }}>
                        {item.value}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .loc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: C.bg, borderTop: `1px solid ${C.borderLight}`,
      padding: "40px 24px",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StarLogo size={24} glow />
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800, fontSize: 17, color: C.white, letterSpacing: 0.5,
            textTransform: "uppercase",
          }}>
            Magic Box Cross Training
          </span>
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>
          © {new Date().getFullYear()} Magic Box · Araraquara, SP
        </div>
        <a href="https://www.instagram.com/magicbox.cross/" target="_blank" rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            color: C.muted, textDecoration: "none", fontSize: 13, fontWeight: 600,
            transition: "color 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.white}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          @magicbox.cross
        </a>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Barlow', sans-serif", background: C.bg, color: C.text, overflowX: "hidden" }}>
      <Navbar />
      <Hero />
      <Stats />
      <About />
      <Modalidades />
      <Diferenciais />
      <CTABanner />
      <Localizacao />
      <Footer />
    </div>
  );
}
