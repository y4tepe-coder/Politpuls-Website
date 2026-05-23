'use client';

// Splash — animated intro, auto-advances to auth after ~1.8s.
// Logo only, no chrome. Schwarz-Rot-Gold.

import React from "react";
import { Bundesadler } from "@/components/Mascot";
import { FlagStripe } from "@/components/ui";

export default function Splash({ onDone }: { onDone: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, #1F1D17 0%, #14130F 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* faint flag-stripe rays */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 40%, rgba(246,196,20,.10), transparent 60%)',
      }}/>

      {/* mascot */}
      <div style={{
        animation: 'pq-rise .6s ease-out backwards, pq-bob 3s ease-in-out 1s infinite',
      }}>
        <Bundesadler size={140} variant="bold" mood="happy"/>
      </div>

      {/* wordmark */}
      <div style={{
        marginTop: 18,
        animation: 'pq-rise .6s .15s ease-out backwards',
      }}>
        <div className="pq-display-tight" style={{
          fontSize: 48, fontWeight: 800, color: '#FBF6E9', letterSpacing: '-.02em',
        }}>
          Polit<span style={{ color: '#F6C414' }}>puls</span>
        </div>
        <div style={{
          fontSize: 13, color: 'rgba(251,246,233,.55)', textAlign: 'center', marginTop: 2,
          fontWeight: 600, letterSpacing: '.04em',
        }}>Politik. Spielen. Verstehen.</div>
      </div>

      {/* flag stripe — animated */}
      <div style={{
        position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
        width: 80, height: 4, borderRadius: 999, overflow: 'hidden',
        animation: 'pq-rise .6s .3s ease-out backwards',
      }}>
        <FlagStripe height={4} animated/>
      </div>
    </div>
  );
}
