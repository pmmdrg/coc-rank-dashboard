/**
 * Metadata quy định số lượt đánh và phòng thủ tối đa cho từng cấp giải đấu Ranked trong Clash of Clans
 * 
 * Quy định cụ thể:
 * - Skeleton & Barbarian: 6 lượt 1 mùa (Tiers 1 - 6)
 * - Archer & Wizard: 8 lượt 1 mùa (Tiers 7 - 12)
 * - Valkyrie & Witch: 10 lượt 1 mùa (Tiers 13 - 18)
 * - Golem, P.E.K.K.A & Titan: 12 lượt 1 mùa (Tiers 19 - 27)
 * - Dragon: 14 lượt 1 mùa (Tiers 28 - 30)
 * - Electro: 18 lượt 1 mùa (Tiers 31 - 33)
 * - Legend 3: 24 lượt 1 mùa (Tier 34)
 * - Legend 2: 30 lượt 1 mùa (Tier 35)
 * - Legend 1: 8 lượt 1 ngày (Tier 36) -> tính theo số ngày mùa giải * 8
 */

export interface RankedTierDefinition {
  id: number
  tierNumber: number
  name: string
  group: string
  baseAttacks: number
  isPerDay?: boolean
}

export const RANKED_TIERS_METADATA: RankedTierDefinition[] = [
  // Skeleton League: 6 lượt
  { id: 105000001, tierNumber: 1, name: 'Skeleton League 1', group: 'Skeleton', baseAttacks: 6 },
  { id: 105000002, tierNumber: 2, name: 'Skeleton League 2', group: 'Skeleton', baseAttacks: 6 },
  { id: 105000003, tierNumber: 3, name: 'Skeleton League 3', group: 'Skeleton', baseAttacks: 6 },

  // Barbarian League: 6 lượt
  { id: 105000004, tierNumber: 4, name: 'Barbarian League 4', group: 'Barbarian', baseAttacks: 6 },
  { id: 105000005, tierNumber: 5, name: 'Barbarian League 5', group: 'Barbarian', baseAttacks: 6 },
  { id: 105000006, tierNumber: 6, name: 'Barbarian League 6', group: 'Barbarian', baseAttacks: 6 },

  // Archer League: 8 lượt
  { id: 105000007, tierNumber: 7, name: 'Archer League 7', group: 'Archer', baseAttacks: 8 },
  { id: 105000008, tierNumber: 8, name: 'Archer League 8', group: 'Archer', baseAttacks: 8 },
  { id: 105000009, tierNumber: 9, name: 'Archer League 9', group: 'Archer', baseAttacks: 8 },

  // Wizard League: 8 lượt
  { id: 105000010, tierNumber: 10, name: 'Wizard League 10', group: 'Wizard', baseAttacks: 8 },
  { id: 105000011, tierNumber: 11, name: 'Wizard League 11', group: 'Wizard', baseAttacks: 8 },
  { id: 105000012, tierNumber: 12, name: 'Wizard League 12', group: 'Wizard', baseAttacks: 8 },

  // Valkyrie League: 10 lượt
  { id: 105000013, tierNumber: 13, name: 'Valkyrie League 13', group: 'Valkyrie', baseAttacks: 10 },
  { id: 105000014, tierNumber: 14, name: 'Valkyrie League 14', group: 'Valkyrie', baseAttacks: 10 },
  { id: 105000015, tierNumber: 15, name: 'Valkyrie League 15', group: 'Valkyrie', baseAttacks: 10 },

  // Witch League: 10 lượt
  { id: 105000016, tierNumber: 16, name: 'Witch League 16', group: 'Witch', baseAttacks: 10 },
  { id: 105000017, tierNumber: 17, name: 'Witch League 17', group: 'Witch', baseAttacks: 10 },
  { id: 105000018, tierNumber: 18, name: 'Witch League 18', group: 'Witch', baseAttacks: 10 },

  // Golem League: 12 lượt
  { id: 105000019, tierNumber: 19, name: 'Golem League 19', group: 'Golem', baseAttacks: 12 },
  { id: 105000020, tierNumber: 20, name: 'Golem League 20', group: 'Golem', baseAttacks: 12 },
  { id: 105000021, tierNumber: 21, name: 'Golem League 21', group: 'Golem', baseAttacks: 12 },

  // P.E.K.K.A League: 12 lượt
  { id: 105000022, tierNumber: 22, name: 'P.E.K.K.A League 22', group: 'P.E.K.K.A', baseAttacks: 12 },
  { id: 105000023, tierNumber: 23, name: 'P.E.K.K.A League 23', group: 'P.E.K.K.A', baseAttacks: 12 },
  { id: 105000024, tierNumber: 24, name: 'P.E.K.K.A League 24', group: 'P.E.K.K.A', baseAttacks: 12 },

  // Titan League: 12 lượt
  { id: 105000025, tierNumber: 25, name: 'Titan League 25', group: 'Titan', baseAttacks: 12 },
  { id: 105000026, tierNumber: 26, name: 'Titan League 26', group: 'Titan', baseAttacks: 12 },
  { id: 105000027, tierNumber: 27, name: 'Titan League 27', group: 'Titan', baseAttacks: 12 },

  // Dragon League: 14 lượt
  { id: 105000028, tierNumber: 28, name: 'Dragon League 28', group: 'Dragon', baseAttacks: 14 },
  { id: 105000029, tierNumber: 29, name: 'Dragon League 29', group: 'Dragon', baseAttacks: 14 },
  { id: 105000030, tierNumber: 30, name: 'Dragon League 30', group: 'Dragon', baseAttacks: 14 },

  // Electro League: 18 lượt
  { id: 105000031, tierNumber: 31, name: 'Electro League 31', group: 'Electro', baseAttacks: 18 },
  { id: 105000032, tierNumber: 32, name: 'Electro League 32', group: 'Electro', baseAttacks: 18 },
  { id: 105000033, tierNumber: 33, name: 'Electro League 33', group: 'Electro', baseAttacks: 18 },

  // Legend III: 24 lượt
  { id: 105000034, tierNumber: 34, name: 'Legend III', group: 'Legend 3', baseAttacks: 24 },

  // Legend II: 30 lượt
  { id: 105000035, tierNumber: 35, name: 'Legend II', group: 'Legend 2', baseAttacks: 30 },

  // Legend I: 8 lượt 1 ngày (mặc định 6 ngày = 48 lượt)
  { id: 105000036, tierNumber: 36, name: 'Legend I', group: 'Legend 1', baseAttacks: 8, isPerDay: true },
]

