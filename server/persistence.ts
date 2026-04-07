import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applyGameAction, type GameAction } from "./gameplayEngine";
import { JOBS, makeInitialState, type PlayerState } from "../shared/gameData";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter });

const ENERGY_REGEN_AMOUNT = 5;
const ENERGY_REGEN_INTERVAL_MS = 10 * 60 * 1000;
const MAX_ENERGY = 100;
const BRAVERY_REGEN_AMOUNT = 1;
const BRAVERY_REGEN_INTERVAL_MS = 5 * 60 * 1000;
const MAX_BRAVERY = 20;
const HEALTH_REGEN_AMOUNT = 10;
const HEALTH_REGEN_INTERVAL_MS = 5 * 60 * 1000;
const MAX_HEALTH = 100;

function normalizeFixedScheduleStat(
  value: number,
  updatedAt: string | undefined,
  maxValue: number,
  regenAmount: number,
  regenIntervalMs: number,
) {
  const nowMs = Date.now();
  const safeUpdatedAt = updatedAt || new Date(nowMs).toISOString();
  const updatedAtMs = new Date(safeUpdatedAt).getTime();

  if (!Number.isFinite(updatedAtMs)) {
    return { value, updatedAt: new Date(nowMs).toISOString() };
  }

  if (value >= maxValue) {
    return { value: maxValue, updatedAt: new Date(nowMs).toISOString() };
  }

  const nowBucketMs = Math.floor(nowMs / regenIntervalMs) * regenIntervalMs;
  const updatedBucketMs = Math.floor(updatedAtMs / regenIntervalMs) * regenIntervalMs;
  const ticks = Math.max(0, Math.floor((nowBucketMs - updatedBucketMs) / regenIntervalMs));

  if (ticks <= 0) {
    return { value, updatedAt: safeUpdatedAt };
  }

  const regained = ticks * regenAmount;
  const nextValue = Math.min(maxValue, value + regained);
  const nextAnchorMs = nextValue >= maxValue ? nowMs : nowBucketMs;

  return {
    value: nextValue,
    updatedAt: new Date(nextAnchorMs).toISOString(),
  };
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
    jailUntil: state.jailUntil || null,
    day: Number(state.day ?? 1),
    wins: Number(state.wins ?? 0),
    losses: Number(state.losses ?? 0),
    crimesSucceeded: Number(state.crimesSucceeded ?? 0),
    crimesFailed: Number(state.crimesFailed ?? 0),
    inventory: state.inventory || {},
    equipped: state.equipped || { weapon: null, armor: null, utility: null },
    log: state.log || ["Welcome to Metro Syndicate."],
  };

  const energy = normalizeFixedScheduleStat(base.energy, base.energyUpdatedAt, MAX_ENERGY, ENERGY_REGEN_AMOUNT, ENERGY_REGEN_INTERVAL_MS);
  const bravery = normalizeFixedScheduleStat(base.bravery, base.braveryUpdatedAt, MAX_BRAVERY, BRAVERY_REGEN_AMOUNT, BRAVERY_REGEN_INTERVAL_MS);
  const health = normalizeFixedScheduleStat(base.health, base.healthUpdatedAt, MAX_HEALTH, HEALTH_REGEN_AMOUNT, HEALTH_REGEN_INTERVAL_MS);

  return {
    ...base,
    energy: energy.value,
    energyUpdatedAt: energy.updatedAt,
    bravery: bravery.value,
    braveryUpdatedAt: bravery.updatedAt,
    health: health.value,
    healthUpdatedAt: health.updatedAt,
  };
}

async function persistNormalizedState(playerId: string, state: PlayerState) {
  return prisma.player.update({ where: { id: playerId }, data: { stateJson: state } });
}

export async function ensureDemoPlayer(handle: string) {
  const clean = handle.trim().slice(0, 20);
  if (!clean || clean.length < 3) throw new Error("Handle too short");

  const player = await prisma.player.upsert({
    where: { handle: clean },
    update: {},
    create: {
      handle: clean,
      passwordHash: "demo-only",
      stateJson: makeInitialState(clean),
    },
  });

  return player;
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
  const current = player.stateJson as PlayerState;
  const result = applyGameAction(current, action);
  await savePlayerState(player.id, result.state);
  return result;
}

export async function createCrewForHandle(handle: string, name: string, tag?: string) {
  const player = await loadPlayerByHandle(handle);
  if (player.crewId) throw new Error("Already in a crew");
  const state = player.stateJson as PlayerState;
  if (state.cash < 5000 || state.respect < 10) throw new Error("Need 5000 cash and 10 respect to found a crew");
  const crew = await prisma.crew.create({
    data: {
      name: name.trim().slice(0, 24),
      tag: (tag || "").trim().slice(0, 4).toUpperCase() || null,
      ownerId: player.id,
    },
  });
  const nextState: PlayerState = {
    ...state,
    cash: state.cash - 5000,
    log: [`Founded crew ${crew.name}.`, ...state.log].slice(0, 14),
  };
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
  return prisma.crewInvite.create({
    data: { crewId: from.crewId, fromPlayerId: from.id, toPlayerId: target.id },
  });
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
  return prisma.directMessage.create({
    data: {
      fromPlayerId: player.id,
      toPlayerId: `crew:${crewId}`,
      body: text,
    },
  });
}

export async function getCrewMessages(crewId: string) {
  const messages = await prisma.directMessage.findMany({
    where: { toPlayerId: `crew:${crewId}` },
    orderBy: { createdAt: "asc" },
    take: 80,
  });
  const senders = await prisma.player.findMany({ where: { id: { in: messages.map((m) => m.fromPlayerId) } }, select: { id: true, handle: true } });
  const byId = Object.fromEntries(senders.map((s) => [s.id, s.handle]));
  return messages.map((m) => ({ id: m.id, handle: byId[m.fromPlayerId] || "unknown", body: m.body, createdAt: m.createdAt }));
}

export async function bootstrapHandle(handle: string) {
  const player = await ensureDemoPlayer(handle);
  const hydrated = await loadPlayerByHandle(player.handle);
  const crew = hydrated.crewId ? await prisma.crew.findUnique({ where: { id: hydrated.crewId } }) : null;
  const roster = hydrated.crewId
    ? await prisma.player.findMany({ where: { crewId: hydrated.crewId }, select: { id: true, handle: true } })
    : [];
  const invitesRaw = await prisma.crewInvite.findMany({ where: { toPlayerId: hydrated.id, status: "PENDING" }, orderBy: { createdAt: "desc" } });
  const crews = invitesRaw.length ? await prisma.crew.findMany({ where: { id: { in: invitesRaw.map((i) => i.crewId) } }, select: { id: true, name: true, tag: true } }) : [];
  const crewById = Object.fromEntries(crews.map((c) => [c.id, c]));
  return {
    player: { id: hydrated.id, handle: hydrated.handle, crewId: hydrated.crewId, state: hydrated.stateJson as PlayerState },
    crew: crew ? { id: crew.id, name: crew.name, tag: crew.tag, cash: crew.cash, roster, messages: await getCrewMessages(crew.id) } : null,
    invites: invitesRaw.map((invite) => ({ id: invite.id, crewId: invite.crewId, crewName: crewById[invite.crewId]?.name || "Unknown Crew", crewTag: crewById[invite.crewId]?.tag || null })),
  };
}
