'use client';

// Auth — Registration / Sign-in. Mock flow: any tap "logs you in" and proceeds.
// Two modes: choice screen + email form.

import React from "react";
import { Bundesadler } from "@/components/Mascot";
import { Icons, PressButton } from "@/components/ui";

export default function Auth({
  onDone,
  onBack,
}: {
  onDone: (r: { provider: string }) => void;
  onBack?: () => void;
}) {
  const [mode, setMode] = React.useState<'choice' | 'signin' | 'signup'>('choice');
  const [email, setEmail] = React.useState('');
  const [pw, setPw]       = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const finish = (provider: string) => {
    setLoading(true);
    setTimeout(() => onDone({ provider }), 700);
  };

  if (mode === 'signin' || mode === 'signup') {
    const isSignup = mode === 'signup';
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: '#1F1D17', color: '#FBF6E9',
        display: 'flex', flexDirection: 'column',
        padding: '56px 24px 24px',
      }}>
        <button onClick={() => setMode('choice')} style={{
          width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,.08)',
          border: 0, padding: 0, cursor: 'pointer', alignSelf: 'flex-start',
          display: 'grid', placeItems: 'center',
        }}>{Icons.chevron('left', '#FBF6E9')}</button>

        <div style={{ marginTop: 24 }}>
          <div className="pq-display-tight" style={{
            fontSize: 32, fontWeight: 800, lineHeight: 1.05,
          }}>{isSignup ? 'Konto erstellen' : 'Willkommen zurück'}</div>
          <div style={{ fontSize: 14, color: 'rgba(251,246,233,.6)', marginTop: 8 }}>
            {isSignup
              ? 'Nur Email und Passwort — Bestätigung kommt per Mail.'
              : 'Melde dich mit deinem Politpuls-Konto an.'}
          </div>
        </div>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AuthField label="E-Mail" type="email" value={email} onChange={setEmail} placeholder="du@example.de" autoFocus/>
          <AuthField label="Passwort" type="password" value={pw} onChange={setPw} placeholder="Mindestens 8 Zeichen"/>
          {isSignup && (
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4,
              fontSize: 12, color: 'rgba(251,246,233,.65)', lineHeight: 1.4, cursor: 'pointer',
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 5,
                background: '#F6C414', display: 'grid', placeItems: 'center', flexShrink: 0,
                marginTop: 1,
              }}>{Icons.check('#1F1D17')}</span>
              Ich akzeptiere die Nutzungsbedingungen und Datenschutzhinweise.
            </label>
          )}
        </div>

        <div style={{ flex: 1 }}/>

        <PressButton
          variant={email && pw.length >= 4 && !loading ? 'primary' : 'ghost'}
          size="lg" full
          disabled={!email || pw.length < 4 || loading}
          onClick={() => finish('email')}
        >{loading ? 'Moment…' : (isSignup ? 'Konto erstellen' : 'Anmelden')}</PressButton>

        <div style={{
          textAlign: 'center', marginTop: 12, fontSize: 13,
          color: 'rgba(251,246,233,.55)',
        }}>
          {isSignup ? 'Schon ein Konto?' : 'Noch kein Konto?'}{' '}
          <button onClick={() => setMode(isSignup ? 'signin' : 'signup')} style={{
            background: 0, border: 0, color: '#F6C414', fontWeight: 700,
            cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 13,
          }}>{isSignup ? 'Anmelden' : 'Jetzt erstellen'}</button>
        </div>
      </div>
    );
  }

  // CHOICE screen
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, #1F1D17 0%, #14130F 100%)',
      color: '#FBF6E9', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      padding: '60px 24px 24px',
    }}>
      {/* faint backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 80% -10%, rgba(216,30,38,.16), transparent 55%), radial-gradient(ellipse at -10% 110%, rgba(246,196,20,.12), transparent 55%)',
        pointerEvents: 'none',
      }}/>

      {onBack && (
        <button onClick={onBack} style={{
          position: 'relative',
          width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,.08)',
          border: 0, padding: 0, cursor: 'pointer', alignSelf: 'flex-start',
          display: 'grid', placeItems: 'center',
        }}>{Icons.chevron('left', '#FBF6E9')}</button>
      )}

      <div style={{ position: 'relative', textAlign: 'center', marginTop: 12 }}>
        <div style={{ display: 'inline-block', animation: 'pq-rise .5s ease-out backwards' }}>
          <Bundesadler size={108} variant="bold"/>
        </div>
        <div className="pq-display-tight" style={{
          fontSize: 38, fontWeight: 800, marginTop: 8, lineHeight: 1,
        }}>
          Polit<span style={{ color: '#F6C414' }}>puls</span>
        </div>
        <div style={{
          fontSize: 14, color: 'rgba(251,246,233,.65)', marginTop: 6, lineHeight: 1.4,
          maxWidth: 280, margin: '6px auto 0',
        }}>
          5 Minuten am Tag.<br/>
          Politik verstehen, indem du sie spielst.
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AuthButton
          kind="apple"
          onClick={() => finish('apple')}
        >Weiter mit Apple</AuthButton>
        <AuthButton
          kind="google"
          onClick={() => finish('google')}
        >Weiter mit Google</AuthButton>
        <AuthButton
          kind="email"
          onClick={() => setMode('signup')}
        >Mit E-Mail registrieren</AuthButton>

        <div style={{
          textAlign: 'center', marginTop: 8, fontSize: 13,
          color: 'rgba(251,246,233,.6)',
        }}>
          Schon ein Konto?{' '}
          <button onClick={() => setMode('signin')} style={{
            background: 0, border: 0, color: '#F6C414', fontWeight: 700,
            cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 13,
          }}>Anmelden</button>
        </div>

        <div style={{
          marginTop: 12, fontSize: 10, lineHeight: 1.5,
          color: 'rgba(251,246,233,.4)', textAlign: 'center',
        }}>
          Mit dem Fortfahren akzeptierst du unsere{' '}
          <u>Nutzungsbedingungen</u> und{' '}
          <u>Datenschutzhinweise</u>.
        </div>
      </div>
    </div>
  );
}

function AuthField({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'rgba(251,246,233,.6)',
        textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6,
      }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%', height: 50, padding: '0 14px',
          background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.12)',
          borderRadius: 12, color: '#FBF6E9', fontSize: 15, fontFamily: 'inherit',
          outline: 'none',
        }}
      />
    </div>
  );
}

function AuthButton({
  kind,
  children,
  onClick,
}: {
  kind: 'apple' | 'google' | 'email';
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const config = {
    apple:  { bg: '#FBF6E9', fg: '#1F1D17', icon: <AppleIcon/> },
    google: { bg: '#FFFFFF', fg: '#1F1D17', icon: <GoogleIcon/> },
    email:  { bg: 'rgba(255,255,255,.10)', fg: '#FBF6E9',
              icon: <svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M3 7 L 12 13 L 21 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  }[kind];
  return (
    <button onClick={onClick} className="pq-press" style={{
      width: '100%', height: 56, borderRadius: 16, border: 0, cursor: 'pointer',
      background: config.bg, color: config.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      fontFamily: 'inherit', fontWeight: 700, fontSize: 15,
      boxShadow: kind === 'email'
        ? 'inset 0 0 0 1.5px rgba(255,255,255,.18)'
        : 'inset 0 -3px 0 rgba(0,0,0,.08)',
    }}>
      <span style={{ display: 'inline-flex' }}>{config.icon}</span>
      {children}
    </button>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20">
      <path d="M12.6 3.2c-.6.7-1.6 1.2-2.6 1.1-.1-1 .4-2 1-2.7C11.7.9 12.7.4 13.6.3c.1 1-.4 2.1-1 2.9zm1 1.6c-1.5-.1-2.7.8-3.4.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.9.9-3.6 2.2-1.6 2.7-.4 6.7 1 8.9.7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.7.7 2.8.7 1.2 0 1.9-1.1 2.6-2.2.6-.8 1-1.7 1.3-2.6-2-.7-2.9-3.2-1-4.7-.5-.8-1.4-1.7-2.4-1.8z" fill="currentColor"/>
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.6 9.2c0-.6 0-1.2-.2-1.7H9v3.4h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" fill="#4285F4"/>
      <path d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.8v2.3C2.3 16 5.4 18 9 18z" fill="#34A853"/>
      <path d="M3.9 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.8C.3 6.2 0 7.5 0 9s.3 2.8.8 4l3.1-2.3z" fill="#FBBC05"/>
      <path d="M9 3.6c1.3 0 2.6.5 3.5 1.4l2.6-2.6C13.5.9 11.4 0 9 0 5.4 0 2.3 2 .8 5l3.1 2.3C4.6 5.2 6.6 3.6 9 3.6z" fill="#EA4335"/>
    </svg>
  );
}
