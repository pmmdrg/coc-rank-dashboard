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

  const atkDest = player.attackDestruction ?? 0
  const defDest = player.defenseDestruction ?? 0

  // 2. Tương quan giữa số lượt và % phá hủy (chỉ cảnh báo để trống đối với người chơi nhập tay thủ công)
  const isApiPlayer = Boolean(player.playerTag)

  if (!isApiPlayer && player.attacks > 0 && atkDest <= 0) {
    warnings.push({
      field: 'attackDestruction',
      message: `Đã có ${player.attacks} lượt công nhưng tỉ lệ % công đang để trống (0%)`,
    })
  }
  if (player.attacks === 0 && atkDest > 0) {
    warnings.push({
      field: 'attackDestruction',
      message: `Chưa có lượt công nào nhưng tỉ lệ % công đang là ${atkDest}%`,
    })
  }

  if (!isApiPlayer && player.defenses > 0 && defDest <= 0) {
    warnings.push({
      field: 'defenseDestruction',
      message: `Đã có ${player.defenses} lượt thủ nhưng tỉ lệ % thủ đang để trống (0%)`,
    })
  }
  if (player.defenses === 0 && defDest > 0) {
    warnings.push({
      field: 'defenseDestruction',
      message: `Chưa bị thủ lượt nào nhưng tỉ lệ % thủ đang là ${defDest}%`,
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
