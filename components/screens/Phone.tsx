'use client';

// Phone screen — the Kanzler's personal smartphone with KI-chats.
// Two modes: chat list, and an open conversation.
//
// Unread state and per-contact chat history survive screen unmount AND page
// reload — persisted via readJSON/writeJSON (SSR-safe). All localStorage
// access happens inside the component via lazy useState initialisers, never
// at module scope.

import React from "react";
import type { Role } from "@/lib/types";
import { loadProgress, loadSession, readJSON, writeJSON, KEYS } from "@/lib/storage";
import { Icons, FlagStripe, SectionLabel } from "@/components/ui";

// ─── Types ─────────────────────────────────────────────────────
interface Contact {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  last: string;
  time: string;
  unread: number;
  pinned?: boolean;
  online?: boolean;
  bot?: boolean;
}

interface ChatMessage {
  from: "me" | "them";
  text: string;
}

type ChatHistory = Record<string, ChatMessage[]>;

export default function Phone({
  onChatActiveChange,
}: {
  onChatActiveChange?: (active: boolean) => void;
}) {
  const [openChat, setOpenChat] = React.useState<Contact | null>(null);
  const [, force] = React.useReducer((x: number) => x + 1, 0);

  // Unread ids — lazy init so localStorage is only touched on the client.
  const [readIds] = React.useState<Set<string>>(
    () => new Set(readJSON<string[]>(KEYS.readIds, [])),
  );

  // Rolle aus der Session lesen — bestimmt Kontakte und Headertext.
  const role: Role = (() => {
    const r = loadSession()?.profile?.role;
    return r || "kandidat";
  })();
  const contactSet = CONTACTS_BY_ROLE[role] || CONTACTS_BY_ROLE.kandidat;

  // Tell App we're in a deep view so the bottom nav can hide.
  React.useEffect(() => {
    onChatActiveChange?.(!!openChat);
    return () => onChatActiveChange?.(false);
  }, [openChat, onChatActiveChange]);

  const openContact = (contact: Contact) => {
    readIds.add(contact.id);
    writeJSON(KEYS.readIds, [...readIds]);
    setOpenChat(contact);
    force();
  };

  const day = loadProgress().currentDay || 1;
  const contacts = contactSet.map((c) => {
    const last = c.last.replace("{day}", String(day));
    return readIds.has(c.id) ? { ...c, last, unread: 0 } : { ...c, last };
  });

  return openChat ? (
    <ChatView contact={openChat} role={role} onBack={() => setOpenChat(null)} />
  ) : (
    <ChatList contacts={contacts} role={role} onOpen={openContact} />
  );
}

