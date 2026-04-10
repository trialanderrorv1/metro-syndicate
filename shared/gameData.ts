import { CRIME_CATEGORIES, CRIMES } from "./crimeCatalog";

export type EquipmentSlot = "primary" | "secondary" | "melee" | "head" | "chest" | "legs" | "feet" | "utility";
export type ItemType = EquipmentSlot | "medical" | "utility_use";
export type ShopId = "weapons" | "armor" | "medical" | "utilities";
export type CrimeSkillMap = Record<string, number>;

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
  jobChangedAt: string | null;
  jailUntil: string | null;
  hospitalUntil: string | null;
  premiumUntil: string | null;
  premiumAutoRenew: boolean;
  premiumCoins: number;
  day: number;
  wins: number;
  losses: number;
  crimesSucceeded: number;
  crimesFailed: number;
  bustingExp: number;
  crimeSkills: CrimeSkillMap;
  inventory: Record<string, number>;
  equipped: Record<EquipmentSlot, string | null>;
  log: string[];
};

export { CRIME_CATEGORIES, CRIMES };

export const MAX_LEVEL = 100;
export const BASE_RESPECT_STEP = 20;
export const RESPECT_STEP_GROWTH = 8;
export const PREMIUM_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const BASE_MAX_ENERGY = 100;
export const PREMIUM_MAX_ENERGY_BONUS = 50;

export const CITIES = [
  { id: "apex", name: "Apex City", vibe: "Corporate towers, courier lanes, and cold money." },
  { id: "iron", name: "Ironport", vibe: "Docks, steel, and crews fighting for the waterfront." },
  { id: "veil", name: "Veil Gardens", vibe: "Luxury fronts hiding the dirtiest business in the city." },
] as const;

export const JOBS = [
  { id: "courier", name: "Neon Express Courier", pay: 260, levelReq: 1, bonusText: "+2 crime chance, -50 travel cost", bonus: { crime: 2, travelDiscount: 50 } },
  { id: "bouncer", name: "Club Bouncer", pay: 420, levelReq: 8, bonusText: "+3 fight power", bonus: { fight: 3 } },
  { id: "mechanic", name: "Street Mechanic", pay: 560, levelReq: 18, bonusText: "+1 strength, -75 travel cost", bonus: { strength: 1, travelDiscount: 75 } },
  { id: "dispatcher", name: "Freight Dispatcher", pay: 740, levelReq: 28, bonusText: "+3 crime chance, +1 speed", bonus: { crime: 3, speed: 1 } },
  { id: "paramedic", name: "Night Paramedic", pay: 920, levelReq: 40, bonusText: "Hospital costs 35% less", bonus: { hospitalDiscount: 0.35 } },
  { id: "analyst", name: "Security Analyst", pay: 1120, levelReq: 52, bonusText: "+4 fight power, +1 defense", bonus: { fight: 4, defense: 1 } },
  { id: "broker", name: "Night Broker", pay: 1420, levelReq: 68, bonusText: "+2 crime chance, 12% shop discount", bonus: { crime: 2, itemDiscount: 0.12 } },
  { id: "chief", name: "Logistics Chief", pay: 1800, levelReq: 84, bonusText: "+4 crime chance, +4 fight power, -150 travel cost", bonus: { crime: 4, fight: 4, travelDiscount: 150 } },
] as const;

export const RIVALS = [
  { id: "dockhand", name: "Dockhand Bruiser", power: 18, reward: 260, respect: 1, note: "Slow and heavy." },
  { id: "cutpurse", name: "Cutpurse Runner", power: 26, reward: 420, respect: 2, note: "Fast and slippery." },
  { id: "enforcer", name: "Bricklane Enforcer", power: 38, reward: 760, respect: 3, note: "Hits hard and takes punishment." },
  { id: "specter", name: "Specter Knife", power: 52, reward: 1180, respect: 4, note: "Quick, technical, and ruthless." },
] as const;

