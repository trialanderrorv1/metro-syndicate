import { prisma, loadPlayerByHandle, savePlayerState, bootstrapHandle } from "./persistence";
import { ITEMS, type PlayerState } from "../shared/gameData";

const territoryOwners = new Map<string, { crewId: string; crewName: string; defense: number }>();

export async function seedContractsAndTerritories() {
  const contracts = await prisma.contractMission.count();
  if (contracts === 0) {
    await prisma.contractMission.createMany({
      data: [
        { title: "Silent Extraction", body: "Run one street crime and cash out safely.", rewardCash: 1800, rewardItemId: null, rewardRespect: 3, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), status: "ACTIVE" },
        { title: "Dock Sweep", body: "Beat a rival and hold your nerve.", rewardCash: 2200, rewardItemId: "utility-1", rewardRespect: 4, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), status: "ACTIVE" },
        { title: "Hard Reset", body: "Work, recover, and stay moving.", rewardCash: 1400, rewardItemId: null, rewardRespect: 2, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), status: "ACTIVE" }
      ]
    });
  }

  const territories = await prisma.territory.count();
  if (territories === 0) {
    await prisma.territory.createMany({
      data: [
        { slug: "apex-delta", name: "Delta Block", cityId: "apex", baseIncome: 650 },
        { slug: "iron-docks", name: "Iron Docks", cityId: "iron", baseIncome: 900 },
        { slug: "veil-yard", name: "Veil Yard", cityId: "veil", baseIncome: 780 }
      ]
    });
  }
}

export async function listMarket() {
  return prisma.marketListing.findMany({ where: { status: "ACTIVE", expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, take: 60 });
}

export async function createListing(handle: string, itemId: string, quantity: number, unitPrice: number) {
  const player = await loadPlayerByHandle(handle);
  const state = player.stateJson as PlayerState;
  const qty = Math.max(1, Math.min(99, Math.round(quantity)));
  const price = Math.max(1, Math.min(1_000_000, Math.round(unitPrice)));
  if ((state.inventory[itemId] || 0) < qty) throw new Error("Not enough items");
  state.inventory[itemId] -= qty;
  state.log = [`Listed ${qty}x ${itemId} on the market.`, ...state.log].slice(0, 12);
  await savePlayerState(player.id, state);
  await prisma.marketListing.create({
    data: {
      playerId: player.id,
      itemId,
      quantity: qty,
      unitPrice: price,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2)
    }
  });
  return bootstrapHandle(handle);
}

export async function buyListing(handle: string, listingId: string) {
  const buyer = await loadPlayerByHandle(handle);
  const listing = await prisma.marketListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "ACTIVE") throw new Error("Listing unavailable");
  if (listing.playerId === buyer.id) throw new Error("Cannot buy your own listing");
  const buyerState = buyer.stateJson as PlayerState;
  const total = listing.quantity * listing.unitPrice;
  if (buyerState.cash < total) throw new Error("Not enough cash");
  const seller = await prisma.player.findUnique({ where: { id: listing.playerId } });
  if (!seller) throw new Error("Seller missing");
  const sellerState = seller.stateJson as PlayerState;
  buyerState.cash -= total;
  buyerState.inventory[listing.itemId] = (buyerState.inventory[listing.itemId] || 0) + listing.quantity;
  buyerState.log = [`Bought ${listing.quantity}x ${listing.itemId} from the market.`, ...buyerState.log].slice(0, 12);
  sellerState.cash += total;
  sellerState.log = [`Sold ${listing.quantity}x ${listing.itemId} on the market.`, ...sellerState.log].slice(0, 12);
  await prisma.marketListing.update({ where: { id: listing.id }, data: { status: "SOLD" } });
  await savePlayerState(buyer.id, buyerState);
  await savePlayerState(seller.id, sellerState);
  return bootstrapHandle(handle);
}

export async function cancelListing(handle: string, listingId: string) {
  const player = await loadPlayerByHandle(handle);
  const listing = await prisma.marketListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.playerId !== player.id || listing.status !== "ACTIVE") throw new Error("Listing unavailable");
  const state = player.stateJson as PlayerState;
  state.inventory[listing.itemId] = (state.inventory[listing.itemId] || 0) + listing.quantity;
  state.log = [`Cancelled listing for ${listing.itemId}.`, ...state.log].slice(0, 12);
  await prisma.marketListing.update({ where: { id: listing.id }, data: { status: "CANCELLED" } });
  await savePlayerState(player.id, state);
  return bootstrapHandle(handle);
}

export async function listContracts() {
  await seedContractsAndTerritories();
  return prisma.contractMission.findMany({ where: { status: "ACTIVE", expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, take: 20 });
}

export async function claimContract(handle: string, contractId: string) {
  const player = await loadPlayerByHandle(handle);
  const contract = await prisma.contractMission.findUnique({ where: { id: contractId } });
  if (!contract || contract.status !== "ACTIVE" || contract.expiresAt < new Date()) throw new Error("Contract unavailable");
  const state = player.stateJson as PlayerState;
  state.cash += contract.rewardCash;
  state.respect += contract.rewardRespect;
  if (contract.rewardItemId) {
    state.inventory[contract.rewardItemId] = (state.inventory[contract.rewardItemId] || 0) + 1;
  }
  state.log = [`Claimed contract ${contract.title}.`, ...state.log].slice(0, 12);
  await prisma.contractMission.update({ where: { id: contract.id }, data: { status: "CLAIMED" } });
  await savePlayerState(player.id, state);
  return bootstrapHandle(handle);
}

export async function listTerritories() {
  await seedContractsAndTerritories();
  const rows = await prisma.territory.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    ...row,
    control: territoryOwners.get(row.id) || null,
  }));
}

export async function attackTerritory(handle: string, territoryId: string) {
  const player = await loadPlayerByHandle(handle);
  if (!player.crewId) throw new Error("Join or found a crew first");
  const crew = await prisma.crew.findUnique({ where: { id: player.crewId } });
  if (!crew) throw new Error("Crew not found");
  const territory = await prisma.territory.findUnique({ where: { id: territoryId } });
  if (!territory) throw new Error("Territory not found");
  const state = player.stateJson as PlayerState;
  const attackPower = state.strength + state.speed + state.defense + Math.floor(Math.random() * 10);
  const current = territoryOwners.get(territory.id);
  const defense = current?.defense || Math.floor(territory.baseIncome / 50) + 8;
  const success = attackPower >= defense;
  if (success) {
    territoryOwners.set(territory.id, { crewId: crew.id, crewName: crew.name, defense: attackPower });
    await prisma.crew.update({ where: { id: crew.id }, data: { cash: { increment: territory.baseIncome } } });
    state.log = [`Captured ${territory.name} for ${crew.name}.`, ...state.log].slice(0, 12);
    await savePlayerState(player.id, state);
  } else {
    state.health = Math.max(0, state.health - 10);
    state.log = [`Failed to take ${territory.name}.`, ...state.log].slice(0, 12);
    await savePlayerState(player.id, state);
  }
  return { success, bootstrap: await bootstrapHandle(handle), territories: await listTerritories() };
}

export function describeItem(itemId: string) {
  return ITEMS.find((item) => item.id === itemId)?.name || itemId;
}
