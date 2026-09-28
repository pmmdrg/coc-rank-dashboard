import type { Player } from '../types'

export type ValidationWarningField =
  | 'attacks'
  | 'attackDestruction'
  | 'defenses'
  | 'defenseDestruction'
  | 'currentCups'
  | 'general'

export interface PlayerValidationWarning {
  field: ValidationWarningField
  message: string
}

/**
 * Rà soát tính hợp lệ dữ liệu người chơi để phát hiện sai sót nhập liệu
 */
export function validatePlayer(
  player: Player,
  maxAttacks = 24,
  maxDefenses = 24,
): PlayerValidationWarning[] {
  const warnings: PlayerValidationWarning[] = []

  // 1. Số lượt vượt giới hạn mùa giải
  if (player.attacks > maxAttacks) {
    warnings.push({
      field: 'attacks',
      message: `Số lượt công (${player.attacks}) vượt quá tối đa mùa giải (${maxAttacks})`,
    })
  }
  if (player.defenses > maxDefenses) {
    warnings.push({
      field: 'defenses',
      message: `Số lượt thủ (${player.defenses}) vượt quá tối đa mùa giải (${maxDefenses})`,
    })
  }



  // 3. Cúp hiện tại vượt trần lý thuyết ban đầu
  const absoluteMaxCups = 5000 + maxAttacks * 40
  if (player.currentCups > absoluteMaxCups) {
    warnings.push({
      field: 'currentCups',
      message: `Cúp hiện tại (${player.currentCups.toLocaleString('vi-VN')}) vượt quá mức trần tối đa lý thuyết (${absoluteMaxCups.toLocaleString('vi-VN')})`,
    })
  }

  return warnings
}
