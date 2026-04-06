import React, { useEffect, useMemo, useState } from "react";
import { apiCall } from "./secureApi";

type PlayerState = {
  alias: string;
  cash: number;
  bank: number;
  energy: number;
  health: number;
  strength: number;
  speed: number;
  defense: number;
  respect: number;
  heat: number;
  city: string;
  job: string;
  day: number;
  wins: number;
  losses: number;
  inventory: Record<string, number>;
  equipped: { weapon: string | null; armor: string | null; utility: string | null };
  log: string[];
};

export default function AppGameplay() {
  const [state, setState] = useState<PlayerState | null>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [crimes, setCrimes] = useState<any[]>([]);
  const [rivals, setRivals] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cityName = useMemo(() => cities.find((c) => c.id === state?.city)?.name || state?.city || "-", [cities, state]);
  const jobName = useMemo(() => jobs.find((j) => j.id === state?.job)?.name || state?.job || "-", [jobs, state]);

  const bootstrap = async () => {
    const data = await apiCall("/api/bootstrap");
    setState(data.player);
    setCities(data.cities || []);
    setJobs(data.jobs || []);
    setCrimes(data.crimes || []);
    setRivals(data.rivals || []);
    setItems(data.items || []);
  };

  useEffect(() => {
    bootstrap().catch((e) => setError(e.message));
  }, []);

  const run = async (action: any) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiCall("/api/actions", { method: "POST", body: JSON.stringify({ action }) });
      setState(data.player);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = async () => {
    const data = await apiCall("/api/reset-demo", { method: "POST" });
    setState(data.player);
  };

  if (!state) {
    return <div style={{ minHeight: "100vh", background: "#09090b", color: "white", padding: 24 }}>Loading gameplay foundation…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "white", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gap: 16 }}>
        <header style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 24, background: "rgba(255,255,255,0.04)" }}>
          <h1 style={{ margin: 0, fontSize: 38 }}>Metro Syndicate Gameplay Foundation</h1>
          <p style={{ color: "#a1a1aa" }}>Playable local foundation using the server action endpoint.</p>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          {[
            ["Alias", state.alias],
            ["Cash", state.cash],
            ["Bank", state.bank],
            ["Energy", state.energy],
            ["Health", state.health],
            ["Respect", state.respect],
            ["Heat", state.heat],
            ["City", cityName],
            ["Job", jobName],
            ["Wins", state.wins],
            ["Losses", state.losses],
            ["Day", state.day],
          ].map(([label, value]) => (
            <div key={String(label)} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 16, background: "rgba(255,255,255,0.03)" }}>
              <div style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#71717a" }}>{label}</div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>{String(value)}</div>
            </div>
          ))}
        </section>

        {error ? <div style={{ color: "#f87171" }}>{error}</div> : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          <ActionPanel title="Core" actions={[
            ["Recover", () => run({ type: "recover" })],
            ["Work", () => run({ type: "work" })],
            ["Train Strength", () => run({ type: "train", stat: "strength" })],
            ["Reset Demo", resetDemo],
          ]} disabled={loading} />

          <ActionPanel title="Travel" actions={cities.map((city) => [city.name, () => run({ type: "travel", cityId: city.id })])} disabled={loading} />
          <ActionPanel title="Jobs" actions={jobs.map((job) => [job.name, () => run({ type: "takeJob", jobId: job.id })])} disabled={loading} />
          <ActionPanel title="Crimes" actions={crimes.map((crime) => [crime.name, () => run({ type: "crime", crimeId: crime.id })])} disabled={loading} />
          <ActionPanel title="Rivals" actions={rivals.map((rival) => [rival.name, () => run({ type: "fightRival", rivalId: rival.id })])} disabled={loading} />
          <ActionPanel title="Items" actions={items.map((item) => [item.name, () => run({ type: "buyItem", itemId: item.id })])} disabled={loading} />
        </section>

        <section style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 20, background: "rgba(255,255,255,0.04)" }}>
          <h2 style={{ marginTop: 0 }}>Recent Log</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {state.log.map((entry, index) => (
              <div key={index} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 12, color: "#d4d4d8", background: "rgba(255,255,255,0.03)" }}>
                {entry}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ActionPanel({ title, actions, disabled }: { title: string; actions: Array<[string, () => void]>; disabled: boolean }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 20, background: "rgba(255,255,255,0.04)" }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {actions.map(([label, onClick]) => (
          <button key={label} onClick={onClick} disabled={disabled} style={{ minHeight: 44, borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: disabled ? "rgba(255,255,255,0.04)" : "white", color: disabled ? "#a1a1aa" : "black", fontWeight: 700, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
