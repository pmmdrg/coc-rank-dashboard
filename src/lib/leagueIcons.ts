// Bảng ánh xạ icon chính thức từ Supercell CDN theo từng bậc giải đấu (League Tier)
export const LEAGUE_TIER_ICONS: Record<string, string> = {
  // Legend League
  'legend 3': 'https://api-assets.clashofclans.com/leaguetiers/125/BvEu_UE53UzADvTRiU9AdyOrlvb1RqvBmMau_uX6xm0.png',
  'legend iii': 'https://api-assets.clashofclans.com/leaguetiers/125/BvEu_UE53UzADvTRiU9AdyOrlvb1RqvBmMau_uX6xm0.png',
  'legend 2': 'https://api-assets.clashofclans.com/leaguetiers/125/2fQPjjBJCXzHdYY8Eul4DQUBB232Bhiw5KPv6TOLMgQ.png',
  'legend ii': 'https://api-assets.clashofclans.com/leaguetiers/125/2fQPjjBJCXzHdYY8Eul4DQUBB232Bhiw5KPv6TOLMgQ.png',
  'legend 1': 'https://api-assets.clashofclans.com/leaguetiers/125/s5Y12RDRg7tgznd2RwU9kgLbedC5Not4peiHfOaWfJo.png',
  'legend i': 'https://api-assets.clashofclans.com/leaguetiers/125/s5Y12RDRg7tgznd2RwU9kgLbedC5Not4peiHfOaWfJo.png',
  'legend league': 'https://api-assets.clashofclans.com/leaguetiers/125/BvEu_UE53UzADvTRiU9AdyOrlvb1RqvBmMau_uX6xm0.png',
  'legend': 'https://api-assets.clashofclans.com/leaguetiers/125/BvEu_UE53UzADvTRiU9AdyOrlvb1RqvBmMau_uX6xm0.png',

  // Electro League
  'electro league 33': 'https://api-assets.clashofclans.com/leaguetiers/125/VFqkaQimExWtSmIf9PC8WEpj4Vd58oLjPWyZqfVb5VE.png',
  'electro 33': 'https://api-assets.clashofclans.com/leaguetiers/125/VFqkaQimExWtSmIf9PC8WEpj4Vd58oLjPWyZqfVb5VE.png',
  'electro 32': 'https://api-assets.clashofclans.com/leaguetiers/125/iX8uNhG6jBcQATWFS8a0gtidGy9O1PRYtXZZMTtUK3U.png',
  'electro 31': 'https://api-assets.clashofclans.com/leaguetiers/125/qVORiRguZ-xMq8L0g7rE1-rZuiA-lKlI8VKuMndRy4w.png',

  // Dragon League
  'dragon 30': 'https://api-assets.clashofclans.com/leaguetiers/125/g7m9aF8YoYj9b0olPsyT4eUIxyYEmkqr53wYxWmzpE4.png',
  'dragon 29': 'https://api-assets.clashofclans.com/leaguetiers/125/DIMeRH3N4lrNObA3zAmk_eUin8nvNeLR89qYznnA--s.png',
  'dragon 28': 'https://api-assets.clashofclans.com/leaguetiers/125/YCZ7O_3_c8eCBYvX-92qiWeLc6Md6eNJ5A8O-2vUg7I.png',

  // Titan League
  'titan 27': 'https://api-assets.clashofclans.com/leaguetiers/125/1AhObOl55grQIWnGmn1J9qMWq5pmRA3aBObfYkQEjko.png',
  'titan 26': 'https://api-assets.clashofclans.com/leaguetiers/125/yIfqSgrhiYRcuMbAPCoeCj1FTmfylCLxnrAljEZc8K0.png',
  'titan 25': 'https://api-assets.clashofclans.com/leaguetiers/125/JLqVXdNkAGjD_yqMRDgu9KK-hDrulNPjsKU4EugHqX8.png',

  // Champion / PEKKA
  'p.e.k.k.a 24': 'https://api-assets.clashofclans.com/leaguetiers/125/vxV7LI0votsz0_n-8lW-Lag96D5HwKsEgEk_7247zC4.png',
  'pekka 24': 'https://api-assets.clashofclans.com/leaguetiers/125/vxV7LI0votsz0_n-8lW-Lag96D5HwKsEgEk_7247zC4.png',
  'champion 1': 'https://api-assets.clashofclans.com/leaguetiers/125/vxV7LI0votsz0_n-8lW-Lag96D5HwKsEgEk_7247zC4.png',
}

export const DEFAULT_LEAGUE_ICON =
  'https://api-assets.clashofclans.com/leaguetiers/125/BvEu_UE53UzADvTRiU9AdyOrlvb1RqvBmMau_uX6xm0.png'

/**
 * Lấy URL icon chính thức của giải đấu từ Supercell CDN
 * @param leagueName Tên giải đấu (ví dụ: Legend III, Legend 3, Champion 1...)
 * @param currentUrl URL icon hiện có nếu đã được nạp từ API
 */
export function getLeagueIconUrl(leagueName?: string, currentUrl?: string): string {
  if (currentUrl && typeof currentUrl === 'string' && currentUrl.startsWith('http')) {
    return currentUrl
  }

  if (!leagueName) return DEFAULT_LEAGUE_ICON

  const normalized = leagueName.trim().toLowerCase()
  return LEAGUE_TIER_ICONS[normalized] || DEFAULT_LEAGUE_ICON
}