export const ITEMS = [
  // Armed and Hammered
  { id: "primary-zipgun", name: "Zip Gun", type: "primary", shop: "weapons", price: 900, desc: "A crude longarm with just enough bite.", effect: { combatPct: 4, strengthPct: 7 } },
  { id: "primary-carbine", name: "Street Carbine", type: "primary", shop: "weapons", price: 2600, desc: "Reliable primary firearm for turf wars.", effect: { combatPct: 8, strengthPct: 13 } },
  { id: "primary-rifle", name: "Marksman Rifle", type: "primary", shop: "weapons", price: 5200, desc: "High-end rifle built for serious fights.", effect: { combatPct: 12, strengthPct: 19 } },
  { id: "primary-breachshot", name: "Breach Shotgun", type: "primary", shop: "weapons", price: 1800, desc: "Close-range cannon for door kickers.", effect: { combatPct: 7, strengthPct: 10 } },
  { id: "primary-battlerifle", name: "Battle Rifle", type: "primary", shop: "weapons", price: 3800, desc: "Military-grade rifle with a hard punch.", effect: { combatPct: 10, strengthPct: 16 } },
  { id: "primary-gauss", name: "Gauss Rifle", type: "primary", shop: "weapons", price: 7600, desc: "Rare coil rifle with brutal stopping force.", effect: { combatPct: 13, strengthPct: 22 } },
  { id: "primary-siegelmg", name: "Siege LMG", type: "primary", shop: "weapons", price: 9800, desc: "Heavy support weapon for turf domination.", effect: { combatPct: 16, strengthPct: 28, speedPct: -4 } },

  { id: "secondary-revolver", name: "Pocket Revolver", type: "secondary", shop: "weapons", price: 650, desc: "Compact backup sidearm.", effect: { combatPct: 4, strengthPct: 7 } },
  { id: "secondary-pistol", name: "Service Pistol", type: "secondary", shop: "weapons", price: 1800, desc: "Fast draw and solid stopping power.", effect: { combatPct: 6, strengthPct: 10 } },
  { id: "secondary-handcannon", name: "Heavy Hand Cannon", type: "secondary", shop: "weapons", price: 3800, desc: "Expensive and loud, but effective.", effect: { combatPct: 9, strengthPct: 16 } },
  { id: "secondary-machinepistol", name: "Machine Pistol", type: "secondary", shop: "weapons", price: 2400, desc: "Compact auto weapon for close scraps.", effect: { combatPct: 7, strengthPct: 10, speedPct: 4 } },
  { id: "secondary-magnum", name: "Iron Magnum", type: "secondary", shop: "weapons", price: 3200, desc: "Heavy revolver with brutal recoil.", effect: { combatPct: 9, strengthPct: 16 } },
  { id: "secondary-deckard", name: "Deckard Auto", type: "secondary", shop: "weapons", price: 5200, desc: "Executive sidearm with surprising bite.", effect: { combatPct: 10, strengthPct: 19 } },
  { id: "secondary-plasma", name: "Plasma Sidearm", type: "secondary", shop: "weapons", price: 8600, desc: "Illegal prototype sidearm with savage output.", effect: { combatPct: 12, strengthPct: 22 } },

  { id: "melee-shiv", name: "Prison Shiv", type: "melee", shop: "weapons", price: 220, desc: "A desperate blade for close work.", effect: { combatPct: 3, strengthPct: 7 } },
  { id: "melee-bat", name: "Weighted Bat", type: "melee", shop: "weapons", price: 760, desc: "Cheap intimidation and street utility.", effect: { combatPct: 4, strengthPct: 10 } },
  { id: "melee-katana", name: "Mono Katana", type: "melee", shop: "weapons", price: 2400, desc: "Balanced melee weapon for skilled hands.", effect: { combatPct: 7, strengthPct: 13, speedPct: 4 } },
  { id: "melee-knuckles", name: "Brass Knuckles", type: "melee", shop: "weapons", price: 480, desc: "Simple metal for up-close brutality.", effect: { combatPct: 3, strengthPct: 7 } },
  { id: "melee-machete", name: "Street Machete", type: "melee", shop: "weapons", price: 1250, desc: "A rough chopping blade with extra leverage.", effect: { combatPct: 5, strengthPct: 10 } },
  { id: "melee-shockbaton", name: "Shock Baton", type: "melee", shop: "weapons", price: 2650, desc: "Charged baton for tactical brawls.", effect: { combatPct: 6, strengthPct: 13, speedPct: 4 } },
  { id: "melee-breachaxe", name: "Breach Axe", type: "melee", shop: "weapons", price: 4200, desc: "Heavy axe for doors, armor, and bones.", effect: { combatPct: 7, strengthPct: 19 } },
  { id: "melee-warhammer", name: "War Hammer", type: "melee", shop: "weapons", price: 6900, desc: "Slow, brutal, and impossible to ignore.", effect: { combatPct: 9, strengthPct: 25, speedPct: -4 } },

  // Titanstone Blacksmiths
  { id: "head-cap", name: "Padded Cap", type: "head", shop: "armor", price: 280, desc: "Basic head protection.", effect: { combatPct: 1, defensePct: 4 } },
  { id: "head-visor", name: "Ballistic Visor", type: "head", shop: "armor", price: 1200, desc: "Improved head armor for open fights.", effect: { combatPct: 3, defensePct: 8 } },
  { id: "head-mask", name: "Tactical Mask", type: "head", shop: "armor", price: 2400, desc: "High-end head protection.", effect: { combatPct: 4, defensePct: 12, speedPct: 4, crime: 1 } },
  { id: "head-recon", name: "Recon Hood", type: "head", shop: "armor", price: 1750, desc: "Lightweight gear for quick operators.", effect: { defensePct: 8, speedPct: 8, crime: 1 } },
  { id: "head-helm", name: "Titan Helm", type: "head", shop: "armor", price: 4200, desc: "Dense alloy helmet with heavy plating.", effect: { combatPct: 4, defensePct: 16, speedPct: -4 } },
  { id: "head-crown", name: "Crownguard Visor", type: "head", shop: "armor", price: 6400, desc: "Elite visor combining defense and mobility.", effect: { combatPct: 5, defensePct: 20, speedPct: 4 } },

  { id: "chest-hoodie", name: "Padded Hoodie", type: "chest", shop: "armor", price: 380, desc: "Cheap chest protection for rough nights.", effect: { combatPct: 1, defensePct: 4 } },
  { id: "chest-vest", name: "Reactive Vest", type: "chest", shop: "armor", price: 1800, desc: "Light ballistic vest.", effect: { combatPct: 3, defensePct: 10 } },
  { id: "chest-plates", name: "Carrier Plates", type: "chest", shop: "armor", price: 3600, desc: "Heavy chest protection for war zones.", effect: { combatPct: 5, defensePct: 18, speedPct: -4 } },
  { id: "chest-meshcoat", name: "Mesh Coat", type: "chest", shop: "armor", price: 2500, desc: "Flexible armor with low drag.", effect: { combatPct: 3, defensePct: 14, speedPct: 4 } },
  { id: "chest-assaultframe", name: "Assault Frame", type: "chest", shop: "armor", price: 5200, desc: "Layered plating built for front-line enforcers.", effect: { combatPct: 5, defensePct: 22 } },
  { id: "chest-exoframe", name: "Exo Frame", type: "chest", shop: "armor", price: 8200, desc: "Premium chassis that shrugs off punishment.", effect: { combatPct: 6, defensePct: 28, speedPct: -4 } },

  { id: "legs-denim", name: "Reinforced Denim", type: "legs", shop: "armor", price: 260, desc: "Simple leg padding.", effect: { combatPct: 1, defensePct: 4 } },
  { id: "legs-kneeguard", name: "Knee Guard Set", type: "legs", shop: "armor", price: 1100, desc: "Flexible lower-body armor.", effect: { combatPct: 2, defensePct: 8 } },
  { id: "legs-tacpants", name: "Tactical Leg Rig", type: "legs", shop: "armor", price: 2400, desc: "Mobility-focused armored trousers.", effect: { combatPct: 3, defensePct: 10, speedPct: 4, crime: 1 } },
  { id: "legs-sprintliner", name: "Sprint Liner", type: "legs", shop: "armor", price: 1800, desc: "Fast movement with light protection.", effect: { defensePct: 8, speedPct: 8, crime: 1 } },
  { id: "legs-composite", name: "Composite Greaves", type: "legs", shop: "armor", price: 3600, desc: "Balanced armor for hard urban fights.", effect: { combatPct: 3, defensePct: 14, speedPct: 4 } },
  { id: "legs-siegeguards", name: "Siege Guards", type: "legs", shop: "armor", price: 5900, desc: "Heavy lower armor for relentless advance.", effect: { combatPct: 4, defensePct: 20, speedPct: -4 } },

  { id: "feet-boots", name: "Steel Boots", type: "feet", shop: "armor", price: 220, desc: "Simple armored footwear.", effect: { combatPct: 1, defensePct: 4 } },
  { id: "feet-runners", name: "Grip Runners", type: "feet", shop: "armor", price: 900, desc: "Good footing and faster escapes.", effect: { combatPct: 2, defensePct: 4, speedPct: 4, crime: 1 } },
  { id: "feet-tread", name: "Shock Tread Boots", type: "feet", shop: "armor", price: 1900, desc: "Premium combat footwear.", effect: { combatPct: 3, defensePct: 8, speedPct: 4, crime: 1 } },
  { id: "feet-silent", name: "Silent Runners", type: "feet", shop: "armor", price: 1600, desc: "Quiet tactical shoes for clean jobs.", effect: { defensePct: 4, speedPct: 8, crime: 2 } },
  { id: "feet-pursuit", name: "Pursuit Boots", type: "feet", shop: "armor", price: 3100, desc: "Fast chase boots with reinforced plating.", effect: { combatPct: 2, defensePct: 10, speedPct: 8 } },
  { id: "feet-ironmarch", name: "Ironmarch Boots", type: "feet", shop: "armor", price: 4700, desc: "Heavy boots for methodical advance.", effect: { combatPct: 3, defensePct: 14, speedPct: 4 } },

  // CityCare RX
  { id: "medical-bandage", name: "Bandage Pack", type: "medical", shop: "medical", price: 90, desc: "Restore 18 health.", effect: { health: 18 } },
  { id: "medical-trauma", name: "Trauma Kit", type: "medical", shop: "medical", price: 320, desc: "Restore 35 health.", effect: { health: 35 } },
  { id: "medical-15", name: "Fast Track Release", type: "medical", shop: "medical", price: 420, desc: "Reduce hospital time by 15 minutes.", effect: { hospitalReduceMinutes: 15 } },
  { id: "medical-30", name: "Priority Release", type: "medical", shop: "medical", price: 780, desc: "Reduce hospital time by 30 minutes.", effect: { hospitalReduceMinutes: 30 } },
  { id: "medical-45", name: "Rapid Ward Pass", type: "medical", shop: "medical", price: 1120, desc: "Reduce hospital time by 45 minutes.", effect: { hospitalReduceMinutes: 45 } },
  { id: "medical-60", name: "Black Ambulance Contract", type: "medical", shop: "medical", price: 1540, desc: "Reduce hospital time by 60 minutes.", effect: { hospitalReduceMinutes: 60 } },

  // Odds & Sods
  { id: "utility-lockkit", name: "Lock Kit", type: "utility", shop: "utilities", price: 550, desc: "Helps on entry jobs and quick escapes.", effect: { crime: 2 } },
  { id: "utility-signalrig", name: "Signal Rig", type: "utility", shop: "utilities", price: 900, desc: "Improves stealth and setup.", effect: { crime: 4 } },
  { id: "utility-jammer", name: "Pocket Jammer", type: "utility", shop: "utilities", price: 1800, desc: "Messes with sensors and cameras.", effect: { crime: 7 } },
  { id: "utility-stim", name: "Stim Drink", type: "utility_use", shop: "utilities", price: 120, desc: "Restore 14 energy.", effect: { energy: 14 } },
  { id: "utility-nerve", name: "Nerve Tonic", type: "utility_use", shop: "utilities", price: 160, desc: "Restore 8 bravery.", effect: { bravery: 8 } },
  { id: "utility-adrenal", name: "Adrenal Pump", type: "utility_use", shop: "utilities", price: 260, desc: "Restore 24 energy.", effect: { energy: 24 } },
  { id: "utility-focussalts", name: "Focus Salts", type: "utility_use", shop: "utilities", price: 240, desc: "Restore 14 bravery.", effect: { bravery: 14 } },
  { id: "utility-fieldharness", name: "Field Harness", type: "utility", shop: "utilities", price: 1100, desc: "Wearable support frame with extra endurance.", effect: { maxHealthPct: 10, defense: 1 } },
  { id: "utility-medmonitor", name: "Med Monitor", type: "utility", shop: "utilities", price: 1900, desc: "Body monitor that expands survivability.", effect: { maxHealthPct: 15, crime: 1 } },
  { id: "utility-safehouse", name: "Safehouse Beacon", type: "utility", shop: "utilities", price: 2600, desc: "Field network for recovery and fallback.", effect: { maxHealthPct: 12, crime: 3 } },
  { id: "utility-respirator", name: "Combat Respirator", type: "utility", shop: "utilities", price: 3600, desc: "Boosts endurance in drawn-out fights.", effect: { maxHealthPct: 20, defense: 2 } },
] as const;