// ─── Kontakte pro Rolle ────────────────────────────────────────
const CONTACTS_BY_ROLE: Record<string, Contact[]> = {
  kandidat: [
    { id: 'wahlkampf', name: 'Nina Hoffmann', role: 'Wahlkampf-Managerin', initials: 'NH',
      color: '#D81E26', last: 'Tag {day} von 5. Reichweite gestern: solide. Wir müssen nachlegen.',
      time: '07:42', unread: 1, pinned: true, online: true },
    { id: 'plakatdesign', name: 'Toni Köhler', role: 'Plakatdesigner:in', initials: 'TK',
      color: '#F6C414', last: 'Brauche den Slogan für morgen. Drei Vorschläge im Anhang.',
      time: '07:38', unread: 2, online: true },
    { id: 'forsa', name: 'Dr. Hannes Reuter', role: 'Wahlforscher (forsa)', initials: 'HR',
      color: '#1B5FAE', last: 'Ihre Werte bei den Jüngeren sind erstaunlich stabil.',
      time: 'gestern', unread: 0 },
    { id: 'mira', name: 'Mira Lang', role: 'Pressesprecherin', initials: 'ML',
      color: '#1F1D17', last: 'BILD ruft an. Drei Sekunden. Was sage ich? 📰',
      time: 'gestern', unread: 0 },
    { id: 'bgf', name: 'Walter Stein', role: 'Bundesgeschäftsführer Partei', initials: 'WS',
      color: '#5C5547', last: 'Die Basis ruft an. Du sollst rauskommen.',
      time: 'Mo', unread: 0 },
    { id: 'bild', name: 'BILD Newsroom', role: 'Redaktion', initials: 'B',
      color: '#D81E26', last: 'Möchten Sie kommentieren? Antwort bis 19 Uhr.',
      time: 'So', unread: 0, bot: true },
  ],
  kanzler: [
    { id: 'lars', name: 'Lars Bergmann', role: 'Kanzleramtschef', initials: 'LB',
      color: '#1F1D17', last: 'Brief mit Steinmeier liegt im Vorzimmer. Brauchst du noch was?',
      time: '07:42', unread: 0, pinned: true, online: true },
    { id: 'mira', name: 'Mira Lang', role: 'Pressesprecherin', initials: 'ML',
      color: '#D81E26', last: 'BILD ruft an. Drei Sekunden. Was sage ich? 📰',
      time: '07:38', unread: 2, online: true },
    { id: 'annika', name: 'Annika Brehm', role: 'Vizekanzlerin', initials: 'AB',
      color: '#E3000F', last: 'Wir müssen vor dem Kabinett reden. Kaffee?',
      time: 'gestern', unread: 1 },
    { id: 'friedrich', name: 'Dr. F. Klein', role: 'Finanzminister', initials: 'FK',
      color: '#000000', last: 'Etat 2027 ist eng. Ich schicke dir die Zahlen.',
      time: 'gestern', unread: 0 },
    { id: 'sabine', name: 'Sabine Witt', role: 'Außenministerin', initials: 'SW',
      color: '#1AA037', last: 'In Brüssel läuft\'s. Drücken die Daumen.',
      time: 'Mo', unread: 0 },
    { id: 'ralf', name: 'Ralf Strecker', role: 'Fraktion', initials: 'RS',
      color: '#1B5FAE', last: 'Wir haben die Mehrheit — knapp.',
      time: 'Mo', unread: 0 },
    { id: 'bild', name: 'BILD Newsroom', role: 'Redaktion', initials: 'B',
      color: '#D81E26', last: 'Möchten Sie kommentieren? Antwort bis 19 Uhr.',
      time: 'So', unread: 0, bot: true },
  ],
  minister: [
    { id: 'staatssek', name: 'Dr. Petra Voll', role: 'Staatssekretär:in', initials: 'PV',
      color: '#1F1D17', last: 'Erste Hausleitung um 9 Uhr. Wir sind bereit.',
      time: '07:30', unread: 1, pinned: true, online: true },
    { id: 'lars', name: 'Lars Bergmann', role: 'Kanzleramtschef', initials: 'LB',
      color: '#000000', last: 'Die Kanzlerin erwartet dich um 11 Uhr.',
      time: '07:42', unread: 1, online: true },
    { id: 'mira', name: 'Mira Lang', role: 'Ressort-Pressesprecher:in', initials: 'ML',
      color: '#D81E26', last: 'Welt-Interview steht. Welche Linie für Migration?',
      time: 'gestern', unread: 2, online: true },
    { id: 'ralf', name: 'Ralf Strecker', role: 'Fraktion', initials: 'RS',
      color: '#1B5FAE', last: 'Du hast Versprechen in der Fraktion. Ruf an.',
      time: 'gestern', unread: 0 },
    { id: 'bild', name: 'BILD Newsroom', role: 'Redaktion', initials: 'B',
      color: '#D81E26', last: 'Statement zum Ressort-Antritt bis 18 Uhr?',
      time: 'Mo', unread: 0, bot: true },
  ],
  opposition: [
    { id: 'fraktion', name: 'Marlene Voss', role: 'Fraktions-Geschäftsführer:in', initials: 'MV',
      color: '#1F1D17', last: 'Aktuelle Stunde · wir brauchen ein Thema.',
      time: '07:42', unread: 2, pinned: true, online: true },
    { id: 'pressefr', name: 'Jonas Wittke', role: 'Pressesprecher Fraktion', initials: 'JW',
      color: '#D81E26', last: 'Wie kontern wir die Regierungserklärung?',
      time: '07:38', unread: 1, online: true },
    { id: 'schatten', name: 'Anna Reichelt', role: 'Schattenministerin Finanzen', initials: 'AR',
      color: '#1B5FAE', last: 'Etat-Antrag liegt bereit. Schau dir das durch.',
      time: 'gestern', unread: 1 },
    { id: 'verband', name: 'BDI', role: 'Verband (Wirtschaft)', initials: 'BD',
      color: '#5C5547', last: 'Möchten Sie uns als Opposition besuchen?',
      time: 'gestern', unread: 0 },
    { id: 'bild', name: 'BILD Newsroom', role: 'Redaktion', initials: 'B',
      color: '#D81E26', last: 'Statement zur Regierungsbildung?',
      time: 'Mo', unread: 0, bot: true },
  ],
};

