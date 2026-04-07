import React, { useEffect, useMemo, useState } from "react";
import { apiCall } from "./secureApi";
import { CITIES, CRIMES, ITEMS, JOBS, RIVALS, getLevelFromRespect } from "../shared/gameData";

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

type TabKey = "home" | "jobs" | "crimes" | "fight" | "hospital" | "travel" | "market" | "crew" | "territories" | "inbox" | "log";

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "home", label: "Home", icon: "⌂" },
  { key: "jobs", label: "Jobs", icon: "▣" },
  { key: "crimes", label: "Crimes", icon: "◈" },
  { key: "fight", label: "Fight", icon: "✦" },
  { key: "hospital", label: "Hospital", icon: "✚" },
  { key: "travel", label: "Travel", icon: "⇄" },
  { key: "market", label: "Market", icon: "◫" },
  { key: "crew", label: "Crews", icon: "☰" },
  { key: "territories", label: "Territory", icon: "⌘" },
  { key: "inbox", label: "Inbox", icon: "✉" },
  { key: "log", label: "Log", icon: "⋯" },
];

const ENERGY_TICK_MS = 10 * 60 * 1000;
const FIVE_MIN_TICK_MS = 5 * 60 * 1000;

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

function londonDayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value || "0000";
  const month = parts.find((part) => part.type === "month")?.value || "00";
  const day = parts.find((part) => part.type === "day")?.value || "00";
  return `${year}-${month}-${day}`;
}

function priceWithJobDiscount(price: number, state: any) {
  const job = JOBS.find((entry) => entry.id === state.job) || JOBS[0];
  const discount = Number(job.bonus?.itemDiscount || 0);
  return Math.max(1, Math.round(price * (1 - discount)));
}

function crimeChance(crimeId: string, state: any) {
  const crime = CRIMES.find((entry) => entry.id === crimeId);
  if (!crime) return 0;
  const level = getLevelFromRespect(Number(state.respect || 0));
  const job = JOBS.find((entry) => entry.id === state.job) || JOBS[0];
  const equippedCrime = [state.equipped?.weapon, state.equipped?.armor, state.equipped?.utility]
    .map((id: string | null) => ITEMS.find((item) => item.id === id)?.effect?.crime || 0)
    .reduce((sum: number, value: number) => sum + Number(value || 0), 0);
  const effectiveSpeed = Number(state.speed || 0) + Number(job.bonus?.speed || 0);
  const effectiveStrength = Number(state.strength || 0) + Number(job.bonus?.strength || 0);
  const effectiveDefense = Number(state.defense || 0) + Number(job.bonus?.defense || 0);
  const chance = 52 + level * 1.6 + effectiveSpeed * 1.2 + effectiveStrength * 0.7 + effectiveDefense * 0.35 + Number(job.bonus?.crime || 0) + equippedCrime - crime.difficulty;
  return Math.max(8, Math.min(96, Math.round(chance)));
}

