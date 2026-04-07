import React, { useEffect, useMemo, useState } from "react";
import { apiCall } from "./secureApi";

type Bootstrap = {
  player: { id: string; handle: string; crewId: string | null; state: any };
  crew: null | {
    id: string;
    name: string;
    tag: string | null;
    cash: number;
    roster: Array<{ id: string; handle: string }>;
    messages: Array<{ id: string; handle: string; body: string; createdAt: string }>;
  };
  invites: Array<{ id: string; crewId: string; crewName: string; crewTag: string | null }>;
  market: Array<any>;
  contracts: Array<any>;
  territories: Array<any>;
  notifications: Array<any>;
};

type TabKey = "overview" | "crimes" | "jobs" | "market" | "crew" | "territories" | "inbox" | "log";

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "overview", label: "Home", icon: "⌂" },
  { key: "jobs", label: "Jobs", icon: "▣" },
  { key: "crimes", label: "Crimes", icon: "◈" },
  { key: "market", label: "Market", icon: "◫" },
  { key: "crew", label: "Crews", icon: "☰" },
  { key: "territories", label: "Territory", icon: "⌘" },
  { key: "inbox", label: "Inbox", icon: "✉" },
  { key: "log", label: "Log", icon: "⋯" },
];

const ENERGY_TICK_MS = 10 * 60 * 1000;
const BRAVERY_TICK_MS = 5 * 60 * 1000;