export const EQUIPMENT_SLOTS: EquipmentSlot[] = ["primary", "secondary", "melee", "head", "chest", "legs", "feet", "utility"];

export function getRespectForLevel(level: number) {
  if (level <= 1) return 0;
  const steps = level - 1;
  return (steps * (BASE_RESPECT_STEP + (steps - 1) * 4)) / 2;
}

export function getRespectNeededForNextLevel(level: number) {
  if (level >= MAX_LEVEL) return 0;
  return BASE_RESPECT_STEP + (level - 1) * RESPECT_STEP_GROWTH;
}

export function getLevelFromRespect(respect: number) {
  const safeRespect = Math.max(0, Number(respect || 0));
  let level = 1;
  while (level < MAX_LEVEL && safeRespect >= getRespectForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export function isPremiumActive(stateLike: { premiumUntil?: string | null }) {
  const premiumMs = stateLike?.premiumUntil ? new Date(stateLike.premiumUntil).getTime() : 0;
  return Number.isFinite(premiumMs) && premiumMs > Date.now();
}

export function getMaxEnergy(stateLike: { premiumUntil?: string | null }) {
  return BASE_MAX_ENERGY + (isPremiumActive(stateLike) ? PREMIUM_MAX_ENERGY_BONUS : 0);
}

export function getMaxBravery(level: number) {
  return 20 + Math.max(0, level - 1) * 5;
}

export function makeInitialState(alias = "Rookie"): PlayerState {
  const nowIso = new Date().toISOString();
  const crimeSkills = Object.fromEntries(CRIME_CATEGORIES.map((category) => [category.id, 0]));
  const equipped = Object.fromEntries(EQUIPMENT_SLOTS.map((slot) => [slot, null])) as Record<EquipmentSlot, string | null>;
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
    jobChangedAt: null,
    jailUntil: null,
    hospitalUntil: null,
    premiumUntil: null,
    premiumAutoRenew: false,
    premiumCoins: 0,
    day: 1,
    wins: 0,
    losses: 0,
    crimesSucceeded: 0,
    crimesFailed: 0,
    bustingExp: 0,
    crimeSkills,
    inventory: {},
    equipped,
    log: ["Welcome to Metro Syndicate."],
  };
}