import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applyGameAction, type GameAction } from "./gameplayEngine";
import { CRIME_CATEGORIES, EQUIPMENT_SLOTS, ITEMS, JOBS, getLevelFromRespect, getMaxBravery, makeInitialState, type EquipmentSlot, type PlayerState } from "../shared/gameData";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter });

const ENERGY_REGEN_AMOUNT = 5;
const ENERGY_REGEN_INTERVAL_MS = 10 * 60 * 1000;
const MAX_ENERGY = 100;
const BRAVERY_REGEN_AMOUNT = 1;
const BRAVERY_REGEN_INTERVAL_MS = 5 * 60 * 1000;
const HEALTH_REGEN_AMOUNT = 10;
const HEALTH_REGEN_INTERVAL_MS = 5 * 60 * 1000;
const BASE_MAX_HEALTH = 100;

function normalizeFixedScheduleStat(value: number, updatedAt: string | undefined, maxValue: number, regenAmount: number, regenIntervalMs: number) {
  const nowMs = Date.now();
  const safeUpdatedAt = updatedAt || new Date(nowMs).toISOString();
  const updatedAtMs = new Date(safeUpdatedAt).getTime();
  if (!Number.isFinite(updatedAtMs)) return { value, updatedAt: new Date(nowMs).toISOString() };
  if (value >= maxValue) return { value: maxValue, updatedAt: new Date(nowMs).toISOString() };

  const nowBucketMs = Math.floor(nowMs / regenIntervalMs) * regenIntervalMs;
  const updatedBucketMs = Math.floor(updatedAtMs / regenIntervalMs) * regenIntervalMs;
  const ticks = Math.max(0, Math.floor((nowBucketMs - updatedBucketMs) / regenIntervalMs));
  if (ticks <= 0) return { value, updatedAt: safeUpdatedAt };

  const regained = ticks * regenAmount;
  const nextValue = Math.min(maxValue, value + regained);
  const nextAnchorMs = nextValue >= maxValue ? nowMs : nowBucketMs;
  return { value: nextValue, updatedAt: new Date(nextAnchorMs).toISOString() };
}

function normalizeHealthStat(value: number, updatedAt: string | undefined) {
  if (value <= 0) return { value: 0, updatedAt: updatedAt || new Date().toISOString() };
  return normalizeFixedScheduleStat(value, updatedAt, BASE_MAX_HEALTH, HEALTH_REGEN_AMOUNT, HEALTH_REGEN_INTERVAL_MS);
}

function normalizeCrimeSkills(skills: Record<string, number> | undefined) {
  const base = Object.fromEntries(CRIME_CATEGORIES.map((category) => [category.id, 0]));
  for (const [key, value] of Object.entries(skills || {})) {
    base[key] = Math.max(0, Math.min(100, Number(value || 0)));
  }
  return base;
}

function getEquippedBonus(equipped: Record<EquipmentSlot, string | null>, key: string) {
  return EQUIPMENT_SLOTS
    .map((slot) => equipped?.[slot] || null)
    .map((id) => ITEMS.find((item) => item.id === id)?.effect?.[key as keyof (typeof ITEMS)[number]["effect"]] || 0)
    .reduce((sum, value) => sum + Number(value || 0), 0);
}

function getMaxHealthForStateLike(equipped: Record<EquipmentSlot, string | null>) {
  const bonusPct = getEquippedBonus(equipped, "maxHealthPct");
  return Math.max(BASE_MAX_HEALTH, Math.round(BASE_MAX_HEALTH * (1 + bonusPct / 100)));
}

function normalizeEquipped(equipped: any) {
  const base = Object.fromEntries(EQUIPMENT_SLOTS.map((slot) => [slot, null])) as Record<EquipmentSlot, string | null>;
  if (equipped && typeof equipped === "object") {
    for (const slot of EQUIPMENT_SLOTS) {
      if (typeof equipped[slot] === "string" || equipped[slot] === null) {
        base[slot] = equipped[slot];
      }
    }
    if ("weapon" in equipped && !base.primary) base.primary = equipped.weapon;
    if ("armor" in equipped && !base.chest) base.chest = equipped.armor;
    if ("utility" in equipped && !base.utility) base.utility = equipped.utility;
  }
  return base;
}

