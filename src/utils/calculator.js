/**
 * Calculate P&L for a gold (emas) holding.
 * @param {number} qty_gram
 * @param {number} avg_buy_price  — price per gram at purchase
 * @param {number} market_price   — current price per gram
 */
export function calcEmas(qty_gram, avg_buy_price, market_price) {
  const modal = qty_gram * avg_buy_price
  const nilai_pasar = qty_gram * market_price
  const pl = nilai_pasar - modal
  const pl_pct = modal > 0 ? (pl / modal) * 100 : 0
  return { modal, nilai_pasar, pl, pl_pct }
}

/**
 * Calculate P&L for a stock (saham) holding.
 * 1 lot = 100 shares on IDX.
 * @param {number} qty_lot
 * @param {number} avg_buy_price  — price per share at purchase
 * @param {number} market_price   — current price per share
 */
export function calcSaham(qty_lot, avg_buy_price, market_price) {
  const shares = qty_lot * 100
  const modal = shares * avg_buy_price
  const nilai_pasar = shares * market_price
  const pl = nilai_pasar - modal
  const pl_pct = modal > 0 ? (pl / modal) * 100 : 0
  return { modal, nilai_pasar, pl, pl_pct }
}

/**
 * Calculate P&L for a mutual fund (reksadana) holding.
 * @param {number} qty_unit
 * @param {number} avg_buy_nab    — NAB per unit at purchase
 * @param {number} current_nab   — current NAB per unit
 */
export function calcReksadana(qty_unit, avg_buy_nab, current_nab) {
  const modal = qty_unit * avg_buy_nab
  const nilai_pasar = qty_unit * current_nab
  const pl = nilai_pasar - modal
  const pl_pct = modal > 0 ? (pl / modal) * 100 : 0
  return { modal, nilai_pasar, pl, pl_pct }
}

/**
 * Calculate actual allocation percentages from asset group totals.
 * @param {number} total_emas
 * @param {number} total_saham
 * @param {number} total_reksadana
 * @returns {{ total, emas_pct, saham_pct, reksadana_pct }}
 */
export function calcAlokasi(total_emas, total_saham, total_reksadana) {
  const total = total_emas + total_saham + total_reksadana
  if (total === 0) return { total: 0, emas_pct: 0, saham_pct: 0, reksadana_pct: 0 }
  return {
    total,
    emas_pct: (total_emas / total) * 100,
    saham_pct: (total_saham / total) * 100,
    reksadana_pct: (total_reksadana / total) * 100,
  }
}

/**
 * Simple P&L helper — used when you already have modal + nilai_pasar.
 */
export function calcPL(modal, nilai) {
  const pl = nilai - modal
  const pl_pct = modal > 0 ? (pl / modal) * 100 : 0
  return { pl, pl_pct }
}

/**
 * Suggest lot count for a "one-tap buy" — 10% of total asset value.
 * 1 lot = 100 shares.
 */
export function suggestLot(totalAset, harga) {
  const dana = totalAset * 0.1
  const hargaPerLot = harga * 100
  return hargaPerLot > 0 ? Math.floor(dana / hargaPerLot) : 0
}

/**
 * Generate deterministic sparkline data points from a changePct value.
 * Deterministic so the chart doesn't jump on re-render.
 * @param {number} changePct
 * @param {number} points  — number of data points (default 7)
 */
export function generateSparklineData(changePct = 0, points = 7) {
  const base = 50
  const noise = [0, 0.4, -0.25, 0.6, -0.15, 0.45, 0, -0.3, 0.5, -0.2]
  const trendStep = changePct / Math.max(points - 1, 1)
  const noiseAmp = Math.min(Math.abs(changePct) * 0.4, 6)
  return Array.from({ length: points }, (_, i) =>
    base + trendStep * i + (noise[i % noise.length] ?? 0) * noiseAmp,
  )
}

/**
 * Determine rebalance recommendations given actuals vs targets.
 * Returns array of { asset, actual, target, diff, action } for assets off by >3%.
 */
export function calcRebalanceRecs(aktual, target) {
  const recs = []
  for (const key of ['emas', 'saham', 'reksadana']) {
    const diff = (aktual[key] ?? 0) - (target[key] ?? 0)
    if (Math.abs(diff) > 3) {
      recs.push({
        asset: key,
        actual: aktual[key],
        target: target[key],
        diff,
        action: diff > 0 ? 'KURANGI' : 'TAMBAH',
      })
    }
  }
  return recs
}
