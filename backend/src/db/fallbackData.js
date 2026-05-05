import { logger } from '../utils/logger.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const fallbackAssets = [
  { asset_id: 1, ticker_symbol: 'AAPL', asset_name: 'Apple Inc.', asset_class: 'stock', exchange: 'NASDAQ', currency: 'USD', basePrice: 214.32, forecastChange: 0.066 },
  { asset_id: 2, ticker_symbol: 'NVDA', asset_name: 'NVIDIA Corp.', asset_class: 'stock', exchange: 'NASDAQ', currency: 'USD', basePrice: 893.60, forecastChange: 0.097 },
  { asset_id: 3, ticker_symbol: 'TSLA', asset_name: 'Tesla Inc.', asset_class: 'stock', exchange: 'NASDAQ', currency: 'USD', basePrice: 178.90, forecastChange: -0.091 },
  { asset_id: 4, ticker_symbol: 'GOOGL', asset_name: 'Alphabet Inc.', asset_class: 'stock', exchange: 'NASDAQ', currency: 'USD', basePrice: 171.45, forecastChange: 0.071 },
  { asset_id: 5, ticker_symbol: 'MSFT', asset_name: 'Microsoft Corp.', asset_class: 'stock', exchange: 'NASDAQ', currency: 'USD', basePrice: 421.10, forecastChange: 0.045 },
  { asset_id: 6, ticker_symbol: 'AMZN', asset_name: 'Amazon.com Inc.', asset_class: 'stock', exchange: 'NASDAQ', currency: 'USD', basePrice: 189.25, forecastChange: 0.038 },
  { asset_id: 7, ticker_symbol: 'SPY', asset_name: 'SPDR S&P 500 ETF Trust', asset_class: 'ETF', exchange: 'NYSEARCA', currency: 'USD', basePrice: 524.80, forecastChange: 0.022 },
  { asset_id: 8, ticker_symbol: 'QQQ', asset_name: 'Invesco QQQ Trust', asset_class: 'ETF', exchange: 'NASDAQ', currency: 'USD', basePrice: 450.12, forecastChange: 0.031 },
  { asset_id: 9, ticker_symbol: 'BTC-USD', asset_name: 'Bitcoin USD', asset_class: 'commodity', exchange: 'CRYPTO', currency: 'USD', basePrice: 67240.00, forecastChange: 0.062 },
  { asset_id: 10, ticker_symbol: 'ETH-USD', asset_name: 'Ethereum USD', asset_class: 'commodity', exchange: 'CRYPTO', currency: 'USD', basePrice: 3512.00, forecastChange: 0.048 },
];

const connectionErrorCodes = new Set([
  'ENOTFOUND',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EAI_AGAIN',
  '3D000',
  '42P01',
  '57P01',
  '08006',
  'ML_SCRIPT_ERROR',
  'PYTHON_EXECUTION_ERROR',
  'PYTHON_PARSE_ERROR',
  'PYTHON_TIMEOUT',
]);

const warned = new Set();

const roundMoney = (value) => Number(value.toFixed(2));

const isoDateFromOffset = (offsetDays) => {
  const date = new Date(Date.now() + offsetDays * DAY_MS);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
};

const toApiAsset = (asset) => ({
  asset_id: asset.asset_id,
  ticker_symbol: asset.ticker_symbol,
  asset_name: asset.asset_name,
  asset_class: asset.asset_class,
  exchange: asset.exchange,
  currency: asset.currency,
  latest_price: asset.basePrice,
  created_at: null,
});

export const canUseFallbackData = (err) => {
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.ENABLE_DEMO_FALLBACK === 'false') return false;
  if (!err) return true;
  return connectionErrorCodes.has(err.code) || /database|connection|relation|ENOTFOUND/i.test(err.message || '');
};

export const logFallback = (area, err) => {
  if (warned.has(area)) return;
  warned.add(area);
  const reason = err?.message ? ` (${err.message})` : '';
  logger.warn(`Using local demo ${area} data${reason}`);
};

export const getFallbackAssets = () => (
  fallbackAssets
    .map(toApiAsset)
    .sort((a, b) => a.ticker_symbol.localeCompare(b.ticker_symbol))
);

export const getFallbackAssetById = (assetId) => {
  const asset = fallbackAssets.find((item) => item.asset_id === Number(assetId));
  return asset ? toApiAsset(asset) : null;
};

export const searchFallbackAssets = (q, assetClass) => {
  const needle = q.trim().toLowerCase();
  return getFallbackAssets().filter((asset) => {
    const matchesQuery = asset.ticker_symbol.toLowerCase().includes(needle)
      || asset.asset_name.toLowerCase().includes(needle);
    const matchesClass = !assetClass || asset.asset_class === assetClass;
    return matchesQuery && matchesClass;
  });
};

export const getFallbackPriceHistory = (assetId, from, to) => {
  const asset = fallbackAssets.find((item) => item.asset_id === Number(assetId));
  if (!asset) return [];

  const rows = [];
  for (let index = 0; index < 180; index += 1) {
    const offset = index - 179;
    const date = isoDateFromOffset(offset);
    const drift = index * 0.00055;
    const seasonal = Math.sin((index + asset.asset_id * 5) / 11) * 0.025;
    const close = roundMoney(asset.basePrice * (0.94 + drift + seasonal));
    const open = roundMoney(close * 0.997);
    const high = roundMoney(close * 1.009);
    const low = roundMoney(close * 0.991);

    rows.push({
      price_id: asset.asset_id * 1000 + index,
      asset_id: asset.asset_id,
      date,
      open,
      high,
      low,
      close,
      volume: 500000 + asset.asset_id * 90000 + index * 1500,
      adjusted_close: close,
    });
  }

  return rows.filter((row) => (!from || row.date >= from) && (!to || row.date <= to));
};

export const getFallbackPredictions = (assetId, horizonDays) => {
  const asset = fallbackAssets.find((item) => item.asset_id === Number(assetId));
  if (!asset) return [];

  const generatedAt = new Date().toISOString();
  const target = asset.basePrice * (1 + asset.forecastChange * (horizonDays / 30));
  const bandBase = Math.max(asset.basePrice * 0.018, 0.5);

  return Array.from({ length: horizonDays }, (_, index) => {
    const day = index + 1;
    const progress = day / horizonDays;
    const oscillation = Math.sin((day + asset.asset_id * 3) / 3.2) * asset.basePrice * 0.0045;
    const predictedClose = roundMoney(asset.basePrice + (target - asset.basePrice) * progress + oscillation);
    const band = bandBase * (1 + progress * 0.35);

    return {
      prediction_id: asset.asset_id * 10000 + horizonDays * 100 + day,
      asset_id: asset.asset_id,
      prediction_date: isoDateFromOffset(day),
      predicted_close: predictedClose,
      confidence_lower: roundMoney(predictedClose - band),
      confidence_upper: roundMoney(predictedClose + band),
      model_version: 'demo-lstm-v1',
      generated_at: generatedAt,
      horizon_days: horizonDays,
      current_close: asset.basePrice,
    };
  });
};
