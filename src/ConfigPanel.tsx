import type { PresetConfig } from "./types";
import { BLOCK_SIZE_OPTIONS, BLOCK_INTERVAL_OPTIONS } from "./types";

interface ConfigPanelProps {
  label: string;
  color: string;
  config: PresetConfig;
  onChange: (config: PresetConfig) => void;
}

export function ConfigPanel({ label, color, config, onChange }: ConfigPanelProps) {
  const toggle = (key: "removeIVKSync" | "lowerSaplingBandwidth") => {
    onChange({ ...config, [key]: !config[key] });
  };

  return (
    <div className="config-panel" style={{ borderColor: color }}>
      <h3 style={{ color }}>{label}</h3>

      <div className="toggles">
        <label>
          <input
            type="checkbox"
            checked={config.removeIVKSync}
            onChange={() => toggle("removeIVKSync")}
          />
          Remove incoming view key shielded sync
        </label>

        <div className="block-size-control">
          <label>
            <input
              type="checkbox"
              checked={config.useCustomBlockInterval}
              onChange={() => onChange({ ...config, useCustomBlockInterval: !config.useCustomBlockInterval })}
            />
            Reduce block interval
          </label>
          <select
            className="block-size-select"
            value={config.customBlockIntervalS}
            disabled={!config.useCustomBlockInterval}
            onChange={(e) => onChange({ ...config, customBlockIntervalS: Number(e.target.value) })}
          >
            {BLOCK_INTERVAL_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}s</option>
            ))}
          </select>
        </div>

        <label>
          <input
            type="checkbox"
            checked={config.lowerSaplingBandwidth}
            onChange={() => toggle("lowerSaplingBandwidth")}
          />
          Lower Sapling bandwidth by 70%
        </label>

        <div className="block-size-control">
          <label>
            <input
              type="checkbox"
              checked={config.useCustomBlockSize}
              onChange={() => onChange({ ...config, useCustomBlockSize: !config.useCustomBlockSize })}
            />
            Orchard applicable block size
          </label>
          <select
            className="block-size-select"
            value={config.customBlockSizeMB}
            disabled={!config.useCustomBlockSize}
            onChange={(e) => onChange({ ...config, customBlockSizeMB: Number(e.target.value) })}
          >
            {BLOCK_SIZE_OPTIONS.map((mb) => (
              <option key={mb} value={mb}>{mb} MB</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
