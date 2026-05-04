import 'dotenv/config';
import { pool } from './pool.js';

const assets = [
  { ticker: 'RELIANCE.NS',  name: 'Reliance Industries',      class: 'stock', exchange: 'NSE', currency: 'INR' },
  { ticker: 'TCS.NS',       name: 'Tata Consultancy Services', class: 'stock', exchange: 'NSE', currency: 'INR' },
  { ticker: 'HDFCBANK.NS',  name: 'HDFC Bank',                 class: 'stock', exchange: 'NSE', currency: 'INR' },
  { ticker: 'INFY.NS',      name: 'Infosys',                   class: 'stock', exchange: 'NSE', currency: 'INR' },
  { ticker: 'ICICIBANK.NS', name: 'ICICI Bank',                class: 'stock', exchange: 'NSE', currency: 'INR' },
  { ticker: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank',       class: 'stock', exchange: 'NSE', currency: 'INR' },
  { ticker: 'LT.NS',        name: 'Larsen & Toubro',           class: 'stock', exchange: 'NSE', currency: 'INR' },
  { ticker: 'AXISBANK.NS',  name: 'Axis Bank',                 class: 'stock', exchange: 'NSE', currency: 'INR' },
  { ticker: 'MARUTI.NS',    name: 'Maruti Suzuki',             class: 'stock', exchange: 'NSE', currency: 'INR' },
  { ticker: 'TITAN.NS',     name: 'Titan Company',             class: 'stock', exchange: 'NSE', currency: 'INR' },
];

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

console.log(`Seeded ${seeded} new asset(s). Total in DB may be higher (existing skipped).`);
await pool.end();
