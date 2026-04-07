export type ItemType = "weapon" | "armor" | "utility" | "recovery";

export type PlayerState = {
  alias: string;
  cash: number;
  bank: number;
  energy: number;
  energyUpdatedAt: string;
  bravery: number;
  braveryUpdatedAt: string;
  health: number;
  healthUpdatedAt: string;
  strength: number;
  speed: number;
  defense: number;
  respect: number;
  city: string;
  job: string;
  jobLastPaidOn: string | null;
  jailUntil: string | null;
  day: number;
  wins: number;
  losses: number;
  crimesSucceeded: number;
  crimesFailed: number;
  inventory: Record<string, number>;
  equipped: { weapon: string | null; armor: string | null; utility: string | null };
  log: string[];
};

export const CITIES = [
  { id: "apex", name: "Apex City", vibe: "Corporate towers, courier lanes, and cold money." },
  { id: "iron", name: "Ironport", vibe: "Docks, steel, and crews fighting for the waterfront." },
  { id: "veil", name: "Veil Gardens", vibe: "Luxury fronts hiding the dirtiest business in the city." },
];

export const JOBS = [
  {
    id: "courier",
    name: "Neon Express Courier",
    pay: 260,
    levelReq: 1,
    bonusText: "+2 crime chance, -50 travel cost",
    bonus: { crime: 2, travelDiscount: 50 },
  },
  {
    id: "bouncer",
    name: "Club Bouncer",
    pay: 420,
    levelReq: 2,
    bonusText: "+3 fight power",
    bonus: { fight: 3 },
  },
  {
    id: "mechanic",
    name: "Street Mechanic",
    pay: 560,
    levelReq: 4,
    bonusText: "+1 strength, -75 travel cost",
    bonus: { strength: 1, travelDiscount: 75 },
  },
  {
    id: "dispatcher",
    name: "Freight Dispatcher",
    pay: 740,
    levelReq: 6,
    bonusText: "+3 crime chance, +1 speed",
    bonus: { crime: 3, speed: 1 },
  },
  {
    id: "paramedic",
    name: "Night Paramedic",
    pay: 920,
    levelReq: 8,
    bonusText: "Hospital costs 35% less",
    bonus: { hospitalDiscount: 0.35 },
  },
  {
    id: "analyst",
    name: "Security Analyst",
    pay: 1120,
    levelReq: 10,
    bonusText: "+4 fight power, +1 defense",
    bonus: { fight: 4, defense: 1 },
  },
  {
    id: "broker",
    name: "Night Broker",
    pay: 1420,
    levelReq: 12,
    bonusText: "+2 crime chance, 12% shop discount",
    bonus: { crime: 2, itemDiscount: 0.12 },
  },
  {
    id: "chief",
    name: "Logistics Chief",
    pay: 1800,
    levelReq: 16,
    bonusText: "+4 crime chance, +4 fight power, -150 travel cost",
    bonus: { crime: 4, fight: 4, travelDiscount: 150 },
  },
] as const;

export const CRIMES = [
  { id: "lift", name: "Lift Wallet", cash: 140, respect: 1, bravery: 4, levelReq: 1, difficulty: 20, jailChance: 12, jailMinutes: 2 },
  { id: "shoplift", name: "Shoplift Goods", cash: 210, respect: 1, bravery: 5, levelReq: 2, difficulty: 23, jailChance: 15, jailMinutes: 3 },
  { id: "smashgrab", name: "Smash & Grab", cash: 360, respect: 2, bravery: 6, levelReq: 4, difficulty: 28, jailChance: 20, jailMinutes: 4 },
  { id: "boost", name: "Boost Car", cash: 680, respect: 3, bravery: 8, levelReq: 6, difficulty: 34, jailChance: 24, jailMinutes: 5 },
  { id: "safe", name: "Crack Safe", cash: 980, respect: 4, bravery: 10, levelReq: 8, difficulty: 39, jailChance: 28, jailMinutes: 6 },
  { id: "warehouse", name: "Warehouse Raid", cash: 1350, respect: 5, bravery: 12, levelReq: 10, difficulty: 45, jailChance: 32, jailMinutes: 8 },
  { id: "blackmail", name: "Blackmail Drop", cash: 1700, respect: 6, bravery: 13, levelReq: 12, difficulty: 49, jailChance: 34, jailMinutes: 10 },
  { id: "armored", name: "Armored Van Hit", cash: 2450, respect: 7, bravery: 15, levelReq: 14, difficulty: 56, jailChance: 38, jailMinutes: 12 },
  { id: "diamond", name: "Diamond Exchange Heist", cash: 3600, respect: 9, bravery: 18, levelReq: 18, difficulty: 64, jailChance: 44, jailMinutes: 15 },
] as const;