function jailRemainingText(jailUntil: string | null, nowMs: number) {
  if (!jailUntil) return null;
  const end = new Date(jailUntil).getTime();
  if (!Number.isFinite(end) || end <= nowMs) return null;
  return formatRemaining(end - nowMs);
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
      const delay = getRemainingUntilBoundary(now, FIVE_MIN_TICK_MS) || FIVE_MIN_TICK_MS;
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

  if (!data) {
    return <div style={loadingStyle}>Loading crime grid…</div>;
  }

  const state = data.player.state;
  const level = getLevelFromRespect(Number(state.respect || 0));
  const job = JOBS.find((entry) => entry.id === state.job) || JOBS[0];
  const jailText = jailRemainingText(state.jailUntil, clockMs);
  const today = londonDayKey();
  const canCollectPay = state.jobLastPaidOn !== today;

  const energyMeta = {
    pct: Math.max(0, Math.min(100, Number(state.energy || 0))),
    text: Number(state.energy || 0) >= 100 ? "Full" : `Next +5 in: ${formatRemaining(getRemainingUntilBoundary(clockMs, ENERGY_TICK_MS))}`,
  };
  const braveryMeta = {
    pct: Math.max(0, Math.min(100, (Number(state.bravery || 0) / 20) * 100)),
    text: Number(state.bravery || 0) >= 20 ? "Full" : `Next +1 in: ${formatRemaining(getRemainingUntilBoundary(clockMs, FIVE_MIN_TICK_MS))}`,
  };
  const healthMeta = {
    pct: Math.max(0, Math.min(100, Number(state.health || 0))),
    text: Number(state.health || 0) >= 100 ? "Full" : `Next +10 in: ${formatRemaining(getRemainingUntilBoundary(clockMs, FIVE_MIN_TICK_MS))}`,
  };

  const categories = [
    { key: "weapon", label: "Weapons" },
    { key: "armor", label: "Armour" },
    { key: "utility", label: "Utilities" },
    { key: "recovery", label: "Recovery" },
  ] as const;

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
          <div style={identityBoxStyle}>
            <div style={identityTitleStyle}>Handle</div>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} style={inputStyle} />
            <button onClick={load} style={sideButtonStyle}>Load</button>
          </div>
        </aside>

        <main style={centerStyle}>
          <div style={titleBarStyle}>{tab.toUpperCase()}</div>
          {error ? <div style={errorStyle}>{error}</div> : null}
          {jailText ? <div style={jailBannerStyle}>Jailed • release in {jailText}</div> : null}

          {tab === "home" ? (
            <SectionCard title="Street Summary">
              <div style={summaryGridStyle}>
                <MiniTile label="Level" value={level} />
                <MiniTile label="Cash" value={`$${state.cash}`} />
                <MiniTile label="Crime Success" value={`${state.crimesSucceeded}`} />
                <MiniTile label="Fight Wins" value={`${state.wins}`} />
              </div>
              <div style={subTitleStyle}>Live Contracts</div>
              {data.contracts.map((contract) => (
                <ActionRow key={contract.id} title={contract.title} desc={contract.body} action={() => claimContract(contract.id)} button="Claim" />
              ))}
            </SectionCard>
          ) : null}

          {tab === "jobs" ? (
            <SectionCard title="Daily Jobs">
              <div style={jobHeroStyle}>
                <div>
                  <div style={crimeTitleStyle}>{job.name}</div>
                  <div style={crimeDescStyle}>{job.bonusText}</div>
                  <div style={crimeMetaStyle}>Daily pay: ${job.pay}</div>
                </div>
                <button onClick={() => runAction({ type: "collectJobPay" })} style={attemptButtonStyle} disabled={!canCollectPay}>Collect Daily Pay</button>
              </div>
              <div style={crimeMetaStyle}>{canCollectPay ? "Daily pay ready." : "Daily pay already collected today."}</div>
              {JOBS.map((entry) => (
                <div key={entry.id} style={crimeRowStyle}>
                  <div>
                    <div style={crimeTitleStyle}>{entry.name}</div>
                    <div style={crimeDescStyle}>{entry.bonusText}</div>
                    <div style={crimeMetaStyle}>Level {entry.levelReq} • Daily pay ${entry.pay}</div>
                  </div>
                  <button onClick={() => runAction({ type: "takeJob", jobId: entry.id })} style={attemptButtonStyle} disabled={level < entry.levelReq || state.job === entry.id}>
                    {state.job === entry.id ? "Active" : level < entry.levelReq ? `Lvl ${entry.levelReq}` : "Take Job"}
                  </button>
                </div>
              ))}
            </SectionCard>
          ) : null}

          {tab === "crimes" ? (
            <SectionCard title="Crime Ladder">
              {CRIMES.map((crime) => (
                <div key={crime.id} style={crimeRowStyle}>
                  <div>
                    <div style={crimeTitleStyle}>{crime.name}</div>
                    <div style={crimeDescStyle}>Chance: {crimeChance(crime.id, state)}% • Reward ${crime.cash} • {crime.bravery} bravery</div>
                    <div style={crimeMetaStyle}>Unlock level {crime.levelReq} • Jail risk {crime.jailChance}% • Jail time {crime.jailMinutes}m</div>
                  </div>
                  <button onClick={() => runAction({ type: "crime", crimeId: crime.id })} style={attemptButtonStyle} disabled={!!jailText || level < crime.levelReq}>
                    {jailText ? "Jailed" : level < crime.levelReq ? `Lvl ${crime.levelReq}` : "Attempt"}
                  </button>
                </div>
              ))}
            </SectionCard>
          ) : null}

          {tab === "fight" ? (
            <SectionCard title="Fight Club">
              {RIVALS.map((rival) => (
                <div key={rival.id} style={crimeRowStyle}>
                  <div>
                    <div style={crimeTitleStyle}>{rival.name}</div>
                    <div style={crimeDescStyle}>{rival.note}</div>
                    <div style={crimeMetaStyle}>Power {rival.power} • Reward ${rival.reward}</div>
                  </div>
                  <button onClick={() => runAction({ type: "fightRival", rivalId: rival.id })} style={attemptButtonStyle} disabled={!!jailText}>Fight</button>
                </div>
              ))}
            </SectionCard>
          ) : null}

          {tab === "hospital" ? (
            <SectionCard title="Hospital & Recovery">
              <div style={summaryGridStyle}>
                <MiniTile label="Health Regen" value="+10 / 5m" />
                <MiniTile label="Bravery Regen" value="+1 / 5m" />
                <MiniTile label="Energy Regen" value="+5 / 10m" />
                <MiniTile label="Jail" value={jailText ? jailText : "Free"} />
              </div>
              <button onClick={() => runAction({ type: "hospital" })} style={attemptButtonStyle}>Use Hospital</button>
              <div style={subTitleStyle}>Recovery Inventory</div>
              {ITEMS.filter((item) => item.type === "recovery").map((item) => (
                <div key={item.id} style={crimeRowStyle}>
                  <div>
                    <div style={crimeTitleStyle}>{item.name}</div>
                    <div style={crimeDescStyle}>{item.desc}</div>
                    <div style={crimeMetaStyle}>Owned: {state.inventory[item.id] || 0}</div>
                  </div>
                  <button onClick={() => runAction({ type: "useItem", itemId: item.id })} style={attemptButtonStyle} disabled={(state.inventory[item.id] || 0) <= 0}>Use</button>
                </div>
              ))}
            </SectionCard>
          ) : null}

          {tab === "travel" ? (
            <SectionCard title="Travel Desk">
              {CITIES.map((city) => (
                <div key={city.id} style={crimeRowStyle}>
                  <div>
                    <div style={crimeTitleStyle}>{city.name}</div>
                    <div style={crimeDescStyle}>{city.vibe}</div>
                    <div style={crimeMetaStyle}>{state.city === city.id ? "Current city" : "Travel cost reduced by some jobs"}</div>
                  </div>
                  <button onClick={() => runAction({ type: "travel", cityId: city.id })} style={attemptButtonStyle} disabled={!!jailText || state.city === city.id}>
                    {state.city === city.id ? "Here" : jailText ? "Jailed" : "Travel"}
                  </button>
                </div>
              ))}
            </SectionCard>
          ) : null}

          {tab === "market" ? (
            <SectionCard title="Market Categories">
              {categories.map((category) => (
                <div key={category.key} style={marketSectionStyle}>
                  <div style={sectionSubHeaderStyle}>{category.label}</div>
                  {ITEMS.filter((item) => item.type === category.key).map((item) => (
                    <div key={item.id} style={crimeRowStyle}>
                      <div>
                        <div style={crimeTitleStyle}>{item.name}</div>
                        <div style={crimeDescStyle}>{item.desc}</div>
                        <div style={crimeMetaStyle}>Shop: ${priceWithJobDiscount(item.price, state)} • Owned: {state.inventory[item.id] || 0}</div>
                      </div>
                      <div style={buttonStackStyle}>
                        <button onClick={() => runAction({ type: "buyItem", itemId: item.id })} style={attemptButtonStyle}>Buy</button>
                        <button onClick={() => runAction({ type: "useItem", itemId: item.id })} style={sideActionStyle} disabled={(state.inventory[item.id] || 0) <= 0}>
                          {item.type === "recovery" ? "Use" : "Equip"}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div style={subTitleStyle}>Live Listings</div>
                  {data.market.filter((listing) => (ITEMS.find((item) => item.id === listing.itemId)?.type || "") === category.key).map((listing) => (
                    <div key={listing.id} style={crimeRowStyle}>
                      <div>
                        <div style={crimeTitleStyle}>{ITEMS.find((item) => item.id === listing.itemId)?.name || listing.itemId}</div>
                        <div style={crimeDescStyle}>{listing.quantity} units • ${listing.unitPrice} each</div>
                      </div>
                      <button onClick={() => buyListing(listing.id)} style={attemptButtonStyle}>Buy Listing</button>
                    </div>
                  ))}
                </div>
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
                  <div style={crimeTitleStyle}>{data.crew.name} {data.crew.tag ? `[${data.crew.tag}]` : ""}</div>
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
              <div style={playerLevelStyle}>Level {level}</div>
            </div>
          </div>

          <div style={statListCardStyle}>
            <StatLine label="Cash" value={`$${state.cash}`} />
            <StatLine label="Bank" value={`$${state.bank}`} />
            <StatLine label="Job" value={job.name} />
            <StatLine label="Crime W/L" value={`${state.crimesSucceeded}/${state.crimesFailed}`} />
          </div>

          <StatusBar label="Health" value={`${state.health}/100`} pct={healthMeta.pct} tone="red" sub={healthMeta.text} />
          <StatusBar label="Energy" value={`${state.energy}/100`} pct={energyMeta.pct} tone="blue" sub={energyMeta.text} />
          <StatusBar label="Bravery" value={`${state.bravery}/20`} pct={braveryMeta.pct} tone="amber" sub={braveryMeta.text} />

          <div style={metaBoxStyle}>
            <MetaLine label="City" value={state.city} />
            <MetaLine label="Strength" value={state.strength} />
            <MetaLine label="Speed" value={state.speed} />
            <MetaLine label="Defense" value={state.defense} />
            <MetaLine label="Respect" value={state.respect} />
            <MetaLine label="Jail" value={jailText ? jailText : "Free"} />
          </div>
        </aside>
      </div>
    </div>
  );
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
const frameStyle: React.CSSProperties = { maxWidth: 1580, margin: "0 auto", display: "grid", gridTemplateColumns: "300px minmax(0,1fr) 360px", gap: 18, border: "1px solid #3d4046", background: "#16181d", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", padding: 16 };
const leftRailStyle: React.CSSProperties = { display: "grid", gap: 8, alignContent: "start" };
const navButtonStyle: React.CSSProperties = { minHeight: 60, display: "flex", alignItems: "center", gap: 14, border: panelBorder, background: steel, color: "#ececec", borderRadius: 4, padding: "0 18px", fontSize: 18, cursor: "pointer", boxShadow: insetShadow, textAlign: "left" };
const navActiveStyle: React.CSSProperties = { ...navButtonStyle, boxShadow: "0 0 0 2px rgba(255,255,255,0.18) inset, 0 10px 24px rgba(0,0,0,0.38)", background: "linear-gradient(180deg,#31353c 0%,#1c2025 100%)" };
const navIconStyle: React.CSSProperties = { width: 28, textAlign: "center", fontSize: 24, opacity: 0.95 };
const badgeStyle: React.CSSProperties = { marginLeft: "auto", color: "#ffb258", fontWeight: 800 };
const identityBoxStyle: React.CSSProperties = { marginTop: 8, border: panelBorder, background: steel, boxShadow: insetShadow, padding: 14, display: "grid", gap: 10 };
const identityTitleStyle: React.CSSProperties = { fontSize: 13, textTransform: "uppercase", color: "#b9bdc3", letterSpacing: "0.12em" };
const sideButtonStyle: React.CSSProperties = { minHeight: 46, border: "1px solid #62666d", background: "linear-gradient(180deg,#565b64 0%,#30343b 100%)", color: "#f0f0f0", fontSize: 16, fontWeight: 800, cursor: "pointer" };
const centerStyle: React.CSSProperties = { minWidth: 0, display: "grid", gap: 14, alignContent: "start" };
const titleBarStyle: React.CSSProperties = { border: panelBorder, background: steel, boxShadow: insetShadow, minHeight: 72, display: "flex", alignItems: "center", padding: "0 22px", fontSize: 30, fontWeight: 800, letterSpacing: "0.01em" };
const errorStyle: React.CSSProperties = { color: "#ff8b8b", padding: "0 4px" };
const jailBannerStyle: React.CSSProperties = { border: "1px solid #7b3f22", background: "linear-gradient(180deg,#5a2a14 0%,#28120a 100%)", color: "#ffd4bf", padding: 14, fontWeight: 800 };
const sectionStyle: React.CSSProperties = { border: panelBorder, background: "linear-gradient(180deg,#20242a 0%,#15181d 100%)", boxShadow: insetShadow };
const sectionHeaderStyle: React.CSSProperties = { minHeight: 62, display: "flex", alignItems: "center", padding: "0 20px", fontSize: 22, fontWeight: 800, borderBottom: panelBorder, background: "linear-gradient(180deg,#292d34 0%,#1b1f24 100%)" };
const sectionBodyStyle: React.CSSProperties = { padding: 18, display: "grid", gap: 14 };
const sectionSubHeaderStyle: React.CSSProperties = { fontSize: 19, fontWeight: 800, paddingBottom: 8 };
const crimeRowStyle: React.CSSProperties = { border: panelBorder, background: "linear-gradient(180deg,#262a31 0%,#181b20 100%)", padding: 16, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" };
const crimeTitleStyle: React.CSSProperties = { fontSize: 22, fontWeight: 800, marginBottom: 6 };
const crimeDescStyle: React.CSSProperties = { fontSize: 15, color: "#d4d5d8", maxWidth: 620 };
const crimeMetaStyle: React.CSSProperties = { marginTop: 8, color: "#a5a8ad", fontSize: 13 };
const attemptButtonStyle: React.CSSProperties = { minWidth: 156, minHeight: 58, borderRadius: 4, border: "1px solid #62666d", background: "linear-gradient(180deg,#565b64 0%,#30343b 100%)", color: "#f0f0f0", fontSize: 18, fontWeight: 800, cursor: "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 10px rgba(0,0,0,0.28)" };
const sideActionStyle: React.CSSProperties = { ...attemptButtonStyle, minWidth: 120, minHeight: 42, fontSize: 15 };
const summaryGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4,minmax(120px,1fr))", gap: 12 };
const miniTileStyle: React.CSSProperties = { border: panelBorder, background: "linear-gradient(180deg,#292d34 0%,#191c21 100%)", padding: 14, textAlign: "center" };
const miniTileLabelStyle: React.CSSProperties = { color: "#a5a8ad", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" };
const miniTileValueStyle: React.CSSProperties = { marginTop: 8, fontSize: 24, fontWeight: 800 };
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
const inputStyle: React.CSSProperties = { minHeight: 46, border: "1px solid #50545b", background: "#13161a", color: "#f2f2f2", padding: "0 14px", fontSize: 16 };
const crewBuildStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 110px 180px", gap: 12 };
const listBoxStyle: React.CSSProperties = { display: "grid", gap: 10 };
const listRowStyle: React.CSSProperties = { border: panelBorder, background: "rgba(0,0,0,0.18)", padding: 12 };
const chatLineStyle: React.CSSProperties = { ...listRowStyle, lineHeight: 1.5 };
const chatInputWrapStyle: React.CSSProperties = { display: "flex", gap: 12 };
const subTitleStyle: React.CSSProperties = { marginTop: 4, fontSize: 18, fontWeight: 800, color: "#f0f0f0" };
const buttonStackStyle: React.CSSProperties = { display: "grid", gap: 8 };
const marketSectionStyle: React.CSSProperties = { display: "grid", gap: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 };
const jobHeroStyle: React.CSSProperties = { border: panelBorder, background: "linear-gradient(180deg,#262a31 0%,#181b20 100%)", padding: 16, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center" };
