import { CITIES, CRIMES, ITEMS, JOBS, RIVALS, getLevelFromRespect, getMaxBravery, getMaxEnergy, type PlayerState } from "../shared/gameData";

export type GameAction =
  | { type: "hospital" }
  | { type: "travel"; cityId: string }
  | { type: "takeJob"; jobId: string }
  | { type: "collectJobPay" }
  | { type: "crime"; crimeId: string }
  | { type: "fightRival"; rivalId: string }
  | { type: "buyItem"; itemId: string }
  | { type: "useItem"; itemId: string }
  | { type: "sellItem"; itemId: string }
  | { type: "personalDeposit"; amount: number }
  | { type: "personalWithdraw"; amount: number }
  | { type: "activatePremium"; plan: "monthly" | "continuous" }
  | { type: "cancelPremiumAutoRenew" };

const MAX_HEALTH = 100;
const MIN_CRIME_HOSPITAL_MINUTES = 5;
const MAX_CRIME_HOSPITAL_MINUTES = 10;
const FIGHT_ENERGY_COST = 20;
const TRAVEL_COOLDOWN_MS = 60 * 60 * 1000;
const PREMIUM_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function currentLondonDayKey(date = new Date()) {
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

function getCurrentJob(state: PlayerState) {
  return JOBS.find((job) => job.id === state.job) || JOBS[0];
}

function getJobBonus(state: PlayerState) {
  return getCurrentJob(state).bonus || {};
}

function getEquippedBonus(state: PlayerState, key: string) {
  return Object.values(state.equipped || {})
    .map((id) => ITEMS.find((item) => item.id === id)?.effect?.[key as keyof (typeof ITEMS)[number]["effect"]] || 0)
    .reduce((sum, value) => sum + Number(value || 0), 0);
}
function getEnergyCap(state: PlayerState) {
  return Number(getMaxEnergy(state as any) || 100);
}

function getBraveryCap(state: PlayerState) {
  const level = getLevelFromRespect(Number(state.respect || 0));
  return Number(getMaxBravery(level) || 20);
}

function isPremiumActive(state: PlayerState) {
  const premiumUntilMs = new Date((state as any).premiumUntil || 0).getTime();
  return Number.isFinite(premiumUntilMs) && premiumUntilMs > Date.now();
}

function getTravelCooldownMs(state: PlayerState) {
  const availableAtMs = new Date((state as any).travelAvailableAt || 0).getTime();
  if (!Number.isFinite(availableAtMs)) return 0;
  return Math.max(0, availableAtMs - Date.now());
}

function getPremiumBaseMs(state: PlayerState) {
  const premiumUntilMs = new Date((state as any).premiumUntil || 0).getTime();
  return Number.isFinite(premiumUntilMs) && premiumUntilMs > Date.now() ? premiumUntilMs : Date.now();
}

function assertFree(state: PlayerState) {
  if (!state.jailUntil) return;
  const jailMs = new Date(state.jailUntil).getTime();
  if (Number.isFinite(jailMs) && jailMs > Date.now()) {
    throw new Error("You are in jail.");
  }
}

function getCrimeHospitalMinutes(crimeId: string) {
  const crimeIndex = CRIMES.findIndex((entry) => entry.id === crimeId);
  if (crimeIndex <= 0) return MIN_CRIME_HOSPITAL_MINUTES;
  const maxIndex = Math.max(1, CRIMES.length - 1);
  const ratio = crimeIndex / maxIndex;
  return Math.round(
    MIN_CRIME_HOSPITAL_MINUTES + ratio * (MAX_CRIME_HOSPITAL_MINUTES - MIN_CRIME_HOSPITAL_MINUTES),
  );
}

function getCrimeCategoryId(crime: any) {
  return String(crime?.categoryId || "").trim();
}

function getCrimeSkillValue(state: PlayerState, categoryId: string) {
  if (!categoryId) return 0;
  const skills = ((state as any).crimeSkills || {}) as Record<string, number>;
  return Number(skills[categoryId] || 0);
}

function setCrimeSkillValue(state: PlayerState, categoryId: string, value: number) {
  if (!categoryId) return;
  const currentSkills = (((state as any).crimeSkills || {}) as Record<string, number>);
  (state as any).crimeSkills = {
    ...currentSkills,
    [categoryId]: clamp(Number(value || 0), 0, 100),
  };
}

export function applyGameAction(state: PlayerState, action: GameAction) {
  let next: PlayerState = {
    ...state,
    inventory: { ...state.inventory },
    equipped: { ...state.equipped },
    log: [...state.log],
  };
  const feed: string[] = [];
  const nowIso = new Date().toISOString();
  const level = getLevelFromRespect(next.respect);

  const push = (entry: string) => {
    feed.unshift(entry);
    next.log = [entry, ...next.log].slice(0, 14);
  };

  switch (action.type) {
    case "hospital": {
      const missingHealth = MAX_HEALTH - next.health;
      if (missingHealth <= 0) throw new Error("You are already at full health");
      const job = getCurrentJob(next);
      const discount = Number(job.bonus?.hospitalDiscount || 0);
      const cost = Math.max(50, Math.round((120 + missingHealth * 18) * (1 - discount)));
      if (next.cash < cost) throw new Error("Not enough cash for hospital care");
      next.cash -= cost;
      next.health = MAX_HEALTH;
      next.healthUpdatedAt = nowIso;
      next.day += 1;
      push(`Hospital patched you up for ${cost}.`);
      break;
    }
    case "travel": {
      assertFree(next);
      const city = CITIES.find((entry) => entry.id === action.cityId);
      if (!city) throw new Error("City not found");
      if (next.city === city.id) throw new Error("Already there");
      const travelCooldownMs = getTravelCooldownMs(next);
      if (travelCooldownMs > 0) throw new Error(`Travel available in ${Math.ceil(travelCooldownMs / 60000)} minutes`);
      const travelDiscount = Number(getJobBonus(next).travelDiscount || 0);
      const cost = Math.max(50, 250 - travelDiscount);
      if (next.cash < cost) throw new Error("Not enough cash to travel");
      next.cash -= cost;
      next.city = city.id;
      (next as any).travelAvailableAt = new Date(Date.now() + TRAVEL_COOLDOWN_MS).toISOString();
      next.day += 1;
      push(`Travelled to ${city.name} for $${cost}. Next travel available in 60 minutes.`);
      break;
    }
    case "takeJob": {
      const job = JOBS.find((entry) => entry.id === action.jobId);
      if (!job) throw new Error("Job not found");
      if (level < job.levelReq) throw new Error(`Reach level ${job.levelReq} to take this job`);
      next.job = job.id;
      push(`Took the ${job.name} role.`);
      break;
    }
    case "collectJobPay": {
      const today = currentLondonDayKey();
      if (next.jobLastPaidOn === today) throw new Error("Daily pay already collected today");
      const job = getCurrentJob(next);
      const pay = job.pay;
      next.cash += pay;
      next.jobLastPaidOn = today;
      next.day += 1;
      push(`Collected daily pay from ${job.name} for $${pay}.`);
      break;
    }
    case "crime": {
      assertFree(next);
      const crime = CRIMES.find((entry) => entry.id === action.crimeId);
      if (!crime) throw new Error("Crime not found");
      if (level < crime.levelReq) throw new Error(`Reach level ${crime.levelReq} to unlock this crime`);
      if (next.bravery < crime.bravery) throw new Error("Not enough bravery");

      const crimeJobBonus = Number(getJobBonus(next).crime || 0);
      const effectiveSpeed = next.speed + Number(getJobBonus(next).speed || 0);
      const effectiveStrength = next.strength + Number(getJobBonus(next).strength || 0);
      const effectiveDefense = next.defense + Number(getJobBonus(next).defense || 0);
      const utilityCrimeBonus = getEquippedBonus(next, "crime");
      const crimeCategoryId = getCrimeCategoryId(crime);
      const currentCrimeSkill = getCrimeSkillValue(next, crimeCategoryId);
      const successChance = clamp(
        52 + level * 1.6 + effectiveSpeed * 1.2 + effectiveStrength * 0.7 + effectiveDefense * 0.35 + crimeJobBonus + utilityCrimeBonus + currentCrimeSkill * 0.28 - crime.difficulty,
        8,
        96,
      );
      const success = Math.random() * 100 <= successChance;

      next.bravery = clamp(next.bravery - crime.bravery, 0, getBraveryCap(next));
      next.braveryUpdatedAt = nowIso;
      next.day += 1;

      if (success) {
        next.cash += crime.cash;
        next.respect += crime.respect;
        next.crimesSucceeded += 1;
        next.speed += rand(0, 1);
        next.strength += rand(0, 1);
        if (crimeCategoryId) {
          setCrimeSkillValue(next, crimeCategoryId, currentCrimeSkill + Number((crime as any).xpGain || 0));
        }
        push(`Crime succeeded: ${crime.name}. You pulled $${crime.cash}.`);
      } else {
        next.crimesFailed += 1;
        const jailed = Math.random() * 100 <= crime.jailChance;
        if (jailed) {
          next.jailUntil = new Date(Date.now() + crime.jailMinutes * 60 * 1000).toISOString();
          if (crimeCategoryId) {
            setCrimeSkillValue(next, crimeCategoryId, currentCrimeSkill - Number((crime as any).xpLoss || 0));
          }
          push(`Crime failed: ${crime.name}. You got jailed for ${crime.jailMinutes} minutes.`);
        } else {
          const damage = rand(10, 22);
          const nextHealth = clamp(next.health - damage, 0, MAX_HEALTH);
          next.health = nextHealth;
          next.healthUpdatedAt = nowIso;

          if (nextHealth <= 0) {
            const hospitalMinutes = getCrimeHospitalMinutes(crime.id);
            next.hospitalUntil = new Date(Date.now() + hospitalMinutes * 60 * 1000).toISOString();
            push(`Crime failed: ${crime.name}. You were put in hospital for ${hospitalMinutes} minutes.`);
          } else {
            push(`Crime failed: ${crime.name}. You escaped but took ${damage} damage.`);
          }
        }
      }
      break;
    }
    case "fightRival": {
      assertFree(next);
      const rival = RIVALS.find((entry) => entry.id === action.rivalId);
      if (!rival) throw new Error("Rival not found");
      if (next.energy < FIGHT_ENERGY_COST) throw new Error("Not enough energy");

      const fightJobBonus = Number(getJobBonus(next).fight || 0);
      const effectiveStrength = next.strength + Number(getJobBonus(next).strength || 0);
      const effectiveSpeed = next.speed + Number(getJobBonus(next).speed || 0);
      const effectiveDefense = next.defense + Number(getJobBonus(next).defense || 0);
      const combatBonus = getEquippedBonus(next, "combat");
      const playerPower = effectiveStrength + effectiveSpeed + effectiveDefense + fightJobBonus + combatBonus + rand(0, 14);
      const success = playerPower >= rival.power + rand(0, 12);

      next.energy = clamp(next.energy - FIGHT_ENERGY_COST, 0, getEnergyCap(next));
      next.energyUpdatedAt = nowIso;
      next.day += 1;

      if (success) {
        next.cash += rival.reward;
        next.respect += rival.respect;
        next.wins += 1;
        next.strength += rand(0, 1);
        next.speed += rand(0, 1);
        next.defense += rand(0, 1);
        push(`Beat ${rival.name} and took $${rival.reward}.`);
      } else {
        const damage = rand(12, 24);
        next.losses += 1;
        next.health = clamp(next.health - damage, 0, MAX_HEALTH);
        next.healthUpdatedAt = nowIso;
        push(`Lost to ${rival.name} and took ${damage} damage.`);
      }
      break;
    }
    case "buyItem": {
      const item = ITEMS.find((entry) => entry.id === action.itemId);
      if (!item) throw new Error("Item not found");
      const itemDiscount = Number(getJobBonus(next).itemDiscount || 0);
      const price = Math.max(1, Math.round(item.price * (1 - itemDiscount)));
      if (next.cash < price) throw new Error("Not enough cash");
      next.cash -= price;
      next.inventory[item.id] = (next.inventory[item.id] || 0) + 1;
      push(`Bought ${item.name} for $${price}.`);
      break;
    }
    case "useItem": {
      const item = ITEMS.find((entry) => entry.id === action.itemId);
      if (!item) throw new Error("Item not found");
      if ((next.inventory[item.id] || 0) <= 0) throw new Error("Item not owned");

      const equipmentSlots = ["primary", "secondary", "melee", "head", "chest", "legs", "feet", "utility"];

      if (equipmentSlots.includes(item.type)) {
        (next.equipped as Record<string, string | null>)[item.type] = item.id;
        push(`Equipped ${item.name}.`);
        break;
      }

      if (item.type === "medical" || item.type === "utility_use") {
        next.inventory[item.id] -= 1;
        next.health = clamp(next.health + Number(item.effect?.health || 0), 0, MAX_HEALTH);
        next.energy = clamp(next.energy + Number(item.effect?.energy || 0), 0, getEnergyCap(next));
        next.bravery = clamp(next.bravery + Number(item.effect?.bravery || 0), 0, getBraveryCap(next));

        const reduceMinutes = Number(item.effect?.hospitalReduceMinutes || 0);
        if (reduceMinutes > 0 && next.hospitalUntil) {
          const reducedUntilMs = new Date(next.hospitalUntil).getTime() - reduceMinutes * 60 * 1000;
          next.hospitalUntil = reducedUntilMs > Date.now() ? new Date(reducedUntilMs).toISOString() : null;
        }

        next.healthUpdatedAt = nowIso;
        next.energyUpdatedAt = nowIso;
        next.braveryUpdatedAt = nowIso;

        push(`Used ${item.name}.`);
        break;
      }

      throw new Error("Item cannot be used");
    }

    case "sellItem": {
      const item = ITEMS.find((entry) => entry.id === action.itemId);
      if (!item) throw new Error("Item not found");
      if ((next.inventory[item.id] || 0) <= 0) throw new Error("Item not owned");

      const salePrice = Math.max(1, Math.floor(Number(item.price || 0) / 3));
      next.inventory[item.id] = Math.max(0, Number(next.inventory[item.id] || 0) - 1);
      if (next.inventory[item.id] <= 0) {
        delete next.inventory[item.id];
        for (const [slot, equippedId] of Object.entries(next.equipped || {})) {
          if (equippedId === item.id) {
            (next.equipped as Record<string, string | null>)[slot] = null;
          }
        }
      }

      next.cash += salePrice;
      push(`Sold ${item.name} for $${salePrice}.`);
      break;
    }

    case "activatePremium": {
      const baseMs = getPremiumBaseMs(next);
      (next as any).premiumUntil = new Date(baseMs + PREMIUM_CYCLE_MS).toISOString();
      (next as any).premiumCoins = Number((next as any).premiumCoins || 0) + 100;
      (next as any).premiumAutoRenew = action.plan === "continuous";
      push(
        action.plan === "continuous"
          ? "Continuous premium activated. Premium extended by 30 days and 100 premium coins added."
          : "Monthly premium activated. Premium extended by 30 days and 100 premium coins added."
      );
      break;
    }
    case "cancelPremiumAutoRenew": {
      if (!(next as any).premiumAutoRenew) throw new Error("Continuous premium is not active");
      (next as any).premiumAutoRenew = false;
      push("Continuous premium auto-renew cancelled.");
      break;
    }
    case "personalDeposit": {
      const amount = Math.max(0, Math.round(action.amount));
      if (amount <= 0 || next.cash < amount) throw new Error("Cannot deposit");
      next.cash -= amount;
      next.bank += amount;
      push(`Deposited $${amount} into the bank.`);
      break;
    }
    case "personalWithdraw": {
      const amount = Math.max(0, Math.round(action.amount));
      if (amount <= 0 || next.bank < amount) throw new Error("Cannot withdraw");
      next.bank -= amount;
      next.cash += amount;
      push(`Withdrew $${amount} from the bank.`);
      break;
    }
  }

  return { state: next, feed };
}
