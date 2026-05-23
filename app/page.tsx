"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { renderCanvas } from "@/components/ui/canvas";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.12 } },
};

export default function Landing() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  useEffect(() => {
    renderCanvas();
  }, []);

  return (
    <main style={{ background: "var(--pq-paper)", color: "var(--pq-ink)", overflowX: "hidden" }}>
      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section
        ref={ref}
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "32px 24px",
          position: "relative",
        }}
      >
        <canvas
          id="canvas"
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            margin: "0 auto",
            pointerEvents: "none",
            zIndex: 1,
            mixBlendMode: "multiply",
          }}
        />
        <FlagOrbs />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, position: "relative", zIndex: 2 }}
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          <motion.div variants={fadeUp} style={pillStyle}>
            <span style={dotStyle} /> Politische Bildung als Spiel
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="pq-display-tight"
            style={{
              fontSize: "clamp(56px, 13vw, 168px)",
              fontWeight: 800,
              margin: "20px 0 12px",
              letterSpacing: "-0.04em",
            }}
          >
            Polit<span style={{ color: "var(--pq-red)" }}>puls</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            style={{
              fontSize: "clamp(20px, 3vw, 28px)",
              maxWidth: 620,
              color: "var(--pq-ink-soft)",
              margin: "0 0 36px",
              lineHeight: 1.35,
            }}
          >
            Tagespolitik verstehen, Rolle einnehmen, entscheiden,
            Folgen sehen. In zwei Minuten am Tag.
          </motion.p>

          <motion.div variants={fadeUp} style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/play/" style={primaryBtn}>
              Jetzt spielen
              <Arrow />
            </Link>
            <a href="#was" style={secondaryBtn}>
              Was ist das?
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          style={{ position: "absolute", bottom: 24, left: "50%", x: "-50%", opacity: 0.5 }}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            scroll ↓
          </span>
        </motion.div>
      </section>

      {/* ─── Was ist Politpuls? ─────────────────────────────────── */}
      <section
        id="was"
        style={{ padding: "96px 24px", maxWidth: 1100, margin: "0 auto" }}
      >
        <SectionTitle eyebrow="Worum geht's">
          Nachrichten sind oft zu kurz. Bücher zu lang.
          <br />
          <span style={{ color: "var(--pq-red)" }}>Politpuls liegt dazwischen.</span>
        </SectionTitle>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
            marginTop: 48,
          }}
        >
          {modes.map((m) => (
            <motion.article key={m.title} variants={fadeUp} style={cardStyle(m.tint)}>
              <div style={{ fontSize: 36, marginBottom: 18 }}>{m.icon}</div>
              <h3
                className="pq-display"
                style={{ fontSize: 26, fontWeight: 700, margin: "0 0 10px" }}
              >
                {m.title}
              </h3>
              <p style={{ color: "var(--pq-ink-soft)", lineHeight: 1.55, margin: 0 }}>
                {m.text}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* ─── Loop ──────────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px", background: "var(--pq-paper-2)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionTitle eyebrow="So funktioniert's">
            Vier Schritte. Zwei Minuten. Jeden Tag.
          </SectionTitle>

          <motion.ol
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            style={{
              listStyle: "none",
              padding: 0,
              margin: "48px 0 0",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {loop.map((step, i) => (
              <motion.li
                key={step.label}
                variants={fadeUp}
                style={{
                  background: "var(--pq-white)",
                  border: "1px solid var(--pq-line)",
                  borderRadius: 20,
                  padding: "24px 22px",
                  position: "relative",
                }}
              >
                <div
                  className="pq-display"
                  style={{
                    fontSize: 46,
                    fontWeight: 800,
                    color: "var(--pq-line)",
                    lineHeight: 1,
                    marginBottom: 10,
                  }}
                >
                  0{i + 1}
                </div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                  {step.label}
                </div>
                <div style={{ color: "var(--pq-ink-soft)", fontSize: 15, lineHeight: 1.5 }}>
                  {step.text}
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* ─── Scroll-Animation: das Spiel im Handy ──────────────── */}
      <section style={{ background: "var(--pq-paper)" }}>
        <ContainerScroll
          titleComponent={
            <div style={{ paddingInline: 24 }}>
              <div
                style={{
                  fontSize: 13,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--pq-red)",
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                Direkt ausprobieren
              </div>
              <h2
                className="pq-display-tight"
                style={{
                  fontSize: "clamp(32px, 5vw, 56px)",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.05,
                  margin: 0,
                }}
              >
                Politpuls ist <br />
                <span style={{ color: "var(--pq-red)" }}>für dein Handy</span> gebaut.
              </h2>
              <p
                style={{
                  marginTop: 14,
                  fontSize: 16,
                  color: "var(--pq-ink-soft)",
                  maxWidth: 520,
                  marginInline: "auto",
                  lineHeight: 1.55,
                }}
              >
                Scroll runter — und probier es direkt aus. Echte Politik, echte
                Entscheidungen, ohne Account.
              </p>
            </div>
          }
        >
          <iframe
            src="/play/"
            title="Politpuls — live Spiel"
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              borderRadius: 36,
              background: "#FBF6E9",
            }}
          />
        </ContainerScroll>
      </section>

      {/* ─── 100 Tage Vorschau ─────────────────────────────────── */}
      <section style={{ padding: "96px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div>
            <SectionTitle eyebrow="100 Tage Kanzler:in" align="left">
              Du sitzt im Kanzleramt.
              <br />
              <span style={{ color: "var(--pq-red)" }}>Was tust du als erstes?</span>
            </SectionTitle>
            <p
              style={{
                color: "var(--pq-ink-soft)",
                fontSize: 18,
                lineHeight: 1.6,
                marginTop: 24,
                maxWidth: 480,
              }}
            >
              Hundert Tage, hundert echte Entscheidungen. Jede verändert deine
              Umfragewerte, deine Koalition, dein politisches Profil. Mach den Job —
              und schau, wo du landest.
            </p>
            <Link
              href="/play/"
              style={{ ...primaryBtn, marginTop: 28, display: "inline-flex" }}
            >
              Loslegen
              <Arrow />
            </Link>
          </div>

          <DaysGrid />
        </div>
      </section>

      {/* ─── Footer CTA ─────────────────────────────────────────── */}
      <section
        style={{
          padding: "120px 24px",
          background: "var(--pq-ink)",
          color: "var(--pq-paper)",
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2
            className="pq-display-tight"
            style={{
              fontSize: "clamp(40px, 7vw, 88px)",
              fontWeight: 800,
              margin: "0 0 18px",
              letterSpacing: "-0.03em",
            }}
          >
            Bereit für deine
            <br />
            <span style={{ color: "var(--pq-gold)" }}>ersten 100 Tage?</span>
          </h2>
          <p
            style={{
              color: "rgba(251,246,233,0.7)",
              fontSize: 19,
              maxWidth: 520,
              margin: "0 auto 36px",
            }}
          >
            Kein Account nötig. Kein Tracking. Läuft direkt im Browser.
          </p>
          <Link
            href="/play/"
            style={{
              ...primaryBtn,
              background: "var(--pq-gold)",
              color: "var(--pq-ink)",
              boxShadow: "0 6px 0 var(--pq-gold-deep)",
            }}
          >
            Spiel starten
            <Arrow />
          </Link>
        </motion.div>
      </section>

      <footer
        style={{
          background: "var(--pq-ink)",
          color: "rgba(251,246,233,0.5)",
          padding: "32px 24px",
          textAlign: "center",
          fontSize: 13,
          borderTop: "1px solid rgba(251,246,233,0.08)",
        }}
      >
        Politpuls — politische Bildung als Spiel · Daily-Redaktion · Open Source
      </footer>
    </main>
  );
}

/* ─── Sub-Komponenten ───────────────────────────────────────────── */

function SectionTitle({
  children,
  eyebrow,
  align = "center",
}: {
  children: React.ReactNode;
  eyebrow: string;
  align?: "left" | "center";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6 }}
      style={{ textAlign: align, maxWidth: 720, margin: align === "center" ? "0 auto" : 0 }}
    >
      <div
        style={{
          fontSize: 13,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--pq-red)",
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        {eyebrow}
      </div>
      <h2
        className="pq-display-tight"
        style={{
          fontSize: "clamp(32px, 5.5vw, 64px)",
          fontWeight: 800,
          margin: 0,
          letterSpacing: "-0.025em",
          lineHeight: 1.05,
        }}
      >
        {children}
      </h2>
    </motion.div>
  );
}

function FlagOrbs() {
  return (
    <>
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-10%",
          right: "-5%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--pq-gold-soft), transparent 70%)",
          filter: "blur(20px)",
          zIndex: 0,
        }}
      />
      <motion.div
        aria-hidden
        animate={{ scale: [1.1, 1, 1.1], x: [0, -25, 0], y: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-8%",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--pq-red-soft), transparent 70%)",
          filter: "blur(20px)",
          zIndex: 0,
        }}
      />
    </>
  );
}

function DaysGrid() {
  const cells = Array.from({ length: 100 });
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(10, 1fr)",
        gap: 6,
        padding: 22,
        background: "var(--pq-white)",
        borderRadius: 24,
        border: "1px solid var(--pq-line)",
        boxShadow: "var(--pq-shadow-card)",
      }}
    >
      {cells.map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.006, duration: 0.3 }}
          style={{
            aspectRatio: "1",
            borderRadius: 6,
            background:
              i === 0
                ? "var(--pq-red)"
                : (i + 1) % 30 === 0
                  ? "var(--pq-gold)"
                  : i < 9
                    ? "var(--pq-gold-soft)"
                    : "var(--pq-line-soft)",
          }}
        />
      ))}
    </motion.div>
  );
}

