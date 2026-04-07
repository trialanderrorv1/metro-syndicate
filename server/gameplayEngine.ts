import { CITIES, CRIMES, ITEMS, JOBS, RIVALS, type PlayerState } from "../shared/gameData";

export type GameAction =
  | { type: "recover" }
  | { type: "travel"; cityId: string }
  | { type: "takeJob"; jobId: string }
  | { type: "work" }
  | { type: "train"; stat: "strength" | "speed" | "defense" }
  | { type: "crime"; crimeId: string }
  | { type: "fightRival"; rivalId: string }
  | { type: "buyItem"; itemId: string }
  | { type: "useItem"; itemId: string }
  | { type: "personalDeposit"; amount: number }
  | { type: "personalWithdraw"; amount: number };

const MAX_ENERGY = 100;
const MAX_BRAVERY = 20;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function applyGameAction(state: PlayerState, action: GameAction) {
  let next: PlayerState = {
    ...state,
    inventory: { ...state.inventory },
    equipped: { ...state.equipped },
    log: [...state.log],
  };
  const feed: string[] = [];
  const nowIso = new Date().toISOString();

  const push = (entry: string) => {
    feed.unshift(entry);
    next.log = [entry, ...next.log].slice(0, 12);
  };

  switch (action.type) {
    case "recover": {
      next.energy = MAX_ENERGY;
      next.energyUpdatedAt = nowIso;
      next.bravery = MAX_BRAVERY;
      next.braveryUpdatedAt = nowIso;
      next.health = clamp(next.health + 20, 0, 100);
      next.day += 1;
      push("Recovered and reset your edge.");
      break;
    }
    case "travel": {
      const city = CITIES.find((c) => c.id === action.cityId);
      if (!city) throw new Error("City not found");
      if (next.city === city.id) throw new Error("Already there");
      const cost = 250;
      if (next.cash < cost) throw new Error("Not enough cash to travel");
      next.cash -= cost;
      next.city = city.id;
      next.day += 1;
      push(`Travelled to ${city.name}.`);
      break;
    }
    case "takeJob": {
      const job = JOBS.find((j) => j.id === action.jobId);
      if (!job) throw new Error("Job not found");
      if (next.respect < job.req) throw new Error("Respect too low");
      next.job = job.id;
      push(`Took the ${job.name} job.`);
      break;
    }
    case "work": {
      const job = JOBS.find((j) => j.id === next.job) || JOBS[0];
      if (next.energy < job.energy) throw new Error("Not enough energy");
      next.energy -= job.energy;
      next.energyUpdatedAt = nowIso;
      next.cash += job.pay;
      next.respect += job.respect;
      next.day += 1;
      push(`Worked a ${job.name} shift for ${job.pay}.`);
      break;
    }
    case "train": {
      if (next.energy < 10) throw new Error("Not enough energy");
      next.energy -= 10;
      next.energyUpdatedAt = nowIso;
      next[action.stat] += rand(1, 3);
      next.day += 1;
      push(`Trained ${action.stat}.`);
      break;
    }
    case "crime": {
      const crime = CRIMES.find((c) => c.id === action.crimeId);
      if (!crime) throw new Error("Crime not found");
      if (next.bravery < crime.bravery) throw new Error("Not enough bravery");
      const successChance = clamp(55 + next.speed + next.strength - crime.risk - next.heat / 2, 15, 92);
      const success = Math.random() * 100 <= successChance;
      next.bravery -= crime.bravery;
      next.braveryUpdatedAt = nowIso;
      next.day += 1;
      if (success) {
        next.cash += crime.cash;
        next.respect += crime.respect;
        next.heat = clamp(next.heat + rand(4, 10), 0, 100);
        push(`Crime succeeded: ${crime.name}.`);
      } else {
        next.health = clamp(next.health - rand(8, 18), 0, 100);
        next.heat = clamp(next.heat + rand(8, 16), 0, 100);
        push(`Crime failed: ${crime.name}.`);
      }
      break;
    }
    case "fightRival": {
      const rival = RIVALS.find((r) => r.id === action.rivalId);
      if (!rival) throw new Error("Rival not found");
      if (next.energy < 12) throw new Error("Not enough energy");
      const equippedBonus = (ITEMS.find((i) => i.id === next.equipped.weapon)?.effect?.combat || 0) + (ITEMS.find((i) => i.id === next.equipped.armor)?.effect?.combat || 0);
      const power = next.strength + next.speed + next.defense + equippedBonus + rand(0, 16);
      const success = power >= rival.power + rand(0, 14);
      next.energy -= 12;
      next.energyUpdatedAt = nowIso;
      next.day += 1;
      if (success) {
        next.cash += rival.reward;
        next.respect += rival.respect;
        next.wins += 1;
        push(`Beat ${rival.name}.`);
      } else {
        next.losses += 1;
        next.health = clamp(next.health - rand(10, 20), 0, 100);
        push(`Lost to ${rival.name}.`);
      }
      break;
    }
    case "buyItem": {
      const item = ITEMS.find((i) => i.id === action.itemId);
      if (!item) throw new Error("Item not found");
      if (next.cash < item.price) throw new Error("Not enough cash");
      next.cash -= item.price;
      next.inventory[item.id] = (next.inventory[item.id] || 0) + 1;
      push(`Bought ${item.name}.`);
      break;
    }
    case "useItem": {
      const item = ITEMS.find((i) => i.id === action.itemId);
      if (!item) throw new Error("Item not found");
      if ((next.inventory[item.id] || 0) <= 0) throw new Error("Item not owned");
      if (item.type === "weapon") next.equipped.weapon = item.id;
      if (item.type === "armor") next.equipped.armor = item.id;
      if (item.type === "utility") next.equipped.utility = item.id;
      if (item.type === "consumable") {
        next.inventory[item.id] -= 1;
        next.energy = clamp(next.energy + (item.effect?.energy || 0), 0, MAX_ENERGY);
        next.energyUpdatedAt = nowIso;
      }
      push(`${item.type === "consumable" ? "Used" : "Equipped"} ${item.name}.`);
      break;
    }
    case "personalDeposit": {
      const amount = Math.max(0, Math.round(action.amount));
      if (amount <= 0 || next.cash < amount) throw new Error("Cannot deposit");
      next.cash -= amount;
      next.bank += amount;
      push(`Deposited ${amount} into the bank.`);
      break;
    }
    case "personalWithdraw": {
      const amount = Math.max(0, Math.round(action.amount));
      if (amount <= 0 || next.bank < amount) throw new Error("Cannot withdraw");
      next.bank -= amount;
      next.cash += amount;
      push(`Withdrew ${amount} from the bank.`);
      break;
    }
  }

  return { state: next, feed };
}
