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

type TabKey = "overview" | "actions" | "crew" | "market" | "territories" | "inbox" | "log";

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

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const refresh = async () => {
    try {
      const result = await apiCall(`/api/demo/${handle}/bootstrap`);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

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

  const cards = useMemo(() => {
    if (!data) return [];
    const state = data.player.state;
    return [
      ["Handle", data.player.handle],
      ["Cash", state.cash],
      ["Bank", state.bank],
      ["Energy", state.energy],
      ["Health", state.health],
      ["Respect", state.respect],
      ["Heat", state.heat],
      ["Crew", data.crew?.name || "None"],
    ];
  }, [data]);

  if (!data) {
    return <div style={{ minHeight: "100vh", background: "#09090b", color: "white", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>Loading live foundation…</div>;
  }

  const state = data.player.state;

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "white", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gap: 16 }}>
        <header style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 36 }}>Metro Syndicate</h1>
              <p style={{ color: "#a1a1aa", marginBottom: 0 }}>Main shell with gameplay, crews, market, territories, and inbox.</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="handle" style={inputStyle} />
              <button onClick={load} style={buttonPrimary}>Load handle</button>
              <button onClick={refresh} style={buttonGhost}>Refresh</button>
            </div>
          </div>
        </header>

        {error ? <div style={{ color: "#f87171" }}>{error}</div> : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          {cards.map(([label, value]) => (
            <div key={String(label)} style={cardStyle}>
              <div style={labelStyle}>{label}</div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>{String(value)}</div>
            </div>
          ))}
        </section>

        <nav style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {([
            ["overview", "Overview"],
            ["actions", "Actions"],
            ["crew", "Crews"],
            ["market", "Market"],
            ["territories", "Territories"],
            ["inbox", "Inbox"],
            ["log", "Log"],
          ] as Array<[TabKey, string]>).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={tab === key ? buttonPrimary : buttonGhost}>{label}</button>
          ))}
        </nav>

        {tab === "overview" ? (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
            <Panel title="Quick start">
              <button onClick={() => runAction({ type: "work" })} style={buttonPrimary}>Work shift</button>
              <button onClick={() => runAction({ type: "crime", crimeId: "pick" })} style={buttonGhost}>Street crime</button>
              <button onClick={() => runAction({ type: "fightRival", rivalId: "dockhand" })} style={buttonGhost}>Fight rival</button>
              <button onClick={() => runAction({ type: "recover" })} style={buttonGhost}>Recover</button>
            </Panel>
            <Panel title="Open invites">
              {data.invites.length === 0 ? <div style={{ color: "#a1a1aa" }}>No pending crew invites.</div> : null}
              {data.invites.map((invite) => (
                <div key={invite.id} style={rowStyle}>
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
            </Panel>
            <Panel title="Latest notifications">
              {data.notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{notification.title}</div>
                    <div style={{ color: "#d4d4d8" }}>{notification.body}</div>
                  </div>
                </div>
              ))}
            </Panel>
          </section>
        ) : null}

        {tab === "actions" ? (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            <Panel title="Crime and recovery">
              <button onClick={() => runAction({ type: "work" })} style={buttonPrimary}>Work</button>
              <button onClick={() => runAction({ type: "crime", crimeId: "pick" })} style={buttonGhost}>Pickpocket</button>
              <button onClick={() => runAction({ type: "fightRival", rivalId: "dockhand" })} style={buttonGhost}>Fight Dockhand</button>
              <button onClick={() => runAction({ type: "recover" })} style={buttonGhost}>Recover</button>
            </Panel>
            <Panel title="Training">
              <button onClick={() => runAction({ type: "train", stat: "strength" })} style={buttonPrimary}>Train strength</button>
              <button onClick={() => runAction({ type: "train", stat: "speed" })} style={buttonGhost}>Train speed</button>
              <button onClick={() => runAction({ type: "train", stat: "defense" })} style={buttonGhost}>Train defense</button>
            </Panel>
            <Panel title="Travel and items">
              <button onClick={() => runAction({ type: "travel", cityId: "iron" })} style={buttonPrimary}>Travel to Ironport</button>
              <button onClick={() => runAction({ type: "buyItem", itemId: "consumable-1" })} style={buttonGhost}>Buy Stim Drink</button>
              <button onClick={() => runAction({ type: "buyItem", itemId: "utility-1" })} style={buttonGhost}>Buy Signal Rig</button>
            </Panel>
          </section>
        ) : null}

        {tab === "crew" ? (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
            <Panel title="Found or review crew">
              {!data.crew ? (
                <>
                  <input value={crewName} onChange={(e) => setCrewName(e.target.value)} placeholder="crew name" style={inputStyle} />
                  <input value={crewTag} onChange={(e) => setCrewTag(e.target.value)} placeholder="tag" style={inputStyle} />
                  <button onClick={createCrew} style={buttonPrimary}>Found crew</button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{data.crew.name} {data.crew.tag ? `[${data.crew.tag}]` : ""}</div>
                  <div style={{ color: "#a1a1aa" }}>Crew cash: {data.crew.cash}</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {data.crew.roster.map((member) => <div key={member.id} style={rowStyle}>{member.handle}</div>)}
                  </div>
                </>
              )}
            </Panel>
            <Panel title="Invite players">
              <div style={{ display: "flex", gap: 8 }}>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search handle" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={searchPeople} style={buttonGhost}>Search</button>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {results.map((row) => (
                  <div key={row.id} style={rowStyle}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{row.handle}</div>
                      <div style={{ color: "#a1a1aa", fontSize: 12 }}>{row.crewId ? "Already in a crew" : "Available"}</div>
                    </div>
                    <button onClick={() => invite(row.handle)} style={buttonPrimary} disabled={!data.crew || !!row.crewId}>Invite</button>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Crew chat">
              {!data.crew ? <div style={{ color: "#a1a1aa" }}>Join or found a crew to use chat.</div> : (
                <>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={chatBody} onChange={(e) => setChatBody(e.target.value)} placeholder="message" style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={postMessage} style={buttonPrimary}>Send</button>
                  </div>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {data.crew.messages.map((msg) => (
                      <div key={msg.id} style={rowStyle}>
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
        ) : null}

        {tab === "market" ? (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
            <Panel title="Create listing">
              <input value={listingItem} onChange={(e) => setListingItem(e.target.value)} style={inputStyle} />
              <input value={listingQty} onChange={(e) => setListingQty(e.target.value)} style={inputStyle} />
              <input value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} style={inputStyle} />
              <button onClick={createListing} style={buttonPrimary}>List item</button>
            </Panel>
            <Panel title="Market board">
              {data.market.map((listing) => (
                <div key={listing.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{listing.itemId}</div>
                    <div style={{ color: "#a1a1aa", fontSize: 12 }}>{listing.quantity} units • {listing.unitPrice} each</div>
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
                <div key={contract.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{contract.title}</div>
                    <div style={{ color: "#d4d4d8" }}>{contract.body}</div>
                  </div>
                  <button onClick={() => claimContract(contract.id)} style={buttonPrimary}>Claim</button>
                </div>
              ))}
            </Panel>
          </section>
        ) : null}

        {tab === "territories" ? (
          <Panel title="Territory control">
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
        ) : null}

        {tab === "inbox" ? (
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
        ) : null}

        {tab === "log" ? (
          <Panel title="Current log">
            {state.log.map((entry: string, index: number) => <div key={index} style={rowStyle}>{entry}</div>)}
          </Panel>
        ) : null}
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
const buttonPrimary: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "white", color: "black", fontWeight: 700, padding: "0 14px", cursor: "pointer", whiteSpace: "nowrap" };
const buttonGhost: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "white", fontWeight: 700, padding: "0 14px", cursor: "pointer", whiteSpace: "nowrap" };
