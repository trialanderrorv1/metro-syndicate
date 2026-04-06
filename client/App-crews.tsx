import React, { useEffect, useMemo, useState } from "react";
import { apiCall } from "./secureApi";

type Bootstrap = {
  player: { id: string; handle: string; crewId: string | null; state: any };
  crew: null | { id: string; name: string; tag: string | null; cash: number; roster: Array<{ id: string; handle: string }>; messages: Array<{ id: string; handle: string; body: string; createdAt: string }> };
  invites: Array<{ id: string; crewId: string; crewName: string; crewTag: string | null }>;
};

export default function AppCrews() {
  const [handle, setHandle] = useState("Cipher");
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");
  const [crewName, setCrewName] = useState("Neon Syndicate");
  const [crewTag, setCrewTag] = useState("NS");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [chatBody, setChatBody] = useState("");

  const state = bootstrap?.player.state;
  const crew = bootstrap?.crew;

  const registerOrLoad = async () => {
    setError("");
    try {
      const data = await apiCall(`/api/demo/register`, { method: "POST", body: JSON.stringify({ handle }) });
      setBootstrap(data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    registerOrLoad().catch(() => undefined);
  }, []);

  const run = async (action: any) => {
    try {
      const data = await apiCall(`/api/demo/${handle}/actions`, { method: "POST", body: JSON.stringify({ action }) });
      setBootstrap(data.bootstrap);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const createCrew = async () => {
    try {
      const data = await apiCall(`/api/demo/${handle}/crews`, { method: "POST", body: JSON.stringify({ name: crewName, tag: crewTag }) });
      setBootstrap(data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const doSearch = async () => {
    try {
      const rows = await apiCall(`/api/demo/${handle}/players/search?q=${encodeURIComponent(search)}`);
      setSearchResults(rows);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const invite = async (targetHandle: string) => {
    if (!crew) return;
    try {
      await apiCall(`/api/demo/${handle}/crews/${crew.id}/invites`, { method: "POST", body: JSON.stringify({ targetHandle }) });
      await registerOrLoad();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const respondInvite = async (inviteId: string, accept: boolean) => {
    try {
      const data = await apiCall(`/api/demo/${handle}/invites/${inviteId}/respond`, { method: "POST", body: JSON.stringify({ accept }) });
      setBootstrap(data.bootstrap);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const postMessage = async () => {
    if (!crew) return;
    try {
      const data = await apiCall(`/api/demo/${handle}/crews/${crew.id}/chat`, { method: "POST", body: JSON.stringify({ body: chatBody }) });
      setBootstrap(data);
      setChatBody("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const cityLabel = useMemo(() => state?.city || "-", [state]);

  if (!bootstrap || !state) {
    return <div style={{ minHeight: "100vh", background: "#09090b", color: "white", padding: 24 }}>Loading crews foundation…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "white", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 1380, margin: "0 auto", display: "grid", gap: 16 }}>
        <header style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 24, background: "rgba(255,255,255,0.04)" }}>
          <h1 style={{ margin: 0, fontSize: 36 }}>Metro Syndicate Crews + Persistence Foundation</h1>
          <p style={{ color: "#a1a1aa" }}>Persistent demo players, crew creation, invites, and crew chat.</p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="handle" style={inputStyle} />
            <button onClick={registerOrLoad} style={buttonPrimary}>Load handle</button>
          </div>
        </header>

        {error ? <div style={{ color: "#f87171" }}>{error}</div> : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          {[
            ["Handle", bootstrap.player.handle],
            ["Cash", state.cash],
            ["Respect", state.respect],
            ["Energy", state.energy],
            ["Health", state.health],
            ["City", cityLabel],
            ["Crew", crew?.name || "None"],
          ].map(([label, value]) => (
            <div key={String(label)} style={cardStyle}>
              <div style={labelStyle}>{label}</div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>{String(value)}</div>
            </div>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          <Panel title="Actions">
            <button onClick={() => run({ type: "work" })} style={buttonPrimary}>Work</button>
            <button onClick={() => run({ type: "crime", crimeId: "pick" })} style={buttonGhost}>Crime</button>
            <button onClick={() => run({ type: "fightRival", rivalId: "dockhand" })} style={buttonGhost}>Fight Rival</button>
            <button onClick={() => run({ type: "travel", cityId: "iron" })} style={buttonGhost}>Travel to Ironport</button>
          </Panel>

          <Panel title="Create crew">
            <input value={crewName} onChange={(e) => setCrewName(e.target.value)} placeholder="crew name" style={inputStyle} />
            <input value={crewTag} onChange={(e) => setCrewTag(e.target.value)} placeholder="tag" style={inputStyle} />
            <button onClick={createCrew} style={buttonPrimary}>Found crew</button>
          </Panel>

          <Panel title="Find players">
            <div style={{ display: "flex", gap: 8 }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search handle" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={doSearch} style={buttonGhost}>Search</button>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {searchResults.map((row) => (
                <div key={row.id} style={innerRow}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{row.handle}</div>
                    <div style={{ color: "#a1a1aa", fontSize: 12 }}>{row.crewId ? "Already in crew" : "Available"}</div>
                  </div>
                  <button onClick={() => invite(row.handle)} style={buttonGhost} disabled={!crew || !!row.crewId}>Invite</button>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
          <Panel title="Invites">
            <div style={{ display: "grid", gap: 8 }}>
              {bootstrap.invites.length === 0 ? <div style={{ color: "#a1a1aa" }}>No pending invites.</div> : null}
              {bootstrap.invites.map((invite) => (
                <div key={invite.id} style={innerRow}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{invite.crewName}</div>
                    <div style={{ color: "#a1a1aa", fontSize: 12 }}>{invite.crewTag || "No tag"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => respondInvite(invite.id, true)} style={buttonPrimary}>Accept</button>
                    <button onClick={() => respondInvite(invite.id, false)} style={buttonGhost}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Crew">
            {!crew ? <div style={{ color: "#a1a1aa" }}>No crew yet.</div> : (
              <>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{crew.name} {crew.tag ? `[${crew.tag}]` : ""}</div>
                <div style={{ color: "#a1a1aa" }}>Crew cash: {crew.cash}</div>
                <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                  {crew.roster.map((member) => <div key={member.id} style={innerRow}>{member.handle}</div>)}
                </div>
              </>
            )}
          </Panel>

          <Panel title="Crew chat">
            {!crew ? <div style={{ color: "#a1a1aa" }}>Join a crew to chat.</div> : (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={chatBody} onChange={(e) => setChatBody(e.target.value)} placeholder="message" style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={postMessage} style={buttonPrimary}>Send</button>
                </div>
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {crew.messages.map((msg) => (
                    <div key={msg.id} style={innerRow}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{msg.handle}</div>
                        <div style={{ color: "#d4d4d8" }}>{msg.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 20, background: "rgba(255,255,255,0.04)", display: "grid", gap: 10 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </div>
  );
}

const cardStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 16, background: "rgba(255,255,255,0.03)" };
const labelStyle: React.CSSProperties = { fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#71717a" };
const inputStyle: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "white", padding: "0 12px" };
const buttonPrimary: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "white", color: "black", fontWeight: 700, padding: "0 14px", cursor: "pointer" };
const buttonGhost: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "white", fontWeight: 700, padding: "0 14px", cursor: "pointer" };
const innerRow: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