function ChatList({
  contacts,
  role,
  onOpen,
}: {
  contacts: Contact[];
  role: Role;
  onOpen: (c: Contact) => void;
}) {
  const handyLabel =
    role === 'kanzler'    ? 'Sicheres Kanzler-Handy' :
    role === 'minister'   ? 'Sicheres Ministerien-Handy' :
    role === 'opposition' ? 'Fraktions-Handy' :
                             'Wahlkampf-Handy';
  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 8px' }}>
        <FlagStripe height={3} style={{ borderRadius: 999, marginBottom: 12, opacity: .9 }} />
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 800, color: 'var(--pq-ink-mute)',
              textTransform: 'uppercase', letterSpacing: '.08em'
            }}>{handyLabel}</div>
            <div className="pq-display-tight" style={{
              fontSize: 30, fontWeight: 800, color: 'var(--pq-ink)', marginTop: 2
            }}>Nachrichten</div>
          </div>
          <button style={{
            width: 40, height: 40, borderRadius: 12, background: '#fff',
            border: '1.5px solid var(--pq-line)', cursor: 'pointer', padding: 0,
            display: 'grid', placeItems: 'center'
          }} aria-label="Neue Nachricht">
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 20 L 16 8 L 20 12 L 8 24 Z M 16 8 L 19 5 a 1.4 1.4 0 0 1 2 0 L 23 7 a 1.4 1.4 0 0 1 0 2 L 20 12 Z" fill="none" transform="translate(-2,-2)" stroke="#1F1D17" strokeWidth="2" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{
          background: '#fff', border: '1.5px solid var(--pq-line)',
          borderRadius: 14, height: 40, padding: '0 12px',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" fill="none" stroke="#807A6A" strokeWidth="2" /><path d="M16 16 L 21 21" stroke="#807A6A" strokeWidth="2" strokeLinecap="round" /></svg>
          <div style={{ color: 'var(--pq-ink-mute)', fontSize: 14 }}>Kontakt suchen…</div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{
        padding: '0 16px 8px', display: 'flex', gap: 6, overflowX: 'auto'
      }}>
        {['Alle', 'Ungelesen', 'Koalition', 'Opposition', 'Medien'].map((t, i) =>
        <button key={t} style={{
          padding: '6px 12px', borderRadius: 999,
          background: i === 0 ? '#1F1D17' : '#fff',
          color: i === 0 ? '#FBF6E9' : 'var(--pq-ink-soft)',
          border: i === 0 ? '0' : '1.5px solid var(--pq-line)',
          fontWeight: 700, fontSize: 12,
          cursor: 'pointer', fontFamily: 'inherit',
          whiteSpace: 'nowrap'
        }}>{t}</button>
        )}
      </div>

      {/* Pinned banner */}
      <SectionLabel>Angeheftet</SectionLabel>
      <div style={{ padding: '0 16px' }}>
        {contacts.filter((c) => c.pinned).map((c) =>
        <ContactRow key={c.id} contact={c} onOpen={onOpen} />
        )}
      </div>

      <SectionLabel right={<span style={{ fontSize: 11, color: 'var(--pq-ink-mute)' }}>7 Kontakte</span>}>
        Heute & gestern
      </SectionLabel>
      <div style={{ padding: '0 16px' }}>
        {contacts.filter((c) => !c.pinned).map((c) =>
        <ContactRow key={c.id} contact={c} onOpen={onOpen} />
        )}
      </div>

      {/* Disclaimer */}
      <div style={{
        margin: '20px 16px 0',
        padding: 12, background: 'var(--pq-blue-soft)',
        borderRadius: 14, fontSize: 12, color: '#0F3D78', lineHeight: 1.35
      }}>
        🛡️ Alle Antworten in diesen Chats werden von einer KI im Charakter deines Teams generiert. Keine echten Personen.
      </div>
    </div>);

}