/**
 * Tra cứu số lượt tối đa dựa vào Metadata, tên / ID giải đấu và thời gian mùa giải
 */
export function getRankedTierMaxAttacks(
  leagueIdentifier?: string | number,
  options?: {
    startsAt?: string
    endsAt?: string
    observedMaxAttacks?: number
  },
): {
  maxAttacks: number
  maxDefenses: number
  matchedTier?: RankedTierDefinition
} {
  const startsAt = options?.startsAt
  const endsAt = options?.endsAt
  const observedMax = options?.observedMaxAttacks ?? 0

  // 1. Tính số ngày của mùa giải (cho Legend 1)
  let seasonDays = 6
  if (startsAt && endsAt) {
    const start = new Date(startsAt).getTime()
    const end = new Date(endsAt).getTime()
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24))
    if (!isNaN(days) && days > 0) {
      seasonDays = days
    }
  }

  // 2. Tra cứu theo ID nếu là số
  if (typeof leagueIdentifier === 'number' || (typeof leagueIdentifier === 'string' && /^\d+$/.test(leagueIdentifier))) {
    const numId = Number(leagueIdentifier)
    const found = RANKED_TIERS_METADATA.find((t) => t.id === numId)
    if (found) {
      const attacks = found.isPerDay ? seasonDays * found.baseAttacks : found.baseAttacks
      return { maxAttacks: attacks, maxDefenses: attacks, matchedTier: found }
    }
  }

  // 3. Tra cứu theo tên giải đấu (chuỗi chữ)
  const clean = String(leagueIdentifier || '').toLowerCase().trim()
  if (clean) {
    // Legend 1
    if (clean.includes('legend i') && !clean.includes('legend ii') && !clean.includes('legend iii')) {
      const tier = RANKED_TIERS_METADATA.find((t) => t.id === 105000036)
      const attacks = seasonDays * 8
      return { maxAttacks: attacks, maxDefenses: attacks, matchedTier: tier }
    }
    if (clean.includes('legend 1')) {
      const tier = RANKED_TIERS_METADATA.find((t) => t.id === 105000036)
      const attacks = seasonDays * 8
      return { maxAttacks: attacks, maxDefenses: attacks, matchedTier: tier }
    }

    // Legend 2
    if (clean.includes('legend ii') || clean.includes('legend 2')) {
      const tier = RANKED_TIERS_METADATA.find((t) => t.id === 105000035)
      return { maxAttacks: 30, maxDefenses: 30, matchedTier: tier }
    }

    // Legend 3
    if (clean.includes('legend iii') || clean.includes('legend 3') || clean === 'legend') {
      const tier = RANKED_TIERS_METADATA.find((t) => t.id === 105000034)
      return { maxAttacks: 24, maxDefenses: 24, matchedTier: tier }
    }

    // Electro League
    if (clean.includes('electro')) {
      const tier = RANKED_TIERS_METADATA.find((t) => t.group === 'Electro')
      return { maxAttacks: 18, maxDefenses: 18, matchedTier: tier }
    }

    // Dragon League
    if (clean.includes('dragon')) {
      const tier = RANKED_TIERS_METADATA.find((t) => t.group === 'Dragon')
      return { maxAttacks: 14, maxDefenses: 14, matchedTier: tier }
    }

    // Golem, P.E.K.K.A, Titan
    if (
      clean.includes('golem') ||
      clean.includes('pekka') ||
      clean.includes('p.e.k.k.a') ||
      clean.includes('titan')
    ) {
      return { maxAttacks: 12, maxDefenses: 12 }
    }

    // Valkyrie, Witch
    if (clean.includes('valkyrie') || clean.includes('witch')) {
      return { maxAttacks: 10, maxDefenses: 10 }
    }

    // Archer, Wizard
    if (clean.includes('archer') || clean.includes('wizard')) {
      return { maxAttacks: 8, maxDefenses: 8 }
    }

    // Skeleton, Barbarian
    if (clean.includes('skeleton') || clean.includes('barbarian')) {
      return { maxAttacks: 6, maxDefenses: 6 }
    }
  }

  // 4. Nếu không rõ tên rank (hoặc mùa trước do Supercell API không kèm tên rank):
  // Nhận diện chuẩn xác dựa trên số lượt đánh thực tế cao nhất của các thành viên trong bảng
  if (observedMax > 30) {
    return { maxAttacks: seasonDays * 8, maxDefenses: seasonDays * 8 }
  }
  if (observedMax > 24) {
    return { maxAttacks: 30, maxDefenses: 30 }
  }
  if (observedMax > 18) {
    return { maxAttacks: 24, maxDefenses: 24 }
  }
  if (observedMax > 14) {
    return { maxAttacks: 18, maxDefenses: 18 } // Electro
  }
  if (observedMax > 12) {
    return { maxAttacks: 14, maxDefenses: 14 } // Dragon
  }
  if (observedMax > 10) {
    return { maxAttacks: 12, maxDefenses: 12 } // Golem / PEKKA / Titan
  }
  if (observedMax > 8) {
    return { maxAttacks: 10, maxDefenses: 10 } // Valkyrie / Witch
  }
  if (observedMax > 6) {
    return { maxAttacks: 8, maxDefenses: 8 } // Archer / Wizard
  }
  if (observedMax > 0) {
    return { maxAttacks: 6, maxDefenses: 6 } // Skeleton / Barbarian
  }

  // Mặc định an toàn
  return { maxAttacks: 24, maxDefenses: 24 }
}