function normalizePlayerState(state: PlayerState): PlayerState {
  const nowIso = new Date().toISOString();
  const base: PlayerState = {
    ...state,
    energy: Number(state.energy ?? 100),
    energyUpdatedAt: state.energyUpdatedAt || nowIso,
    bravery: Number(state.bravery ?? 20),
    braveryUpdatedAt: state.braveryUpdatedAt || nowIso,
    health: Number(state.health ?? 100),
    healthUpdatedAt: state.healthUpdatedAt || nowIso,
    strength: Number(state.strength ?? 8),
    speed: Number(state.speed ?? 8),
    defense: Number(state.defense ?? 8),
    respect: Number(state.respect ?? 0),
    city: state.city || "apex",
    job: state.job || JOBS[0].id,
    jobLastPaidOn: state.jobLastPaidOn || null,
    jobChangedAt: state.jobChangedAt || null,
    jailUntil: state.jailUntil || null,
    hospitalUntil: state.hospitalUntil || null,
    day: Number(state.day ?? 1),
    wins: Number(state.wins ?? 0),
    losses: Number(state.losses ?? 0),
    crimesSucceeded: Number(state.crimesSucceeded ?? 0),
    crimesFailed: Number(state.crimesFailed ?? 0),
    bustingExp: Math.max(0, Math.min(100, Number(state.bustingExp ?? 0))),
    crimeSkills: normalizeCrimeSkills(state.crimeSkills),
inventory: (() => {
  const rawInventory = state.inventory || {};
  const keys = Object.keys(rawInventory).filter((key) => Number(rawInventory[key] || 0) > 0);
  const legacyStarterIds = ["recovery-bandage", "recovery-stim", "medical-bandage", "utility-stim", "melee-shiv"];
  const legacyStarterOnly = keys.length > 0 && keys.every((key) => legacyStarterIds.includes(key)) && keys.reduce((sum, key) => sum + Number(rawInventory[key] || 0), 0) <= 4;
  return legacyStarterOnly ? {} : rawInventory;
})(),
    equipped: normalizeEquipped(state.equipped),
    log: state.log || ["Welcome to Metro Syndicate."],
  };

  const level = getLevelFromRespect(base.respect);
  const maxBravery = getMaxBravery(level);
  const energy = normalizeFixedScheduleStat(base.energy, base.energyUpdatedAt, MAX_ENERGY, ENERGY_REGEN_AMOUNT, ENERGY_REGEN_INTERVAL_MS);
  const bravery = normalizeFixedScheduleStat(base.bravery, base.braveryUpdatedAt, maxBravery, BRAVERY_REGEN_AMOUNT, BRAVERY_REGEN_INTERVAL_MS);
  const maxHealth = getMaxHealthForStateLike(base.equipped);
  const health = normalizeFixedScheduleStat(base.health <= 0 ? 0 : base.health, base.healthUpdatedAt, maxHealth, HEALTH_REGEN_AMOUNT, HEALTH_REGEN_INTERVAL_MS);

  const jailMs = base.jailUntil ? new Date(base.jailUntil).getTime() : 0;
  const jailUntil = Number.isFinite(jailMs) && jailMs > Date.now() ? base.jailUntil : null;
  const hospitalMs = base.hospitalUntil ? new Date(base.hospitalUntil).getTime() : 0;
  const hospitalActive = Number.isFinite(hospitalMs) && hospitalMs > Date.now();
  const hospitalUntil = hospitalActive ? base.hospitalUntil : null;

  let nextHealth = health.value;
  let nextHealthUpdatedAt = health.updatedAt;
  if (!hospitalActive && base.hospitalUntil) {
    nextHealth = maxHealth;
    nextHealthUpdatedAt = nowIso;
  }

  return {
    ...base,
    jailUntil,
    hospitalUntil,
    energy: energy.value,
    energyUpdatedAt: energy.updatedAt,
    bravery: bravery.value,
    braveryUpdatedAt: bravery.updatedAt,
    health: nextHealth,
    healthUpdatedAt: nextHealthUpdatedAt,
  };
}

async function persistNormalizedState(playerId: string, state: PlayerState) {
  return prisma.player.update({ where: { id: playerId }, data: { stateJson: state } });
}

export async function ensureDemoPlayer(handle: string) {
  const clean = handle.trim().slice(0, 20);
  if (!clean || clean.length < 3) throw new Error("Handle too short");
  return prisma.player.upsert({
    where: { handle: clean },
    update: {},
    create: { handle: clean, passwordHash: "demo-only", stateJson: makeInitialState(clean) },
  });
}

