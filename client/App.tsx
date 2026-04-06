import React, { useEffect, useState } from "react";
import { apiCall } from "./secureApi";

type Bootstrap = {
  player: { id: string; handle: string; crewId: string | null; state: any };
  crew: any;
  invites: any[];
  market: any[];
  contracts: any[];
  territories: any[];
  notifications: any[];
};

export default function AppLive() {
  const [handle, setHandle] = useState("Cipher");
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const result = await apiCall(`/api/demo/register`, { method: "POST", body: JSON.stringify({ handle }) });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const refresh = async () => {
    const result = await apiCall(`/api/demo/${handle}/bootstrap`);
    setData(result);
  };

  const markRead = async (notificationId: string) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/notifications/${notificationId}/read`, { method: "POST" });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const attackTerritory = async (territoryId: string) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/territories/${territoryId}/attack`, { method: "POST" });
      setData({ ...(result.bootstrap as Bootstrap), territories: result.territories, notifications: result.notifications, market: data?.market || [], contracts: data?.contracts || [] });
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!data) {
    return <div style={{ minHeight: "100vh", background: "#09090b", color: "white", padding: 24 }}>Loading live foundation…</div>;
  }

  const state = data.player.state;

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "white", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gap: 16 }}>
        <header style={panelStyle}>
          <h1 style={{ margin: 0, fontSize: 36 }}>Metro Syndicate Live Foundation</h1>
          <p style={{ color: "#a1a1aa" }}>Durable territory hooks, inbox, and consolidated current-layer client.</p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="handle" style={inputStyle} />
            <button onClick={load} style={buttonPrimary}>Load handle</button>
            <button onClick={refresh} style={buttonGhost}>Refresh</button>
          </div>
        </header>

        {error ? <div style={{ color: "#f87171" }}>{error}</div> : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          {[["Handle", data.player.handle],["Cash", state.cash],["Bank", state.bank],["Respect", state.respect],["Energy", state.energy],["Health", state.health],["Crew", data.crew?.name || "None"]].map(([label, value]) => (
            <div key={String(label)} style={cardStyle}>
              <div style={labelStyle}>{label}</div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>{String(value)}</div>
            </div>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(320px,1fr)", gap: 16 }}>
          <div style={{ display: "grid", gap: 16 }}>
            <Panel title="Territories">
              {data.territories.map((territory) => (
                <div key={territory.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{territory.name}</div>
                    <div style={{ color: "#a1a1aa", fontSize: 12 }}>{territory.cityId} • income {territory.baseIncome}</div>
                    <div style={{ color: "#d4d4d8" }}>{territory.control ? `${territory.control.crewName} holding (defense ${territory.control.defense})` : "Unclaimed"}</div>
                  </div>
                  <button onClick={() => attackTerritory(territory.id)} style={buttonPrimary}>Attack</button>
                </div>
              ))}
            </Panel>

            <Panel title="Current log">
              {state.log.map((entry: string, index: number) => <div key={index} style={rowStyle}>{entry}</div>)}
            </Panel>
          </div>

          <Panel title="Inbox / notifications">
            {data.notifications.length === 0 ? <div style={{ color: "#a1a1aa" }}>No notifications yet.</div> : null}
            {data.notifications.map((notification) => (
              <div key={notification.id} style={rowStyle}>
                <div>
                  <div style={{ fontWeight: 700 }}>{notification.title}</div>
                  <div style={{ color: "#d4d4d8" }}>{notification.body}</div>
                  <div style={{ color: "#a1a1aa", fontSize: 12 }}>{notification.kind}{notification.readAt ? " • read" : " • unread"}</div>
                </div>
                {!notification.readAt ? <button onClick={() => markRead(notification.id)} style={buttonGhost}>Mark read</button> : null}
              </div>
            ))}
          </Panel>
        </section>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={panelStyle}><h2 style={{ marginTop: 0 }}>{title}</h2><div style={{ display: "grid", gap: 8 }}>{children}</div></div>;
}

const panelStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 20, background: "rgba(255,255,255,0.04)" };
const cardStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 16, background: "rgba(255,255,255,0.03)" };
const labelStyle: React.CSSProperties = { fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#71717a" };
const rowStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const inputStyle: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "white", padding: "0 12px" };
const buttonPrimary: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "white", color: "black", fontWeight: 700, padding: "0 14px", cursor: "pointer" };
const buttonGhost: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "white", fontWeight: 700, padding: "0 14px", cursor: "pointer" };