function getRemainingUntilBoundary(nowMs: number, intervalMs: number) {
  const elapsedInBucket = nowMs % intervalMs;
  return elapsedInBucket === 0 ? 0 : intervalMs - elapsedInBucket;
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export default function App() {
  const [handle, setHandle] = useState("Dean");
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("crimes");
  const [clockMs, setClockMs] = useState(Date.now());
  const [crewName, setCrewName] = useState("Neon Syndicate");
  const [crewTag, setCrewTag] = useState("NS");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [chatBody, setChatBody] = useState("");

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
    const refreshTimer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 60_000);
    const clockTimer = window.setInterval(() => setClockMs(Date.now()), 1000);
    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, [handle]);

  useEffect(() => {
    let timeoutId: number | undefined;

    const scheduleBoundaryRefresh = () => {
      const now = Date.now();
      const delay = getRemainingUntilBoundary(now, BRAVERY_TICK_MS) || BRAVERY_TICK_MS;
      timeoutId = window.setTimeout(async () => {
        await refresh().catch(() => undefined);
        scheduleBoundaryRefresh();
      }, delay + 150);
    };

    scheduleBoundaryRefresh();
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
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
      const result = await apiCall(`/api/demo/${handle}/crews/${data.crew.id}/invites`, {
        method: "POST",
        body: JSON.stringify({ targetHandle }),
      });
      setData(result.bootstrap);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const respondInvite = async (inviteId: string, accept: boolean) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/invites/${inviteId}/respond`, {
        method: "POST",
        body: JSON.stringify({ accept }),
      });
      setData(result.bootstrap);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const postMessage = async () => {
    if (!data?.crew) return;
    try {
      const result = await apiCall(`/api/demo/${handle}/crews/${data.crew.id}/chat`, {
        method: "POST",
        body: JSON.stringify({ body: chatBody }),
      });
      setData(result);
      setChatBody("");
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
    } catch (e: any) {
      setError(e.message);
    }
  };

  const attackTerritory = async (territoryId: string) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/territories/${territoryId}/attack`, { method: "POST" });
      setData({
        ...(result.bootstrap as Bootstrap),
        territories: result.territories,
        notifications: result.notifications,
        market: data?.market || [],
        contracts: data?.contracts || [],
      });
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
    if (!data) return { pct: 0, text: "--" };
    const state = data.player.state;
    const remainingMs = state.energy >= 100 ? 0 : getRemainingUntilBoundary(clockMs, ENERGY_TICK_MS);
    return {
      pct: Math.max(0, Math.min(100, Number(state.energy || 0))),
      text: state.energy >= 100 ? "Full" : `Next +5 in: ${formatRemaining(remainingMs)}`,
    };
  }, [data, clockMs]);

  const braveryMeta = useMemo(() => {
    if (!data) return { pct: 0, text: "--" };
    const state = data.player.state;
    const remainingMs = state.bravery >= 20 ? 0 : getRemainingUntilBoundary(clockMs, BRAVERY_TICK_MS);
    return {
      pct: Math.max(0, Math.min(100, (Number(state.bravery || 0) / 20) * 100)),
      text: state.bravery >= 20 ? "Full" : `Next +1 in: ${formatRemaining(remainingMs)}`,
    };
  }, [data, clockMs]);

  if (!data) {
    return <div style={loadingStyle}>Loading crime grid…</div>;
  }

  const state = data.player.state;
  const activeCrimeCards = [
    { id: "pick", title: "Pickpocket", desc: "Snatch a wallet from an unsuspecting mark.", cost: "4 bravery" },
    { id: "boost", title: "Boost Car", desc: "Jack a parked vehicle and move it before the heat spikes.", cost: "8 bravery" },
  ];

  return (
    <div style={pageStyle}>
      <div style={frameStyle}>
        <aside style={leftRailStyle}>
          {TABS.map((item) => (
            <button key={item.key} onClick={() => setTab(item.key)} style={item.key === tab ? navActiveStyle : navButtonStyle}>
              <span style={navIconStyle}>{item.icon}</span>
              <span>{item.label}</span>
              {item.key === "inbox" && data.notifications.some((n) => !n.readAt) ? <span style={badgeStyle}>{data.notifications.filter((n) => !n.readAt).length}</span> : null}
            </button>
          ))}
          <div style={streetFooterStyle}>Metro Syndicate • city feed online</div>
        </aside>

        <main style={centerStyle}>
          <div style={titleBarStyle}>{titleForTab(tab)}</div>
          {error ? <div style={errorStyle}>{error}</div> : null}

          {tab === "crimes" ? (
            <SectionCard title="Petty Crimes">
              {activeCrimeCards.map((crime) => (
                <div key={crime.id} style={crimeRowStyle}>
                  <div>
                    <div style={crimeTitleStyle}>{crime.title}</div>
                    <div style={crimeDescStyle}>{crime.desc}</div>
                    <div style={crimeMetaStyle}>Cost: {crime.cost}</div>
                  </div>
                  <button onClick={() => runAction({ type: "crime", crimeId: crime.id })} style={attemptButtonStyle}>Attempt</button>
                </div>
              ))}
              <div style={summaryBoxStyle}>
                <div>Crime Success: {state.wins}</div>
                <div>Crime Failures: {state.losses}</div>
              </div>
            </SectionCard>
          ) : null}

          {tab === "overview" ? (
            <SectionCard title="City Overview">
              <div style={summaryGridStyle}>
                <MiniTile label="Cash" value={`$${state.cash}`} />
                <MiniTile label="Bank" value={`$${state.bank}`} />
                <MiniTile label="Respect" value={state.respect} />
                <MiniTile label="Heat" value={state.heat} />
              </div>
              <div style={buttonStripStyle}>
                <button onClick={() => runAction({ type: "work" })} style={attemptButtonStyle}>Work</button>
                <button onClick={() => runAction({ type: "fightRival", rivalId: "dockhand" })} style={attemptButtonStyle}>Fight</button>
                <button onClick={() => runAction({ type: "recover" })} style={attemptButtonStyle}>Recover</button>
              </div>
            </SectionCard>
          ) : null}

          {tab === "jobs" ? (
            <SectionCard title="Job Board">
              <ActionRow title="Runner" desc="Small errands with low profile payouts." action={() => runAction({ type: "takeJob", jobId: "runner" })} button="Take Job" />
              <ActionRow title="Collector" desc="Higher pressure work for better cash." action={() => runAction({ type: "takeJob", jobId: "collector" })} button="Take Job" />
              <ActionRow title="Operator" desc="Heavy jobs for connected players." action={() => runAction({ type: "takeJob", jobId: "operator" })} button="Take Job" />
            </SectionCard>
          ) : null}

          {tab === "market" ? (
            <SectionCard title="Market Listings">
              {data.market.length === 0 ? <div style={emptyStyle}>No active listings right now.</div> : null}
              {data.market.map((listing) => (
                <div key={listing.id} style={crimeRowStyle}>
                  <div>
                    <div style={crimeTitleStyle}>{listing.itemId}</div>
                    <div style={crimeDescStyle}>{listing.quantity} units • ${listing.unitPrice} each</div>
                  </div>
                  <div style={buttonStackStyle}>
                    <button onClick={() => buyListing(listing.id)} style={attemptButtonStyle}>Buy</button>
                    {listing.playerId === data.player.id ? <button onClick={() => cancelListing(listing.id)} style={sideActionStyle}>Cancel</button> : null}
                  </div>
                </div>
              ))}
              <div style={subTitleStyle}>Contracts</div>
              {data.contracts.map((contract) => (
                <ActionRow key={contract.id} title={contract.title} desc={contract.body} action={() => claimContract(contract.id)} button="Claim" />
              ))}
            </SectionCard>
          ) : null}

          {tab === "crew" ? (
            <SectionCard title="Crew Control">
              {!data.crew ? (
                <div style={crewBuildStyle}>
                  <input value={crewName} onChange={(e) => setCrewName(e.target.value)} placeholder="Crew name" style={inputStyle} />
                  <input value={crewTag} onChange={(e) => setCrewTag(e.target.value)} placeholder="Tag" style={inputStyle} />
                  <button onClick={createCrew} style={attemptButtonStyle}>Found Crew</button>
                </div>
              ) : (
                <>
                  <div style={crewHeaderStyle}>{data.crew.name} {data.crew.tag ? `[${data.crew.tag}]` : ""}</div>
                  <div style={crimeMetaStyle}>Crew cash: ${data.crew.cash}</div>
                  <div style={listBoxStyle}>{data.crew.roster.map((member) => <div key={member.id} style={listRowStyle}>{member.handle}</div>)}</div>
                  <div style={subTitleStyle}>Crew Chat</div>
                  <div style={listBoxStyle}>{data.crew.messages.map((message) => <div key={message.id} style={chatLineStyle}><strong>{message.handle}:</strong> {message.body}</div>)}</div>
                  <div style={chatInputWrapStyle}>
                    <input value={chatBody} onChange={(e) => setChatBody(e.target.value)} placeholder="Send a crew message" style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={postMessage} style={attemptButtonStyle}>Send</button>
                  </div>
                </>
              )}
              <div style={subTitleStyle}>Player Search</div>
              <div style={chatInputWrapStyle}>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search handle" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={searchPeople} style={attemptButtonStyle}>Search</button>
              </div>
              <div style={listBoxStyle}>
                {results.map((row) => (
                  <div key={row.id} style={crimeRowStyle}>
                    <div>
                      <div style={crimeTitleStyle}>{row.handle}</div>
                      <div style={crimeDescStyle}>{row.crewId ? "Already in a crew" : "Available to invite"}</div>
                    </div>
                    <button onClick={() => invite(row.handle)} style={attemptButtonStyle} disabled={!data.crew || !!row.crewId}>Invite</button>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {tab === "territories" ? (
            <SectionCard title="Territory Control">
              {data.territories.map((territory) => (
                <div key={territory.id} style={crimeRowStyle}>
                  <div>
                    <div style={crimeTitleStyle}>{territory.name}</div>
                    <div style={crimeDescStyle}>{territory.cityId} • income {territory.baseIncome}</div>
                    <div style={crimeMetaStyle}>{territory.control ? `${territory.control.crewName} holding • def ${territory.control.defense}` : "Unclaimed"}</div>
                  </div>
                  <button onClick={() => attackTerritory(territory.id)} style={attemptButtonStyle}>Attack</button>
                </div>
              ))}
            </SectionCard>
          ) : null}

          {tab === "inbox" ? (
            <SectionCard title="Inbox">
              {data.invites.map((invite) => (
                <div key={invite.id} style={crimeRowStyle}>
                  <div>
                    <div style={crimeTitleStyle}>{invite.crewName}</div>
                    <div style={crimeDescStyle}>{invite.crewTag || "No tag"}</div>
                  </div>
                  <div style={buttonStackStyle}>
                    <button onClick={() => respondInvite(invite.id, true)} style={attemptButtonStyle}>Accept</button>
                    <button onClick={() => respondInvite(invite.id, false)} style={sideActionStyle}>Decline</button>
                  </div>
                </div>
              ))}
              {data.notifications.map((notification) => (
                <div key={notification.id} style={crimeRowStyle}>
                  <div>
                    <div style={crimeTitleStyle}>{notification.title}</div>
                    <div style={crimeDescStyle}>{notification.body}</div>
                  </div>
                  {!notification.readAt ? <button onClick={() => markRead(notification.id)} style={attemptButtonStyle}>Read</button> : <span style={crimeMetaStyle}>Read</span>}
                </div>
              ))}
            </SectionCard>
          ) : null}

          {tab === "log" ? (
            <SectionCard title="Street Feed">
              <div style={listBoxStyle}>{state.log.map((entry: string, index: number) => <div key={index} style={listRowStyle}>{entry}</div>)}</div>
            </SectionCard>
          ) : null}
        </main>

        <aside style={rightRailStyle}>
          <div style={profileCardStyle}>
            <div style={avatarWrapStyle}><div style={avatarStyle}>{String(data.player.handle).charAt(0).toUpperCase()}</div></div>
            <div style={profileMetaStyle}>
              <div style={playerNameStyle}>{data.player.handle}</div>
              <div style={playerLevelStyle}>Level: 1</div>
            </div>
          </div>

          <div style={statListCardStyle}>
            <StatLine label="Cash" value={`$${state.cash}`} />
            <StatLine label="Bank" value={`$${state.bank}`} />
            <StatLine label="City Rep" value={state.respect} />
          </div>

          <StatusBar label="Health" value={`${state.health}/100`} pct={state.health} tone="red" />
          <StatusBar label="Energy" value={`${state.energy}/100`} pct={energyMeta.pct} tone="blue" sub={energyMeta.text} />
          <StatusBar label="Bravery" value={`${state.bravery}/20`} pct={braveryMeta.pct} tone="amber" sub={braveryMeta.text} />

          <div style={metaBoxStyle}>
            <MetaLine label="Rank" value="Rookie" />
            <MetaLine label="Location" value={state.city} />
            <MetaLine label="Job" value={state.job} />
          </div>

          <div style={footerActionsStyle}>
            <button onClick={() => runAction({ type: "recover" })} style={bigSideButtonStyle}>Hospital</button>
            <button onClick={() => runAction({ type: "travel", cityId: state.city === "apex" ? "iron" : "apex" })} style={bigSideButtonStyle}>Travel</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function titleForTab(tab: TabKey) {
  return {
    overview: "Home",
    crimes: "Crimes",
    jobs: "Jobs",
    market: "Market",
    crew: "Crews",
    territories: "Territory",
    inbox: "Inbox",
    log: "Street Feed",
  }[tab];
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>{title}</div>
      <div style={sectionBodyStyle}>{children}</div>
    </section>
  );
}

function ActionRow({ title, desc, action, button }: { title: string; desc: string; action: () => void; button: string }) {
  return (
    <div style={crimeRowStyle}>
      <div>
        <div style={crimeTitleStyle}>{title}</div>
        <div style={crimeDescStyle}>{desc}</div>
      </div>
      <button onClick={action} style={attemptButtonStyle}>{button}</button>
    </div>
  );
}

function MiniTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={miniTileStyle}>
      <div style={miniTileLabelStyle}>{label}</div>
      <div style={miniTileValueStyle}>{value}</div>
    </div>
  );
}

function StatusBar({ label, value, pct, tone, sub }: { label: string; value: string; pct: number; tone: "red" | "blue" | "amber"; sub?: string }) {
  const fill = tone === "red" ? "linear-gradient(90deg,#651212,#d93b32)" : tone === "blue" ? "linear-gradient(90deg,#12386d,#1e74dd)" : "linear-gradient(90deg,#6a3d0d,#d98c23)";
  return (
    <div style={barCardStyle}>
      <div style={barTopStyle}>
        <div style={barLabelStyle}>{label}</div>
        <div style={barValueStyle}>{value}</div>
      </div>
      <div style={barTrackStyle}><div style={{ ...barFillStyle, width: `${Math.max(0, Math.min(100, pct))}%`, background: fill }} /></div>
      {sub ? <div style={barSubStyle}>{sub}</div> : null}
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string | number }) {
  return <div style={statLineStyle}><span>{label}:</span><strong>{value}</strong></div>;
}

function MetaLine({ label, value }: { label: string; value: string | number }) {
  return <div style={metaLineStyle}><span>{label}:</span><strong>{value}</strong></div>;
}

const steel = "linear-gradient(180deg,#282b31 0%,#181b1f 100%)";
const panelBorder = "1px solid #3d4046";
const insetShadow = "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.45), 0 10px 24px rgba(0,0,0,0.38)";

const loadingStyle: React.CSSProperties = { minHeight: "100vh", background: "#111317", color: "#f4f4f4", display: "grid", placeItems: "center", fontFamily: "Inter, Arial, sans-serif" };
const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at bottom left,#2b1a0c 0%,#131519 18%,#0a0c0f 100%)", color: "#f2f2f2", fontFamily: "Inter, Arial, sans-serif", padding: 18 };
const frameStyle: React.CSSProperties = { maxWidth: 1540, margin: "0 auto", display: "grid", gridTemplateColumns: "300px minmax(0,1fr) 360px", gap: 18, border: "1px solid #3d4046", background: "#16181d", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", padding: 16 };
const leftRailStyle: React.CSSProperties = { display: "grid", gap: 8, alignContent: "start" };
const navButtonStyle: React.CSSProperties = { minHeight: 68, display: "flex", alignItems: "center", gap: 14, border: panelBorder, background: steel, color: "#ececec", borderRadius: 4, padding: "0 18px", fontSize: 19, cursor: "pointer", boxShadow: insetShadow, textAlign: "left" };
const navActiveStyle: React.CSSProperties = { ...navButtonStyle, boxShadow: "0 0 0 2px rgba(255,255,255,0.18) inset, 0 10px 24px rgba(0,0,0,0.38)", background: "linear-gradient(180deg,#31353c 0%,#1c2025 100%)" };
const navIconStyle: React.CSSProperties = { width: 28, textAlign: "center", fontSize: 24, opacity: 0.95 };
const badgeStyle: React.CSSProperties = { marginLeft: "auto", color: "#ffb258", fontWeight: 800 };
const streetFooterStyle: React.CSSProperties = { minHeight: 120, marginTop: 10, border: panelBorder, background: "linear-gradient(180deg,#171a1e 0%,#101215 100%)", boxShadow: insetShadow, display: "flex", alignItems: "end", justifyContent: "center", padding: 14, color: "#9f815e", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em" };
const centerStyle: React.CSSProperties = { minWidth: 0, display: "grid", gap: 14, alignContent: "start" };
const titleBarStyle: React.CSSProperties = { border: panelBorder, background: steel, boxShadow: insetShadow, minHeight: 72, display: "flex", alignItems: "center", padding: "0 22px", fontSize: 30, fontWeight: 800, letterSpacing: "0.01em" };
const errorStyle: React.CSSProperties = { color: "#ff8b8b", padding: "0 4px" };
const sectionStyle: React.CSSProperties = { border: panelBorder, background: "linear-gradient(180deg,#20242a 0%,#15181d 100%)", boxShadow: insetShadow };
const sectionHeaderStyle: React.CSSProperties = { minHeight: 62, display: "flex", alignItems: "center", padding: "0 20px", fontSize: 22, fontWeight: 800, borderBottom: panelBorder, background: "linear-gradient(180deg,#292d34 0%,#1b1f24 100%)" };
const sectionBodyStyle: React.CSSProperties = { padding: 18, display: "grid", gap: 14 };
const crimeRowStyle: React.CSSProperties = { border: panelBorder, background: "linear-gradient(180deg,#262a31 0%,#181b20 100%)", padding: 16, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" };
const crimeTitleStyle: React.CSSProperties = { fontSize: 23, fontWeight: 800, marginBottom: 6 };
const crimeDescStyle: React.CSSProperties = { fontSize: 15, color: "#d4d5d8", maxWidth: 580 };
const crimeMetaStyle: React.CSSProperties = { marginTop: 8, color: "#a5a8ad", fontSize: 13 };
const attemptButtonStyle: React.CSSProperties = { minWidth: 156, minHeight: 62, borderRadius: 4, border: "1px solid #62666d", background: "linear-gradient(180deg,#565b64 0%,#30343b 100%)", color: "#f0f0f0", fontSize: 20, fontWeight: 800, cursor: "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 10px rgba(0,0,0,0.28)" };
const sideActionStyle: React.CSSProperties = { ...attemptButtonStyle, minWidth: 120, minHeight: 46, fontSize: 16 };
const summaryBoxStyle: React.CSSProperties = { border: panelBorder, background: "rgba(0,0,0,0.18)", padding: 16, lineHeight: 1.8, fontSize: 16 };
const summaryGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4,minmax(120px,1fr))", gap: 12 };
const miniTileStyle: React.CSSProperties = { border: panelBorder, background: "linear-gradient(180deg,#292d34 0%,#191c21 100%)", padding: 14, textAlign: "center" };
const miniTileLabelStyle: React.CSSProperties = { color: "#a5a8ad", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" };
const miniTileValueStyle: React.CSSProperties = { marginTop: 8, fontSize: 24, fontWeight: 800 };
const buttonStripStyle: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap" };
const rightRailStyle: React.CSSProperties = { display: "grid", gap: 12, alignContent: "start" };
const profileCardStyle: React.CSSProperties = { border: panelBorder, background: steel, boxShadow: insetShadow, display: "grid", gridTemplateColumns: "112px 1fr", gap: 14, padding: 14 };
const avatarWrapStyle: React.CSSProperties = { border: panelBorder, background: "linear-gradient(180deg,#4a5764 0%,#1e2932 100%)", minHeight: 112, display: "grid", placeItems: "center" };
const avatarStyle: React.CSSProperties = { width: 74, height: 74, borderRadius: "50%", background: "linear-gradient(180deg,#0b0d10 0%,#273241 100%)", color: "#f5f5f5", display: "grid", placeItems: "center", fontSize: 34, fontWeight: 800 };
const profileMetaStyle: React.CSSProperties = { display: "grid", alignContent: "center", gap: 8 };
const playerNameStyle: React.CSSProperties = { fontSize: 28, fontWeight: 900 };
const playerLevelStyle: React.CSSProperties = { fontSize: 18, color: "#e3e3e3" };
const statListCardStyle: React.CSSProperties = { border: panelBorder, background: steel, boxShadow: insetShadow, padding: 16, display: "grid", gap: 12 };
const statLineStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 17 };
const barCardStyle: React.CSSProperties = { border: panelBorder, background: steel, boxShadow: insetShadow, padding: 12 };
const barTopStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 18, fontWeight: 800 };
const barLabelStyle: React.CSSProperties = { fontSize: 18, fontWeight: 800 };
const barValueStyle: React.CSSProperties = { fontSize: 18, fontWeight: 900 };
const barTrackStyle: React.CSSProperties = { height: 38, background: "#121418", border: "1px solid #41454d", overflow: "hidden" };
const barFillStyle: React.CSSProperties = { height: "100%" };
const barSubStyle: React.CSSProperties = { marginTop: 10, textAlign: "center", color: "#efefef", fontSize: 15 };
const metaBoxStyle: React.CSSProperties = { border: panelBorder, background: steel, boxShadow: insetShadow, padding: 14, display: "grid", gap: 12 };
const metaLineStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, fontSize: 17 };
const footerActionsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const bigSideButtonStyle: React.CSSProperties = { minHeight: 68, border: "1px solid #62666d", background: "linear-gradient(180deg,#5d626c 0%,#31353d 100%)", color: "#f0f0f0", fontSize: 18, fontWeight: 800, cursor: "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 10px rgba(0,0,0,0.28)" };
const inputStyle: React.CSSProperties = { minHeight: 48, border: "1px solid #50545b", background: "#13161a", color: "#f2f2f2", padding: "0 14px", fontSize: 16 };
const crewBuildStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 110px 180px", gap: 12 };
const crewHeaderStyle: React.CSSProperties = { fontSize: 24, fontWeight: 800 };
const listBoxStyle: React.CSSProperties = { display: "grid", gap: 10 };
const listRowStyle: React.CSSProperties = { border: panelBorder, background: "rgba(0,0,0,0.18)", padding: 12 };
const chatLineStyle: React.CSSProperties = { ...listRowStyle, lineHeight: 1.5 };
const chatInputWrapStyle: React.CSSProperties = { display: "flex", gap: 12 };
const subTitleStyle: React.CSSProperties = { marginTop: 4, fontSize: 18, fontWeight: 800, color: "#f0f0f0" };
const buttonStackStyle: React.CSSProperties = { display: "grid", gap: 8 };
const emptyStyle: React.CSSProperties = { color: "#a8abb0", padding: 8 };