function Arrow() {
  return (
    <motion.span
      aria-hidden
      style={{ display: "inline-block", marginLeft: 8 }}
      animate={{ x: [0, 4, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      →
    </motion.span>
  );
}

/* ─── Daten ─────────────────────────────────────────────────────── */

const modes = [
  {
    icon: "🏛️",
    tint: "var(--pq-red-soft)",
    title: "100 Tage Kanzler:in",
    text: "Du übernimmst die Regierung. Jede Entscheidung verändert Umfragen, Koalition, Geschichte.",
  },
  {
    icon: "📰",
    tint: "var(--pq-gold-soft)",
    title: "Tagesmission",
    text: "Eine Schlagzeile von heute. Erklärt in fünf Karten. Du entscheidest selbst, wie du sie liest.",
  },
  {
    icon: "🪧",
    tint: "var(--pq-blue-soft)",
    title: "Wahlkampf",
    text: "Plakat, Position, Pressekonferenz — übe den Wahlkampf, bevor er dich übt.",
  },
];

const loop = [
  { label: "Verstehen", text: "Die Lage in fünf Karten. Klar, kompakt, ohne Floskeln." },
  { label: "Rolle einnehmen", text: "Du bist nicht Beobachter:in. Du bist im Spiel." },
  { label: "Entscheiden", text: "Wäge ab. Wähle. Manchmal gibt's keine perfekte Antwort." },
  { label: "Folgen sehen", text: "Was passiert nach deiner Entscheidung? Du erfährst es sofort." },
];

/* ─── Styles ────────────────────────────────────────────────────── */

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 16px",
  background: "var(--pq-white)",
  border: "1px solid var(--pq-line)",
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 500,
  color: "var(--pq-ink-soft)",
};

const dotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "var(--pq-red)",
  boxShadow: "0 0 0 4px var(--pq-red-soft)",
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "16px 28px",
  background: "var(--pq-ink)",
  color: "var(--pq-paper)",
  borderRadius: 999,
  fontSize: 17,
  fontWeight: 600,
  textDecoration: "none",
  boxShadow: "0 6px 0 var(--pq-black)",
  transition: "transform 120ms ease, box-shadow 120ms ease",
};

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "16px 24px",
  background: "transparent",
  color: "var(--pq-ink)",
  border: "1.5px solid var(--pq-ink)",
  borderRadius: 999,
  fontSize: 17,
  fontWeight: 600,
  textDecoration: "none",
};

function cardStyle(tint: string): React.CSSProperties {
  return {
    background: "var(--pq-white)",
    border: "1px solid var(--pq-line)",
    borderRadius: 24,
    padding: "32px 28px",
    boxShadow: "var(--pq-shadow-card)",
    position: "relative",
    overflow: "hidden",
    backgroundImage: `linear-gradient(135deg, ${tint} 0%, transparent 55%)`,
  };
}
