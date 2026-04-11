import React, { useEffect, useState } from "react";
import loginBg from "./assets/login-bg.png";
import postLoginBg from "./assets/post-login-bg.png";
import { apiCall } from "./secureApi";
import {
  CITIES,
  CRIME_CATEGORIES,
  CRIMES,
  EQUIPMENT_SLOTS,
  ITEMS,
  JOBS,
  RIVALS,
  getLevelFromRespect,
  getMaxBravery,
  getMaxEnergy,
  getRespectForLevel,
  getRespectNeededForNextLevel,
} from "../shared/gameData";

type ActionResult = { kind: "pass" | "fail" | "jail" | "info"; title: string; message: string };
type Bootstrap = {
  player: { id: string; handle: string; crewId: string | null; state: any };
  crew: any;
  invites: any[];
  market: any[];
  contracts: any[];
  territories: any[];
  notifications: any[];
  jailRoster: Array<{ id: string; handle: string; remainingMinutes: number; bailCost: number }>;
  hospitalRoster: Array<{ id: string; handle: string; remainingMinutes: number }>;
};
type ForumCategory = "updates" | "faqs" | "suggestions";
type ForumThread = {
  id: string;
  category: ForumCategory;
  title: string;
  body: string;
  author: string;
  createdAt: string;
};
type Tab = "home" | "jobs" | "crimes" | "fight" | "hospital" | "travel" | "bank" | "inventory" | "shops" | "train" | "forums" | "jail" | "log" | "premium";

const TABS: Tab[] = ["home", "jobs", "crimes", "fight", "hospital", "travel", "bank", "inventory", "shops", "train", "forums", "jail", "log"];
const NAV_META: Record<Tab, { label: string; icon: string }> = {
  home: { label: "Home", icon: "⌂" },
  jobs: { label: "Jobs", icon: "▣" },
  crimes: { label: "Crimes", icon: "◈" },
  fight: { label: "Fight", icon: "⚡" },
  hospital: { label: "Hospital", icon: "+" },
  travel: { label: "Travel", icon: "➤" },
  bank: { label: "Bank", icon: "$" },
  inventory: { label: "Inventory", icon: "◍" },
  shops: { label: "Shops", icon: "⚒" },
  train: { label: "Train", icon: "▲" },
  forums: { label: "Forums", icon: "☰" },
  jail: { label: "Jail", icon: "⛓" },
  log: { label: "Log", icon: "✦" },
  premium: { label: "Premium", icon: "★" },
};
const ENERGY_MS = 10 * 60 * 1000;
const FIVE_MS = 5 * 60 * 1000;
const JOB_LOCK_MS = 24 * 60 * 60 * 1000;


const SLOT_LABELS: Record<string, string> = {
  primary: "Primary Weapons",
  secondary: "Secondary Weapons",
  melee: "Melee Weapons",
  head: "Head",
  chest: "Chest",
  legs: "Legs",
  feet: "Feet",
  utility: "Utility",
};

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};

const fmtPremiumDays = (ms: number) => {
  const days = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  return `${days} day${days === 1 ? "" : "s"}`;
};

const untilBoundary = (now: number, interval: number) => {
  const elapsed = now % interval;
  return elapsed === 0 ? 0 : interval - elapsed;
};

const noticeBg = (kind: ActionResult["kind"]) =>
  kind === "pass" ? "#17361d" : kind === "fail" ? "#4f340f" : kind === "jail" ? "#4a1717" : "#1f2a36";

const fmtRespect = (value: number) => {
  const rounded = Number(value || 0);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

function getEquippedStatBonus(state: any, key: string) {
  return EQUIPMENT_SLOTS.map((slot) => state.equipped?.[slot] || null)
    .map((id: string | null) => ITEMS.find((i) => i.id === id)?.effect?.[key as keyof (typeof ITEMS)[number]["effect"]] || 0)
    .reduce((sum: number, value: number) => sum + Number(value || 0), 0);
}

function getEquippedPctBonus(state: any, key: string) {
  return EQUIPMENT_SLOTS.map((slot) => state.equipped?.[slot] || null)
    .map((id: string | null) => ITEMS.find((i) => i.id === id)?.effect?.[key as keyof (typeof ITEMS)[number]["effect"]] || 0)
    .reduce((sum: number, value: number) => sum + Number(value || 0), 0);
}

function applyPctModifier(value: number, pct: number) {
  return Number((Number(value || 0) * (1 + Number(pct || 0) / 100)).toFixed(2));
}

function getMaxHealthForState(state: any) {
  const bonusPct = getEquippedStatBonus(state, "maxHealthPct");
  return Math.max(100, Math.round(100 * (1 + bonusPct / 100)));
}

function effectSummary(item: any) {
  const bits: string[] = [];
  if (item.effect?.combat) bits.push(`Combat +${item.effect.combat}`);
  if (item.effect?.combatPct) bits.push(`Combat +${item.effect.combatPct}%`);
  if (item.effect?.crime) bits.push(`Crime +${item.effect.crime}`);
  if (item.effect?.strength) bits.push(`Strength +${item.effect.strength}`);
  if (item.effect?.strengthPct) bits.push(`Strength +${item.effect.strengthPct}%`);
  if (item.effect?.defense) bits.push(`Defense +${item.effect.defense}`);
  if (item.effect?.defensePct) bits.push(`Defense +${item.effect.defensePct}%`);
  if (item.effect?.speed) bits.push(`Speed ${item.effect.speed > 0 ? "+" : ""}${item.effect.speed}`);
  if (item.effect?.speedPct) bits.push(`Speed ${item.effect.speedPct > 0 ? "+" : ""}${item.effect.speedPct}%`);
  if (item.effect?.maxHealthPct) bits.push(`Max health +${item.effect.maxHealthPct}%`);
  if (item.effect?.health) bits.push(`Heal ${item.effect.health}`);
  if (item.effect?.energy) bits.push(`Energy +${item.effect.energy}`);
  if (item.effect?.bravery) bits.push(`Bravery +${item.effect.bravery}`);
  if (item.effect?.hospitalReduceMinutes) bits.push(`Hospital -${item.effect.hospitalReduceMinutes}m`);
  return bits.join(" • ");
}



function HomePanel({ title, children, rightMeta }: { title: string; children: React.ReactNode; rightMeta?: React.ReactNode }) {
  return (
    <div style={homePanel}>
      <div style={homePanelHeader}>
        <strong>{title}</strong>
        {rightMeta ? <span style={homePanelMeta}>{rightMeta}</span> : null}
      </div>
      <div style={homePanelBody}>{children}</div>
    </div>
  );
}

function EquipmentCard({
  slot,
  item,
}: {
  slot: string;
  item: any | null;
}) {
  return (
    <div style={equipmentCard}>
      <div style={equipmentSlotLabel}>{SLOT_LABELS[slot] || slot}</div>
      <div style={equipmentItemName}>{item?.name || "Empty slot"}</div>
      <div style={equipmentItemBody}>{item ? effectSummary(item) : "Nothing equipped."}</div>
    </div>
  );
}
const FORUM_STORAGE_KEY = "metro_syndicate_forums_v9";
const TAB_STORAGE_KEY = "metro_syndicate_active_tab_v1";

function loadForumThreads(storageKey: string): ForumThread[] {
  const seed: ForumThread[] = [
    {
      id: "seed-update-1",
      category: "updates",
      title: "Welcome to Metro Syndicate",
      body: "Major balance and feature updates will be posted here.",
      author: "System",
      createdAt: new Date("2026-04-01T12:00:00Z").toISOString(),
    },
    {
      id: "seed-faq-1",
      category: "faqs",
      title: "How does Premium work?",
      body: "Premium adds +50 max energy, 10 energy every 10 minutes, 1 bravery every 4 minutes, and 100 premium coins per billing cycle.",
      author: "System",
      createdAt: new Date("2026-04-01T12:05:00Z").toISOString(),
    },
    {
      id: "seed-suggestions-1",
      category: "suggestions",
      title: "Suggestion board",
      body: "Post ideas for crimes, shops, crews, and new systems here.",
      author: "System",
      createdAt: new Date("2026-04-01T12:10:00Z").toISOString(),
    },
  ];

  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return seed;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : seed;
  } catch {
    return seed;
  }
}

function saveForumThreads(threads: ForumThread[], storageKey: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(threads));
  } catch {}
}

function loadSavedTab(handle: string): Tab {
  if (typeof window === "undefined" || !handle) return "home";
  try {
    const raw = window.localStorage.getItem(`${TAB_STORAGE_KEY}_${handle}`);
    const validTabs: Tab[] = [...TABS, "premium"];
    return raw && validTabs.includes(raw as Tab) ? (raw as Tab) : "home";
  } catch {
    return "home";
  }
}

function saveSavedTab(handle: string, tab: Tab) {
  if (typeof window === "undefined" || !handle) return;
  try {
    window.localStorage.setItem(`${TAB_STORAGE_KEY}_${handle}`, tab);
  } catch {}
}

