import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PRESET_TODAY, PRESET_PROPOSED } from "./types";
import type { PresetConfig } from "./types";
import { computeShared, computeSapling, computeOrchard } from "./equations";
import { ConfigPanel } from "./ConfigPanel";
import { EquationBreakdown } from "./EquationBreakdown";
import "./App.css";

const COLOR_A = "#6366f1";
const COLOR_B = "#f59e0b";
const COLOR_SAPLING = "#f472b6";
const COLOR_ORCHARD = "#34d399";

function DominanceTag({ label, dominant, color }: { label: string; dominant: "sapling" | "orchard"; color: string }) {
  const domColor = dominant === "sapling" ? COLOR_SAPLING : COLOR_ORCHARD;
  return (
    <span className="dominance-tag">
      <span style={{ color }}>{label}</span>:{" "}
      <span style={{ color: domColor }}>{dominant}-dominated</span>
    </span>
  );
}

function App() {
  const [configA, setConfigA] = useState<PresetConfig>({ ...PRESET_TODAY });
  const [configB, setConfigB] = useState<PresetConfig>({ ...PRESET_PROPOSED });
  const [excludeSaplingAttack, setExcludeSaplingAttack] = useState(false);
  const [includeKeystone, setIncludeKeystone] = useState(false);

  const effectiveA = { ...configA, excludeSaplingAttack, includeKeystone };
  const effectiveB = { ...configB, excludeSaplingAttack, includeKeystone };

  const sharedA = computeShared(effectiveA);
  const sharedB = computeShared(effectiveB);
  const saplingA = computeSapling(effectiveA, sharedA);
  const saplingB = computeSapling(effectiveB, sharedB);
  const orchardA = computeOrchard(effectiveA, sharedA);
  const orchardB = computeOrchard(effectiveB, sharedB);

  // Zero out sapling if excluding sapling attack vector
  const sapBwA = excludeSaplingAttack ? 0 : saplingA.rawBandwidthPerDay;
  const sapBwB = excludeSaplingAttack ? 0 : saplingB.rawBandwidthPerDay;
  const sapRawDecA = excludeSaplingAttack ? 0 : saplingA.rawDecryptsPerDay;
  const sapRawDecB = excludeSaplingAttack ? 0 : saplingB.rawDecryptsPerDay;

  // Final bandwidth = max(sapling, orchard) raw + compact block headers
  const bandwidthA = (Math.max(sapBwA, orchardA.rawBandwidthPerDay) + sharedA.compactBlockHeaderBwPerDay) / 1_000_000;
  const bandwidthB = (Math.max(sapBwB, orchardB.rawBandwidthPerDay) + sharedB.compactBlockHeaderBwPerDay) / 1_000_000;

  // Final decrypts = max(sapling, orchard) raw × shared trial decrypt multiplier
  const rawDecryptsA = Math.max(sapRawDecA, orchardA.rawDecryptsPerDay);
  const rawDecryptsB = Math.max(sapRawDecB, orchardB.rawDecryptsPerDay);
  const decryptsA = rawDecryptsA * sharedA.trialDecryptMultiplier;
  const decryptsB = rawDecryptsB * sharedB.trialDecryptMultiplier;

  // Which pool dominates?
  const bwDominantA = sapBwA >= orchardA.rawBandwidthPerDay ? "sapling" : "orchard";
  const bwDominantB = sapBwB >= orchardB.rawBandwidthPerDay ? "sapling" : "orchard";
  const decDominantA = sapRawDecA >= orchardA.rawDecryptsPerDay ? "sapling" : "orchard";
  const decDominantB = sapRawDecB >= orchardB.rawDecryptsPerDay ? "sapling" : "orchard";

  const bandwidthData = [
    { name: "Bandwidth", a: Math.round(bandwidthA * 100) / 100, b: Math.round(bandwidthB * 100) / 100 },
  ];

  const decryptData = [
    { name: "Trial Decrypts", a: decryptsA, b: decryptsB },
  ];

  return (
    <div className="app">
      <h1>Zcash Shielded Sync Simulator</h1>
      <p className="subtitle">
        Compare shielded sync performance under different configurations
      </p>

      <div className="global-toggles">
        <label>
          <input
            type="checkbox"
            checked={excludeSaplingAttack}
            onChange={() => setExcludeSaplingAttack(!excludeSaplingAttack)}
          />
          Exclude Sapling attack vector
        </label>
        <label>
          <input
            type="checkbox"
            checked={includeKeystone}
            onChange={() => setIncludeKeystone(!includeKeystone)}
          />
          Include Keystone
        </label>
      </div>

      <div className="config-row">
        <ConfigPanel
          label={configA.label}
          color={COLOR_A}
          config={configA}
          onChange={setConfigA}
        />
        <ConfigPanel
          label={configB.label}
          color={COLOR_B}
          config={configB}
          onChange={setConfigB}
        />
      </div>

      <div className="tps-row">
        <div className="tps-card" style={{ borderColor: COLOR_A }}>
          <span className="tps-label" style={{ color: COLOR_A }}>{configA.label}</span>
          <span className="tps-value">{sharedA.orchardTps.toFixed(2)}</span>
          <span className="tps-unit">Orchard TPS</span>
        </div>
        <div className="tps-card" style={{ borderColor: COLOR_B }}>
          <span className="tps-label" style={{ color: COLOR_B }}>{configB.label}</span>
          <span className="tps-value">{sharedB.orchardTps.toFixed(2)}</span>
          <span className="tps-unit">Orchard TPS</span>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-container">
          <h2>Max Shielded Sync Client Bandwidth / Day (MB)</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={bandwidthData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" unit=" MB" />
              <Tooltip
                contentStyle={{ background: "#1e1e2e", border: "1px solid #444" }}
              />
              <Legend />
              <Bar dataKey="a" name={configA.label} fill={COLOR_A} />
              <Bar dataKey="b" name={configB.label} fill={COLOR_B} />
            </BarChart>
          </ResponsiveContainer>
          <div className="dominance-row">
            <DominanceTag label={configA.label} dominant={bwDominantA} color={COLOR_A} />
            <DominanceTag label={configB.label} dominant={bwDominantB} color={COLOR_B} />
          </div>
        </div>

        <div className="chart-container">
          <h2>Max Shielded Sync Trial Decrypt KEs / Day</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={decryptData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{ background: "#1e1e2e", border: "1px solid #444" }}
                formatter={(value: number) => [value.toLocaleString(), undefined]}
              />
              <Legend />
              <Bar dataKey="a" name={configA.label} fill={COLOR_A} />
              <Bar dataKey="b" name={configB.label} fill={COLOR_B} />
            </BarChart>
          </ResponsiveContainer>
          <div className="dominance-row">
            <DominanceTag label={configA.label} dominant={decDominantA} color={COLOR_A} />
            <DominanceTag label={configB.label} dominant={decDominantB} color={COLOR_B} />
          </div>
        </div>
      </div>
      <div className="eq-row">
        <EquationBreakdown label={configA.label} color={COLOR_A} shared={sharedA} sapling={saplingA} orchard={orchardA} />
        <EquationBreakdown label={configB.label} color={COLOR_B} shared={sharedB} sapling={saplingB} orchard={orchardB} />
      </div>
    </div>
  );
}

export default App;
