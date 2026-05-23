"use client";

import { useEffect, useReducer } from "react";

/**
 * Force a re-render whenever any of the given pq:* events fire (or the
 * window regains focus). Components then call the storage loaders inline,
 * mirroring the prototype's event-driven refresh.
 */
export function useGameSync(events: string[] = []) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const refresh = () => force();
    events.forEach((e) => window.addEventListener(e, refresh));
    window.addEventListener("focus", refresh);
    return () => {
      events.forEach((e) => window.removeEventListener(e, refresh));
      window.removeEventListener("focus", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.join(",")]);
}
