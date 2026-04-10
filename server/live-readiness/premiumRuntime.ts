import { prisma } from "../persistence";

export async function getPremiumStateForUser(userId: string) {
  const grants = await prisma.premiumGrant.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { premiumUntil: "desc" },
  });

  const now = Date.now();
  const active = grants.find((grant) => new Date(grant.premiumUntil).getTime() > now) || null;
  const premiumCoins = grants.reduce((sum, grant) => sum + Number(grant.grantedCoins || 0), 0);

  return {
    premiumActive: !!active,
    premiumUntil: active ? active.premiumUntil.toISOString() : null,
    premiumCoins,
  };
}
