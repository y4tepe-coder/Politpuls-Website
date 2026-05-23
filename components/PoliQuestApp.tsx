"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Character, Skin } from "@/lib/types";
import { skinTokens } from "@/lib/tokens";
import { loadSession, saveSession, clearAllData } from "@/lib/storage";
import { nextStepToday } from "@/lib/wahlkampf";
import { refreshDossiers } from "@/lib/dossierFeed";
import { BottomNav, type NavId } from "@/components/ui";
import MissionRouter, { type MissionStep } from "@/components/MissionRouter";
import Splash from "@/components/screens/Splash";
import Auth from "@/components/screens/Auth";
import Onboarding from "@/components/screens/Onboarding";
import Home from "@/components/screens/Home";
import Phone from "@/components/screens/Phone";
import Spectrum from "@/components/screens/Spectrum";
import Profile from "@/components/screens/Profile";
import ValuesCheck from "@/components/screens/ValuesCheck";
import Plakat from "@/components/screens/Plakat";
import Wahlkampf from "@/components/screens/Wahlkampf";

/* ============================================================
   Politpuls — app shell + state machine.
   Demo-first flow: Splash → Onboarding → App. No auth wall;
   the Auth screen is an optional login reachable from Profil.
   ============================================================ */

type Stage = "splash" | "onboarding" | "app";
type Screen =
  | "home"
  | "phone"
  | "spectrum"
  | "profile"
  | "decision"
  | "plakat"
  | "wahlkampf"
  | "valuescheck"
  | "auth";

const TABS: NavId[] = ["home", "phone", "spectrum", "profile"];
const SKIN: Skin = "clean";

interface OnboardData {
  role: string;
  name: string;
  character: Character;
  party: string | null;
  kernthemen: string[];
}

