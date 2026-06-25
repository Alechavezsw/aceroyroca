const FALLBACK = [
  { symbol: 'COBRE', name: 'Cobre (LME)', price: 4.52, unit: 'USD/lb', change: -1.2 },
  { symbol: 'LITIO', name: 'Litio (Li2CO3)', price: 14200, unit: 'USD/t', change: 1.85 },
  { symbol: 'ORO', name: 'Oro (COMEX)', price: 2340.5, unit: 'USD/oz', change: 0.45 },
  { symbol: 'PLATA', name: 'Plata', price: 29.15, unit: 'USD/oz', change: -0.3 }
];

/** Precios de referencia con variación diaria simulada cuando no hay API key */
function getDynamicFallback() {
  const daySeed = Math.floor(Date.now() / 86400000);
  const jitter = (base: number, pct: number, seed: number) => {
    const f = Math.sin(daySeed * 0.7 + seed) * pct;
    return Math.round(base * (1 + f) * 100) / 100;
  };
  return [
    { symbol: 'COBRE', name: 'Cobre (LME)', price: jitter(4.52, 0.03, 1), unit: 'USD/lb', change: jitter(-1.2, 0.5, 2) },
    { symbol: 'LITIO', name: 'Litio (Li2CO3)', price: jitter(14200, 0.02, 3), unit: 'USD/t', change: jitter(1.85, 0.4, 4) },
    { symbol: 'ORO', name: 'Oro (COMEX)', price: jitter(2340.5, 0.015, 5), unit: 'USD/oz', change: jitter(0.45, 0.6, 6) },
    { symbol: 'PLATA', name: 'Plata', price: jitter(29.15, 0.02, 7), unit: 'USD/oz', change: jitter(-0.3, 0.8, 8) }
  ];
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const apiKey = process.env.METALS_API_KEY;
    if (apiKey) {
      const r = await fetch(
        `https://metals-api.com/api/latest?access_key=${apiKey}&base=USD&symbols=XCU,XAU,XAG`
      );
      if (r.ok) {
        const data = await r.json();
        if (data?.rates) {
          const items = [
            { symbol: 'COBRE', name: 'Cobre (LME)', price: data.rates.XCU ? 1 / data.rates.XCU : 4.52, unit: 'USD/lb', change: 0 },
            { symbol: 'ORO', name: 'Oro', price: data.rates.XAU ? 1 / data.rates.XAU : 2340, unit: 'USD/oz', change: 0 },
            { symbol: 'PLATA', name: 'Plata', price: data.rates.XAG ? 1 / data.rates.XAG : 29, unit: 'USD/oz', change: 0 }
          ];
          res.status(200).json({ items, source: 'metals-api', updatedAt: new Date().toISOString() });
          return;
        }
      }
    }

    res.status(200).json({
      items: getDynamicFallback(),
      source: 'reference',
      updatedAt: new Date().toISOString(),
      note: 'Configure METALS_API_KEY para cotizaciones en tiempo real.'
    });
  } catch (e: any) {
    res.status(200).json({ items: FALLBACK, source: 'fallback', updatedAt: new Date().toISOString() });
  }
}
