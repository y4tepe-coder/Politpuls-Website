import type { Skin } from "./types";

/* Raw Schwarz-Rot-Gold palette. Mirrors the CSS variables in globals.css. */
export const PQ = {
  black: "#14130F",
  ink: "#1F1D17",
  inkSoft: "#4A463C",
  inkMute: "#807A6A",
  line: "#E8E2D2",
  lineSoft: "#F0EADB",
  paper: "#FBF6E9",
  paper2: "#F4ECD6",
  white: "#FFFFFF",
  gold: "#F6C414",
  goldDeep: "#C48A05",
  goldSoft: "#FFE9A0",
  red: "#D81E26",
  redDeep: "#9B1219",
  redSoft: "#FCE0DF",
  green: "#2E9F5D",
  greenDeep: "#166B3A",
  greenSoft: "#D8F0DE",
  blue: "#1B5FAE",
  blueSoft: "#DCEAF7",
} as const;

/* Real German party colors. */
export const PARTY_COLORS: Record<string, string> = {
  CDU: "#000000",
  SPD: "#E3000F",
  Grüne: "#46962B",
  FDP: "#FFED00",
  Linke: "#BE3075",
  AfD: "#009EE0",
  BSW: "#511B82",
  Volt: "#502379",
  "Freie Wähler": "#F39200",
};

export interface SkinTokens {
  bg: string;
  surface: string;
  surfaceBorder: string;
  surface2: string;
  text: string;
  textMuted: string;
  textDim: string;
  divider: string;
  nodeRest: string;
  nodeRestRing: string;
  nodeRestText: string;
  pathLine: string;
  pathLineLocked: string;
  heroBg: string;
  heroFg: string;
  heroAccent: string;
  navBg: string;
  navBorder: string;
  iconActive: string;
  iconRest: string;
  tagBg: string;
  tagFg: string;
}

/* Whole-app skin. The app ships the white "clean" skin (the variant the
   user landed on); paper + dark are kept as complete token sets. */
export function skinTokens(name: Skin = "clean"): SkinTokens {
  if (name === "dark") {
    return {
      bg: "linear-gradient(180deg, #1F1D17 0%, #14130F 100%)",
      surface: "rgba(255,255,255,.04)",
      surfaceBorder: "1px solid rgba(255,255,255,.08)",
      surface2: "rgba(255,255,255,.06)",
      text: "#FBF6E9",
      textMuted: "rgba(251,246,233,.55)",
      textDim: "rgba(251,246,233,.4)",
      divider: "rgba(255,255,255,.08)",
      nodeRest: "#3A3528",
      nodeRestRing: "#2A261E",
      nodeRestText: "#807A6A",
      pathLine: "rgba(255,255,255,.18)",
      pathLineLocked: "rgba(255,255,255,.08)",
      heroBg: "#FBF6E9",
      heroFg: "#1F1D17",
      heroAccent: "#D81E26",
      navBg: "rgba(20,19,15,.92)",
      navBorder: "rgba(255,255,255,.06)",
      iconActive: "#F6C414",
      iconRest: "#807A6A",
      tagBg: "rgba(255,255,255,.08)",
      tagFg: "rgba(251,246,233,.7)",
    };
  }
  if (name === "paper") {
    return {
      bg: "#FBF6E9",
      surface: "#FFFFFF",
      surfaceBorder: "1.5px solid #E8E2D2",
      surface2: "#F4ECD6",
      text: "#1F1D17",
      textMuted: "#4A463C",
      textDim: "#807A6A",
      divider: "#E8E2D2",
      nodeRest: "#E8E2D2",
      nodeRestRing: "#C9BFA3",
      nodeRestText: "#807A6A",
      pathLine: "#D6CCB1",
      pathLineLocked: "#E8E2D2",
      heroBg: "#1F1D17",
      heroFg: "#FBF6E9",
      heroAccent: "#F6C414",
      navBg: "rgba(251,246,233,.95)",
      navBorder: "#E8E2D2",
      iconActive: "#1F1D17",
      iconRest: "#807A6A",
      tagBg: "#F4ECD6",
      tagFg: "#4A463C",
    };
  }
  return {
    bg: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceBorder: "1.5px solid #ECECEC",
    surface2: "#F7F5F0",
    text: "#1F1D17",
    textMuted: "#56524B",
    textDim: "#9C9789",
    divider: "#F0EEE8",
    nodeRest: "#F0EEE8",
    nodeRestRing: "#D8D4C8",
    nodeRestText: "#9C9789",
    pathLine: "#D8D4C8",
    pathLineLocked: "#ECECEC",
    heroBg: "#1F1D17",
    heroFg: "#FBF6E9",
    heroAccent: "#F6C414",
    navBg: "rgba(255,255,255,.92)",
    navBorder: "#F0EEE8",
    iconActive: "#1F1D17",
    iconRest: "#9C9789",
    tagBg: "#F4F2EC",
    tagFg: "#56524B",
  };
}
