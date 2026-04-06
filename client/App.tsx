import React from "react";
import { CITIES, CRIMES, ITEMS, JOBS, RIVALS, makeInitialState } from "../shared/gameData";

export default function App() {
  const state = makeInitialState("Cipher");

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "white", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 16 }}>
        <header style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 24, background: "rgba(255,255,255,0.04)" }}>
          <h1 style={{ margin: 0, fontSize: 42 }}>Metro Syndicate</h1>
          <p style={{ color: "#a1a1aa" }}>Server-authoritative crime game foundation with crews, PvP, market, contracts, and territory control.</p>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {[
            ["Cash", state.cash],
            ["Energy", state.energy],
            ["Health", state.health],
            ["Respect", state.respect],
            ["Heat", state.heat],
            ["City", CITIES.find(c => c.id === state.city)?.name || state.city]
          ].map(([label, value]) => (
            <div key={String(label)} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 16, background: "rgba(255,255,255,0.03)" }}>
              <div style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#71717a" }}>{label}</div>
              <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{String(value)}</div>
            </div>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          <Panel title="Cities" items={CITIES.map(c => `${c.name} — ${c.vibe}`)} />
          <Panel title="Jobs" items={JOBS.map(j => `${j.name} — pay ${j.pay}`)} />
          <Panel title="Crimes" items={CRIMES.map(c => `${c.name} — reward ${c.cash}`)} />
          <Panel title="Rivals" items={RIVALS.map(r => `${r.name} — power ${r.power}`)} />
          <Panel title="Items" items={ITEMS.map(i => `${i.name} — ${i.type}`)} />
          <Panel title="Log" items={state.log} />
        </section>
      </div>
    </div>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 20, background: "rgba(255,255,255,0.04)" }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {items.map((item, index) => (
          <div key={index} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 12, color: "#d4d4d8", background: "rgba(255,255,255,0.03)" }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
