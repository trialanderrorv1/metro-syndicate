export type PlayerState = {
  alias: string;
  cash: number;
  bank: number;
  energy: number;
  energyUpdatedAt: string;
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

export const CITIES = [
  { id: "apex", name: "Apex City", vibe: "Corporate towers and cold money." },
  { id: "iron", name: "Ironport", vibe: "Docks, crews, pressure and steel." },
  { id: "veil", name: "Veil Gardens", vibe: "Luxury fronts hiding dirty power." }
];

export const JOBS = [
  { id: "runner", name: "Runner", pay: 180, energy: 8, respect: 1, req: 0 },
  { id: "collector", name: "Collector", pay: 420, energy: 12, respect: 2, req: 5 },
  { id: "operator", name: "Operator", pay: 900, energy: 18, respect: 4, req: 15 }
];

export const CRIMES = [
  { id: "pick", name: "Lift Wallet", cash: 140, respect: 1, energy: 8, risk: 12, req: 0 },
  { id: "boost", name: "Boost Car", cash: 680, respect: 3, energy: 16, risk: 28, req: 6 }
];

export const RIVALS = [
  { id: "dockhand", name: "Dockhand Bruiser", power: 16, reward: 240, respect: 1, note: "Slow but heavy." },
  { id: "cipher", name: "Cipher Blade", power: 30, reward: 520, respect: 2, note: "Quick and technical." }
];

export const ITEMS = [
  { id: "weapon-1", name: "Ghost Blade", type: "weapon", price: 1200, desc: "Fast close-range weapon.", effect: { combat: 6 } },
  { id: "armor-1", name: "Reactive Mesh", type: "armor", price: 1400, desc: "Light reactive body armor.", effect: { combat: 5 } },
  { id: "utility-1", name: "Signal Rig", type: "utility", price: 900, desc: "Improves stealth and setup.", effect: { stealth: 4 } },
  { id: "consumable-1", name: "Stim Drink", type: "consumable", price: 120, desc: "Restores a little energy.", effect: { energy: 12 } }
];

export function makeInitialState(alias = "Rookie"): PlayerState {
  return {
    alias,
    cash: 1500,
    bank: 0,
    energy: 100,
    energyUpdatedAt: new Date().toISOString(),
    health: 100,
    strength: 8,
    speed: 8,
    defense: 8,
    respect: 0,
    heat: 0,
    city: CITIES[0].id,
    job: JOBS[0].id,
    day: 1,
    wins: 0,
    losses: 0,
    inventory: { "consumable-1": 2 },
    equipped: { weapon: null, armor: null, utility: null },
    log: ["Welcome to Metro Syndicate."]
  };
}
