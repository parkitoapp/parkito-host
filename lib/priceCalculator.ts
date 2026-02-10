// priceCalculator.js

/**
 * Arrotonda "in su" al passo 0,50 € dopo un round a 2 decimali (fix 20→20,5).
 */
function roundUpTo050(x: number) {
  const twoDecimals = Math.round((x + Number.EPSILON) * 100) / 100;
  return Math.ceil(twoDecimals * 2) / 2;
}

/**
 * CAP giornaliero NETTO a partire dal prezzo orario NETTO.
 * Mappa come in get_cap_netto_from_hourly:
 * - <=1 €/h → cap lordo 20
 * - <=2 €/h → 40
 * - <=3 €/h → 50
 * - <=4 €/h → 60
 * - <=5 €/h → 70
 * - >5 €/h → cap NETTO = 10h * €/h * 1.10
 * Poi converte LORDO→NETTO dividendo per feeFactor.
 */
export function getCapNetFromHourly(hourly: number, feeFactor = 1.244) {
  if (hourly == null || !isFinite(hourly) || hourly <= 0) return 0;
  if (hourly <= 1) return 20 / feeFactor;
  if (hourly <= 2) return 40 / feeFactor;
  if (hourly <= 3) return 50 / feeFactor;
  if (hourly <= 4) return 60 / feeFactor;
  if (hourly <= 5) return 70 / feeFactor;
  // oltre 5 €/h: già NETTO
  return hourly * 10 * 1.1;
}

/**
 * Figlia (≤24h): prezzo NETTO
 * - 0–10h lineare
 * - 11–24h progressione verso il cap netto
 * - =24h → cap netto
 */
export function calculateDailyNetPrice(
  hours: number,
  hourly: number,
  feeFactor = 1.244
) {
  const h = Math.max(0, Math.min(24, Number(hours) || 0));
  const capNet = getCapNetFromHourly(hourly, feeFactor);

  if (h <= 10) {
    return hourly * h;
  }
  if (h < 24) {
    const base10 = hourly * 10;
    return base10 + (h - 10) * ((capNet - base10) / 14);
  }
  // h === 24 (o >24 per sicurezza)
  return capNet;
}

/**
 * MADRE (semplificata senza availability): prezzo LORDO
 * - Se ≤24h → usa figlia con "hourly" = baseHourlyNet.
 * - 25–72h → giorno1 100%, giorno2 80%, giorno3 60% (frazione ore/24).
 * - 73–168h → come sopra per primi 3 giorni (max 72h) + extra ore al 20% di baseHourlyNet (NETTO).
 *             Minimo (NETTO) = cap netto del prezzo orario più alto (qui = base).
 * - >168h → continua come 73–168h (stessa regola extra).
 *
 * @param {number} totalHours - ore totali (decimali ammessi)
 * @param {number} baseHourlyNet - prezzo orario NETTO
 * @param {object} opts
 * @param {number} opts.feeFactor - moltiplicatore commissioni (default 1.244)
 * @returns {number} prezzo LORDO arrotondato in su ai 50 cent
 */
export function calculateParkingPrice(
  totalHours: number,
  baseHourlyNet: number,
  opts: { feeFactor?: number } = {}
) {
  const feeFactor = opts.feeFactor ?? 1.244;
  const hours = Math.max(0, Number(totalHours) || 0);
  const base = Math.max(0, Number(baseHourlyNet) || 0);

  if (hours === 0 || base === 0) return 0;

  // Caso A: ≤24h → usa la figlia (NETTO)
  if (hours <= 24) {
    const net = calculateDailyNetPrice(hours, base, feeFactor);
    const gross = roundUpTo050(net * feeFactor);
    return Number(gross.toFixed(2));
  }

  // Helper per calcolare quote ore dei primi 3 "giorni calendario"
  const h1 = Math.min(24, hours);
  const h2 = Math.min(24, Math.max(0, hours - 24));
  const h3 = Math.min(24, Math.max(0, hours - 48));

  const capNet = getCapNetFromHourly(base, feeFactor);

  // Caso B: 25–72h → sconti 100/80/60 pro-rata (NETTO)
  if (hours <= 72) {
    const net =
      capNet * (h1 / 24) * 1.0 +
      capNet * (h2 / 24) * 0.8 +
      capNet * (h3 / 24) * 0.6;

    const gross = roundUpTo050(net * feeFactor);
    return Number(gross.toFixed(2));
  }

  // Caso C: >72h → primi 72h come sopra + extra ore al 20% del base (NETTO)
  const netFirst72 =
    capNet * (24 / 24) * 1.0 + // giorno 1 pieno
    capNet * (24 / 24) * 0.8 + // giorno 2 pieno
    capNet * (24 / 24) * 0.6; // giorno 3 pieno

  const extraHours = hours - 72;
  const netExtra = extraHours * (base * 0.2); // 20% NETTO dell'€/h medio globale (qui = base)

  // Minimo (fascia 4): non scendere sotto il cap NETTO del prezzo più alto (qui = base)
  let netTotal = netFirst72 + netExtra;
  const minNet = capNet;
  if (netTotal < minNet) netTotal = minNet;

  const gross = roundUpTo050(netTotal * feeFactor);
  return Number(gross.toFixed(2));
}

/**
 * Per compatibilità con il vecchio nome:
 * totalHours = ore totali, base = prezzo orario NETTO
 */
export function calculateDiscountedPrice(
  totalHours: number,
  base: number,
  opts = {}
) {
  return calculateParkingPrice(totalHours, base, opts);
}

export default calculateParkingPrice;
