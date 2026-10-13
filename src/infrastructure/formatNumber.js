// Formatea con `decimals` decimales redondeando como Excel (mitad lejos de cero).
// Los valores distintos de 0 que con esos decimales se verían como 0.00 se muestran
// con 3 cifras significativas (0.001, 1e-9) para no esconder el valor real.
export function formatNumber(n, decimals = 2) {
  const value = Number(n);
  if (!Number.isFinite(value)) return String(value);
  if (value === 0) return (0).toFixed(decimals);

  const abs = Math.abs(value);
  const factor = 10 ** decimals;
  if (abs * factor < 0.5) return String(Number(value.toPrecision(3)));

  const rounded = Math.sign(value) * Math.round(Number((abs * factor).toPrecision(12))) / factor;
  // En valores grandes los decimales en cero solo estorban (1800000.00 → 1800000).
  if (abs >= 1e4) return String(rounded);
  return rounded.toFixed(decimals);
}