export default function PoliQuestApp() {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<Stage>("splash");
  const [screen, setScreen] = useState<Screen>("home");
  const [inDeepView, setInDeepView] = useState(false);
  const [missionStep, setMissionStep] = useState<MissionStep>(null);

  /* Resolve the starting stage from the persisted session — client-only,
     so the localStorage read never causes a hydration mismatch. */
  useEffect(() => {
    const s = loadSession();
    setStage(s && s.onboarded && s.profile ? "app" : "splash");
    setMounted(true);
    /* Fire-and-forget: holt das aktuelle Tages-Dossier vom GitHub-Feed
       und legt es in localStorage ab. Nächste dossierForDay()-Aufrufe
       greifen direkt auf den frischen Stand zu. */
    void refreshDossiers();
  }, []);

  const skin = skinTokens(SKIN);

  if (!mounted) {
    return (
      <div className="pq-stage">
        <div className="pq-app" style={{ background: "#1F1D17" }} />
      </div>
    );
  }

  /* ─── Stage transitions ─────────────────────────────────── */
  const onSplashDone = () => setStage("onboarding");

  const onOnboardDone = (data: OnboardData) => {
    const s = loadSession() || {};
    saveSession({
      ...s,
      onboarded: true,
      profile: {
        role: "kandidat",
        name: data.name,
        character: data.character,
        party: data.party,
        kernthemen: data.kernthemen,
      },
    });
    setMissionStep(null);
    setScreen("home");
    setStage("app");
  };

  const resetAll = () => {
    clearAllData();
    setMissionStep(null);
    setScreen("home");
    setInDeepView(false);
    setStage("splash");
  };

  /* ─── In-app navigation ─────────────────────────────────── */
  const goTab = (id: NavId) => {
    setInDeepView(false);
    setScreen(id);
  };

  const openMission = (step: MissionStep) => {
    setMissionStep(step);
    setScreen("decision");
  };

  /* X out of a mission → back to where it makes sense. */
  const closeMission = () => {
    const step = missionStep;
    setMissionStep(null);
    setScreen(step && step !== "haushalt" ? "wahlkampf" : "home");
  };

  /* A mission finished. Wahlkampf steps return to the campaign HQ;
     the Wahlsonntag chains the winner into the Koalitionsverhandlung,
     which itself may chain Kanzler:in/Finanzminister:in into the budget. */
  const completeMission = () => {
    const step = missionStep;
    if (step === "wahl") {
      const role = loadSession().profile?.role;
      if (role === "kanzler" || role === "minister") {
        setMissionStep("koalition");
        return; // stay on 'decision', re-render with Koalitionsverhandlung
      }
      setMissionStep(null);
      setScreen("home");
      return;
    }
    if (step === "koalition") {
      const profile = loadSession().profile;
      if (profile?.ressort === "kanzleramt" || profile?.ressort === "finanzen") {
        setMissionStep("haushalt");
        return; // direkt in den Bundeshaushalt
      }
      setMissionStep(null);
      setScreen("home");
      return;
    }
    if (step && step !== "haushalt") {
      setMissionStep(null);
      setScreen("wahlkampf");
      return;
    }
    /* haushalt or daily mission → home */
    setMissionStep(null);
    setScreen("home");
  };

  const onAuthDone = ({ provider }: { provider: string }) => {
    const s = loadSession() || {};
    saveSession({ ...s, user: { provider } });
    setScreen("profile");
  };

  /* ─── Render ────────────────────────────────────────────── */
  const showNav = stage === "app" && TABS.includes(screen as NavId) && !inDeepView;

  function renderStage() {
    if (stage === "splash") return <Splash onDone={onSplashDone} />;
    if (stage === "onboarding") {
      return (
        <div className="pq-scroll" style={scrollAreaStyle}>
          <Onboarding onDone={onOnboardDone} />
        </div>
      );
    }
    return (
      <>
        <div className="pq-scroll" style={scrollAreaStyle}>
          {renderScreen()}
        </div>
        {showNav && (
          <BottomNav skin={skin} active={screen as NavId} onChange={goTab} />
        )}
      </>
    );
  }

  function renderScreen() {
    switch (screen) {
      case "phone":
        return <Phone onChatActiveChange={setInDeepView} />;
      case "spectrum":
        return <Spectrum onOpenValuesCheck={() => setScreen("valuescheck")} />;
      case "profile":
        return (
          <Profile
            skin={SKIN}
            onRestartOnboarding={resetAll}
            onOpenAuth={() => setScreen("auth")}
          />
        );
      case "decision":
        return (
          <MissionRouter
            stepId={missionStep}
            skin={SKIN}
            onClose={closeMission}
            onComplete={completeMission}
          />
        );
      case "plakat":
        return <Plakat skin={SKIN} onClose={() => setScreen("home")} />;
      case "wahlkampf":
        return (
          <Wahlkampf
            skin={SKIN}
            onClose={() => setScreen("home")}
            onOpenStep={(id) => openMission(id)}
          />
        );
      case "valuescheck":
        return (
          <ValuesCheck
            onClose={() => setScreen("spectrum")}
            onDone={() => setScreen("spectrum")}
          />
        );
      case "auth":
        return <Auth onDone={onAuthDone} onBack={() => setScreen("profile")} />;
      case "home":
      default:
        return (
          <Home
            skin={SKIN}
            onOpenMission={() => openMission(null)}
            onOpenWahlkampf={() => {
              /* If the campaign is mid-phase, the HQ overview is the map;
                 if nothing is open it still shows the finished state. */
              void nextStepToday();
              setScreen("wahlkampf");
            }}
            onOpenPlakat={() => setScreen("plakat")}
          />
        );
    }
  }

  return (
    <div className="pq-stage">
      <div className="pq-app">
        <motion.div
          key={`${stage}:${screen}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.3, 0.7, 0.4, 1] }}
          style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          {renderStage()}
        </motion.div>
      </div>
    </div>
  );
}

const scrollAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  paddingTop: "env(safe-area-inset-top, 0px)",
};
