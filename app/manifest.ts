import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Politpuls — Politik. Spielen. Verstehen.",
    short_name: "Politpuls",
    description: "Politische Bildung als tägliches Entscheidungs-Spiel.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1F1D17",
    theme_color: "#1F1D17",
    icons: [
      { src: "/icon", sizes: "any", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
