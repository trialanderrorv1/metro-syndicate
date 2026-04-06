import { prisma, bootstrapHandle, loadPlayerByHandle, savePlayerState } from "./persistence";
import { type PlayerState } from "../shared/gameData";

async function territoryControlsAvailable() {
  const anyPrisma = prisma as any;
  return !!anyPrisma.territoryControl?.findMany;
}

async function notificationsAvailable() {
  const anyPrisma = prisma as any;
  return !!anyPrisma.notification?.findMany;
}

export async function pushNotification(playerId: string, kind: string, title: string, body: string, detailJson?: unknown) {
  const anyPrisma = prisma as any;
  if (!(await notificationsAvailable())) return null;
  return anyPrisma.notification.create({ data: { playerId, kind, title, body, detailJson: detailJson || null } });
}

export async function listNotificationsForHandle(handle: string) {
  const player = await loadPlayerByHandle(handle);
  const anyPrisma = prisma as any;
  if (!(await notificationsAvailable())) return [];
  return anyPrisma.notification.findMany({ where: { playerId: player.id }, orderBy: { createdAt: "desc" }, take: 40 });
}

export async function markNotificationRead(handle: string, notificationId: string) {
  const player = await loadPlayerByHandle(handle);
  const anyPrisma = prisma as any;
  if (!(await notificationsAvailable())) return { ok: false };
  await anyPrisma.notification.updateMany({ where: { id: notificationId, playerId: player.id }, data: { readAt: new Date() } });
  return { ok: true };
}

export async function durableTerritories() {
  const rows = await prisma.territory.findMany({ orderBy: { createdAt: "asc" } });
  if (!(await territoryControlsAvailable())) {
    return rows.map((row) => ({ ...row, control: null }));
  }
  const anyPrisma = prisma as any;
  const controls = await anyPrisma.territoryControl.findMany({});
  const byTerritoryId = Object.fromEntries(controls.map((c: any) => [c.territoryId, c]));
  return rows.map((row) => ({ ...row, control: byTerritoryId[row.id] || null }));
}

export async function attackDurableTerritory(handle: string, territoryId: string) {
  const player = await loadPlayerByHandle(handle);
  if (!player.crewId) throw new Error("Join or found a crew first");
  const crew = await prisma.crew.findUnique({ where: { id: player.crewId } });
  if (!crew) throw new Error("Crew not found");
  const territory = await prisma.territory.findUnique({ where: { id: territoryId } });
  if (!territory) throw new Error("Territory not found");
  const state = player.stateJson as PlayerState;
  const attackPower = state.strength + state.speed + state.defense + Math.floor(Math.random() * 10);

  const anyPrisma = prisma as any;
  if (!(await territoryControlsAvailable())) {
    throw new Error("Territory control table not migrated yet");
  }

  const current = await anyPrisma.territoryControl.findUnique({ where: { territoryId: territory.id } });
  const defense = current?.defense || Math.floor(territory.baseIncome / 50) + 8;
  const success = attackPower >= defense;

  if (success) {
    await anyPrisma.territoryControl.upsert({
      where: { territoryId: territory.id },
      update: { crewId: crew.id, crewName: crew.name, defense: attackPower, passiveIncome: territory.baseIncome },
      create: { territoryId: territory.id, crewId: crew.id, crewName: crew.name, defense: attackPower, passiveIncome: territory.baseIncome },
    });
    await prisma.crew.update({ where: { id: crew.id }, data: { cash: { increment: territory.baseIncome } } });
    state.log = [`Captured ${territory.name} for ${crew.name}.`, ...state.log].slice(0, 12);
    await savePlayerState(player.id, state);
    await pushNotification(player.id, "TERRITORY", "Territory captured", `${territory.name} is now controlled by ${crew.name}.`, { territoryId: territory.id });
  } else {
    state.health = Math.max(0, state.health - 10);
    state.log = [`Failed to take ${territory.name}.`, ...state.log].slice(0, 12);
    await savePlayerState(player.id, state);
    await pushNotification(player.id, "TERRITORY", "Territory attack failed", `You failed to take ${territory.name}.`, { territoryId: territory.id });
  }

  return { success, bootstrap: await bootstrapHandle(handle), territories: await durableTerritories(), notifications: await listNotificationsForHandle(handle) };
}