function crimeChance(crimeId: string, state: any) {
  const crime = CRIMES.find((c) => c.id === crimeId);
  if (!crime) return 0;
  const level = getLevelFromRespect(Number(state.respect || 0));
  const job = JOBS.find((j) => j.id === state.job) || JOBS[0];
  const skill = Number(state.crimeSkills?.[crime.categoryId] || 0);
  const equippedCrime = EQUIPMENT_SLOTS.map((slot) => state.equipped?.[slot] || null)
    .map((id: string | null) => ITEMS.find((i) => i.id === id)?.effect?.crime || 0)
    .reduce((sum: number, value: number) => sum + Number(value || 0), 0);
  const speed = applyPctModifier(
    Number(state.speed || 0) + Number(job.bonus?.speed || 0) + getEquippedStatBonus(state, "speed"),
    getEquippedPctBonus(state, "speedPct"),
  );
  const strength = applyPctModifier(
    Number(state.strength || 0) + Number(job.bonus?.strength || 0) + getEquippedStatBonus(state, "strength"),
    getEquippedPctBonus(state, "strengthPct"),
  );
  const defense = applyPctModifier(
    Number(state.defense || 0) + Number(job.bonus?.defense || 0) + getEquippedStatBonus(state, "defense"),
    getEquippedPctBonus(state, "defensePct"),
  );
  const raw = 38 + level * 0.55 + speed * 1.1 + strength * 0.55 + defense * 0.35 + Number(job.bonus?.crime || 0) + equippedCrime + skill * 0.28 - crime.difficulty;
  return Math.max(5, Math.min(97, Math.round(raw)));
}

function Row({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div style={row}>
      <div style={{ minWidth: 0 }}>
        <div style={rowTitle}>{title}</div>
        <div style={rowBody}>{body}</div>
      </div>
      {children}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={mini}>
      <div style={miniLabel}>{label}</div>
      <div style={miniValue}>{value}</div>
    </div>
  );
}

function Bar({ label, value, max, sub, fillColor }: { label: string; value: number; max: number; sub: string; fillColor: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div style={statusShell}>
      <div style={{ ...statusBarFrame, borderColor: fillColor }}>
        <div style={{ ...fill, width: `${pct}%`, background: fillColor }} />
        <div style={statusBarText}>
          <span>{label}</span>
          <strong>{value}/{max}</strong>
        </div>
      </div>
      <div style={statusSub}>{sub}</div>
    </div>
  );
}

