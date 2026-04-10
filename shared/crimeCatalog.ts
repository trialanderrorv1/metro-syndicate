export const CRIME_CATEGORIES = [
  { id: "street", name: "Street Hustles", names: ["Pocket Lift", "Market Dip", "Transit Snatch", "Sidewalk Scam", "Drunk Roll", "Neon Swipe"], baseCash: 120, baseDifficulty: 18, baseBravery: 4, jailChanceBase: 10, jailMinutesBase: 2 },
  { id: "theft", name: "Retail Theft", names: ["Corner Store Sweep", "Luxury Shelf Lift", "Pharmacy Snatch", "Tech Rack Raid", "Designer Grab", "Mall Smash"], baseCash: 870, baseDifficulty: 25, baseBravery: 6, jailChanceBase: 14, jailMinutesBase: 5 },
  { id: "burglary", name: "Burglary", names: ["Backdoor Entry", "Window Crawl", "Brownstone Hit", "Office Sweep", "Vault Room Entry", "Penthouse Burglary"], baseCash: 1620, baseDifficulty: 35, baseBravery: 9, jailChanceBase: 20, jailMinutesBase: 9 },
  { id: "auto", name: "Auto Crime", names: ["Bike Strip", "Moped Boost", "Sedan Jack", "Delivery Van Lift", "Sports Car Snatch", "Armored SUV Theft"], baseCash: 2370, baseDifficulty: 44, baseBravery: 12, jailChanceBase: 26, jailMinutesBase: 14 },
  { id: "vice", name: "Vice & Extortion", names: ["Dice Table Skim", "Protection Shake", "Club Till Dip", "Loan Shark Press", "Casino Squeeze", "Vice Ring Extraction"], baseCash: 3120, baseDifficulty: 54, baseBravery: 15, jailChanceBase: 32, jailMinutesBase: 18 },
  { id: "smuggling", name: "Smuggling", names: ["Harbor Slip", "Cargo Swap", "Tunnel Run", "Border Crate Lift", "Midnight Convoy", "Black Route Shipment"], baseCash: 3870, baseDifficulty: 64, baseBravery: 18, jailChanceBase: 38, jailMinutesBase: 23 },
  { id: "fraud", name: "Fraud", names: ["Card Clone", "Invoice Twist", "Wire Phish", "Payroll Loop", "Shell Company Job", "Exchange Wash"], baseCash: 4620, baseDifficulty: 72, baseBravery: 19, jailChanceBase: 41, jailMinutesBase: 25 },
  { id: "blackmail", name: "Blackmail", names: ["Photo Leak", "Phone Clone", "Leverage Drop", "Executive Dirt Run", "Council Pressure", "Judge Compromise"], baseCash: 5370, baseDifficulty: 70, baseBravery: 20, jailChanceBase: 43, jailMinutesBase: 26 },
  { id: "robbery", name: "Robbery", names: ["Corner Hold-Up", "Register Jack", "Jeweler Swipe", "Armored Stop", "Bank Lobby Push", "Vault Breach"], baseCash: 6120, baseDifficulty: 72, baseBravery: 20, jailChanceBase: 43, jailMinutesBase: 26 },
  { id: "heists", name: "Major Heists", names: ["Museum Lift", "Syndicate Vault", "Casino Mainframe", "Diamond Exchange", "Federal Mint Run", "Crown Reserve Heist"], baseCash: 7020, baseDifficulty: 78, baseBravery: 20, jailChanceBase: 45, jailMinutesBase: 28 },
] as const;

const TOTAL_CRIMES = CRIME_CATEGORIES.reduce((sum, category) => sum + category.names.length, 0);

export const CRIMES = CRIME_CATEGORIES.flatMap((category, categoryIndex) =>
  category.names.map((name, crimeIndex) => {
    const globalIndex = CRIME_CATEGORIES.slice(0, categoryIndex).reduce((sum, entry) => sum + entry.names.length, 0) + crimeIndex;
    const levelReq = Math.min(100, Math.round(1 + (globalIndex * 99) / Math.max(1, TOTAL_CRIMES - 1)));
    return {
      id: `${category.id}-${crimeIndex + 1}`,
      categoryId: category.id,
      categoryName: category.name,
      name,
      cash: category.baseCash + crimeIndex * 140,
      respect: 1 + Math.min(12, Math.floor(globalIndex / 5)),
      bravery: Math.min(20, category.baseBravery + Math.floor(crimeIndex / 2)),
      levelReq,
      difficulty: category.baseDifficulty + crimeIndex * 3 + categoryIndex * 2,
      jailChance: Math.min(50, category.jailChanceBase + crimeIndex * 2),
      jailMinutes: category.jailMinutesBase + crimeIndex * 2 + Math.floor(categoryIndex / 2),
      xpGain: Math.min(8, 2 + Math.floor(categoryIndex / 2)),
      xpLoss: Math.min(5, 1 + Math.floor(categoryIndex / 3)),
    };
  }),
);