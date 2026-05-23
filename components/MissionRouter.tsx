"use client";

import type { Skin, WahlkampfStepId } from "@/lib/types";
import { loadProgress, loadSession } from "@/lib/storage";
import { completeWahlkampfStep, awardXp } from "@/lib/wahlkampf";
import Decision from "./screens/Decision";
import {
  MissionThemen,
  MissionProgramm,
  MissionPlakat,
  MissionRede,
  MissionSocial,
  MissionPresse,
  MissionTV,
  MissionMarkt,
  MissionWahl,
  MissionBundeshaushalt,
} from "./screens/Missions";

/* The mission slot can hold a Wahlkampf step, the post-election budget
   mission, or null = the daily KI-Redaktion mission. */
export type MissionStep = WahlkampfStepId | "haushalt" | null;

/**
 * Routes the active mission slot to the right screen.
 *  • Wahlkampf step → the matching Mission*, then completeWahlkampfStep()
 *  • 'haushalt'     → the Bundeshaushalt simulator (Kanzler:in only)
 *  • null           → the daily decision flow (handles its own completion)
 */
export default function MissionRouter({
  stepId,
  skin = "clean",
  onClose,
  onComplete,
}: {
  stepId: MissionStep;
  skin?: Skin;
  onClose: () => void;
  onComplete: () => void;
}) {
  const day = loadProgress().currentDay;
  const role = loadSession().profile?.role || "kandidat";

  if (stepId === "haushalt") {
    return (
      <MissionBundeshaushalt
        skin={skin}
        day={day}
        role={role}
        onClose={onClose}
        onDone={(xp = 70) => {
          awardXp(xp);
          onComplete();
        }}
      />
    );
  }

  if (stepId) {
    const onDone = (xp = 50) => {
      completeWahlkampfStep(stepId, xp);
      onComplete();
    };
    const props = { skin, day, role, onClose, onDone };
    switch (stepId) {
      case "themen":
        return <MissionThemen {...props} />;
      case "programm":
        return <MissionProgramm {...props} />;
      case "plakat":
        return <MissionPlakat {...props} />;
      case "rede":
        return <MissionRede {...props} />;
      case "social":
        return <MissionSocial {...props} />;
      case "presse":
        return <MissionPresse {...props} />;
      case "tv":
        return <MissionTV {...props} />;
      case "tour":
        return <MissionMarkt {...props} />;
      case "wahl":
        return <MissionWahl {...props} />;
    }
  }

  /* Daily mission — Decision calls completeDailyMission() itself. */
  return <Decision skin={skin} onClose={onClose} onComplete={onComplete} />;
}