export async function loadPlayerByHandle(handle: string) {
  const player = await prisma.player.findUnique({ where: { handle } });
  if (!player) throw new Error("Player not found");
  const current = player.stateJson as PlayerState;
  const normalized = normalizePlayerState(current);
  if (JSON.stringify(current) !== JSON.stringify(normalized)) {
    await persistNormalizedState(player.id, normalized);
    return { ...player, stateJson: normalized };
  }
  return player;
}

export async function savePlayerState(playerId: string, state: PlayerState) {
  return prisma.player.update({ where: { id: playerId }, data: { stateJson: state } });
}

export async function applyPlayerAction(handle: string, action: GameAction) {
  const player = await loadPlayerByHandle(handle);
  const result = applyGameAction(player.stateJson as PlayerState, action);
  await savePlayerState(player.id, result.state);
  return result;
}

function jailRemainingMinutes(jailUntil: string | null) {
  if (!jailUntil) return 0;
  const remaining = new Date(jailUntil).getTime() - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
}

export async function listJailedPlayers() {
  const players = await prisma.player.findMany({ select: { id: true, handle: true, stateJson: true } });
  return players
    .map((player) => {
      const state = normalizePlayerState(player.stateJson as PlayerState);
      const remainingMinutes = jailRemainingMinutes(state.jailUntil);
      if (!remainingMinutes) return null;
      return {
        id: player.id,
        handle: player.handle,
        jailUntil: state.jailUntil,
        remainingMinutes,
        bailCost: Math.max(500, remainingMinutes * 120),
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.remainingMinutes || 0) - (a?.remainingMinutes || 0));
}

function hospitalRemainingMinutes(hospitalUntil: string | null) {
  if (!hospitalUntil) return 0;
  const remaining = new Date(hospitalUntil).getTime() - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
}

export async function listHospitalizedPlayers() {
  const players = await prisma.player.findMany({ select: { id: true, handle: true, stateJson: true } });
  return players
    .map((player) => {
      const state = normalizePlayerState(player.stateJson as PlayerState);
      const remainingMinutes = hospitalRemainingMinutes(state.hospitalUntil);
      if (!remainingMinutes) return null;
      return { id: player.id, handle: player.handle, hospitalUntil: state.hospitalUntil, remainingMinutes };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.remainingMinutes || 0) - (a?.remainingMinutes || 0));
}

async function loadPlayerById(playerId: string) {
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found");
  const normalized = normalizePlayerState(player.stateJson as PlayerState);
  if (JSON.stringify(player.stateJson) !== JSON.stringify(normalized)) {
    await persistNormalizedState(player.id, normalized);
  }
  return { ...player, stateJson: normalized };
}

export async function bailOutPlayer(actorHandle: string, targetPlayerId: string) {
  const actor = await loadPlayerByHandle(actorHandle);
  const target = await loadPlayerById(targetPlayerId);
  const actorState = { ...(actor.stateJson as PlayerState), log: [...(actor.stateJson as PlayerState).log] };
  const targetState = { ...(target.stateJson as PlayerState), log: [...(target.stateJson as PlayerState).log] };
  const remainingMinutes = jailRemainingMinutes(targetState.jailUntil);
  if (!remainingMinutes) throw new Error("Target is not in jail.");
  const bailCost = Math.max(500, remainingMinutes * 120);
  if (actorState.cash < bailCost) throw new Error("Not enough cash to pay bail.");
  actorState.cash -= bailCost;
  targetState.jailUntil = null;
  actorState.log = [`Paid ${bailCost} bail for ${target.handle}.`, ...actorState.log].slice(0, 18);
  targetState.log = [`${actor.handle} paid your bail.`, ...targetState.log].slice(0, 18);
  await savePlayerState(actor.id, actorState);
  await savePlayerState(target.id, targetState);
  return { kind: "info" as const, title: "Bail paid", message: `${target.handle} was released for ${bailCost}.` };
}

export async function bustOutPlayer(actorHandle: string, targetPlayerId: string) {
  const actor = await loadPlayerByHandle(actorHandle);
  const target = await loadPlayerById(targetPlayerId);
  const actorState = { ...(actor.stateJson as PlayerState), log: [...(actor.stateJson as PlayerState).log] };
  const targetState = { ...(target.stateJson as PlayerState), log: [...(target.stateJson as PlayerState).log] };
  const remainingMinutes = jailRemainingMinutes(targetState.jailUntil);
  if (!remainingMinutes) throw new Error("Target is not in jail.");
  if (actor.id === target.id) throw new Error("Use bail to leave jail yourself.");
  if (actorState.jailUntil) throw new Error("You cannot bust someone out while in jail.");

  const chance = Math.max(8, Math.min(92, 22 + actorState.bustingExp * 0.6 + actorState.speed * 0.8 + actorState.strength * 0.35 - remainingMinutes * 0.45));
  const success = Math.random() * 100 <= chance;

  if (success) {
    actorState.bustingExp = Math.min(100, actorState.bustingExp + 5);
    targetState.jailUntil = null;
    actorState.log = [`Busted ${target.handle} out of jail. Busting skill is now ${actorState.bustingExp}%.`, ...actorState.log].slice(0, 18);
    targetState.log = [`${actor.handle} busted you out of jail.`, ...targetState.log].slice(0, 18);
    await savePlayerState(actor.id, actorState);
    await savePlayerState(target.id, targetState);
    return { kind: "pass" as const, title: "Bust successful", message: `${target.handle} escaped. Busting experience is now ${actorState.bustingExp}%.` };
  }

  actorState.jailUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  actorState.log = [`Failed to bust ${target.handle} out and got jailed for 10 minutes.`, ...actorState.log].slice(0, 18);
  await savePlayerState(actor.id, actorState);
  return { kind: "jail" as const, title: "Bust failed", message: `You were caught trying to bust ${target.handle} out and got jailed for 10 minutes.` };
}

export async function reviveHospitalPlayer(actorHandle: string, targetPlayerId: string) {
  const actor = await loadPlayerByHandle(actorHandle);
  const target = await loadPlayerById(targetPlayerId);
  const actorState = { ...(actor.stateJson as PlayerState), inventory: { ...((actor.stateJson as PlayerState).inventory || {}) }, crimeSkills: { ...((actor.stateJson as PlayerState).crimeSkills || {}) }, equipped: { ...((actor.stateJson as PlayerState).equipped || {}) }, log: [...((actor.stateJson as PlayerState).log || [])] };
  const targetState = actor.id === target.id
    ? actorState
    : { ...(target.stateJson as PlayerState), inventory: { ...((target.stateJson as PlayerState).inventory || {}) }, crimeSkills: { ...((target.stateJson as PlayerState).crimeSkills || {}) }, equipped: { ...((target.stateJson as PlayerState).equipped || {}) }, log: [...((target.stateJson as PlayerState).log || [])] };

  const remainingMinutes = hospitalRemainingMinutes(targetState.hospitalUntil);
  if (!remainingMinutes) throw new Error("Target is not in hospital.");
  if ((actorState.jailUntil ? new Date(actorState.jailUntil).getTime() : 0) > Date.now()) throw new Error("You cannot revive from jail.");
  if (actorState.energy < 50) throw new Error("You need 50 energy to revive a hospitalized player.");

  const nowIso = new Date().toISOString();
  actorState.energy = Math.max(0, actorState.energy - 50);
  actorState.energyUpdatedAt = nowIso;
  targetState.hospitalUntil = null;
  targetState.health = getMaxHealthForStateLike(targetState.equipped);
  targetState.healthUpdatedAt = nowIso;

  if (actor.id === target.id) {
    actorState.log = [`You revived yourself from hospital for 50 energy.`, ...actorState.log].slice(0, 18);
    await savePlayerState(actor.id, actorState);
    return { kind: "info" as const, title: "Revived", message: `You spent 50 energy and revived yourself from hospital.` };
  }

  actorState.log = [`Revived ${target.handle} from hospital for 50 energy.`, ...actorState.log].slice(0, 18);
  targetState.log = [`${actor.handle} revived you from hospital.`, ...targetState.log].slice(0, 18);
  await savePlayerState(actor.id, actorState);
  await savePlayerState(target.id, targetState);
  return { kind: "info" as const, title: "Revived", message: `${target.handle} was revived from hospital for 50 energy.` };
}

export async function createCrewForHandle(handle: string, name: string, tag?: string) {
  const player = await loadPlayerByHandle(handle);
  if (player.crewId) throw new Error("Already in a crew");
  const state = player.stateJson as PlayerState;
  if (state.cash < 5000 || state.respect < 10) throw new Error("Need 5000 cash and 10 respect to found a crew");
  const crew = await prisma.crew.create({
    data: { name: name.trim().slice(0, 24), tag: (tag || "").trim().slice(0, 4).toUpperCase() || null, ownerId: player.id },
  });
  const nextState: PlayerState = { ...state, cash: state.cash - 5000, log: [`Founded crew ${crew.name}.`, ...state.log].slice(0, 18) };
  await prisma.player.update({ where: { id: player.id }, data: { crewId: crew.id, stateJson: nextState } });
  return crew;
}

export async function searchPlayers(query: string, excludeHandle: string) {
  return prisma.player.findMany({
    where: { handle: { contains: query.trim(), mode: "insensitive" }, NOT: { handle: excludeHandle } },
    select: { id: true, handle: true, crewId: true },
    take: 8,
    orderBy: { handle: "asc" },
  });
}

export async function createCrewInvite(fromHandle: string, targetHandle: string) {
  const from = await loadPlayerByHandle(fromHandle);
  const target = await loadPlayerByHandle(targetHandle);
  if (!from.crewId) throw new Error("Join or found a crew first");
  if (target.crewId) throw new Error("Target already in a crew");
  const existing = await prisma.crewInvite.findFirst({ where: { crewId: from.crewId, toPlayerId: target.id, status: "PENDING" } });
  if (existing) throw new Error("Invite already pending");
  return prisma.crewInvite.create({ data: { crewId: from.crewId, fromPlayerId: from.id, toPlayerId: target.id } });
}

export async function respondToInvite(handle: string, inviteId: string, accept: boolean) {
  const player = await loadPlayerByHandle(handle);
  const invite = await prisma.crewInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.toPlayerId !== player.id || invite.status !== "PENDING") throw new Error("Invite not found");
  if (!accept) {
    await prisma.crewInvite.update({ where: { id: invite.id }, data: { status: "DECLINED" } });
    return { accepted: false };
  }
  await prisma.crewInvite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });
  await prisma.player.update({ where: { id: player.id }, data: { crewId: invite.crewId } });
  return { accepted: true, crewId: invite.crewId };
}