export default function App() {
  const [handle, setHandle] = useState("");
  const [data, setData] = useState<Bootstrap | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const [now, setNow] = useState(Date.now());
  const [openCrimeCategory, setOpenCrimeCategory] = useState<string | null>(CRIME_CATEGORIES[0]?.id || null);
  const [openShop, setOpenShop] = useState<string | null>("weapons");
  const [showAffordableOnly, setShowAffordableOnly] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [forumCategory, setForumCategory] = useState<ForumCategory>("updates");
  const [forumThreads, setForumThreads] = useState<ForumThread[]>([]);
  const [forumTitle, setForumTitle] = useState("");
  const [forumBody, setForumBody] = useState("");
  const [forumReady, setForumReady] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const activeHandle = (authUser?.handle || handle || "").trim();
  const forumStorageKey = `${FORUM_STORAGE_KEY}_${activeHandle || "guest"}`;

  const deriveNoticeFromPayload = (nextPayload: any) => {
    const nextData = nextPayload?.bootstrap || nextPayload;
    const latestLog = nextData?.player?.state?.log?.[0];
    if (!latestLog || typeof latestLog !== "string") return null;

    const text = latestLog.toLowerCase();
    if (text.includes("jailed")) {
      return { kind: "jail" as const, title: "Jailed", message: latestLog };
    }
    if (
      text.includes("failed") ||
      text.includes("lost") ||
      text.includes("not enough") ||
      text.includes("hospital") ||
      text.includes("took ")
    ) {
      return { kind: "fail" as const, title: "Setback", message: latestLog };
    }
    if (
      text.includes("succeeded") ||
      text.includes("beat ") ||
      text.includes("bought ") ||
      text.includes("equipped ") ||
      text.includes("used ") ||
      text.includes("travelled") ||
      text.includes("collected") ||
      text.includes("deposited") ||
      text.includes("withdrew") ||
      text.includes("founded crew") ||
      text.includes("revived") ||
      text.includes("bailed") ||
      text.includes("busted")
    ) {
      return { kind: "pass" as const, title: "Success", message: latestLog };
    }
    return { kind: "info" as const, title: "Update", message: latestLog };
  };

  const showErrorNotice = (message: string) => {
    setErr(message);
    setNotice({ kind: "fail", title: "Action failed", message });
  };

  const apply = (payload: any, options?: { deriveNotice?: boolean; clearNotice?: boolean }) => {
    if (!payload) return;
    const deriveNotice = options?.deriveNotice ?? true;

    if (options?.clearNotice) {
      setNotice(null);
    }

    if (payload.bootstrap) {
      setData(payload.bootstrap as Bootstrap);
      if (payload.actionResult) {
        setNotice(payload.actionResult as ActionResult);
      } else if (deriveNotice) {
        const derived = deriveNoticeFromPayload(payload);
        if (derived) setNotice(derived);
      }
    } else {
      setData(payload as Bootstrap);
      if (deriveNotice) {
        const derived = deriveNoticeFromPayload(payload);
        if (derived) setNotice(derived);
      }
    }
  };

  const load = async (forcedHandle?: string) => {
    const targetHandle = (forcedHandle || activeHandle).trim();
    if (!targetHandle) return;
    setErr("");
    try {
      apply(
        await apiCall("/api/demo/register", { method: "POST", body: JSON.stringify({ handle: targetHandle }) }),
        { deriveNotice: false, clearNotice: true }
      );
    } catch (e: any) {
      showErrorNotice(e.message);
    }
  };

  const bootstrapAuthenticatedUser = async (userHandle: string, resetToHome = false) => {
    setHandle(userHandle);
    setTab(resetToHome ? "home" : loadSavedTab(userHandle));
    apply(await apiCall("/api/demo/register", {
      method: "POST",
      body: JSON.stringify({ handle: userHandle }),
    }), { deriveNotice: false, clearNotice: true });
  };

  const login = async () => {
    setErr("");
    const result = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    setAuthUser(result.user);
    await bootstrapAuthenticatedUser(result.user.handle, true);
  };

  const register = async () => {
    setErr("");
    const result = await apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        handle: identifier,
        email,
        password,
      }),
    });
    setAuthUser(result.user);
    await bootstrapAuthenticatedUser(result.user.handle, true);
  };

  const logout = async () => {
    setErr("");
    try {
      await apiCall("/auth/logout", { method: "POST" });
    } catch {}
    setAuthUser(null);
    setData(null);
    setHandle("");
    setIdentifier("");
    setEmail("");
    setPassword("");
    setTab("home");
    setNotice(null);
    setDepositAmount("");
    setWithdrawAmount("");
    setForumTitle("");
    setForumBody("");
  };

  const refresh = async () => {
    if (!activeHandle) return;
    try {
      apply(await apiCall(`/api/demo/${activeHandle}/bootstrap`), {
        deriveNotice: false,
        clearNotice: true,
      });
    } catch {}
  };

  const runAction = async (action: any) => {
    setErr("");
    try {
      apply(await apiCall(`/api/demo/${activeHandle}/actions`, { method: "POST", body: JSON.stringify({ action }) }));
    } catch (e: any) {
      showErrorNotice(e.message);
    }
  };

  const runJail = async (id: string, mode: "bail" | "bust") => {
    setErr("");
    try {
      apply(await apiCall(`/api/demo/${activeHandle}/jail/${id}/${mode}`, { method: "POST" }));
    } catch (e: any) {
      showErrorNotice(e.message);
    }
  };

  const runRevive = async (id: string) => {
    setErr("");
    try {
      apply(await apiCall(`/api/demo/${activeHandle}/hospital/${id}/revive`, { method: "POST" }));
    } catch (e: any) {
      showErrorNotice(e.message);
    }
  };

  const runBankAction = async (
    type: "personalDeposit" | "personalWithdraw",
    rawAmount: string,
    onSuccess?: () => void,
  ) => {
    const amount = Math.floor(Number(rawAmount));
    if (!Number.isFinite(amount) || amount <= 0) {
      showErrorNotice(type === "personalDeposit" ? "Enter a valid deposit amount" : "Enter a valid withdrawal amount");
      return;
    }

    setErr("");
    try {
      apply(await apiCall(`/api/demo/${activeHandle}/actions`, {
        method: "POST",
        body: JSON.stringify({ action: { type, amount } }),
      }));
      onSuccess?.();
    } catch (e: any) {
      showErrorNotice(e.message);
    }
  };

  const createForumThread = () => {
    setErr("");
    const cleanTitle = forumTitle.trim();
    const cleanBody = forumBody.trim();
    if (cleanTitle.length < 4) {
      setErr("Thread title must be at least 4 characters.");
      return;
    }
    if (cleanBody.length < 8) {
      setErr("Thread body must be at least 8 characters.");
      return;
    }
    const thread: ForumThread = {
      id: `thread-${Date.now()}`,
      category: forumCategory,
      title: cleanTitle.slice(0, 80),
      body: cleanBody.slice(0, 600),
      author: activeHandle || "Anonymous",
      createdAt: new Date().toISOString(),
    };
    setForumThreads([thread, ...forumThreads]);
    setForumTitle("");
    setForumBody("");
    setNotice({ kind: "info", title: "Thread posted", message: `New ${forumCategory} thread posted to Forums.` });
  };

  useEffect(() => {
    const init = async () => {
      try {
        const me = await apiCall("/auth/me");
        if (me?.user) {
          setAuthUser(me.user);
          await bootstrapAuthenticatedUser(me.user.handle);
        }
      } catch {}
      setAuthChecked(true);
    };

    init().catch(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    setForumReady(false);
    setForumThreads(loadForumThreads(forumStorageKey));
    setForumReady(true);
  }, [forumStorageKey]);

  useEffect(() => {
    if (!activeHandle) return;
    saveSavedTab(activeHandle, tab);
  }, [activeHandle, tab]);


  useEffect(() => {
    const refreshTimer = window.setInterval(() => refresh(), 60_000);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, [activeHandle]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!authChecked) {
    return <div style={loading}>Checking session…</div>;
  }

  if (!authUser) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundImage: `linear-gradient(rgba(7,9,13,0.48), rgba(7,9,13,0.68)), url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: 540,
            maxWidth: "92vw",
            display: "grid",
            gap: 12,
            justifyItems: "stretch",
          }}
        >
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            style={{
              ...input,
              minHeight: 72,
              background: "linear-gradient(180deg, rgba(5,7,10,0.92) 0%, rgba(8,10,14,0.88) 100%)",
              border: "1px solid rgba(84,96,112,0.58)",
              color: "#f5f1eb",
              fontSize: 24,
              padding: "0 32px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
              backdropFilter: "blur(2px)",
            }}
            placeholder={isRegister ? "Handle" : "Email or handle"}
          />

          {isRegister ? (
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                ...input,
                minHeight: 70,
                background: "linear-gradient(180deg, rgba(11,14,20,0.82) 0%, rgba(15,18,24,0.72) 100%)",
                border: "1px solid rgba(124,140,160,0.5)",
                color: "#f5f1eb",
                fontSize: 20,
                padding: "0 32px",
                boxShadow: "0 10px 24px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.06)",
                backdropFilter: "blur(2px)",
              }}
              placeholder="Email"
            />
          ) : null}

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              ...input,
              minHeight: 72,
              background: "linear-gradient(180deg, rgba(5,7,10,0.92) 0%, rgba(8,10,14,0.88) 100%)",
              border: "1px solid rgba(84,96,112,0.58)",
              color: "#f5f1eb",
              fontSize: 24,
              padding: "0 32px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
              backdropFilter: "blur(2px)",
            }}
            placeholder="Password"
          />

          {err ? (
            <div
              style={{
                color: "#ff4d3d",
                fontSize: 18,
                fontWeight: 800,
                textAlign: "center",
                textShadow: "0 2px 8px rgba(0,0,0,0.45)",
                marginTop: 2,
              }}
            >
              {err}
            </div>
          ) : null}

          <button
            style={{
              ...btn,
              minHeight: 72,
              width: "100%",
              border: "1px solid rgba(255,120,120,0.55)",
              background: "linear-gradient(180deg, #f43625 0%, #cf1813 55%, #9d0f0f 100%)",
              color: "#fff5f2",
              fontSize: 24,
              fontWeight: 900,
              boxShadow: "0 10px 28px rgba(112,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.18)",
              textShadow: "0 1px 2px rgba(0,0,0,0.35)",
            }}
            onClick={() => (isRegister ? register() : login()).catch((e) => showErrorNotice(e.message))}
          >
            {isRegister ? "Create Account" : "Login"}
          </button>

          <button
            style={{
              ...subBtn,
              minHeight: 54,
              width: 280,
              justifySelf: "center",
              border: "1px solid rgba(90,100,115,0.6)",
              background: "linear-gradient(180deg, rgba(24,29,36,0.92) 0%, rgba(10,13,18,0.9) 100%)",
              color: "#f0ebe3",
              fontSize: 16,
              fontWeight: 700,
              boxShadow: "0 8px 18px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
            onClick={() => {
              setIsRegister((v) => !v);
              setErr("");
            }}
          >
            {isRegister ? "Switch to login" : "Switch to register"}
          </button>
        </div>
      </div>
    );
  }

  if (!data) return <div style={loading}>Loading Metro Syndicate…</div>;

  const state = data.player.state;
  const level = getLevelFromRespect(Number(state.respect || 0));
  const maxBravery = getMaxBravery(level);
  const job = JOBS.find((j) => j.id === state.job) || JOBS[0];
  const jailMs = state.jailUntil ? Math.max(0, new Date(state.jailUntil).getTime() - now) : 0;
  const hospitalMs = state.hospitalUntil ? Math.max(0, new Date(state.hospitalUntil).getTime() - now) : 0;
  const currentLevelFloor = getRespectForLevel(level);
  const nextLevelFloor = level >= 100 ? currentLevelFloor : getRespectForLevel(level + 1);
  const healthMax = getMaxHealthForState(state);
  const energyMax = getMaxEnergy(state);
  const premiumActive = !!state.premiumUntil && new Date(state.premiumUntil).getTime() > now;
  const premiumRemainingMs = premiumActive ? Math.max(0, new Date(state.premiumUntil).getTime() - now) : 0;
  const energyTickAmount = premiumActive ? 10 : 5;
  const braveryTickMs = premiumActive ? 4 * 60 * 1000 : FIVE_MS;
  const levelProgressPct = level >= 100 ? 100 : Math.max(0, Math.min(100, ((Number(state.respect || 0) - currentLevelFloor) / Math.max(1, nextLevelFloor - currentLevelFloor)) * 100));

  const payReady = (() => {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const key = `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}-${parts.find((p) => p.type === "day")?.value}`;
    return state.jobLastPaidOn !== key;
  })();

  const jobLock = state.jobChangedAt ? Math.max(0, new Date(state.jobChangedAt).getTime() + JOB_LOCK_MS - now) : 0;
  const travelCooldownMs = state.travelAvailableAt ? Math.max(0, new Date(state.travelAvailableAt).getTime() - now) : 0;
  const travelCooldownShortText = travelCooldownMs > 0 ? `Wait ${Math.ceil(travelCooldownMs / 60000)}m` : "Travel";
  const premiumPlan = state.premiumAutoRenew ? "continuous" : premiumActive ? "monthly" : "none";

  const getShopItemPrice = (item: any) => {
    const discount = Number(job.bonus?.itemDiscount || 0);
    return Math.max(1, Math.round(Number(item.price || 0) * (1 - discount)));
  };

  const canAffordItem = (item: any) => Number(state.cash || 0) >= getShopItemPrice(item);
  const getSellItemPrice = (item: any) => Math.max(1, Math.floor(Number(item.price || 0) / 3));

  const fightEnergyCost = 20;
  const fixedActionButtonStyle = (tone: "ready" | "blocked" | "neutral") : React.CSSProperties => ({
    ...btn,
    width: 168,
    minWidth: 168,
    maxWidth: 168,
    minHeight: 52,
    padding: "0 10px",
    fontSize: 14,
    lineHeight: 1.1,
    textAlign: "center",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "normal",
    wordBreak: "keep-all",
    borderColor:
      tone === "ready"
        ? "#4f8f5d"
        : tone === "blocked"
          ? "#a34d4d"
          : "#545a65",
    background:
      tone === "ready"
        ? "linear-gradient(180deg, #4f8f5d 0%, #2f613c 45%, #183321 100%)"
        : tone === "blocked"
          ? "linear-gradient(180deg, #a34d4d 0%, #6d2e2e 45%, #341616 100%)"
          : "linear-gradient(180deg, #6c717a 0%, #41464f 45%, #23272e 100%)",
  });

  const inventoryActionWrap: React.CSSProperties = {
    display: "grid",
    gap: 8,
    justifyItems: "end",
    alignContent: "center",
    minWidth: 148,
  };

  const inventoryActionButton: React.CSSProperties = {
    ...btn,
    width: 148,
    minWidth: 148,
    maxWidth: 148,
    minHeight: 42,
    padding: "0 12px",
    fontSize: 14,
    justifyContent: "center",
  };


  const crimeGroups = CRIME_CATEGORIES.map((cat) => ({
    ...cat,
    skill: Number(state.crimeSkills?.[cat.id] || 0),
    crimes: CRIMES.filter((crime) => crime.categoryId === cat.id),
  }));

  const ownedItems = ITEMS.filter((item) => Number(state.inventory?.[item.id] || 0) > 0);
  const ownedBySlot = Object.fromEntries(
    [...EQUIPMENT_SLOTS, "medical", "utility_use"].map((slot) => [slot, ownedItems.filter((item) => item.type === slot)])
  ) as Record<string, any[]>;
  const forumThreadsForCategory = forumThreads.filter((thread) => thread.category === forumCategory);

const shopGroups = [
  {
    id: "weapons",
    name: "Armed and Hammered",
    subtitle: "Primary, secondary, and melee weapons with percentage-based combat and strength modifiers.",
    items: ITEMS.filter((item) => item.shop === "weapons"),
  },
  {
    id: "armor",
    name: "Titanstone Blacksmiths",
    subtitle: "Head, chest, legs, and feet armour with percentage-based defense and speed modifiers.",
    items: ITEMS.filter((item) => item.shop === "armor"),
  },
  {
    id: "medical",
    name: "CityCare RX",
    subtitle: "Medical kits and hospital time reduction contracts.",
    items: ITEMS.filter((item) => item.shop === "medical"),
  },
  {
    id: "utilities",
    name: "Odds & Sods",
    subtitle: "Utility gear, max-health boosters, and support consumables.",
    items: ITEMS.filter((item) => item.shop === "utilities"),
  },
];

  const battleStats = [
    {
      label: "Strength",
      base: Number(state.strength || 0),
      flat: getEquippedStatBonus(state, "strength"),
      pct: getEquippedPctBonus(state, "strengthPct"),
    },
    {
      label: "Defense",
      base: Number(state.defense || 0),
      flat: getEquippedStatBonus(state, "defense"),
      pct: getEquippedPctBonus(state, "defensePct"),
    },
    {
      label: "Speed",
      base: Number(state.speed || 0),
      flat: getEquippedStatBonus(state, "speed"),
      pct: getEquippedPctBonus(state, "speedPct"),
    },
  ].map((row) => {
    const boostedBase = row.base + row.flat;
    const effective = applyPctModifier(boostedBase, row.pct);
    const modPct = row.base > 0 ? Math.round(((effective - row.base) / row.base) * 100) : 0;
    return { ...row, effective, modPct };
  });

  const baseBattleTotal = battleStats.reduce((sum, row) => sum + row.base, 0);
  const effectiveBattleTotal = Number(battleStats.reduce((sum, row) => sum + row.effective, 0).toFixed(2));
  const recentAttackLog = (state.log || [])
    .filter((entry: string) => /(beat|lost|fight|attacked|hospital|revived|jailed)/i.test(entry))
    .slice(0, 6);

  const homeEquipmentSlots = ["primary", "secondary", "melee", "head", "chest", "legs", "feet"];
  const homeEquippedItems = homeEquipmentSlots.map((slot) => ({
    slot,
    item: ITEMS.find((entry) => entry.id === state.equipped?.[slot]) || null,
  }));

  const isJailed = jailMs > 0;
  const isHospitalized = hospitalMs > 0;
  const restrictedNavTabs: Tab[] = isJailed
    ? ["home", "jail", "train", "forums", "log"]
    : isHospitalized
      ? ["home", "hospital", "inventory", "forums", "log"]
      : TABS;
  const showPremiumNav = !isJailed;
  const currentTab: Tab = ((tab === "premium" && showPremiumNav) || restrictedNavTabs.includes(tab)) ? tab : "home";
  const isOwnJailRow = (row: { id: string; handle: string }) => row.id === data.player.id || row.handle === activeHandle;
  const isOwnHospitalRow = (row: { id: string; handle: string }) => row.id === data.player.id || row.handle === activeHandle;

  const renderInventoryActionButtons = (item: any, mode: "equip" | "use") => (
    <div style={inventoryActionWrap}>
      <button
        style={inventoryActionButton}
        disabled={(state.inventory[item.id] || 0) <= 0}
        onClick={() => runAction({ type: "useItem", itemId: item.id })}
      >
        {mode === "equip" ? "Equip" : "Use"}
      </button>
      <button
        style={{
          ...inventoryActionButton,
          ...subBtn,
          background: "linear-gradient(180deg, #6b5151 0%, #4f3a3a 50%, #302424 100%)",
        }}
        disabled={(state.inventory[item.id] || 0) <= 0}
        onClick={() => runAction({ type: "sellItem", itemId: item.id })}
      >
        Sell for $${getSellItemPrice(item)}
      </button>
    </div>
  );

  return (
    <div style={page}>
      <div style={layout}>
        <aside style={left}>
          {restrictedNavTabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={t === currentTab ? navOn : navOff}>
              <span style={navIcon}>{NAV_META[t].icon}</span>
              <span>{NAV_META[t].label}</span>
            </button>
          ))}
          {showPremiumNav ? (
            <button onClick={() => setTab("premium")} style={currentTab === "premium" ? premiumNavOn : premiumNavOff}>
              <span style={navIcon}>★</span>
              <span>Premium</span>
            </button>
          ) : null}
          <div style={panel}>
            <div style={muted}>Account</div>
            <div>{authUser?.handle || "Not logged in"}</div>
            <div style={{ ...muted, fontSize: 12 }}>Live test account bound to session</div>
            <button style={subBtn} onClick={() => logout().catch((e) => showErrorNotice(e.message))}>Logout</button>
          </div>
        </aside>

        <main style={center}>
          <div style={title}>{NAV_META[currentTab].label}</div>
          {err ? <div style={errorBox}>{err}</div> : null}
          {notice ? (
            <div style={toastWrap}>
              <div style={{ ...toastCard, background: noticeBg(notice.kind), borderColor: "#66717d" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <strong>{notice.title}</strong>
                  <button style={linkBtn} onClick={() => setNotice(null)}>x</button>
                </div>
                <div style={toastMessage}>{notice.message}</div>
              </div>
            </div>
          ) : null}


          {currentTab === "home" && (
            <div style={section}>
              <div style={grid4}>
                <Mini label="Level" value={String(level)} />
                <Mini label="Respect" value={fmtRespect(Number(state.respect || 0))} />
                <Mini label="Crime W/L" value={`${state.crimesSucceeded}/${state.crimesFailed}`} />
                <Mini label="Busting XP" value={`${state.bustingExp || 0}%`} />
              </div>

              <div style={homeTopGrid}>
                <HomePanel title="Battle Stats" rightMeta={`Effective total ${effectiveBattleTotal.toLocaleString()}`}>
                  <div style={battleTable}>
                    <div style={battleHeaderCell}>Stat</div>
                    <div style={battleHeaderCell}>Base</div>
                    <div style={battleHeaderCell}>Effective</div>
                    <div style={battleHeaderCell}>Modifier</div>
                    {battleStats.map((row) => (
                      <React.Fragment key={row.label}>
                        <div style={battleNameCell}>{row.label}</div>
                        <div style={battleValueCell}>{row.base.toLocaleString()}</div>
                        <div style={battleValueCell}>{row.effective.toLocaleString()}</div>
                        <div style={{ ...battleModCell, color: row.modPct >= 0 ? "#7fd66d" : "#e07b7b" }}>
                          {row.modPct >= 0 ? "+" : ""}{row.modPct}%
                        </div>
                      </React.Fragment>
                    ))}
                    <div style={{ ...battleNameCell, fontWeight: 900 }}>Total</div>
                    <div style={{ ...battleValueCell, fontWeight: 900 }}>{baseBattleTotal.toLocaleString()}</div>
                    <div style={{ ...battleValueCell, fontWeight: 900 }}>{effectiveBattleTotal.toLocaleString()}</div>
                    <div style={{ ...battleModCell, fontWeight: 900, color: "#7fd66d" }}>
                      {baseBattleTotal > 0 ? `+${Math.round(((effectiveBattleTotal - baseBattleTotal) / baseBattleTotal) * 100)}%` : "+0%"}
                    </div>
                  </div>
                </HomePanel>

                <HomePanel title="Latest Attacks" rightMeta={`${state.wins || 0}W / ${state.losses || 0}L`}>
                  <div style={activityList}>
                    {recentAttackLog.length === 0 ? (
                      <div style={activityItem}>No recent attack entries yet.</div>
                    ) : (
                      recentAttackLog.map((entry: string, index: number) => (
                        <div key={`${entry}-${index}`} style={activityItem}>
                          {entry}
                        </div>
                      ))
                    )}
                  </div>
                </HomePanel>
              </div>

              <HomePanel title="Equipped Weapons & Armor" rightMeta={`${homeEquippedItems.filter((entry) => entry.item).length}/${homeEquippedItems.length} equipped`}>
                <div style={equipmentGrid}>
                  {homeEquippedItems.map((entry) => (
                    <EquipmentCard key={entry.slot} slot={entry.slot} item={entry.item} />
                  ))}
                </div>
              </HomePanel>

              <div style={panel}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>Level Progress</strong>
                  <span>{level >= 100 ? "MAX" : `${fmtRespect(Number(state.respect || 0) - currentLevelFloor)}/${fmtRespect(nextLevelFloor - currentLevelFloor)}`}</span>
                </div>
                <div style={track}><div style={{ ...fill, width: `${levelProgressPct}%`, background: "#7f63db" }} /></div>
                <div style={muted}>
                  {level >= 100
                    ? "Maximum level reached."
                    : `Current level starts at ${fmtRespect(currentLevelFloor)} respect. Next level starts at ${fmtRespect(nextLevelFloor)} respect and the next level gap is ${fmtRespect(getRespectNeededForNextLevel(level))} respect.`}
                </div>
              </div>

              {data.contracts.map((c) => (
                <Row key={c.id} title={c.title} body={c.body}>
                  <button style={btn} onClick={() => apiCall(`/api/demo/${activeHandle}/contracts/${c.id}/claim`, { method: "POST" }).then(apply).catch((e) => showErrorNotice(e.message))}>Claim</button>
                </Row>
              ))}
            </div>
          )}

          {currentTab === "jobs" && (
            <div style={section}>
              <Row title={job.name} body={`${job.bonusText} • Daily pay $${job.pay}`}>
                <button style={btn} disabled={!payReady} onClick={() => runAction({ type: "collectJobPay" })}>
                  {payReady ? "Collect Pay" : "Paid Today"}
                </button>
              </Row>
              <div style={muted}>{jobLock > 0 ? `Job switch locked for ${fmt(jobLock)}` : "You can change jobs now."}</div>
              {JOBS.map((j) => (
                <Row key={j.id} title={j.name} body={`Unlock level ${j.levelReq} • ${j.bonusText}`}>
                  <button style={btn} disabled={j.id === state.job || level < j.levelReq || jobLock > 0 || jailMs > 0 || hospitalMs > 0} onClick={() => runAction({ type: "takeJob", jobId: j.id })}>
                    {j.id === state.job ? "Active" : level < j.levelReq ? `Lvl ${j.levelReq}` : jobLock > 0 ? "Locked" : "Take Job"}
                  </button>
                </Row>
              ))}
            </div>
          )}

          {currentTab === "crimes" && (
            <div style={section}>
              <div style={muted}>Crime skill progression only affects the category you are currently running.</div>
              {crimeGroups.map((group) => {
                const open = openCrimeCategory === group.id;
                return (
                  <div key={group.id} style={crimeBox}>
                    <button
                      style={crimeToggle}
                      onClick={() => setOpenCrimeCategory(open ? null : group.id)}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{group.name}</div>
                        <div style={muted}>Category skill {group.skill}% • {group.crimes.length} crimes</div>
                      </div>
                      <div style={{ fontWeight: 800 }}>{open ? "−" : "+"}</div>
                    </button>

                    {open ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        {group.crimes.map((crime) => (
                          <Row
                            key={crime.id}
                            title={crime.name}
                            body={`Lvl ${crime.levelReq} • Chance ${crimeChance(crime.id, state)}% • $${crime.cash} • ${crime.bravery} bravery • +${crime.xpGain}% ${group.name} skill • jail loss ${crime.xpLoss}%`}
                          >
                            <button
                              style={fixedActionButtonStyle(
                                Number(state.bravery || 0) < crime.bravery
                                  ? "blocked"
                                  : jailMs > 0 || hospitalMs > 0 || level < crime.levelReq
                                    ? "neutral"
                                    : "ready"
                              )}
                              disabled={jailMs > 0 || hospitalMs > 0 || level < crime.levelReq || (Number(state.bravery || 0) < crime.bravery)}
                              onClick={() => runAction({ type: "crime", crimeId: crime.id })}
                            >
                              {jailMs > 0
                                ? "Jailed"
                                : hospitalMs > 0
                                  ? "Hospitalized"
                                  : level < crime.levelReq
                                    ? `Lvl ${crime.levelReq}`
                                    : Number(state.bravery || 0) < crime.bravery
                                      ? "Not enough bravery"
                                      : "Attempt"}
                            </button>
                          </Row>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {currentTab === "fight" && (
            <div style={section}>
              {RIVALS.map((r) => (
                <Row key={r.id} title={r.name} body={`${r.note} • power ${r.power} • reward $${r.reward} • costs ${fightEnergyCost} energy`}>
                  <button
                    style={fixedActionButtonStyle(
                      Number(state.energy || 0) < fightEnergyCost
                        ? "blocked"
                        : jailMs > 0 || hospitalMs > 0
                          ? "neutral"
                          : "ready"
                    )}
                    disabled={jailMs > 0 || hospitalMs > 0 || Number(state.energy || 0) < fightEnergyCost}
                    onClick={() => runAction({ type: "fightRival", rivalId: r.id })}
                  >
                    {jailMs > 0
                      ? "Jailed"
                      : hospitalMs > 0
                        ? "Hospitalized"
                        : Number(state.energy || 0) < fightEnergyCost
                          ? "Not enough energy"
                          : "Fight"}
                  </button>
                </Row>
              ))}
            </div>
          )}

          {currentTab === "hospital" && (
            <div style={section}>
              <div style={muted}>
                Fight losers are sent to hospital for a random time between 15 and 60 minutes. Reviving any hospitalized player costs 50 energy.
              </div>
              {data.hospitalRoster.length === 0 ? <div style={muted}>No one is in hospital currently.</div> : null}
              {data.hospitalRoster.map((h) => (
                <Row key={h.id} title={h.handle} body={`Remaining ${h.remainingMinutes} minutes • Revive cost 50 energy`}>
                  {isOwnHospitalRow(h) ? (
                    <span style={muted}>You cannot revive yourself.</span>
                  ) : (
                    <button
                      style={fixedActionButtonStyle(
                        Number(state.energy || 0) < 50
                          ? "blocked"
                          : jailMs > 0 || hospitalMs > 0
                            ? "neutral"
                            : "ready"
                      )}
                      disabled={Number(state.energy || 0) < 50 || jailMs > 0 || hospitalMs > 0}
                      onClick={() => runRevive(h.id)}
                    >
                      {Number(state.energy || 0) < 50
                        ? "Not enough energy"
                        : jailMs > 0
                          ? "Jailed"
                          : hospitalMs > 0
                            ? "Hospitalized"
                            : "Revive"}
                    </button>
                  )}
                </Row>
              ))}
            </div>
          )}

          {currentTab === "travel" && (
            <div style={section}>
              {travelCooldownMs > 0 ? <div style={muted}>Travel available again in {fmt(travelCooldownMs)}.</div> : null}
              {CITIES.map((c) => (
                <Row key={c.id} title={c.name} body={c.vibe}>
                  <button
                    style={fixedActionButtonStyle(
                      state.city === c.id
                        ? "neutral"
                        : travelCooldownMs > 0 || jailMs > 0 || hospitalMs > 0
                          ? "neutral"
                          : "ready"
                    )}
                    disabled={jailMs > 0 || hospitalMs > 0 || state.city === c.id || travelCooldownMs > 0}
                    onClick={() => runAction({ type: "travel", cityId: c.id })}
                  >
                    {state.city === c.id
                      ? "Here"
                      : jailMs > 0
                        ? "Jailed"
                        : hospitalMs > 0
                          ? "Hospitalized"
                          : travelCooldownMs > 0
                            ? travelCooldownShortText
                            : "Travel"}
                  </button>
                </Row>
              ))}
            </div>
          )}

          {currentTab === "inventory" && (
            <div style={section}>
              {ownedItems.length === 0 ? <div style={muted}>Inventory is empty. Buy items from Shops.</div> : null}

              {isHospitalized ? (
                <>
                  <div style={crimeBox}>
                    <div style={groupHeader}>Utility Gear</div>
                    <div style={muted}>Only utility items are available while you are in hospital.</div>
                    <div style={muted}>Equipped: {state.equipped?.utility ? ITEMS.find((i) => i.id === state.equipped.utility)?.name || state.equipped.utility : "None"}</div>
                    {(ownedBySlot["utility"] || []).length === 0 ? (
                      <div style={muted}>No utility gear owned.</div>
                    ) : (
                      (ownedBySlot["utility"] || []).map((item) => (
                        <Row key={item.id} title={item.name} body={`${item.desc} • ${effectSummary(item)} • owned ${state.inventory[item.id] || 0}`}>
                          {renderInventoryActionButtons(item, "equip")}
                        </Row>
                      ))
                    )}
                  </div>

                  <div style={crimeBox}>
                    <div style={groupHeader}>Utility Items</div>
                    {(ownedBySlot["utility_use"] || []).length === 0 ? (
                      <div style={muted}>No utility consumables owned.</div>
                    ) : (
                      (ownedBySlot["utility_use"] || []).map((item) => (
                        <Row key={item.id} title={item.name} body={`${item.desc} • ${effectSummary(item)} • owned ${state.inventory[item.id] || 0}`}>
                          {renderInventoryActionButtons(item, "use")}
                        </Row>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  {EQUIPMENT_SLOTS.map((slot) => (
                    <div key={slot} style={crimeBox}>
                      <div style={groupHeader}>{SLOT_LABELS[slot]}</div>
                      <div style={muted}>Equipped: {state.equipped?.[slot] ? ITEMS.find((i) => i.id === state.equipped[slot])?.name || state.equipped[slot] : "None"}</div>
                      {(ownedBySlot[slot] || []).length === 0 ? (
                        <div style={muted}>No owned items for this slot.</div>
                      ) : (
                        (ownedBySlot[slot] || []).map((item) => (
                          <Row key={item.id} title={item.name} body={`${item.desc} • ${effectSummary(item)} • owned ${state.inventory[item.id] || 0}`}>
                            {renderInventoryActionButtons(item, "equip")}
                          </Row>
                        ))
                      )}
                    </div>
                  ))}

                  <div style={crimeBox}>
                    <div style={groupHeader}>Utility Items</div>
                    {(ownedBySlot["utility_use"] || []).length === 0 ? (
                      <div style={muted}>No utility consumables owned.</div>
                    ) : (
                      (ownedBySlot["utility_use"] || []).map((item) => (
                        <Row key={item.id} title={item.name} body={`${item.desc} • ${effectSummary(item)} • owned ${state.inventory[item.id] || 0}`}>
                          {renderInventoryActionButtons(item, "use")}
                        </Row>
                      ))
                    )}
                  </div>

                  <div style={crimeBox}>
                    <div style={groupHeader}>Medical Items</div>
                    {(ownedBySlot["medical"] || []).length === 0 ? (
                      <div style={muted}>No medical items owned.</div>
                    ) : (
                      (ownedBySlot["medical"] || []).map((item) => (
                        <Row key={item.id} title={item.name} body={`${item.desc} • ${effectSummary(item)} • owned ${state.inventory[item.id] || 0}`}>
                          {renderInventoryActionButtons(item, "use")}
                        </Row>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
{currentTab === "shops" && (
  <div style={section}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={muted}>Click a shop to open or close its stock list.</div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#d9dde4", fontSize: 14, fontWeight: 700 }}>
        <input type="checkbox" checked={showAffordableOnly} onChange={(e) => setShowAffordableOnly(e.target.checked)} />
        Show only items I can afford
      </label>
    </div>
    {shopGroups.map((shop) => {
      const open = openShop === shop.id;
      const visibleItems = showAffordableOnly ? shop.items.filter((item) => canAffordItem(item)) : shop.items;
      return (
        <div key={shop.id} style={crimeBox}>
          <button
            style={crimeToggle}
            onClick={() => setOpenShop(open ? null : shop.id)}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{shop.name}</div>
              <div style={muted}>{shop.subtitle}</div>
            </div>
            <div style={{ fontWeight: 800 }}>{open ? "−" : "+"}</div>
          </button>

          {open ? (
            <div style={{ display: "grid", gap: 8 }}>
              {visibleItems.length === 0 ? <div style={muted}>No items in this shop match your current budget.</div> : null}
              {visibleItems.map((item) => {
                const price = getShopItemPrice(item);
                const affordable = canAffordItem(item);
                return (
                  <Row key={item.id} title={item.name} body={`${item.desc} • ${effectSummary(item)} • $${price}`}>
                    <button
                      style={fixedActionButtonStyle(affordable ? "ready" : "blocked")}
                      disabled={!affordable}
                      onClick={() => runAction({ type: "buyItem", itemId: item.id })}
                    >
                      {affordable ? "Buy" : "Not enough money"}
                    </button>
                  </Row>
                );
              })}
            </div>
          ) : null}
        </div>
      );
    })}
  </div>
)}


          {currentTab === "train" && (
            <div style={section}>
              <div style={muted}>Spend 5 energy to train one stat by 1 point.</div>
              <Row title="Strength" body={`Current ${state.strength} • Cost 5 energy`}>
                <button style={btn} disabled={jailMs > 0 || hospitalMs > 0 || Number(state.energy || 0) < 5} onClick={() => runAction({ type: "trainStat", stat: "strength" })}>Train</button>
              </Row>
              <Row title="Speed" body={`Current ${state.speed} • Cost 5 energy`}>
                <button style={btn} disabled={jailMs > 0 || hospitalMs > 0 || Number(state.energy || 0) < 5} onClick={() => runAction({ type: "trainStat", stat: "speed" })}>Train</button>
              </Row>
              <Row title="Defense" body={`Current ${state.defense} • Cost 5 energy`}>
                <button style={btn} disabled={jailMs > 0 || hospitalMs > 0 || Number(state.energy || 0) < 5} onClick={() => runAction({ type: "trainStat", stat: "defense" })}>Train</button>
              </Row>
            </div>
          )}


          {currentTab === "forums" && (
            <div style={section}>
              <div style={forumCategoryRow}>
                {(["updates", "faqs", "suggestions"] as ForumCategory[]).map((category) => (
                  <button
                    key={category}
                    style={forumCategory === category ? forumPillOn : forumPillOff}
                    onClick={() => setForumCategory(category)}
                  >
                    {category === "faqs" ? "FAQs" : category[0].toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              <div style={crimeBox}>
                <div style={groupHeader}>Create Thread</div>
                <div style={muted}>Players can create their own threads in any forum category.</div>
                <input value={forumTitle} onChange={(e) => setForumTitle(e.target.value)} style={input} placeholder="Thread title" />
                <textarea value={forumBody} onChange={(e) => setForumBody(e.target.value)} style={textarea} placeholder="Write your thread..." />
                <button style={btn} onClick={createForumThread}>Post Thread</button>
              </div>

              <div style={crimeBox}>
                <div style={groupHeader}>
                  {forumCategory === "faqs" ? "FAQs" : forumCategory[0].toUpperCase() + forumCategory.slice(1)} Threads
                </div>
                {forumThreadsForCategory.length === 0 ? <div style={muted}>No threads in this category yet.</div> : null}
                {forumThreadsForCategory.map((thread) => (
                  <div key={thread.id} style={item}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                      <strong>{thread.title}</strong>
                      <span style={muted}>{new Date(thread.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={muted}>By {thread.author}</div>
                    <div style={{ color: "#f2efe8", marginTop: 8, lineHeight: 1.4 }}>{thread.body}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentTab === "premium" && (
            <div style={section}>
              <div style={groupHeader}>Metro Syndicate Premium</div>
              <div style={muted}>Premium is simulated for live testing: monthly and continuous plans now update account state, premium timers, and premium coins inside the game.</div>

              <div style={crimeBox}>
                <div style={statRow}><span style={statLabel}>Status</span><strong>{premiumActive ? `Active • ${fmtPremiumDays(premiumRemainingMs)} left` : "Inactive"}</strong></div>
                <div style={statRow}><span style={statLabel}>Plan</span><strong>{premiumPlan === "continuous" ? "Continuous" : premiumPlan === "monthly" ? "Monthly" : "None"}</strong></div>
                <div style={statRow}><span style={statLabel}>Premium Coins</span><strong>{state.premiumCoins || 0}</strong></div>
                <div style={statRow}><span style={statLabel}>Max Energy</span><strong>{energyMax}</strong></div>
                <div style={statRow}><span style={statLabel}>Energy Tick</span><strong>{energyTickAmount} / 10m</strong></div>
                <div style={statRow}><span style={statLabel}>Bravery Tick</span><strong>{premiumActive ? "1 / 4m" : "1 / 5m"}</strong></div>
              </div>

              <Row title="Monthly Premium" body="£3.00 per month • adds 100 premium coins and extends the premium timer by 30 days.">
                <button style={premiumBtn} onClick={() => runAction({ type: "activatePremium", plan: "monthly" })}>
                  {premiumPlan === "monthly" ? "Extend Monthly £3.00" : "Buy Monthly £3.00"}
                </button>
              </Row>

              <Row title="Continuous Premium" body="£2.50 recurring • enables auto-renew, adds 100 premium coins, and extends the premium timer by 30 days.">
                <button style={premiumBtn} onClick={() => runAction({ type: "activatePremium", plan: "continuous" })}>
                  {premiumPlan === "continuous" ? "Renew Continuous £2.50" : "Start Continuous £2.50"}
                </button>
              </Row>

              {state.premiumAutoRenew ? (
                <button style={subBtn} onClick={() => runAction({ type: "cancelPremiumAutoRenew" })}>Cancel Continuous Renewal</button>
              ) : null}
            </div>
          )}


          {currentTab === "bank" && (
            <div style={section}>
              <div style={grid4}>
                <Mini label="Cash On Hand" value={`$${state.cash}`} />
                <Mini label="Bank Balance" value={`$${state.bank}`} />
                <Mini label="Total Funds" value={`$${Number(state.cash || 0) + Number(state.bank || 0)}`} />
                <Mini label="Status" value={jailMs > 0 ? "Jailed" : hospitalMs > 0 ? "Hospital" : "Available"} />
              </div>

              <div style={crimeBox}>
                <div style={groupHeader}>Deposit Money</div>
                <div style={muted}>Move money from cash into your bank account.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    style={{ ...input, width: 220 }}
                    placeholder="Deposit amount"
                  />
                  <button
                    style={btn}
                    disabled={Number(state.cash || 0) <= 0}
                    onClick={() => runBankAction("personalDeposit", depositAmount, () => setDepositAmount(""))}
                  >
                    Deposit
                  </button>
                  <button
                    style={subBtn}
                    disabled={Number(state.cash || 0) <= 0}
                    onClick={() => runBankAction("personalDeposit", String(Math.floor(Number(state.cash || 0))), () => setDepositAmount(""))}
                  >
                    Deposit All
                  </button>
                </div>
              </div>

              <div style={crimeBox}>
                <div style={groupHeader}>Withdraw Money</div>
                <div style={muted}>Move money from your bank back into cash on hand.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    style={{ ...input, width: 220 }}
                    placeholder="Withdraw amount"
                  />
                  <button
                    style={btn}
                    disabled={Number(state.bank || 0) <= 0}
                    onClick={() => runBankAction("personalWithdraw", withdrawAmount, () => setWithdrawAmount(""))}
                  >
                    Withdraw
                  </button>
                  <button
                    style={subBtn}
                    disabled={Number(state.bank || 0) <= 0}
                    onClick={() => runBankAction("personalWithdraw", String(Math.floor(Number(state.bank || 0))), () => setWithdrawAmount(""))}
                  >
                    Withdraw All
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentTab === "jail" && (
            <div style={section}>
              <div style={muted}>Bust chance uses busting experience, speed, and strength.</div>
              {data.jailRoster.length === 0 ? <div style={muted}>Nobody is currently in jail.</div> : null}
              {data.jailRoster.map((j) => (
                <Row key={j.id} title={j.handle} body={`Remaining ${j.remainingMinutes} minutes • Bail $${j.bailCost}`}>
                  {isOwnJailRow(j) ? (
                    <span style={muted}>You cannot bail or bust yourself out.</span>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={subBtn} onClick={() => runJail(j.id, "bail")}>Bail Out</button>
                      <button style={btn} onClick={() => runJail(j.id, "bust")}>Bust Out</button>
                    </div>
                  )}
                </Row>
              ))}
            </div>
          )}

          {currentTab === "log" && (
            <div style={section}>
              {state.log.map((x: string, i: number) => <div key={i} style={item}>{x}</div>)}
            </div>
          )}
        </main>

        <aside style={right}>
          <div style={profilePanel}>
            <div style={portraitWrap}>
              <div style={portraitCard}>MS</div>
              <div style={profileTextWrap}>
                <div style={profileName}>{data.player.handle}</div>
                <div style={profileLevel}>Level: {level}</div>
              </div>
            </div>
            <div style={statList}>
              <div style={statRow}><span style={statLabel}>Cash:</span><strong>${state.cash}</strong></div>
              <div style={statRow}><span style={statLabel}>Bank:</span><strong>${state.bank}</strong></div>
              <div style={statRow}><span style={statLabel}>Respect:</span><strong>{fmtRespect(Number(state.respect || 0))}</strong></div>
              <div style={statRow}><span style={statLabel}>Job:</span><strong>{job.name}</strong></div>
              <div style={statRow}><span style={statLabel}>Jail:</span><strong>{jailMs > 0 ? fmt(jailMs) : "Free"}</strong></div>
              <div style={statRow}><span style={statLabel}>Hospital:</span><strong>{hospitalMs > 0 ? fmt(hospitalMs) : "Clear"}</strong></div>
              <div style={statRow}><span style={statLabel}>Premium:</span><strong>{premiumActive ? (state.premiumAutoRenew ? "Continuous" : "Monthly") : "None"}</strong></div>
              <div style={statRow}><span style={statLabel}>Coins:</span><strong>{state.premiumCoins || 0}</strong></div>
            </div>
          </div>

          <Bar label="Health" value={Number(state.health || 0)} max={healthMax} fillColor="#b65454" sub={hospitalMs > 0 ? `Hospitalized for ${fmt(hospitalMs)}` : Number(state.health || 0) <= 0 ? "Hospital required" : Number(state.health || 0) >= healthMax ? "Full" : `Next +10 in ${fmt(untilBoundary(now, FIVE_MS))}`} />
          <Bar label="Energy" value={Number(state.energy || 0)} max={energyMax} fillColor="#4f82c2" sub={Number(state.energy || 0) >= energyMax ? "Full" : `Next +${energyTickAmount} in ${fmt(untilBoundary(now, ENERGY_MS))}`} />
          <Bar label="Bravery" value={Number(state.bravery || 0)} max={maxBravery} fillColor="#d19531" sub={Number(state.bravery || 0) >= maxBravery ? "Full" : `Next +1 in ${fmt(untilBoundary(now, braveryTickMs))}`} />

          <div style={panel}>
            <div style={infoStatRow}><span style={infoStatLabel}>Strength</span><strong>{state.strength}</strong></div>
            <div style={infoStatRow}><span style={infoStatLabel}>Speed</span><strong>{state.speed}</strong></div>
            <div style={infoStatRow}><span style={infoStatLabel}>Defense</span><strong>{state.defense}</strong></div>
            <div style={infoStatRow}><span style={infoStatLabel}>Energy cap</span><strong>{energyMax}</strong></div>
            <div style={infoStatRow}><span style={infoStatLabel}>Bravery cap</span><strong>{maxBravery}</strong></div>
            <div style={infoStatRow}><span style={infoStatLabel}>Health cap</span><strong>{healthMax}</strong></div>
            <div style={infoDetailLine}>{premiumActive ? `Premium ends in ${fmtPremiumDays(premiumRemainingMs)}.` : "Premium inactive."}</div>
            <div style={infoDetailLine}>{level >= 100 ? "Max level reached." : `Next level at ${fmtRespect(nextLevelFloor)} respect.`}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const textureBg = "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05), transparent 22%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.04), transparent 18%), linear-gradient(180deg, rgba(26,34,48,0.78) 0%, rgba(11,17,28,0.82) 38%, rgba(7,10,16,0.88) 100%)";
const chromeEdge = "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.55), 0 14px 30px rgba(0,0,0,0.35)";


const homeTopGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 12 };
const homePanel: React.CSSProperties = { border: "1px solid #3d434f", background: "linear-gradient(180deg, rgba(37,41,49,0.97) 0%, rgba(17,20,26,0.98) 100%)", boxShadow: chromeEdge };
const homePanelHeader: React.CSSProperties = { minHeight: 48, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 14px", color: "#f4f1eb", fontWeight: 900, fontSize: 16 };
const homePanelMeta: React.CSSProperties = { color: "#c8ccd3", fontSize: 12, fontWeight: 700 };
const homePanelBody: React.CSSProperties = { padding: 12 };
const battleTable: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.3fr .9fr 1fr .9fr", border: "1px solid rgba(255,255,255,0.06)" };
const battleHeaderCell: React.CSSProperties = { padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#d6dbe1", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" };
const battleNameCell: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#f4f1eb", fontWeight: 800 };
const battleValueCell: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#dbe0e6", textAlign: "right", fontVariantNumeric: "tabular-nums" };
const battleModCell: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "right", fontWeight: 800, fontVariantNumeric: "tabular-nums" };
const activityList: React.CSSProperties = { display: "grid", gap: 8 };
const activityItem: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.07)", background: "linear-gradient(180deg, rgba(47,51,60,0.6) 0%, rgba(17,19,24,0.75) 100%)", padding: "12px 14px", color: "#d7dbe0", minHeight: 48, display: "flex", alignItems: "center" };
const equipmentGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 };
const equipmentCard: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(180deg, rgba(46,50,58,0.84) 0%, rgba(18,21,27,0.96) 100%)", minHeight: 112, padding: 12, display: "grid", gap: 6, alignContent: "start" };
const equipmentSlotLabel: React.CSSProperties = { color: "#adb4bd", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800 };
const equipmentItemName: React.CSSProperties = { color: "#f4f1eb", fontWeight: 900, fontSize: 16, lineHeight: 1.2 };
const equipmentItemBody: React.CSSProperties = { color: "#c7ccd3", fontSize: 12, lineHeight: 1.3 };
const page: React.CSSProperties = {
  minHeight: "100vh",
  backgroundImage: `linear-gradient(rgba(5,9,16,0.52), rgba(6,10,18,0.76)), url(${postLoginBg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
  color: "#f4f1ea",
  fontFamily: "Inter, Arial, sans-serif",
  padding: 18,
};
const layout: React.CSSProperties = { maxWidth: 1540, margin: "0 auto", display: "grid", gridTemplateColumns: "292px minmax(0,1fr) 360px", gap: 18, alignItems: "start" };
const left: React.CSSProperties = { display: "grid", gap: 10, alignContent: "start", padding: 12, background: textureBg, border: "1px solid rgba(104,123,148,0.32)", boxShadow: chromeEdge, backdropFilter: "blur(6px)" };
const center: React.CSSProperties = { display: "grid", gap: 14, alignContent: "start", padding: 12, background: textureBg, border: "1px solid rgba(104,123,148,0.32)", boxShadow: chromeEdge, backdropFilter: "blur(6px)" };
const right: React.CSSProperties = { display: "grid", gap: 14, alignContent: "start", padding: 12, background: textureBg, border: "1px solid rgba(104,123,148,0.32)", boxShadow: chromeEdge, backdropFilter: "blur(6px)", minWidth: 0 };
const title: React.CSSProperties = { border: "1px solid rgba(124,145,176,0.42)", background: "linear-gradient(180deg, rgba(40,52,72,0.82) 0%, rgba(17,24,36,0.9) 100%)", boxShadow: chromeEdge, padding: "16px 22px", fontSize: 24, fontWeight: 900, letterSpacing: "0.01em", backdropFilter: "blur(4px)" };
const navOff: React.CSSProperties = { border: "1px solid #414753", background: "linear-gradient(180deg, #2f343d 0%, #161a21 100%)", color: "#f5f3ee", minHeight: 70, textAlign: "left", padding: "0 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, fontSize: 18, fontWeight: 700, boxShadow: chromeEdge };
const navOn: React.CSSProperties = { ...navOff, borderColor: "#8f939d", boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18), inset 6px 0 0 #c7cbd1, 0 14px 30px rgba(0,0,0,0.35)" };
const premiumNavOff: React.CSSProperties = { ...navOff, borderColor: "#b8902f", background: "linear-gradient(180deg, #5b4920 0%, #2d2410 100%)" };
const premiumNavOn: React.CSSProperties = { ...premiumNavOff, boxShadow: "inset 0 0 0 2px rgba(255,232,150,0.18), inset 6px 0 0 #f1d17a, 0 14px 30px rgba(0,0,0,0.35)" };
const navIcon: React.CSSProperties = { width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, background: "rgba(255,255,255,0.06)", fontSize: 18, flexShrink: 0 };
const section: React.CSSProperties = { border: "1px solid rgba(104,123,148,0.28)", background: "linear-gradient(180deg, rgba(30,40,56,0.78) 0%, rgba(11,17,27,0.84) 100%)", padding: 16, display: "grid", gap: 12, boxShadow: chromeEdge, backdropFilter: "blur(4px)" };
const panel: React.CSSProperties = { border: "1px solid rgba(104,123,148,0.28)", background: "linear-gradient(180deg, rgba(36,46,63,0.76) 0%, rgba(14,20,31,0.84) 100%)", padding: 14, display: "grid", gap: 8, boxShadow: chromeEdge, backdropFilter: "blur(4px)" };
const row: React.CSSProperties = { border: "1px solid rgba(93,111,136,0.26)", background: "linear-gradient(180deg, rgba(31,40,55,0.72) 0%, rgba(14,19,28,0.82) 100%)", padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" };
const crimeBox: React.CSSProperties = { border: "1px solid rgba(93,111,136,0.24)", background: "linear-gradient(180deg, rgba(28,37,52,0.72) 0%, rgba(12,17,26,0.82) 100%)", padding: 12, display: "grid", gap: 10, boxShadow: chromeEdge, backdropFilter: "blur(3px)" };
const crimeToggle: React.CSSProperties = { border: "1px solid #4b505b", background: "linear-gradient(180deg, #363b45 0%, #1c2028 100%)", color: "#fff", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.5)" };
const groupHeader: React.CSSProperties = { fontWeight: 900, fontSize: 18, color: "#f5f2ec" };
const btn: React.CSSProperties = { minHeight: 52, minWidth: 124, border: "1px solid #545a65", background: "linear-gradient(180deg, #6c717a 0%, #41464f 45%, #23272e 100%)", color: "#fdfbf8", padding: "0 18px", cursor: "pointer", fontSize: 16, fontWeight: 800, boxShadow: chromeEdge };
const subBtn: React.CSSProperties = { ...btn, background: "linear-gradient(180deg, #4c535f 0%, #2e343d 45%, #1a1e25 100%)" };
const premiumBtn: React.CSSProperties = { ...btn, borderColor: "#d8ba5a", background: "linear-gradient(180deg, #8f6f24 0%, #5f4a16 45%, #2f240d 100%)" };
const linkBtn: React.CSSProperties = { border: 0, background: "transparent", color: "#fff", cursor: "pointer", fontSize: 16 };
const input: React.CSSProperties = { minHeight: 44, border: "1px solid #5a616e", background: "linear-gradient(180deg, #191d24 0%, #0f1318 100%)", color: "#fff", padding: "0 12px", fontSize: 15 };
const textarea: React.CSSProperties = { minHeight: 120, border: "1px solid #5a616e", background: "linear-gradient(180deg, #191d24 0%, #0f1318 100%)", color: "#fff", padding: "12px", fontSize: 15, resize: "vertical", fontFamily: "Inter, Arial, sans-serif" };
const muted: React.CSSProperties = { color: "#c8ccd3", fontSize: 13, lineHeight: 1.35 };
const rowTitle: React.CSSProperties = { fontWeight: 900, fontSize: 20, color: "#f5f2ec", marginBottom: 4 };
const rowBody: React.CSSProperties = { color: "#c8ccd3", fontSize: 14, lineHeight: 1.35, maxWidth: 620 };
const grid4: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4,minmax(120px,1fr))", gap: 12 };
const mini: React.CSSProperties = { border: "1px solid #3d434f", background: "linear-gradient(180deg, rgba(47,51,60,0.95) 0%, rgba(20,22,28,0.98) 100%)", padding: 12, boxShadow: chromeEdge };
const miniLabel: React.CSSProperties = { color: "#b8bec7", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 };
const miniValue: React.CSSProperties = { fontWeight: 900, fontSize: 24, color: "#f6f3ec" };
const forumCategoryRow: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };
const forumPillOff: React.CSSProperties = { ...subBtn, minHeight: 42, minWidth: 0, padding: "0 14px" };
const forumPillOn: React.CSSProperties = { ...btn, minHeight: 42, minWidth: 0, padding: "0 14px" };
const item: React.CSSProperties = { border: "1px solid #343944", background: "linear-gradient(180deg, rgba(39,43,50,0.96) 0%, rgba(21,24,31,0.98) 100%)", padding: 12, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" };
const track: React.CSSProperties = { height: 18, background: "#0d1116", border: "1px solid #39414c", overflow: "hidden" };
const fill: React.CSSProperties = { height: "100%", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.28)" };
const errorBox: React.CSSProperties = { border: "1px solid #a14545", background: "linear-gradient(180deg, #4c1e1e 0%, #2e1313 100%)", color: "#ffd4d4", padding: 12, boxShadow: chromeEdge };
const toastWrap: React.CSSProperties = { position: "sticky", top: 10, zIndex: 30, pointerEvents: "none" };
const toastCard: React.CSSProperties = { maxWidth: 560, margin: "0 auto", padding: 14, display: "grid", gap: 8, boxShadow: chromeEdge, color: "#f5f7fb", pointerEvents: "auto" };
const toastMessage: React.CSSProperties = { color: "#edf1f8", lineHeight: 1.4 };
const infoStatRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8 };
const infoStatLabel: React.CSSProperties = { color: "#d0d4da", fontWeight: 700 };
const infoDetailLine: React.CSSProperties = { color: "#c8ccd3", fontSize: 13, lineHeight: 1.4 };
const loading: React.CSSProperties = { minHeight: "100vh", display: "grid", placeItems: "center", background: "#101216", color: "#fff", fontFamily: "Inter, Arial, sans-serif" };
const profilePanel: React.CSSProperties = { border: "1px solid #414753", background: "linear-gradient(180deg, rgba(42,46,55,0.98) 0%, rgba(17,20,26,0.98) 100%)", padding: 14, display: "grid", gap: 12, boxShadow: chromeEdge, minWidth: 0 };
const portraitWrap: React.CSSProperties = { display: "grid", gridTemplateColumns: "92px minmax(0,1fr)", gap: 12, alignItems: "stretch" };
const portraitCard: React.CSSProperties = { minHeight: 104, border: "1px solid #5a606b", background: "radial-gradient(circle at 50% 28%, #7b8594 0%, #4f5966 28%, #232830 72%, #13161c 100%)", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.88)", fontSize: 32, fontWeight: 900, letterSpacing: "0.08em", boxShadow: chromeEdge };
const profileTextWrap: React.CSSProperties = { border: "1px solid #3f454f", background: "linear-gradient(180deg, rgba(45,49,58,0.96) 0%, rgba(20,23,29,0.98) 100%)", padding: 14, display: "grid", alignContent: "center", gap: 8, boxShadow: chromeEdge, minWidth: 0 };
const profileName: React.CSSProperties = { fontSize: 18, fontWeight: 900, color: "#f8f6f1", lineHeight: 1.2, overflowWrap: "anywhere" };
const profileLevel: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: "#e1e4e8" };
const statList: React.CSSProperties = { border: "1px solid #3f454f", background: "linear-gradient(180deg, rgba(37,40,48,0.96) 0%, rgba(16,19,24,0.98) 100%)", padding: 14, display: "grid", gap: 10, boxShadow: chromeEdge, minWidth: 0 };
const statRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8 };
const statLabel: React.CSSProperties = { color: "#d0d4da", fontWeight: 700, flexShrink: 0 };
const statusShell: React.CSSProperties = { display: "grid", gap: 6 };
const statusBarFrame: React.CSSProperties = { position: "relative", minHeight: 48, border: "1px solid", background: "linear-gradient(180deg, rgba(22,24,30,1) 0%, rgba(10,12,16,1) 100%)", overflow: "hidden", boxShadow: chromeEdge };
const statusBarText: React.CSSProperties = { position: "absolute", inset: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px", fontWeight: 900, fontSize: 16, color: "#f8f5ef", textShadow: "0 1px 1px rgba(0,0,0,0.7)" };
const statusSub: React.CSSProperties = { color: "#d5d8de", textAlign: "center", fontSize: 13, fontWeight: 600 };
