import { PrismaClient } from "@prisma/client";
import { applyGameAction, type GameAction } from "./gameplayEngine";
import { makeInitialState, type PlayerState } from "../shared/gameData";

export const prisma = new PrismaClient();

export async function ensureDemoPlayer(handle: string) {
  const clean = handle.trim().slice(0, 20);
  if (!clean || clean.length < 3) throw new Error("Handle too short");
  let player = await prisma.player.findUnique({ where: { handle: clean } });
  if (!player) {
    player = await prisma.player.create({
      data: {
        handle: clean,
        passwordHash: "demo-only",
        stateJson: makeInitialState(clean),
      },
    });
  }
  return player;
}

export async function loadPlayerByHandle(handle: string) {
  const player = await prisma.player.findUnique({ where: { handle } });
  if (!player) throw new Error("Player not found");
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
    log: [`Founded crew ${crew.name}.`, ...state.log].slice(0, 12),
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
  const crew = player.crewId ? await prisma.crew.findUnique({ where: { id: player.crewId } }) : null;
  const roster = player.crewId
    ? await prisma.player.findMany({ where: { crewId: player.crewId }, select: { id: true, handle: true } })
    : [];
  const invitesRaw = await prisma.crewInvite.findMany({ where: { toPlayerId: player.id, status: "PENDING" }, orderBy: { createdAt: "desc" } });
  const crews = invitesRaw.length ? await prisma.crew.findMany({ where: { id: { in: invitesRaw.map((i) => i.crewId) } }, select: { id: true, name: true, tag: true } }) : [];
  const crewById = Object.fromEntries(crews.map((c) => [c.id, c]));
  return {
    player: { id: player.id, handle: player.handle, crewId: player.crewId, state: player.stateJson as PlayerState },
    crew: crew ? { id: crew.id, name: crew.name, tag: crew.tag, cash: crew.cash, roster, messages: await getCrewMessages(crew.id) } : null,
    invites: invitesRaw.map((invite) => ({ id: invite.id, crewId: invite.crewId, crewName: crewById[invite.crewId]?.name || "Unknown Crew", crewTag: crewById[invite.crewId]?.tag || null })),
  };
}
