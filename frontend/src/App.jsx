import { useState, useEffect, useRef } from "react";

const theme = {
  bg: "#07080A",
  surface: "#0E1015",
  card: "#13161C",
  border: "#1E2330",
  accent: "#00D4A0",
  accentDim: "#00D4A015",
  accentBorder: "#00D4A040",
  gold: "#F5C842",
  red: "#FF4D6D",
  blue: "#4D9FFF",
  purple: "#A78BFA",
  text: "#E8EAF0",
  muted: "#5A6070",
  sub: "#8A93A8",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: ${theme.bg};
    color: ${theme.text};
    font-family: 'Outfit', sans-serif;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${theme.bg}; }
  ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 2px; }

  .mono { font-family: 'DM Mono', monospace; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes growBar {
    from { width: 0; }
    to { width: var(--target-width); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes borderGlow {
    0%, 100% { box-shadow: 0 0 0 0 ${theme.accent}30; }
    50% { box-shadow: 0 0 0 6px ${theme.accent}10; }
  }

  .fade-up { animation: fadeUp 0.5s ease forwards; }
  .fade-up-1 { animation: fadeUp 0.5s 0.1s ease both; }
  .fade-up-2 { animation: fadeUp 0.5s 0.2s ease both; }
  .fade-up-3 { animation: fadeUp 0.5s 0.3s ease both; }
  .fade-up-4 { animation: fadeUp 0.5s 0.4s ease both; }

  .glow-text {
    background: linear-gradient(135deg, ${theme.accent}, ${theme.blue});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .card {
    background: ${theme.card};
    border: 1px solid ${theme.border};
    border-radius: 12px;
    transition: border-color 0.2s, transform 0.2s;
  }
  .card:hover { border-color: ${theme.accentBorder}; }

  .btn-primary {
    background: ${theme.accent};
    color: #000;
    border: none;
    padding: 10px 22px;
    border-radius: 8px;
    font-family: 'Outfit', sans-serif;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
  }
  .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
  .btn-primary:active { transform: translateY(0); }

  .btn-ghost {
    background: transparent;
    color: ${theme.sub};
    border: 1px solid ${theme.border};
    padding: 10px 22px;
    border-radius: 8px;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-ghost:hover { border-color: ${theme.accentBorder}; color: ${theme.text}; }

  .nav-link {
    background: none;
    border: none;
    color: ${theme.sub};
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: color 0.2s, background 0.2s;
  }
  .nav-link:hover { color: ${theme.text}; background: ${theme.surface}; }
  .nav-link.active { color: ${theme.accent}; }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 4px;
    font-family: 'DM Mono', monospace;
  }

  .tag-green { background: ${theme.accent}18; color: ${theme.accent}; border: 1px solid ${theme.accent}35; }
  .tag-red { background: ${theme.red}18; color: ${theme.red}; border: 1px solid ${theme.red}35; }
  .tag-blue { background: ${theme.blue}18; color: ${theme.blue}; border: 1px solid ${theme.blue}35; }
  .tag-gold { background: ${theme.gold}18; color: ${theme.gold}; border: 1px solid ${theme.gold}35; }
  .tag-purple { background: ${theme.purple}18; color: ${theme.purple}; border: 1px solid ${theme.purple}35; }

  input, select {
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    color: ${theme.text};
    padding: 10px 14px;
    border-radius: 8px;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }
  input:focus, select:focus { border-color: ${theme.accent}; }
  select option { background: ${theme.surface}; }

  label { font-size: 12px; font-weight: 500; color: ${theme.sub}; letter-spacing: 0.5px; text-transform: uppercase; display: block; margin-bottom: 6px; }

  .range-input {
    -webkit-appearance: none;
    background: ${theme.border};
    height: 4px;
    border-radius: 2px;
    outline: none;
    border: none;
    padding: 0;
  }
  .range-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: ${theme.accent};
    cursor: pointer;
    box-shadow: 0 0 8px ${theme.accent}60;
  }

  .divider { height: 1px; background: ${theme.border}; }

  .ticker-wrap { overflow: hidden; white-space: nowrap; }
  .ticker-inner { display: inline-flex; gap: 40px; animation: ticker 25s linear infinite; }

  .sparkline-svg line { stroke: ${theme.accent}; stroke-width: 1.5; }

  .loading-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: ${theme.accent};
    animation: pulse 1.2s ease-in-out infinite;
  }
  .loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .loading-dot:nth-child(3) { animation-delay: 0.4s; }

  .mini-chart-bar {
    border-radius: 2px 2px 0 0;
    transition: height 0.3s ease;
  }

  .score-ring {
    transition: stroke-dashoffset 1s ease;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    font-size: 14px;
    color: ${theme.sub};
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-family: 'Outfit', sans-serif;
  }
  .sidebar-item:hover { background: ${theme.surface}; color: ${theme.text}; }
  .sidebar-item.active { background: ${theme.accentDim}; color: ${theme.accent}; border: 1px solid ${theme.accentBorder}; }
`;

// ─── Mock Data ───────────────────────────────────────────────────────────────

const tickerData = [
  { sym: "AAPL", price: "214.32", change: "+1.24%" },
  { sym: "TSLA", price: "178.90", change: "+3.11%" },
  { sym: "GOOGL", price: "171.45", change: "-0.52%" },
  { sym: "MSFT", price: "421.10", change: "+0.88%" },
  { sym: "NVDA", price: "893.60", change: "+5.43%" },
  { sym: "BTC-USD", price: "67,240", change: "+2.30%" },
  { sym: "ETH-USD", price: "3,512", change: "+1.76%" },
  { sym: "SPY", price: "524.80", change: "+0.34%" },
  { sym: "QQQ", price: "450.12", change: "+0.61%" },
  { sym: "AMZN", price: "189.25", change: "-0.19%" },
];

const portfolioAssets = [
  { sym: "AAPL", name: "Apple Inc.", type: "Stock", weight: 28, value: 14000, change: "+1.24%", pos: true },
  { sym: "NVDA", name: "NVIDIA Corp.", type: "Stock", weight: 22, value: 11000, change: "+5.43%", pos: true },
  { sym: "BTC", name: "Bitcoin", type: "Crypto", weight: 18, value: 9000, change: "+2.30%", pos: true },
  { sym: "SPY", name: "S&P 500 ETF", type: "ETF", weight: 15, value: 7500, change: "+0.34%", pos: true },
  { sym: "TLT", name: "Treasury Bond ETF", type: "Bond", weight: 10, value: 5000, change: "-0.12%", pos: false },
  { sym: "GLD", name: "Gold ETF", type: "Commodity", weight: 7, value: 3500, change: "+0.65%", pos: true },
];

const predictions = [
  { sym: "AAPL", current: 214.32, predicted: 228.50, horizon: "30d", confidence: 84, trend: "up" },
  { sym: "NVDA", current: 893.60, predicted: 980.20, horizon: "30d", confidence: 78, trend: "up" },
  { sym: "TSLA", current: 178.90, predicted: 162.30, horizon: "30d", confidence: 71, trend: "down" },
  { sym: "GOOGL", current: 171.45, predicted: 183.70, horizon: "30d", confidence: 76, trend: "up" },
];

const comparisonAssets = {
  left: { sym: "AAPL", name: "Apple Inc.", price: "214.32", type: "Stock", metrics: { volatility: 62, momentum: 78, value: 55, growth: 82, quality: 90 }, score: 79 },
  right: { sym: "MSFT", name: "Microsoft Corp.", price: "421.10", type: "Stock", metrics: { volatility: 48, momentum: 72, value: 61, growth: 76, quality: 88 }, score: 75 },
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ positive = true, width = 80, height = 30 }) {
  const pts = Array.from({ length: 12 }, (_, i) => {
    const base = 15 + Math.random() * 10;
    return base + (positive ? i * 0.8 : -i * 0.8) + (Math.random() - 0.5) * 6;
  });
  const min = Math.min(...pts), max = Math.max(...pts);
  const norm = pts.map(p => ((p - min) / (max - min)) * (height - 4) + 2);
  const points = norm.map((y, i) => `${(i / (pts.length - 1)) * width},${height - y}`).join(" ");
  const color = positive ? theme.accent : theme.red;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data, color = theme.accent }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40 }}>
      {data.map((v, i) => (
        <div key={i} className="mini-chart-bar" style={{ width: 8, height: `${(v / max) * 100}%`, background: i === data.length - 1 ? color : color + "50" }} />
      ))}
    </div>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80, color = theme.accent }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme.border} strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="score-ring" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Ticker Bar ───────────────────────────────────────────────────────────────
function TickerBar() {
  const doubled = [...tickerData, ...tickerData];
  return (
    <div style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}`, padding: "8px 0", overflow: "hidden" }}>
      <div className="ticker-inner" style={{ display: "inline-flex", gap: 48, animation: "ticker 30s linear infinite" }}>
        {doubled.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span className="mono" style={{ fontSize: 12, color: theme.sub }}>{t.sym}</span>
            <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>${t.price}</span>
            <span className="mono" style={{ fontSize: 11, color: t.change.startsWith("+") ? theme.accent : theme.red }}>{t.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ page, setPage }) {
  const nav = ["Dashboard", "Predict", "Compare", "Portfolio"];
  return (
    <nav style={{ background: `${theme.bg}E0`, backdropFilter: "blur(16px)", borderBottom: `1px solid ${theme.border}`, padding: "0 28px", display: "flex", alignItems: "center", gap: 8, height: 56, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 24 }}>
        <div style={{ width: 28, height: 28, background: `linear-gradient(135deg, ${theme.accent}, ${theme.blue})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#000" }}>V</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>VAKVIC</span>
        <span style={{ fontSize: 10, color: theme.muted, fontFamily: "'DM Mono', monospace", border: `1px solid ${theme.border}`, padding: "1px 6px", borderRadius: 3 }}>v0.9</span>
      </div>
      <div style={{ display: "flex", gap: 2, flex: 1 }}>
        {nav.map(n => (
          <button key={n} className={`nav-link ${page === n ? "active" : ""}`} onClick={() => setPage(n)}>{n}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: theme.accent, animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: 12, color: theme.sub, fontFamily: "'DM Mono', monospace" }}>LIVE</span>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${theme.purple}, ${theme.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>A</div>
      </div>
    </nav>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function Dashboard({ setPage }) {
  const marketData = [
    { label: "S&P 500", val: "5,248.32", change: "+0.34%", pos: true, data: [40, 38, 45, 42, 50, 48, 55, 52, 60, 58, 65, 63] },
    { label: "NASDAQ", val: "16,421.10", change: "+0.61%", pos: true, data: [35, 40, 38, 45, 43, 50, 48, 55, 53, 58, 56, 62] },
    { label: "Bitcoin", val: "$67,240", change: "+2.30%", pos: true, data: [30, 28, 35, 40, 38, 45, 43, 50, 55, 52, 60, 65] },
    { label: "Gold", val: "$2,341", change: "-0.15%", pos: false, data: [60, 58, 55, 57, 54, 52, 55, 53, 51, 53, 50, 49] },
  ];
  const recentPreds = predictions.slice(0, 3);
  return (
    <div style={{ padding: "28px 28px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>Market Overview</h1>
          <span className="tag tag-green">● LIVE</span>
        </div>
        <p style={{ color: theme.sub, fontSize: 14 }}>Sunday, March 8, 2026 · Pre-Market Session</p>
      </div>

      {/* Market Cards */}
      <div className="fade-up-1" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {marketData.map((m, i) => (
          <div key={i} className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: theme.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>{m.label}</p>
                <p style={{ fontSize: 20, fontWeight: 700, marginTop: 3, letterSpacing: "-0.5px" }}>{m.val}</p>
              </div>
              <span className={`tag ${m.pos ? "tag-green" : "tag-red"}`}>{m.change}</span>
            </div>
            <Sparkline positive={m.pos} width={140} height={36} />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
        {/* Recent Predictions */}
        <div className="fade-up-2 card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>LSTM Predictions</h2>
              <p style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>Latest model outputs</p>
            </div>
            <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setPage("Predict")}>View All →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentPreds.map((p, i) => {
              const delta = ((p.predicted - p.current) / p.current * 100).toFixed(1);
              const pos = p.trend === "up";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: theme.surface, borderRadius: 8, border: `1px solid ${theme.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: pos ? `${theme.accent}18` : `${theme.red}18`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${pos ? theme.accent + "30" : theme.red + "30"}` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: pos ? theme.accent : theme.red }}>{p.sym}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{p.sym}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="mono" style={{ fontSize: 13, color: theme.sub }}>${p.current}</span>
                        <span style={{ color: theme.muted }}>→</span>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: pos ? theme.accent : theme.red }}>${p.predicted}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      <div style={{ height: 4, flex: 1, background: theme.border, borderRadius: 2, overflow: "hidden", marginRight: 12 }}>
                        <div style={{ height: "100%", width: `${p.confidence}%`, background: pos ? theme.accent : theme.red, borderRadius: 2 }} />
                      </div>
                      <span className="mono" style={{ fontSize: 11, color: theme.sub }}>{p.confidence}% conf</span>
                      <span style={{ marginLeft: 10 }} className={`tag ${pos ? "tag-green" : "tag-red"}`}>{pos ? "+" : ""}{delta}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="fade-up-3 card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Portfolio</h2>
            <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setPage("Portfolio")}>Manage →</button>
          </div>
          <div style={{ textAlign: "center", marginBottom: 18, padding: "14px 0", background: theme.surface, borderRadius: 10 }}>
            <p style={{ fontSize: 11, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Value</p>
            <p style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-1px", marginTop: 4 }}>$50,000</p>
            <span className="tag tag-green" style={{ marginTop: 8, display: "inline-flex" }}>+$1,240 today</span>
          </div>
          {/* Allocation Bars */}
          {portfolioAssets.slice(0, 4).map((a, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: theme.sub }}>{a.sym}</span>
                <span className="mono" style={{ fontSize: 12, color: theme.sub }}>{a.weight}%</span>
              </div>
              <div style={{ height: 5, background: theme.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${a.weight}%`, background: [theme.accent, theme.blue, theme.gold, theme.purple][i], borderRadius: 3, transition: "width 0.8s ease" }} />
              </div>
            </div>
          ))}
          <div className="divider" style={{ margin: "14px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 11, color: theme.muted }}>Sharpe Ratio</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: theme.accent }}>1.84</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: theme.muted }}>Max Drawdown</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: theme.red }}>-12.3%</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: theme.muted }}>YTD Return</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: theme.accent }}>+18.4%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PREDICT PAGE ─────────────────────────────────────────────────────────────
function Predict() {
  const [selected, setSelected] = useState("AAPL");
  const [horizon, setHorizon] = useState("30");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = () => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const pred = predictions.find(p => p.sym === selected) || predictions[0];
      setResult({ ...pred, horizon: `${horizon}d` });
      setLoading(false);
    }, 1800);
  };

  const generateChartPts = (sym, horizon) => {
    const pts = [];
    let v = 200;
    for (let i = 0; i < 30; i++) v += (Math.random() - 0.48) * 8, pts.push(v);
    for (let i = 0; i < parseInt(horizon); i++) v += (Math.random() - 0.44) * 8, pts.push(v);
    return pts;
  };
  const chartPts = generateChartPts(selected, horizon);
  const min = Math.min(...chartPts), max = Math.max(...chartPts);
  const w = 560, h = 180;
  const toSVG = (pts) => pts.map((p, i) => `${(i / (pts.length - 1)) * w},${h - ((p - min) / (max - min)) * (h - 20) - 10}`).join(" ");

  return (
    <div style={{ padding: "28px", maxWidth: 1100, margin: "0 auto" }}>
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>Price Prediction</h1>
        <p style={{ color: theme.sub, fontSize: 14, marginTop: 4 }}>LSTM neural network · Trained on 5-year historical data</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>
        {/* Controls */}
        <div className="fade-up-1 card" style={{ padding: "20px", alignSelf: "start" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: theme.sub, textTransform: "uppercase", letterSpacing: "0.5px" }}>Model Config</h3>

          <div style={{ marginBottom: 16 }}>
            <label>Asset Symbol</label>
            <select value={selected} onChange={e => setSelected(e.target.value)}>
              {["AAPL", "NVDA", "TSLA", "GOOGL", "MSFT", "AMZN", "BTC-USD", "ETH-USD"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Prediction Horizon</label>
            <select value={horizon} onChange={e => setHorizon(e.target.value)}>
              {["7", "14", "30", "60", "90"].map(d => <option key={d} value={d}>{d} Days</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label>Model Type</label>
            <select defaultValue="lstm">
              <option value="lstm">LSTM (Default)</option>
              <option value="bilstm">Bi-LSTM</option>
              <option value="gru">GRU</option>
            </select>
          </div>

          <div className="divider" style={{ marginBottom: 16 }} />

          <div style={{ marginBottom: 12 }}>
            <label>Sequence Length: <span style={{ color: theme.accent }}>60</span></label>
            <input type="range" min="20" max="120" defaultValue="60" className="range-input" style={{ width: "100%", marginTop: 8 }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label>Epochs: <span style={{ color: theme.accent }}>100</span></label>
            <input type="range" min="50" max="300" defaultValue="100" className="range-input" style={{ width: "100%", marginTop: 8 }} />
          </div>

          <button className="btn-primary" style={{ width: "100%" }} onClick={handleRun} disabled={loading}>
            {loading ? "Running Model..." : "Run Prediction"}
          </button>

          {loading && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
          )}
        </div>

        {/* Chart & Result */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="fade-up-2 card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{selected}</span>
                <span className="tag tag-blue" style={{ marginLeft: 10 }}>{horizon}d Forecast</span>
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 20, height: 2, background: theme.accent }} /><span style={{ fontSize: 11, color: theme.muted }}>Historical</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 20, height: 2, background: theme.blue, borderTop: "2px dashed" + theme.blue }} /><span style={{ fontSize: 11, color: theme.muted }}>Predicted</span></div>
              </div>
            </div>
            <svg width="100%" viewBox={`0 0 ${w} ${h + 20}`} style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.accent} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
                </linearGradient>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.blue} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={theme.blue} stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Historical area */}
              <polygon fill="url(#chartGrad)" points={`0,${h + 10} ${toSVG(chartPts.slice(0, 30))} ${(29 / (chartPts.length - 1)) * w},${h + 10}`} />
              <polyline fill="none" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={toSVG(chartPts.slice(0, 30))} />
              {/* Predicted area */}
              <polygon fill="url(#predGrad)" points={`${(29 / (chartPts.length - 1)) * w},${h + 10} ${toSVG(chartPts.slice(29))} ${w},${h + 10}`} />
              <polyline fill="none" stroke={theme.blue} strokeWidth="2" strokeDasharray="6,4" strokeLinecap="round" strokeLinejoin="round" points={toSVG(chartPts.slice(29))} />
              {/* Divider */}
              <line x1={(29 / (chartPts.length - 1)) * w} y1={10} x2={(29 / (chartPts.length - 1)) * w} y2={h + 10} stroke={theme.border} strokeWidth="1.5" strokeDasharray="4,3" />
              <text x={(29 / (chartPts.length - 1)) * w + 5} y={20} fill={theme.muted} fontSize="10" fontFamily="DM Mono, monospace">NOW</text>
            </svg>
          </div>

          {result && (
            <div className="fade-up card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <ScoreRing score={result.confidence} color={result.trend === "up" ? theme.accent : theme.red} size={80} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Prediction Result · {result.sym}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
                    <span className="mono" style={{ fontSize: 28, fontWeight: 700, color: result.trend === "up" ? theme.accent : theme.red }}>${result.predicted}</span>
                    <span className={`tag ${result.trend === "up" ? "tag-green" : "tag-red"}`}>
                      {result.trend === "up" ? "+" : ""}{((result.predicted - result.current) / result.current * 100).toFixed(2)}%
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: theme.sub, marginTop: 4 }}>
                    Expected price in {result.horizon} · from current <span className="mono" style={{ color: theme.text }}>${result.current}</span>
                  </p>
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  {[{ k: "RMSE", v: "2.34" }, { k: "MAE", v: "1.87" }, { k: "R²", v: "0.92" }].map(m => (
                    <div key={m.k} style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 11, color: theme.muted }}>{m.k}</p>
                      <p className="mono" style={{ fontSize: 15, fontWeight: 600, color: theme.accent, marginTop: 2 }}>{m.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All predictions table */}
          <div className="fade-up-3 card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>All Saved Predictions</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {["Asset", "Current", "Predicted", "Change", "Horizon", "Confidence"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.4px", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => {
                  const delta = ((p.predicted - p.current) / p.current * 100).toFixed(2);
                  const pos = p.trend === "up";
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${theme.border}20` }}>
                      <td style={{ padding: "10px 10px" }}><span style={{ fontWeight: 600 }}>{p.sym}</span></td>
                      <td className="mono" style={{ padding: "10px 10px", color: theme.sub }}>${p.current}</td>
                      <td className="mono" style={{ padding: "10px 10px", color: pos ? theme.accent : theme.red, fontWeight: 600 }}>${p.predicted}</td>
                      <td style={{ padding: "10px 10px" }}><span className={`tag ${pos ? "tag-green" : "tag-red"}`}>{pos ? "+" : ""}{delta}%</span></td>
                      <td style={{ padding: "10px 10px" }}><span className="tag tag-blue">{p.horizon}</span></td>
                      <td style={{ padding: "10px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 60, height: 4, background: theme.border, borderRadius: 2 }}>
                            <div style={{ width: `${p.confidence}%`, height: "100%", background: pos ? theme.accent : theme.red, borderRadius: 2 }} />
                          </div>
                          <span className="mono" style={{ fontSize: 11, color: theme.sub }}>{p.confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPARE PAGE ─────────────────────────────────────────────────────────────
function Compare() {
  const [leftSym, setLeftSym] = useState("AAPL");
  const [rightSym, setRightSym] = useState("MSFT");
  const [analyzed, setAnalyzed] = useState(true);
  const [loading, setLoading] = useState(false);

  const metricsLabels = { volatility: "Volatility Score", momentum: "Momentum", value: "Value Score", growth: "Growth", quality: "Quality" };
  const L = comparisonAssets.left;
  const R = comparisonAssets.right;
  const winner = L.score > R.score ? L.sym : R.sym;

  const handleCompare = () => {
    setLoading(true);
    setAnalyzed(false);
    setTimeout(() => { setLoading(false); setAnalyzed(true); }, 1400);
  };

  return (
    <div style={{ padding: "28px", maxWidth: 1100, margin: "0 auto" }}>
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>Asset Comparison</h1>
        <p style={{ color: theme.sub, fontSize: 14, marginTop: 4 }}>Side-by-side ML-computed suitability analysis</p>
      </div>

      {/* Asset Selector */}
      <div className="fade-up-1 card" style={{ padding: "20px", display: "flex", gap: 20, alignItems: "flex-end", marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label>Asset A</label>
          <select value={leftSym} onChange={e => setLeftSym(e.target.value)}>
            {["AAPL", "NVDA", "TSLA", "GOOGL", "MSFT", "AMZN", "SPY", "BTC-USD"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ padding: "10px 16px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.muted, fontSize: 13 }}>VS</div>
        <div style={{ flex: 1 }}>
          <label>Asset B</label>
          <select value={rightSym} onChange={e => setRightSym(e.target.value)}>
            {["MSFT", "AAPL", "NVDA", "TSLA", "GOOGL", "AMZN", "SPY", "BTC-USD"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label>Risk Profile</label>
          <select defaultValue="moderate">
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
        <button className="btn-primary" onClick={handleCompare} disabled={loading} style={{ padding: "10px 28px", flexShrink: 0 }}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 40 }}>
          <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
        </div>
      )}

      {analyzed && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "start" }}>
          {/* Left Card */}
          {[L, R].map((asset, side) => (
            <div key={side} className={`fade-up-${side + 1} card`} style={{ padding: "22px", border: asset.sym === winner ? `1px solid ${theme.accent}60` : undefined }}>
              {asset.sym === winner && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <span className="tag tag-green">★ Recommended</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>{asset.sym}</div>
                  <div style={{ fontSize: 13, color: theme.sub, marginTop: 2 }}>{asset.name}</div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                    <span className="tag tag-blue">{asset.type}</span>
                  </div>
                </div>
                <ScoreRing score={asset.score} color={asset.sym === winner ? theme.accent : theme.blue} size={72} />
              </div>
              <p style={{ fontSize: 13, color: theme.muted, marginBottom: 4 }}>Current Price</p>
              <p className="mono" style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>${asset.price}</p>
              <div className="divider" style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 12, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>ML Suitability Metrics</p>
              {Object.entries(asset.metrics).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: theme.sub }}>{metricsLabels[k]}</span>
                    <span className="mono" style={{ fontSize: 12, color: theme.text }}>{v}/100</span>
                  </div>
                  <div style={{ height: 6, background: theme.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${v}%`, borderRadius: 3, background: `linear-gradient(90deg, ${asset.sym === winner ? theme.accent : theme.blue}80, ${asset.sym === winner ? theme.accent : theme.blue})`, transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
              <Sparkline positive={true} width="100%" height={50} />
            </div>
          ))}

          {/* Center Divider */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 60 }}>
            <div style={{ width: 1, height: 60, background: theme.border }} />
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: theme.surface, border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: theme.muted }}>VS</div>
            <div style={{ width: 1, flex: 1, background: theme.border }} />
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {analyzed && (
        <div className="fade-up-3 card" style={{ marginTop: 18, padding: "20px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Head-to-Head Analysis</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <th style={{ padding: "8px 12px", textAlign: "left", color: theme.muted, fontSize: 11, textTransform: "uppercase" }}>Metric</th>
                <th style={{ padding: "8px 12px", textAlign: "center", color: theme.accent, fontSize: 12 }}>{L.sym}</th>
                <th style={{ padding: "8px 12px", textAlign: "center", color: theme.blue, fontSize: 12 }}>{R.sym}</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: theme.muted, fontSize: 11, textTransform: "uppercase" }}>Edge</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(L.metrics).map(([k, v]) => {
                const rv = R.metrics[k];
                const edge = v > rv ? L.sym : R.sym;
                return (
                  <tr key={k} style={{ borderBottom: `1px solid ${theme.border}20` }}>
                    <td style={{ padding: "10px 12px", color: theme.sub }}>{metricsLabels[k]}</td>
                    <td className="mono" style={{ padding: "10px 12px", textAlign: "center", color: edge === L.sym ? theme.accent : theme.sub, fontWeight: edge === L.sym ? 600 : 400 }}>{v}</td>
                    <td className="mono" style={{ padding: "10px 12px", textAlign: "center", color: edge === R.sym ? theme.blue : theme.sub, fontWeight: edge === R.sym ? 600 : 400 }}>{rv}</td>
                    <td style={{ padding: "10px 12px" }}><span className={`tag ${edge === L.sym ? "tag-green" : "tag-blue"}`}>{edge}</span></td>
                  </tr>
                );
              })}
              <tr style={{ background: theme.surface }}>
                <td style={{ padding: "12px 12px", fontWeight: 600 }}>Overall Score</td>
                <td className="mono" style={{ padding: "12px 12px", textAlign: "center", fontWeight: 700, fontSize: 16, color: theme.accent }}>{L.score}</td>
                <td className="mono" style={{ padding: "12px 12px", textAlign: "center", fontWeight: 700, fontSize: 16, color: theme.blue }}>{R.score}</td>
                <td style={{ padding: "12px 12px" }}><span className="tag tag-green">★ {winner}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── PORTFOLIO PAGE ───────────────────────────────────────────────────────────
function Portfolio() {
  const [capital, setCapital] = useState("50000");
  const [risk, setRisk] = useState("moderate");
  const [horizon, setHorizon] = useState("12");
  const [optimized, setOptimized] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleOptimize = () => {
    setLoading(true);
    setOptimized(false);
    setTimeout(() => { setLoading(false); setOptimized(true); }, 2000);
  };

  const colors = [theme.accent, theme.blue, theme.gold, theme.purple, theme.red, "#F97316"];

  return (
    <div style={{ padding: "28px", maxWidth: 1100, margin: "0 auto" }}>
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>Portfolio Optimizer</h1>
        <p style={{ color: theme.sub, fontSize: 14, marginTop: 4 }}>Markowitz optimization · ML-enhanced allocation</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>
        {/* Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="fade-up-1 card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: 13, color: theme.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 18 }}>Investor Profile</h3>
            <div style={{ marginBottom: 16 }}>
              <label>Capital (USD)</label>
              <input type="number" value={capital} onChange={e => setCapital(e.target.value)} placeholder="50000" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>Risk Tolerance</label>
              <select value={risk} onChange={e => setRisk(e.target.value)}>
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label>Time Horizon (months)</label>
              <select value={horizon} onChange={e => setHorizon(e.target.value)}>
                {["3", "6", "12", "24", "36", "60"].map(h => <option key={h} value={h}>{h} months</option>)}
              </select>
            </div>
            <div className="divider" style={{ marginBottom: 16 }} />
            <div style={{ marginBottom: 16 }}>
              <label>Optimization Goal</label>
              <select defaultValue="sharpe">
                <option value="sharpe">Max Sharpe Ratio</option>
                <option value="return">Max Return</option>
                <option value="minvol">Min Volatility</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label>Asset Universe</label>
              <select defaultValue="mixed">
                <option value="stocks">Stocks Only</option>
                <option value="mixed">Mixed (Stocks + ETF + Bonds)</option>
                <option value="crypto">Include Crypto</option>
              </select>
            </div>
            <button className="btn-primary" style={{ width: "100%" }} onClick={handleOptimize} disabled={loading}>
              {loading ? "Optimizing..." : "Optimize Portfolio"}
            </button>
            {loading && <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}><div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" /></div>}
          </div>
        </div>

        {/* Results */}
        {optimized && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Stats */}
            <div className="fade-up-1" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Expected Return", val: "+18.4%", color: theme.accent },
                { label: "Sharpe Ratio", val: "1.84", color: theme.blue },
                { label: "Max Drawdown", val: "-12.3%", color: theme.red },
                { label: "Volatility", val: "14.2%", color: theme.gold },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: "16px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.4px" }}>{s.label}</p>
                  <p className="mono" style={{ fontSize: 22, fontWeight: 700, color: s.color, marginTop: 6 }}>{s.val}</p>
                </div>
              ))}
            </div>

            {/* Allocations */}
            <div className="fade-up-2 card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recommended Allocation</h3>
                <span className="tag tag-gold">Optimized</span>
              </div>
              {/* Stacked bar */}
              <div style={{ height: 18, display: "flex", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
                {portfolioAssets.map((a, i) => (
                  <div key={i} style={{ flex: a.weight, background: colors[i], transition: "flex 0.8s ease" }} title={`${a.sym}: ${a.weight}%`} />
                ))}
              </div>
              {/* Legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                {portfolioAssets.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[i] }} />
                    <span style={{ fontSize: 11, color: theme.sub }}>{a.sym} {a.weight}%</span>
                  </div>
                ))}
              </div>
              <div className="divider" style={{ marginBottom: 16 }} />
              {/* Asset rows */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {["Asset", "Type", "Allocation", "Value", "24h Change", ""].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.3px", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolioAssets.map((a, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${theme.border}20` }}>
                      <td style={{ padding: "11px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: colors[i] + "25", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${colors[i]}40` }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: colors[i] }}>{a.sym.slice(0, 2)}</span>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{a.sym}</div>
                            <div style={{ fontSize: 11, color: theme.muted }}>{a.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "11px 10px" }}>
                        <span className={`tag ${a.type === "Stock" ? "tag-blue" : a.type === "Crypto" ? "tag-gold" : a.type === "ETF" ? "tag-purple" : "tag-green"}`}>{a.type}</span>
                      </td>
                      <td style={{ padding: "11px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 70, height: 5, background: theme.border, borderRadius: 3 }}>
                            <div style={{ width: `${(a.weight / 30) * 100}%`, height: "100%", background: colors[i], borderRadius: 3 }} />
                          </div>
                          <span className="mono" style={{ fontSize: 12, color: theme.sub }}>{a.weight}%</span>
                        </div>
                      </td>
                      <td className="mono" style={{ padding: "11px 10px", fontSize: 13 }}>${a.value.toLocaleString()}</td>
                      <td style={{ padding: "11px 10px" }}>
                        <span className={`tag ${a.pos ? "tag-green" : "tag-red"}`}>{a.change}</span>
                      </td>
                      <td style={{ padding: "11px 10px" }}>
                        <Sparkline positive={a.pos} width={60} height={24} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Efficient Frontier sketch */}
            <div className="fade-up-3 card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Efficient Frontier (Simulated)</h3>
              <svg width="100%" viewBox="0 0 500 180" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="frontierGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={theme.blue} />
                    <stop offset="100%" stopColor={theme.accent} />
                  </linearGradient>
                </defs>
                {/* Axes */}
                <line x1="40" y1="150" x2="480" y2="150" stroke={theme.border} strokeWidth="1" />
                <line x1="40" y1="10" x2="40" y2="150" stroke={theme.border} strokeWidth="1" />
                <text x="260" y="170" textAnchor="middle" fill={theme.muted} fontSize="11" fontFamily="DM Mono, monospace">Volatility (Risk)</text>
                <text x="18" y="80" textAnchor="middle" fill={theme.muted} fontSize="11" fontFamily="DM Mono, monospace" transform="rotate(-90, 18, 80)">Return</text>
                {/* Frontier curve */}
                <path d="M 80 140 Q 120 80 180 60 Q 240 40 320 30 Q 380 22 440 20" fill="none" stroke="url(#frontierGrad)" strokeWidth="2.5" strokeLinecap="round" />
                {/* Scatter points */}
                {[[120, 100], [180, 80], [220, 65], [280, 50], [350, 40], [400, 55], [430, 75]].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={4} fill={theme.surface} stroke={theme.muted} strokeWidth="1.5" />
                ))}
                {/* Current portfolio marker */}
                <circle cx={280} cy={50} r={7} fill={theme.accent} />
                <text x={290} y={46} fill={theme.accent} fontSize="10" fontFamily="DM Mono, monospace">Current</text>
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("Dashboard");
  return (
    <>
      <style>{styles}</style>
      <div style={{ minHeight: "100vh", background: theme.bg }}>
        <Navbar page={page} setPage={setPage} />
        <TickerBar />
        <div style={{ minHeight: "calc(100vh - 100px)" }}>
          {page === "Dashboard" && <Dashboard setPage={setPage} />}
          {page === "Predict" && <Predict />}
          {page === "Compare" && <Compare />}
          {page === "Portfolio" && <Portfolio />}
        </div>
        <footer style={{ borderTop: `1px solid ${theme.border}`, padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: theme.muted, fontFamily: "'DM Mono', monospace" }}>VAKVIC · Value Analytics & Knowledge-driven Value Intelligence Core</span>
          <span style={{ fontSize: 11, color: theme.muted }}>Mahindra University · SE Project · 2026</span>
        </footer>
      </div>
    </>
  );
}