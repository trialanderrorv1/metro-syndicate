import React, { useEffect, useMemo, useState } from "react";
import { apiCall } from "./secureApi";

type Bootstrap = {
  player: { id: string; handle: string; crewId: string | null; state: any };
  crew: null | { id: string; name: string; tag: string | null; cash: number; roster: Array<{ id: string; handle: string }>; messages: Array<{ id: string; handle: string; body: string; createdAt: string }> };
  invites: Array<{ id: string; crewId: string; crewName: string; crewTag: string | null }>;
  market: Array<any>;
  contracts: Array<any>;
  territories: Array<any>;
  notifications: Array<any>;
};

type TabKey = "overview" | "crimes" | "gym" | "crew" | "market" | "territories" | "inbox" | "log";

const TABS: Array<[TabKey, string]> = [
  ["overview", "Home"],
  ["crimes", "Crimes"],
  ["gym", "Gym"],
  ["crew", "Crews"],
  ["market", "Market"],
  ["territories", "Territories"],
  ["inbox", "Inbox"],
  ["log", "Log"],
];

export default function App() {
  const [handle, setHandle] = useState("Cipher");
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("overview");
  const [crewName, setCrewName] = useState("Neon Syndicate");
  const [crewTag, setCrewTag] = useState("NS");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [chatBody, setChatBody] = useState("");
  const [listingItem, setListingItem] = useState("consumable-1");
  const [listingQty, setListingQty] = useState("1");
  const [listingPrice, setListingPrice] = useState("150");

  const load = async () => {
    setError("");
    try {
      const result = await apiCall("/api/demo/register", { method: "POST", body: JSON.stringify({ handle }) });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const refresh = async () => {
    try {
      const result = await apiCall(`/api/demo/${handle}/bootstrap`);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [handle]);

  const runAction = async (action: any) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/actions`, { method: "POST", body: JSON.stringify({ action }) });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const createCrew = async () => {
    try {
      const result = await apiCall(`/api/demo/${handle}/crews`, { method: "POST", body: JSON.stringify({ name: crewName, tag: crewTag }) });
      setData(result);
      setTab("crew");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const searchPeople = async () => {
    try {
      const rows = await apiCall(`/api/demo/${handle}/players/search?q=${encodeURIComponent(search)}`);
      setResults(rows);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const invite = async (targetHandle: string) => {
    if (!data?.crew) return;
    try {
      const result = await apiCall(`/api/demo/${handle}/crews/${data.crew.id}/invites`, { method: "POST", body: JSON.stringify({ targetHandle }) });
      setData(result.bootstrap);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const respondInvite = async (inviteId: string, accept: boolean) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/invites/${inviteId}/respond`, { method: "POST", body: JSON.stringify({ accept }) });
      setData(result.bootstrap);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const postMessage = async () => {
    if (!data?.crew) return;
    try {
      const result = await apiCall(`/api/demo/${handle}/crews/${data.crew.id}/chat`, { method: "POST", body: JSON.stringify({ body: chatBody }) });
      setData(result);
      setChatBody("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const createListing = async () => {
    try {
      const result = await apiCall(`/api/demo/${handle}/market/listings`, { method: "POST", body: JSON.stringify({ itemId: listingItem, quantity: Number(listingQty), unitPrice: Number(listingPrice) }) });
      setData(result);
      setTab("market");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const buyListing = async (listingId: string) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/market/listings/${listingId}/buy`, { method: "POST" });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const cancelListing = async (listingId: string) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/market/listings/${listingId}/cancel`, { method: "POST" });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const claimContract = async (contractId: string) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/contracts/${contractId}/claim`, { method: "POST" });
      setData(result);
      setTab("market");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const attackTerritory = async (territoryId: string) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/territories/${territoryId}/attack`, { method: "POST" });
      setData({ ...(result.bootstrap as Bootstrap), territories: result.territories, notifications: result.notifications, market: data?.market || [], contracts: data?.contracts || [] });
      setTab("territories");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const markRead = async (notificationId: string) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/notifications/${notificationId}/read`, { method: "POST" });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const energyMeta = useMemo(() => {
    if (!data) return { nextTickText: "--", pct: 0 };
    const state = data.player.state;
    const last = new Date(state.energyUpdatedAt || Date.now()).getTime();
    const now = Date.now();
    const remainingMs = state.energy >= 100 ? 0 : Math.max(0, 10 * 60 * 1000 - ((now - last) % (10 * 60 * 1000)));
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    return {
      nextTickText: state.energy >= 100 ? "Full" : `+5 in ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      pct: state.energy,
    };
  }, [data]);

  const braveryPct = useMemo(() => {
    if (!data) return 0;
    return Math.max(0, Math.min(100, (Number(data.player.state.bravery || 0) / 20) * 100));
  }, [data]);

  if (!data) {
    return <div style={{ minHeight: "100vh", background: "#05070b", color: "white", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>Loading city grid…</div>;
  }

  const state = data.player.state;

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        <aside style={leftRailStyle}>
          <div style={brandCardStyle}>
            <div style={{ fontSize: 11, letterSpacing: "0.24em", color: "#7dd3fc", textTransform: "uppercase" }}>Metro Syndicate</div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>Underworld Ops</div>
            <div style={{ marginTop: 6, color: "#94a3b8", fontSize: 13 }}>Torn-style command layout with a sharper 2026 finish.</div>
          </div>

          <div style={sidebarPanelStyle}>
            <div style={sectionLabelStyle}>Navigation</div>
            <div style={{ display: "grid", gap: 8 }}>
              {TABS.map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} style={tab === key ? navActiveStyle : navButtonStyle}>{label}</button>
              ))}
            </div>
          </div>

          <div style={sidebarPanelStyle}>
            <div style={sectionLabelStyle}>Identity</div>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="handle" style={inputStyle} />
            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              <button onClick={load} style={buttonPrimary}>Load handle</button>
              <button onClick={refresh} style={buttonGhost}>Refresh</button>
            </div>
          </div>
        </aside>

        <main style={mainStyle}>
          <header style={heroStyle}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.2em", color: "#7dd3fc", textTransform: "uppercase" }}>City status</div>
              <h1 style={{ margin: "10px 0 6px", fontSize: 34 }}>Welcome back, {data.player.handle}</h1>
              <div style={{ color: "#94a3b8" }}>Crews, territories, contracts, inbox, and player actions from one command desk.</div>
            </div>
            <div style={heroStatsWrapStyle}>
              <MiniStat label="Cash" value={state.cash} />
              <MiniStat label="Bank" value={state.bank} />
              <MiniStat label="Respect" value={state.respect} />
              <MiniStat label="Bravery" value={`${state.bravery}/20`} />
            </div>
          </header>

          {error ? <div style={{ color: "#f87171", padding: "0 4px" }}>{error}</div> : null}

          {tab === "overview" ? (
            <div style={contentGridStyle}>
              <Panel title="Character">
                <StatRow label="Health" value={state.health} />
                <StatRow label="Strength" value={state.strength} />
                <StatRow label="Speed" value={state.speed} />
                <StatRow label="Defense" value={state.defense} />
                <StatRow label="Wins" value={state.wins} />
                <StatRow label="Losses" value={state.losses} />
              </Panel>
              <Panel title="Quick actions">
                <ActionButton onClick={() => runAction({ type: "work" })} label="Work shift" />
                <ActionButton onClick={() => runAction({ type: "crime", crimeId: "pick" })} label="Lift wallet" ghost />
                <ActionButton onClick={() => runAction({ type: "fightRival", rivalId: "dockhand" })} label="Fight dockhand" ghost />
                <ActionButton onClick={() => runAction({ type: "recover" })} label="Recover" ghost />
              </Panel>
              <Panel title="Notifications">
                {data.notifications.slice(0, 6).map((notification) => (
                  <div key={notification.id} style={listRowStyle}>
                    <div style={{ fontWeight: 700 }}>{notification.title}</div>
                    <div style={{ color: "#94a3b8", fontSize: 13 }}>{notification.body}</div>
                  </div>
                ))}
              </Panel>
            </div>
          ) : null}

          {tab === "crimes" ? (
            <div style={contentGridStyle}>
              <Panel title="Street work">
                <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>Crimes now consume bravery instead of energy.</div>
                <ActionButton onClick={() => runAction({ type: "crime", crimeId: "pick" })} label="Lift wallet • 4 bravery" />
                <ActionButton onClick={() => runAction({ type: "crime", crimeId: "boost" })} label="Boost car • 8 bravery" ghost />
                <ActionButton onClick={() => runAction({ type: "fightRival", rivalId: "dockhand" })} label="Fight dockhand" ghost />
              </Panel>
              <Panel title="Travel and setup">
                <ActionButton onClick={() => runAction({ type: "travel", cityId: "iron" })} label="Travel to Ironport" />
                <ActionButton onClick={() => runAction({ type: "buyItem", itemId: "utility-1" })} label="Buy Signal Rig" ghost />
                <ActionButton onClick={() => runAction({ type: "buyItem", itemId: "consumable-1" })} label="Buy Stim Drink" ghost />
              </Panel>
            </div>
          ) : null}

          {tab === "gym" ? (
            <div style={contentGridStyle}>
              <Panel title="Training floor">
                <ActionButton onClick={() => runAction({ type: "train", stat: "strength" })} label="Train strength" />
                <ActionButton onClick={() => runAction({ type: "train", stat: "speed" })} label="Train speed" ghost />
                <ActionButton onClick={() => runAction({ type: "train", stat: "defense" })} label="Train defense" ghost />
              </Panel>
              <Panel title="Recovery">
                <div style={{ color: "#94a3b8", marginBottom: 10 }}>Energy regenerates by 5 every 10 minutes. Recover resets health, energy, and bravery.</div>
                <ActionButton onClick={() => runAction({ type: "recover" })} label="Manual recover" />
              </Panel>
            </div>
          ) : null}

          {tab === "crew" ? (
            <div style={contentGridStyle}>
              <Panel title="Crew HQ">
                {!data.crew ? (
                  <>
                    <input value={crewName} onChange={(e) => setCrewName(e.target.value)} placeholder="crew name" style={inputStyle} />
                    <input value={crewTag} onChange={(e) => setCrewTag(e.target.value)} placeholder="tag" style={inputStyle} />
                    <button onClick={createCrew} style={buttonPrimary}>Found crew</button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{data.crew.name} {data.crew.tag ? `[${data.crew.tag}]` : ""}</div>
                    <div style={{ color: "#94a3b8" }}>Crew cash: {data.crew.cash}</div>
                    <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                      {data.crew.roster.map((member) => <div key={member.id} style={listRowStyle}>{member.handle}</div>)}
                    </div>
                  </>
                )}
              </Panel>
              <Panel title="Invite players">
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search handle" style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={searchPeople} style={buttonGhost}>Search</button>
                </div>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {results.map((row) => (
                    <div key={row.id} style={listRowStyle}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{row.handle}</div>
                        <div style={{ color: "#94a3b8", fontSize: 12 }}>{row.crewId ? "Already in crew" : "Available"}</div>
                      </div>
                      <button onClick={() => invite(row.handle)} style={buttonPrimary} disabled={!data.crew || !!row.crewId}>Invite</button>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Crew chat">
                {!data.crew ? <div style={{ color: "#94a3b8" }}>Join or found a crew to use chat.</div> : (
                  <>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={chatBody} onChange={(e) => setChatBody(e.target.value)} placeholder="message" style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={postMessage} style={buttonPrimary}>Send</button>
                    </div>
                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                      {data.crew.messages.map((msg) => (
                        <div key={msg.id} style={listRowStyle}>
                          <div style={{ fontWeight: 700 }}>{msg.handle}</div>
                          <div style={{ color: "#cbd5e1", fontSize: 13 }}>{msg.body}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Panel>
            </div>
          ) : null}

          {tab === "market" ? (
            <div style={contentGridStyle}>
              <Panel title="Create listing">
                <input value={listingItem} onChange={(e) => setListingItem(e.target.value)} style={inputStyle} />
                <input value={listingQty} onChange={(e) => setListingQty(e.target.value)} style={inputStyle} />
                <input value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} style={inputStyle} />
                <button onClick={createListing} style={buttonPrimary}>List item</button>
              </Panel>
              <Panel title="Market board">
                {data.market.map((listing) => (
                  <div key={listing.id} style={listRowStyle}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{listing.itemId}</div>
                      <div style={{ color: "#94a3b8", fontSize: 12 }}>{listing.quantity} units • {listing.unitPrice} each</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => buyListing(listing.id)} style={buttonPrimary}>Buy</button>
                      {listing.playerId === data.player.id ? <button onClick={() => cancelListing(listing.id)} style={buttonGhost}>Cancel</button> : null}
                    </div>
                  </div>
                ))}
              </Panel>
              <Panel title="Contracts">
                {data.contracts.map((contract) => (
                  <div key={contract.id} style={listRowStyle}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{contract.title}</div>
                      <div style={{ color: "#cbd5e1", fontSize: 13 }}>{contract.body}</div>
                    </div>
                    <button onClick={() => claimContract(contract.id)} style={buttonPrimary}>Claim</button>
                  </div>
                ))}
              </Panel>
            </div>
          ) : null}

          {tab === "territories" ? (
            <Panel title="Territory desk">
              {data.territories.map((territory) => (
                <div key={territory.id} style={listRowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{territory.name}</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>{territory.cityId} • income {territory.baseIncome}</div>
                    <div style={{ color: "#cbd5e1", fontSize: 13 }}>{territory.control ? `${territory.control.crewName} holding (defense ${territory.control.defense})` : "Unclaimed"}</div>
                  </div>
                  <button onClick={() => attackTerritory(territory.id)} style={buttonPrimary}>Attack</button>
                </div>
              ))}
            </Panel>
          ) : null}

          {tab === "inbox" ? (
            <Panel title="Inbox">
              {data.invites.length > 0 ? data.invites.map((invite) => (
                <div key={invite.id} style={listRowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{invite.crewName}</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>{invite.crewTag || "No tag"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => respondInvite(invite.id, true)} style={buttonPrimary}>Accept</button>
                    <button onClick={() => respondInvite(invite.id, false)} style={buttonGhost}>Decline</button>
                  </div>
                </div>
              )) : null}
              {data.notifications.map((notification) => (
                <div key={notification.id} style={listRowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{notification.title}</div>
                    <div style={{ color: "#cbd5e1", fontSize: 13 }}>{notification.body}</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>{notification.kind}{notification.readAt ? " • read" : " • unread"}</div>
                  </div>
                  {!notification.readAt ? <button onClick={() => markRead(notification.id)} style={buttonGhost}>Mark read</button> : null}
                </div>
              ))}
            </Panel>
          ) : null}

          {tab === "log" ? (
            <Panel title="Activity log">
              {state.log.map((entry: string, index: number) => <div key={index} style={listRowStyle}>{entry}</div>)}
            </Panel>
          ) : null}
        </main>

        <aside style={rightRailStyle}>
          <div style={rightCardStyle}>
            <div style={sectionLabelStyle}>Status</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{state.energy}/100</div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 10 }}>Energy</div>
            <div style={meterTrackStyle}><div style={{ ...meterFillStyle, width: `${energyMeta.pct}%` }} /></div>
            <div style={{ marginTop: 8, color: "#7dd3fc", fontSize: 13 }}>{energyMeta.nextTickText}</div>
          </div>

          <div style={rightCardStyle}>
            <div style={sectionLabelStyle}>Bravery</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{state.bravery}/20</div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 10 }}>Crime resource</div>
            <div style={meterTrackStyle}><div style={{ ...meterFillStyle, width: `${braveryPct}%` }} /></div>
            <div style={{ marginTop: 8, color: "#7dd3fc", fontSize: 13 }}>Crimes deduct from bravery.</div>
          </div>

          <div style={rightCardStyle}>
            <div style={sectionLabelStyle}>Profile</div>
            <StatRow label="City" value={state.city} compact />
            <StatRow label="Job" value={state.job} compact />
            <StatRow label="Crew" value={data.crew?.name || "None"} compact />
            <StatRow label="Health" value={state.health} compact />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={panelStyle}><div style={{ fontSize: 12, letterSpacing: "0.18em", color: "#7dd3fc", textTransform: "uppercase", marginBottom: 14 }}>{title}</div><div style={{ display: "grid", gap: 10 }}>{children}</div></section>;
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div style={miniStatStyle}><div style={{ color: "#94a3b8", fontSize: 12 }}>{label}</div><div style={{ fontWeight: 800, fontSize: 20 }}>{value}</div></div>;
}

function StatRow({ label, value, compact = false }: { label: string; value: string | number; compact?: boolean }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: compact ? "6px 0" : "10px 0", borderBottom: compact ? "1px solid rgba(148,163,184,0.12)" : "1px solid rgba(148,163,184,0.1)" }}><span style={{ color: "#94a3b8" }}>{label}</span><span style={{ fontWeight: 700 }}>{value}</span></div>;
}

function ActionButton({ onClick, label, ghost = false }: { onClick: () => void; label: string; ghost?: boolean }) {
  return <button onClick={onClick} style={ghost ? buttonGhost : buttonPrimary}>{label}</button>;
}

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(180deg,#05070b 0%,#09111d 100%)", color: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif", padding: 18 };
const shellStyle: React.CSSProperties = { maxWidth: 1680, margin: "0 auto", display: "grid", gridTemplateColumns: "260px minmax(0,1fr) 300px", gap: 18, alignItems: "start" };
const leftRailStyle: React.CSSProperties = { display: "grid", gap: 14, position: "sticky", top: 18 };
const rightRailStyle: React.CSSProperties = { display: "grid", gap: 14, position: "sticky", top: 18 };
const mainStyle: React.CSSProperties = { display: "grid", gap: 16, minWidth: 0 };
const brandCardStyle: React.CSSProperties = { borderRadius: 24, padding: 18, background: "linear-gradient(180deg,rgba(14,165,233,0.14),rgba(15,23,42,0.92))", border: "1px solid rgba(125,211,252,0.22)", boxShadow: "0 16px 48px rgba(0,0,0,0.35)" };
const sidebarPanelStyle: React.CSSProperties = { borderRadius: 22, padding: 16, background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.12)" };
const rightCardStyle: React.CSSProperties = { borderRadius: 22, padding: 16, background: "rgba(15,23,42,0.9)", border: "1px solid rgba(148,163,184,0.12)" };
const heroStyle: React.CSSProperties = { borderRadius: 24, padding: 20, background: "linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))", border: "1px solid rgba(148,163,184,0.12)", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" };
const heroStatsWrapStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2,minmax(110px,1fr))", gap: 10 };
const miniStatStyle: React.CSSProperties = { borderRadius: 18, padding: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,184,0.12)", minWidth: 110 };
const panelStyle: React.CSSProperties = { borderRadius: 24, padding: 18, background: "rgba(15,23,42,0.88)", border: "1px solid rgba(148,163,184,0.12)", boxShadow: "0 12px 36px rgba(0,0,0,0.22)" };
const contentGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 };
const sectionLabelStyle: React.CSSProperties = { fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#7dd3fc", marginBottom: 10 };
const listRowStyle: React.CSSProperties = { borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" };
const inputStyle: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(255,255,255,0.04)", color: "white", padding: "0 12px", width: "100%", boxSizing: "border-box" };
const buttonPrimary: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(125,211,252,0.2)", background: "linear-gradient(180deg,#e2e8f0,#cbd5e1)", color: "#020617", fontWeight: 800, padding: "0 14px", cursor: "pointer", whiteSpace: "nowrap" };
const buttonGhost: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(255,255,255,0.03)", color: "white", fontWeight: 700, padding: "0 14px", cursor: "pointer", whiteSpace: "nowrap" };
const navButtonStyle: React.CSSProperties = { ...buttonGhost, width: "100%", justifyContent: "flex-start", textAlign: "left" };
const navActiveStyle: React.CSSProperties = { ...buttonPrimary, width: "100%", justifyContent: "flex-start", textAlign: "left" };
const meterTrackStyle: React.CSSProperties = { height: 10, width: "100%", borderRadius: 999, background: "rgba(148,163,184,0.18)", overflow: "hidden" };
const meterFillStyle: React.CSSProperties = { height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#38bdf8,#22d3ee)" };