function Avatar({
  initials,
  color,
  size = 48,
  online,
}: {
  initials: string;
  color: string;
  size?: number;
  online?: boolean;
}) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: color, color: '#FBF6E9',
        display: 'grid', placeItems: 'center',
        fontWeight: 800, fontSize: size * 0.36,
        fontFamily: '"Bricolage Grotesque", system-ui'
      }}>{initials}</div>
      {online &&
      <span style={{
        position: 'absolute', right: 0, bottom: 1,
        width: 13, height: 13, borderRadius: '50%',
        background: '#2E9F5D', border: '2.5px solid var(--pq-paper)'
      }} />
      }
    </div>);

}

function ContactRow({ contact, onOpen }: { contact: Contact; onOpen: (c: Contact) => void }) {
  return (
    <button onClick={() => onOpen(contact)} style={{
      width: '100%', textAlign: 'left',
      background: '#fff', border: '1.5px solid var(--pq-line)',
      borderRadius: 14, padding: '10px 12px', marginBottom: 8,
      display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer',
      fontFamily: 'inherit'
    }}>
      <Avatar initials={contact.initials} color={contact.color} online={contact.online} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8
        }}>
          <div style={{
            fontWeight: 700, fontSize: 15, color: 'var(--pq-ink)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {contact.name}
            {contact.bot &&
            <span style={{
              marginLeft: 6, fontSize: 9, fontWeight: 800,
              padding: '1px 5px', background: '#E8E2D2', borderRadius: 4,
              color: 'var(--pq-ink-soft)', letterSpacing: '.05em'
            }}>BOT</span>
            }
          </div>
          <div style={{
            fontSize: 11, color: 'var(--pq-ink-mute)', whiteSpace: 'nowrap',
            fontFamily: '"JetBrains Mono", monospace'
          }}>{contact.time}</div>
        </div>
        <div style={{
          fontSize: 11, color: 'var(--pq-ink-mute)', marginTop: 1,
          textTransform: 'uppercase', letterSpacing: '.04em'
        }}>{contact.role}</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 4
        }}>
          <div style={{
            flex: 1, fontSize: 13, color: 'var(--pq-ink-soft)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontWeight: contact.unread ? 600 : 400
          }}>{contact.last}</div>
          {contact.unread > 0 &&
          <span style={{
            flexShrink: 0,
            background: 'var(--pq-red)', color: '#fff',
            fontSize: 11, fontWeight: 800, padding: '1px 7px',
            borderRadius: 999, minWidth: 20, textAlign: 'center'
          }}>{contact.unread}</span>
          }
        </div>
      </div>
    </button>);

}

