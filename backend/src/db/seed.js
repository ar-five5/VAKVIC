import 'dotenv/config';
import { pool } from './pool.js';
import { logger } from '../utils/logger.js';

const assets = [
  { ticker: 'RELIANCE.NS',  name: 'Reliance Industries',      class: 'stock', exchange: 'NSE', currency: 'INR', base: 2850 },
  { ticker: 'TCS.NS',       name: 'Tata Consultancy Services', class: 'stock', exchange: 'NSE', currency: 'INR', base: 3900 },
  { ticker: 'HDFCBANK.NS',  name: 'HDFC Bank',                 class: 'stock', exchange: 'NSE', currency: 'INR', base: 1650 },
  { ticker: 'INFY.NS',      name: 'Infosys',                   class: 'stock', exchange: 'NSE', currency: 'INR', base: 1480 },
  { ticker: 'ICICIBANK.NS', name: 'ICICI Bank',                class: 'stock', exchange: 'NSE', currency: 'INR', base: 1100 },
  { ticker: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank',       class: 'stock', exchange: 'NSE', currency: 'INR', base: 1775 },
  { ticker: 'LT.NS',        name: 'Larsen & Toubro',           class: 'stock', exchange: 'NSE', currency: 'INR', base: 3600 },
  { ticker: 'AXISBANK.NS',  name: 'Axis Bank',                 class: 'stock', exchange: 'NSE', currency: 'INR', base: 1160 },
  { ticker: 'MARUTI.NS',    name: 'Maruti Suzuki',             class: 'stock', exchange: 'NSE', currency: 'INR', base: 12400 },
  { ticker: 'TITAN.NS',     name: 'Titan Company',             class: 'stock', exchange: 'NSE', currency: 'INR', base: 3450 },
];

function isoDateDaysAgo(daysAgo) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function buildStarterPrices(asset, assetId, index) {
  const rows = [];
  const totalDays = 370;
  for (let day = 0; day < totalDays; day += 1) {
    const daysAgo = totalDays - day;
    const seasonal = Math.sin((day + index * 7) / 18) * 0.025;
    const drift = day * (0.00045 + index * 0.00001);
    const close = Number((asset.base * (1 + drift + seasonal)).toFixed(2));
    const open = Number((close * (1 - 0.002)).toFixed(2));
    const high = Number((close * (1 + 0.006)).toFixed(2));
    const low = Number((close * (1 - 0.006)).toFixed(2));
    const volume = 500000 + index * 75000 + day * 250;

    rows.push({
      assetId,
      date: isoDateDaysAgo(daysAgo),
      open,
      high,
      low,
      close,
      volume,
      adjustedClose: close,
    });
  }
  return rows;
}

async function seedStarterPrices(asset, assetId, index) {
  const prices = buildStarterPrices(asset, assetId, index);
  const result = await pool.query(
    `INSERT INTO asset_prices
       (asset_id, date, open, high, low, close, volume, adjusted_close)
     SELECT * FROM unnest(
       $1::int[], $2::date[], $3::numeric[], $4::numeric[],
       $5::numeric[], $6::numeric[], $7::bigint[], $8::numeric[]
     ) AS t(asset_id, date, open, high, low, close, volume, adjusted_close)
     ON CONFLICT (asset_id, date) DO NOTHING`,
    [
      prices.map((p) => p.assetId),
      prices.map((p) => p.date),
      prices.map((p) => p.open),
      prices.map((p) => p.high),
      prices.map((p) => p.low),
      prices.map((p) => p.close),
      prices.map((p) => p.volume),
      prices.map((p) => p.adjustedClose),
    ]
  );
  return result.rowCount;
}

let seeded = 0;
for (const asset of assets) {
  const result = await pool.query(
    `INSERT INTO assets (ticker_symbol, asset_name, asset_class, exchange, currency)
     VALUES ($1, $2, $3::asset_class_enum, $4, $5)
     ON CONFLICT (ticker_symbol) DO NOTHING`,
    [asset.ticker, asset.name, asset.class, asset.exchange, asset.currency]
  );
  seeded += result.rowCount;
}

const { rows: dbAssets } = await pool.query(
  'SELECT asset_id, ticker_symbol FROM assets WHERE ticker_symbol = ANY($1::text[])',
  [assets.map((asset) => asset.ticker)]
);
const idByTicker = new Map(dbAssets.map((asset) => [asset.ticker_symbol, asset.asset_id]));

let seededPrices = 0;
for (const [index, asset] of assets.entries()) {
  seededPrices += await seedStarterPrices(asset, idByTicker.get(asset.ticker), index);
}

logger.info(`Seeded ${seeded} new asset(s) and ${seededPrices} starter price row(s). Existing rows skipped.`);
await pool.end();
