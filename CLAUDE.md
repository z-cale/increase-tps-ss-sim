# Increase TPS & Shielded Sync Simulator

## Project Purpose
A website demonstrating that Zcash shielded sync performance can be significantly improved. Shows two key metrics under various configurations, allowing side-by-side comparison of "Today" vs "Dev Proposed" settings.

## Zcash Protocol Specification

The Zcash protocol spec is in `references/`:
- `zcash-protocol.tex` — Full protocol spec in LaTeX (~19k lines)
- `zcash-protocol.pdf` — Rendered PDF
- `zcash-protocol-index.md` — Section index with line ranges

### How to read the spec
1. Open `references/zcash-protocol-index.md` to find the relevant topic and line range.
2. Use the line range to read from `references/zcash-protocol.tex`.
3. The first ~2700 lines are LaTeX macro definitions (notation reference).

### Key sections for this project
- **Encryption & In-band Secret Distribution** (lines 4332–8240): Covers key agreement and trial decryption — central to shielded sync cost.
- **Notes & Commitments** (lines 3303–6326): Note structure, sending notes across Sapling/Orchard.
- **Keys & Addresses** (lines 3192–5519): Key components for Sapling/Orchard, relevant to incoming viewing key optimization.
- **Action descriptions** (lines 5751–5860): Orchard action structure.
- **Output descriptions** (lines 5677–5751): Sapling output structure.

## Architecture
- Static website with interactive graphs
- Two graphs: (1) Max shielded sync client bandwidth/day (MB), (2) Max shielded sync trial decrypt key exchanges/day
- Preset configs: "Today" and "Dev Proposed"
- Toggles: Exclude sapling attack vector, Remove incoming view key shielded sync, Include Keystone
- Overlay two configs for comparison

## Tech Stack
TBD — likely a single-page app with a charting library.