export const RIVALS = [
  { id: "dockhand", name: "Dockhand Bruiser", power: 18, reward: 260, respect: 1, note: "Slow and heavy." },
  { id: "cutpurse", name: "Cutpurse Runner", power: 26, reward: 420, respect: 2, note: "Fast and slippery." },
  { id: "enforcer", name: "Bricklane Enforcer", power: 38, reward: 760, respect: 3, note: "Hits hard and takes punishment." },
  { id: "specter", name: "Specter Knife", power: 52, reward: 1180, respect: 4, note: "Quick, technical, and ruthless." },
] as const;

export const ITEMS = [
  { id: "weapon-switchblade", name: "Switchblade", type: "weapon", price: 420, desc: "Cheap steel with a quick draw.", effect: { combat: 2 } },
  { id: "weapon-ghostblade", name: "Ghost Blade", type: "weapon", price: 1200, desc: "Fast close-range weapon.", effect: { combat: 6 } },
  { id: "weapon-streetshot", name: "Street Shot", type: "weapon", price: 2400, desc: "Heavy sidearm for serious work.", effect: { combat: 11 } },

  { id: "armor-hoodie", name: "Padded Hoodie", type: "armor", price: 380, desc: "Cheap protection for rough nights.", effect: { combat: 1 } },
  { id: "armor-mesh", name: "Reactive Mesh", type: "armor", price: 1400, desc: "Light reactive body armor.", effect: { combat: 5 } },
  { id: "armor-plates", name: "Ballistic Plates", type: "armor", price: 2600, desc: "Heavy protection for open conflict.", effect: { combat: 9 } },

  { id: "utility-lockkit", name: "Lock Kit", type: "utility", price: 550, desc: "Helps on entry jobs and quick escapes.", effect: { crime: 2 } },
  { id: "utility-signalrig", name: "Signal Rig", type: "utility", price: 900, desc: "Improves stealth and setup.", effect: { crime: 4 } },
  { id: "utility-jammer", name: "Pocket Jammer", type: "utility", price: 1800, desc: "Messes with sensors and cameras.", effect: { crime: 7 } },

  { id: "recovery-bandage", name: "Bandage Pack", type: "recovery", price: 90, desc: "Restore 18 health.", effect: { health: 18 } },
  { id: "recovery-stim", name: "Stim Drink", type: "recovery", price: 120, desc: "Restore 14 energy.", effect: { energy: 14 } },
  { id: "recovery-nerve", name: "Nerve Tonic", type: "recovery", price: 160, desc: "Restore 3 bravery.", effect: { bravery: 3 } },
  { id: "recovery-trauma", name: "Trauma Kit", type: "recovery", price: 320, desc: "Restore 35 health.", effect: { health: 35 } },
] as const;

export function getLevelFromRespect(respect: number) {
  return Math.max(1, Math.floor(Math.max(0, respect) / 4) + 1);
}

export function makeInitialState(alias = "Rookie"): PlayerState {
  const nowIso = new Date().toISOString();
  return {
    alias,
    cash: 1500,
    bank: 0,
    energy: 100,
    energyUpdatedAt: nowIso,
    bravery: 20,
    braveryUpdatedAt: nowIso,
    health: 100,
    healthUpdatedAt: nowIso,
    strength: 8,
    speed: 8,
    defense: 8,
    respect: 0,
    city: CITIES[0].id,
    job: JOBS[0].id,
    jobLastPaidOn: null,
    jailUntil: null,
    day: 1,
    wins: 0,
    losses: 0,
    crimesSucceeded: 0,
    crimesFailed: 0,
    inventory: {
      "recovery-bandage": 2,
      "recovery-stim": 1,
    },
    equipped: { weapon: null, armor: null, utility: null },
    log: ["Welcome to Metro Syndicate."],
  };
}