export async function postCrewMessage(handle: string, crewId: string, body: string) {
  const player = await loadPlayerByHandle(handle);
  if (player.crewId !== crewId) throw new Error("Not in crew");
  const text = body.trim().slice(0, 400);
  if (!text) throw new Error("Message empty");
  return prisma.directMessage.create({ data: { fromPlayerId: player.id, toPlayerId: `crew:${crewId}`, body: text } });
}

export async function getCrewMessages(crewId: string) {
  const messages = await prisma.directMessage.findMany({ where: { toPlayerId: `crew:${crewId}` }, orderBy: { createdAt: "asc" }, take: 80 });
  const senders = await prisma.player.findMany({ where: { id: { in: messages.map((m) => m.fromPlayerId) } }, select: { id: true, handle: true } });
  const byId = Object.fromEntries(senders.map((s) => [s.id, s.handle]));
  return messages.map((m) => ({ id: m.id, handle: byId[m.fromPlayerId] || "unknown", body: m.body, createdAt: m.createdAt }));
}

export async function bootstrapHandle(handle: string) {
  const player = await ensureDemoPlayer(handle);
  const hydrated = await loadPlayerByHandle(player.handle);
  const crew = hydrated.crewId ? await prisma.crew.findUnique({ where: { id: hydrated.crewId } }) : null;
  const roster = hydrated.crewId ? await prisma.player.findMany({ where: { crewId: hydrated.crewId }, select: { id: true, handle: true } }) : [];
  const invitesRaw = await prisma.crewInvite.findMany({ where: { toPlayerId: hydrated.id, status: "PENDING" }, orderBy: { createdAt: "desc" } });
  const crews = invitesRaw.length ? await prisma.crew.findMany({ where: { id: { in: invitesRaw.map((i) => i.crewId) } }, select: { id: true, name: true, tag: true } }) : [];
  const crewById = Object.fromEntries(crews.map((c) => [c.id, c]));
  return {
    player: { id: hydrated.id, handle: hydrated.handle, crewId: hydrated.crewId, state: hydrated.stateJson as PlayerState },
    crew: crew ? { id: crew.id, name: crew.name, tag: crew.tag, cash: crew.cash, roster, messages: await getCrewMessages(crew.id) } : null,
    invites: invitesRaw.map((invite) => ({ id: invite.id, crewId: invite.crewId, crewName: crewById[invite.crewId]?.name || "Unknown Crew", crewTag: crewById[invite.crewId]?.tag || null })),
  };
}