// ─── Open conversation ────────────────────────────────────────────────
function ChatView({
  contact,
  role = 'kandidat',
  onBack,
}: {
  contact: Contact;
  role?: Role;
  onBack: () => void;
}) {
  // Pre-baked scenes per contact so opening any chat feels alive.
  const scripts: Record<string, ChatMessage[]> = {
    // —— Pre-Wahl Wahlkampf-Team ——
    wahlkampf: [
      { from: 'them', text: 'Guten Morgen. Tag {day} von 5. Reichweite gestern: solide. Wir müssen nachlegen.' },
      { from: 'them', text: 'Was ist dein Schwerpunkt heute?' },
    ],
    plakatdesign: [
      { from: 'them', text: 'Brauche den Slogan für morgen.' },
      { from: 'them', text: 'Drei Vorschläge: 1) Klare Worte. Klare Politik. 2) Bei uns zählst du. 3) Endlich anpacken.' },
    ],
    forsa: [
      { from: 'them', text: 'Ihre Werte bei den Jüngeren sind erstaunlich stabil.' },
      { from: 'them', text: 'Senioren-Lager wackelt aber. Brauchen Sie eine Vertiefungsstudie?' },
    ],
    bgf: [
      { from: 'them', text: 'Die Basis ruft an. Du sollst rauskommen.' },
      { from: 'them', text: 'Drei Ortsverbände wollen einen Besuch.' },
    ],
    // —— Kanzler:in-Team ——
    lars: [
      { from: 'them', text: 'Guten Morgen, Chefin. Termine: 9 Uhr Steinmeier, 11 Uhr Kabinett.' },
      { from: 'them', text: 'Brief mit Steinmeier liegt im Vorzimmer. Brauchst du noch was?' },
    ],
    mira: [
      { from: 'them', text: 'Chefin, BILD ruft an. 📰' },
      { from: 'them', text: 'Sie wollen O-Ton. Drei Sekunden, dann sind sie weg.' },
      { from: 'them', text: 'Was sage ich? 🤔' },
    ],
    annika: [
      { from: 'them', text: 'Wir müssen vor dem Kabinett reden. Kaffee?' },
      { from: 'them', text: 'Die Linke in der Fraktion wird zickig.' },
    ],
    friedrich: [
      { from: 'them', text: 'Etat 2027 ist eng.' },
      { from: 'them', text: 'Ich schicke dir die Zahlen. Wir reden um 14h.' },
    ],
    sabine: [
      { from: 'them', text: 'In Brüssel läuft\'s.' },
      { from: 'them', text: 'Drücken die Daumen für heute. 🤞' },
    ],
    ralf: [
      { from: 'them', text: 'Wir haben die Mehrheit — knapp.' },
      { from: 'them', text: 'Zwei Abweichler. Brauchen Gespräch.' },
    ],
    // —— Minister:in-Team ——
    staatssek: [
      { from: 'them', text: 'Guten Morgen. Erste Hausleitung um 9 Uhr.' },
      { from: 'them', text: 'Hier sind die offenen Vorlagen aus dem alten Ministerium.' },
    ],
    // —— Opposition-Team ——
    fraktion: [
      { from: 'them', text: 'Aktuelle Stunde · wir brauchen ein Thema.' },
      { from: 'them', text: 'Vorschlag: Migrations-Politik der Regierung angreifen.' },
    ],
    pressefr: [
      { from: 'them', text: 'Wie kontern wir die Regierungserklärung?' },
      { from: 'them', text: 'Welt-Online wartet auf eine Stellungnahme.' },
    ],
    schatten: [
      { from: 'them', text: 'Etat-Antrag liegt bereit. Schau dir das durch.' },
      { from: 'them', text: 'Wir müssen Position beziehen — bevor andere es tun.' },
    ],
    verband: [
      { from: 'them', text: 'Wir hören, Sie sind nun in der Opposition.' },
      { from: 'them', text: 'Möchten Sie uns besuchen kommen? Wir würden gerne reden.' },
    ],
    // —— Geteilt ——
    bild: [
      { from: 'them', text: 'Sehr geehrte:r,' },
      { from: 'them', text: 'Wir berichten morgen 1A. Möchten Sie kommentieren? Antwort bis 19 Uhr.' },
    ],
  };
  const [msgs, setMsgs] = React.useState<ChatMessage[]>(() => {
    // Resume from saved chat history if we have it for this contact;
    // otherwise seed with the scripted intro so first-open feels alive.
    const key = `${role}:${contact.id}`;
    const history = readJSON<ChatHistory>(KEYS.chatHistory, {});
    if (history[key]?.length) return history[key];
    const day = loadProgress().currentDay || 1;
    const initial: ChatMessage[] = (scripts[contact.id] || [{ from: 'them', text: 'Hi! Wie kann ich helfen?' }])
      .map((m) => ({ ...m, text: m.text.replace('{day}', String(day)) }));
    return initial;
  });
  // Mirror to localStorage on every change so user-typed messages survive
  // back-button, tab-switch, and reload.
  React.useEffect(() => {
    const history = readJSON<ChatHistory>(KEYS.chatHistory, {});
    history[`${role}:${contact.id}`] = msgs;
    writeJSON(KEYS.chatHistory, history);
  }, [msgs, contact.id, role]);
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    const userMsg: ChatMessage = { from: 'me', text: trimmed };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: 'them', text: aiReply(contact.id, trimmed) }]);
    }, 700);
  };

  const replyChips = contact.id === 'mira' ?
  ['"Wir handeln aus Verantwortung — für beide Seiten."', '„Kein Stillstand bei sozialen Fragen."', 'No comment.'] :
  contact.id === 'lars' ?
  ['Briefing in 15 Min', 'Verschieb Steinmeier auf 10h', 'Nicht jetzt.'] :
  contact.id === 'annika' ?
  ['Klar, 9 Uhr Kanzleramt.', 'Heute Abend besser.', 'Was bietest du an?'] :
  ['Danke. Reden später.', 'Okay, weiter so.', '👍'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* chat header */}
      <div style={{
        padding: '10px 12px 10px', display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(251,246,233,.94)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--pq-line)',
        position: 'sticky', top: 0, zIndex: 5
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 12, background: '#fff',
          border: '1.5px solid var(--pq-line)', cursor: 'pointer', padding: 0,
          display: 'grid', placeItems: 'center', flexShrink: 0
        }} aria-label="Zurück">{Icons.chevron('left', '#1F1D17')}</button>
        <Avatar initials={contact.initials} color={contact.color} online={contact.online} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--pq-ink)' }}>{contact.name}</div>
          <div style={{ fontSize: 11, color: 'var(--pq-ink-mute)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
            {contact.online ? '● online' : contact.role}
          </div>
        </div>
        <button style={{
          width: 36, height: 36, borderRadius: 12, background: '#fff',
          border: '1.5px solid var(--pq-line)', cursor: 'pointer', padding: 0,
          display: 'grid', placeItems: 'center'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 5 L 9 5 L 11 10 L 8 12 a 10 10 0 0 0 5 5 L 15 14 L 20 16 V 20 a 1 1 0 0 1 -1 1 A 16 16 0 0 1 4 6 a 1 1 0 0 1 1 -1 Z" fill="#1F1D17" /></svg>
        </button>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="pq-scroll" style={{
        flex: 1, overflow: 'auto',
        padding: '12px 12px 8px',
        background: '#F4ECD6',
        backgroundImage: `
          radial-gradient(circle at 30% 20%, rgba(216,30,38,.04), transparent 40%),
          radial-gradient(circle at 70% 80%, rgba(196,138,5,.05), transparent 45%)
        `,
        display: 'flex', flexDirection: 'column', gap: 6
      }}>
        {/* date separator */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--pq-ink-mute)', margin: '4px 0 8px' }}>
          <span style={{
            background: 'rgba(255,255,255,.7)', padding: '3px 10px', borderRadius: 999,
            fontWeight: 600
          }}>Heute · 07:38</span>
        </div>

        {msgs.map((m, i) => {
          const prev = msgs[i - 1];
          const grouped = !!prev && prev.from === m.from;
          return <Bubble key={i} msg={m} grouped={grouped} contact={contact} />;
        })}
        {typing && <TypingIndicator contact={contact} />}
      </div>

      {/* quick reply chips */}
      <div style={{
        padding: '8px 12px 4px',
        display: 'flex', gap: 6, overflowX: 'auto',
        background: '#F4ECD6'
      }}>
        {replyChips.map((c, i) =>
        <button key={i} onClick={() => send(c)} style={{
          flexShrink: 0,
          background: '#FBF6E9', border: '1.5px solid var(--pq-line)',
          padding: '6px 10px', borderRadius: 999,
          fontSize: 12, color: 'var(--pq-ink-soft)', cursor: 'pointer',
          fontFamily: 'inherit', maxWidth: 240,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>{c}</button>
        )}
      </div>

      {/* composer */}
      <div style={{
        padding: '4px 12px 24px',
        background: '#F4ECD6',
        display: 'flex', gap: 8, alignItems: 'flex-end'
      }}>
        <div style={{
          flex: 1,
          background: '#FBF6E9', border: '1.5px solid var(--pq-line)',
          borderRadius: 20, padding: '6px 10px 6px 14px',
          display: 'flex', alignItems: 'flex-end', gap: 6
        }}>
          <button style={{
            background: 'transparent', border: 0, padding: 4, cursor: 'pointer',
            color: 'var(--pq-ink-mute)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 8 V 16 M 8 12 H 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault();send(input);}}}
            placeholder="Nachricht…"
            rows={1}
            style={{
              flex: 1, border: 0, outline: 0, background: 'transparent',
              resize: 'none', fontFamily: 'inherit', fontSize: 15,
              color: 'var(--pq-ink)', padding: '6px 0', lineHeight: 1.3
            }} />

        </div>
        <button onClick={() => send(input)} style={{
          width: 44, height: 44, borderRadius: '50%',
          background: input.trim() ? 'var(--pq-gold)' : '#E8E2D2',
          border: 0, cursor: input.trim() ? 'pointer' : 'default',
          display: 'grid', placeItems: 'center', flexShrink: 0,
          boxShadow: input.trim() ? 'inset 0 -3px 0 var(--pq-gold-deep)' : 'none'
        }}>{Icons.send('#1F1D17')}</button>
      </div>
    </div>);

}

// ─── Canned character replies ────────────────────────────────────────
function aiReply(id: string, prompt: string) {
  // canned for the prototype — would be claude.complete in the real app
  void prompt;
  if (id === 'mira') return 'Verstanden. Ich gebe das so an die BILD weiter und melde mich, wenn Reaktion kommt.';
  if (id === 'lars') return 'Notiert. Vorzimmer wird informiert.';
  if (id === 'annika') return 'Okay. Bring frische Croissants mit, dann reden wir.';
  if (id === 'bild') return 'Vielen Dank — wir nehmen das mit auf.';
  if (id === 'sabine') return 'Daumen drücken zurück. ✊';
  if (id === 'friedrich') return 'Gut. Ich melde mich nach dem Termin mit der Industrie.';
  if (id === 'ralf') return 'Ich nehme mir die Abweichler. Bis später.';
  return 'Verstanden.';
}

function Bubble({
  msg,
  grouped,
  contact,
}: {
  msg: ChatMessage;
  grouped: boolean;
  contact: Contact;
}) {
  const isMe = msg.from === 'me';
  return (
    <div style={{
      display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
      marginTop: grouped ? 0 : 6
    }}>
      {!isMe && !grouped &&
      <div style={{ marginRight: 6, marginTop: 2 }}>
          <Avatar initials={contact.initials} color={contact.color} size={28} />
        </div>
      }
      {!isMe && grouped && <div style={{ width: 34 }} />}
      <div style={{
        maxWidth: '78%',
        background: isMe ? 'var(--pq-gold)' : '#FBF6E9',
        color: isMe ? '#1F1D17' : 'var(--pq-ink)',
        padding: '8px 12px',
        borderRadius: 16,
        borderTopLeftRadius: !isMe && !grouped ? 4 : 16,
        borderTopRightRadius: isMe && !grouped ? 4 : 16,
        fontSize: 14, lineHeight: 1.35,
        boxShadow: isMe ?
        'inset 0 -2px 0 var(--pq-gold-deep)' :
        '0 1px 2px rgba(20,19,15,.05)',
        border: isMe ? 0 : '1px solid rgba(216,30,38,.08)',
        fontWeight: isMe ? 600 : 400
      }}>
        {msg.text}
      </div>
    </div>);

}

function TypingIndicator({ contact }: { contact: Contact }) {
  return (
    <div style={{ display: 'flex', marginTop: 6 }}>
      <div style={{ marginRight: 6, marginTop: 2 }}>
        <Avatar initials={contact.initials} color={contact.color} size={28} />
      </div>
      <div style={{
        background: '#FBF6E9', padding: '10px 14px',
        borderRadius: 16, borderTopLeftRadius: 4,
        display: 'flex', gap: 4, alignItems: 'center'
      }}>
        <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
      </div>
    </div>);

}
function Dot({ delay }: { delay: number }) {
  return <span style={{
    width: 6, height: 6, borderRadius: '50%', background: '#807A6A',
    animation: `pq-bounce 1s ${delay}ms infinite`
  }} />;
}
