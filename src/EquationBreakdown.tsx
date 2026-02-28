import { useState } from "react";
import type { SharedResult, SaplingResult, OrchardResult } from "./equations";

interface Variable {
  name: string;
  value: number | string;
  unit?: string;
}

function Var({ name, value, unit }: Variable) {
  const [hovered, setHovered] = useState(false);
  const display = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <span
      className={`eq-var ${hovered ? "eq-var-hovered" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {name}
      {hovered && (
        <span className="eq-tooltip">
          {display}{unit ? ` ${unit}` : ""}
        </span>
      )}
    </span>
  );
}

interface EquationBreakdownProps {
  label: string;
  color: string;
  shared: SharedResult;
  sapling: SaplingResult;
  orchard: OrchardResult;
}

export function EquationBreakdown({ label, color, shared, sapling, orchard }: EquationBreakdownProps) {
  const [open, setOpen] = useState(false);

  const maxRawBw = Math.max(sapling.rawBandwidthPerDay, orchard.rawBandwidthPerDay);
  const finalBw = maxRawBw + shared.compactBlockHeaderBwPerDay;
  const maxRawDecrypts = Math.max(sapling.rawDecryptsPerDay, orchard.rawDecryptsPerDay);
  const finalDecrypts = maxRawDecrypts * shared.trialDecryptMultiplier;

  return (
    <div className="eq-breakdown" style={{ borderColor: color }}>
      <button className="eq-toggle" onClick={() => setOpen(!open)}>
        <span style={{ color }}>{label}</span> — Equation Breakdown {open ? "▾" : "▸"}
      </button>
      {open && (
        <div className="eq-content">
          {/* ── SHARED ─────────────────────────────────── */}
          <h4>Shared Constants</h4>
          <div className="eq-line">
            <Var name="COINBASE_RESERVED" value={1739} unit="bytes" />
          </div>
          <div className="eq-line">
            <Var name="COMPACT_BLOCK_HEADER_SIZE" value={90} unit="bytes" />
          </div>

          <h4>Shared Derived</h4>
          <div className="eq-line">
            <Var name="effective_block_size" value={shared.effectiveBlockSize} unit="bytes" />{" "}
            = {shared.effectiveBlockSize === 2_000_000 - 1739
              ? "2,000,000 − 1,739 (default 2 MB)"
              : `${((shared.effectiveBlockSize + 1739) / 1_000_000).toFixed(0)} MB − 1,739 (custom)`}
          </div>
          <div className="eq-line">
            <Var name="block_time" value={shared.blockTime} unit="s" />{" "}
            = {shared.blockTime === 75 ? "75s (default)" : `${shared.blockTime}s (custom)`}
          </div>
          <div className="eq-line">
            <Var name="num_blocks_per_day" value={shared.numBlocksPerDay} />{" "}
            = floor(86400 / block_time)
          </div>
          <div className="eq-line">
            <Var name="compact_block_header_bw_per_day" value={shared.compactBlockHeaderBwPerDay} unit="bytes" />{" "}
            = COMPACT_BLOCK_HEADER_SIZE × num_blocks_per_day
          </div>
          <div className="eq-line">
            <Var name="trial_decrypt_multiplier" value={shared.trialDecryptMultiplier} />{" "}
            = 2{shared.trialDecryptMultiplier !== 2 && " (adjusted by toggles)"}
          </div>
          <div className="eq-line eq-note">
            Both applied after max(sapling, orchard) in final rollup
          </div>

          {/* ── SAPLING ────────────────────────────────── */}
          <h4 className="eq-section-sapling">Sapling Constants</h4>
          <div className="eq-line">
            <Var name="SAPLING_SPEND_SIZE" value={352} unit="bytes" />,{" "}
            <Var name="SAPLING_OUTPUT_SIZE" value={948} unit="bytes" />,{" "}
            <Var name="SAPLING_FLAT_UNKNOWN" value={109} unit="bytes" />
          </div>

          <h4 className="eq-section-sapling">Sapling Derived</h4>
          <div className="eq-line">
            <Var name="sapling_effective_block_size" value={sapling.saplingEffectiveBlockSize} unit="bytes" />{" "}
            = {sapling.saplingEffectiveBlockSize === 600_000 ? "600,000 (checkbox)" : "effective_block_size"}
          </div>
          <div className="eq-line">
            <Var name="sapling_spam_tx_size" value={sapling.saplingSpamTxSize} unit="bytes" />{" "}
            = SAPLING_SPEND_SIZE + 32 × SAPLING_OUTPUT_SIZE + SAPLING_FLAT_UNKNOWN
          </div>
          <div className="eq-line">
            <Var name="sapling_txs_per_block" value={sapling.saplingTxsPerBlock} />{" "}
            = floor(sapling_effective_block_size / sapling_spam_tx_size)
          </div>
          <div className="eq-line">
            <Var name="sapling_outputs_per_block" value={sapling.numOutputsPerBlock} />{" "}
            = ceil(sapling_txs_per_block × 32)
          </div>
          <div className="eq-line">
            <Var name="sapling_bw_per_block" value={sapling.bandwidthLoadPerBlock} unit="bytes" />{" "}
            = 32 × sapling_txs_per_block + 112 × sapling_outputs_per_block
          </div>

          <h4 className="eq-section-sapling">Sapling Daily (raw)</h4>
          <div className="eq-line">
            <Var name="sapling_raw_bw_per_day" value={sapling.rawBandwidthPerDay} unit="bytes" />{" "}
            = sapling_bw_per_block × num_blocks_per_day
            <span className="eq-converted">
              ({(sapling.rawBandwidthPerDay / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} MB)
            </span>
          </div>
          <div className="eq-line">
            <Var name="sapling_raw_decrypts_per_day" value={sapling.rawDecryptsPerDay} />{" "}
            = sapling_outputs_per_block × num_blocks_per_day
          </div>

          {/* ── ORCHARD ────────────────────────────────── */}
          <h4 className="eq-section-orchard">Orchard Constants</h4>
          <div className="eq-line">
            <Var name="ORCHARD_SPEND_AUTH_SIG" value={64} unit="bytes" />,{" "}
            <Var name="ORCHARD_PER_ACTION_PROOF_SIZE" value={2272} unit="bytes" />,{" "}
            <Var name="ORCHARD_ACTION_DESC" value={820} unit="bytes" />
          </div>
          <div className="eq-line">
            <Var name="ORCHARD_PER_ACTION_SIZE" value={orchard.orchardPerActionSize} unit="bytes" />{" "}
            = SPEND_AUTH_SIG + PER_ACTION_PROOF_SIZE + ACTION_DESC
          </div>
          <div className="eq-line">
            <Var name="ORCHARD_BINDING_SIG" value={64} unit="bytes" />,{" "}
            <Var name="ORCHARD_FLAT_PROOF" value={2720} unit="bytes" />
          </div>
          <div className="eq-line">
            <Var name="ORCHARD_FLAT_SIZE" value={orchard.orchardFlatSize} unit="bytes" />{" "}
            = BINDING_SIG + FLAT_PROOF
          </div>
          <div className="eq-line">
            <Var name="ORCHARD_BANDWIDTH_PER_ACTION" value={148} unit="bytes" />
          </div>

          <h4 className="eq-section-orchard">Orchard Derived</h4>
          <div className="eq-line">
            <Var name="orchard_spam_tx_size" value={orchard.orchardSpamTxSize} unit="bytes" />{" "}
            = 32 × ORCHARD_PER_ACTION_SIZE + ORCHARD_FLAT_SIZE
          </div>
          <div className="eq-line">
            <Var name="orchard_txs_per_block" value={orchard.orchardTxsPerBlock} />{" "}
            = floor(effective_block_size / orchard_spam_tx_size)
          </div>
          <div className="eq-line">
            <Var name="orchard_actions_per_block" value={orchard.orchardActionsPerBlock} />{" "}
            = ceil(orchard_txs_per_block × 32)
          </div>
          <div className="eq-line">
            <Var name="orchard_bw_per_block" value={orchard.bandwidthLoadPerBlock} unit="bytes" />{" "}
            = ORCHARD_BANDWIDTH_PER_ACTION × orchard_actions_per_block
          </div>

          <h4 className="eq-section-orchard">Orchard Daily (raw)</h4>
          <div className="eq-line">
            <Var name="orchard_raw_bw_per_day" value={orchard.rawBandwidthPerDay} unit="bytes" />{" "}
            = orchard_bw_per_block × num_blocks_per_day
            <span className="eq-converted">
              ({(orchard.rawBandwidthPerDay / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} MB)
            </span>
          </div>
          <div className="eq-line">
            <Var name="orchard_raw_decrypts_per_day" value={orchard.rawDecryptsPerDay} />{" "}
            = orchard_actions_per_block × num_blocks_per_day
          </div>

          {/* ── FINAL ROLLUP ───────────────────────────── */}
          <h4>Final Rollup</h4>
          <div className="eq-line">
            <Var name="max_raw_bw_per_day" value={maxRawBw} unit="bytes" />{" "}
            = max(sapling_raw_bw_per_day, orchard_raw_bw_per_day)
          </div>
          <div className="eq-line">
            <Var name="final_bw_per_day" value={finalBw} unit="bytes" />{" "}
            = max_raw_bw_per_day + compact_block_header_bw_per_day
            <span className="eq-converted">
              ({(finalBw / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} MB)
            </span>
          </div>
          <div className="eq-line">
            <Var name="max_raw_decrypts_per_day" value={maxRawDecrypts} />{" "}
            = max(sapling_raw_decrypts_per_day, orchard_raw_decrypts_per_day)
          </div>
          <div className="eq-line">
            <Var name="final_trial_decrypts_per_day" value={finalDecrypts} />{" "}
            = max_raw_decrypts_per_day × trial_decrypt_multiplier
          </div>
        </div>
      )}
    </div>
  );
}
