export type PremiumState = {
  premiumUntil?: string | null;
  premiumAutoRenew?: boolean;
  premiumCoins?: number;
};

export function isPremiumActive(state: PremiumState, nowMs = Date.now()): boolean {
  if (!state.premiumUntil) return false;
  const expiry = new Date(state.premiumUntil).getTime();
  return Number.isFinite(expiry) && expiry > nowMs;
}

export function getMaxEnergy(state: PremiumState): number {
  return isPremiumActive(state) ? 150 : 100;
}

export function getEnergyTickAmount(state: PremiumState): number {
  return isPremiumActive(state) ? 10 : 5;
}

export function getEnergyTickMinutes(state: PremiumState): number {
  return 10;
}

export function getBraveryTickAmount(_state: PremiumState): number {
  return 1;
}

export function getBraveryTickMinutes(state: PremiumState): number {
  return isPremiumActive(state) ? 4 : 5;
}

export function clampExpiredEnergy(currentEnergy: number, state: PremiumState): number {
  return Math.min(currentEnergy, getMaxEnergy(state));
}
