# AI Curator

> **Local-first dataset preparation layer for LLM fine-tuning**  
> _No Code. Zero config. Full ownership. MIT licensed._

[![npm version](https://badge.fury.io/js/@elgap%2Fai-curator.svg)](https://badge.fury.io/js/@elgap/ai-curator)
[![CI](https://github.com/elgap/ai-curator/actions/workflows/ci.yml/badge.svg)](https://github.com/elgap/ai-curator/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/@elgap/ai-curator.svg)](https://www.npmjs.com/package/@elgap/ai-curator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI Curator provides a **Universal Capture API** for streaming training data from any tool, a **web UI** for interactive curation, and a **CLI** for power users managing datasets at scale. All data stays local in SQLite — no cloud, no lock-in.

![AI Curator Screenshot](AI-Curator-screenshot.png)

---

## Quick Start

### NPM (Recommended)

```bash
# One-time use
npx @elgap/ai-curator

# Or install globally
npm install -g @elgap/ai-curator
curator
```

Open [http://localhost:3333](http://localhost:3333) and start capturing.

---

## Features

- **🔒 Privacy First** — Local SQLite database. No cloud, no tracking, no telemetry.
- **⚡ Zero Configuration** — Install and run. Start collecting in minutes.
- **🎣 Universal Capture** — Manual entry, file imports, or live capture from any tool.
- **✅ Quality Control** — Review workflow with draft → review → approve states.
- **📤 Export Formats** — Alpaca, JSONL, MLX, Unsloth, TRL.
- **📥 Import Formats** — JSON, JSONL, CSV.
- **🚫 No Code** — Point, click, curate. No programming required.

---

## Ways to Capture Data

### 1. Live Capture (Universal API)

Stream training data in real-time via HTTP API from any tool, IDE, or script.

```bash
curl -X POST localhost:3333/api/capture \
  -H "Content-Type: application/json" \
  -d '{"source":"my-app","records":[{"instruction":"...","output":"..."}]}'
```

### 2. Manual Entry

Create samples directly in the web UI for human-crafted examples.

### 3. File Import

Upload existing datasets (JSON, JSONL, CSV).

### 4. Hugging Face & Kaggle

Import public datasets directly via CLI:

```bash
# Search and download from Hugging Face
curator search "python programming"
curator download hf:openai/summarize_from_feedback

# Or from Kaggle
curator download kaggle:competitions/titanic
```

## Core Functionality

### Dataset Management

- Create multiple datasets for different projects
- Set goals and track progress
- Organize by purpose: coding, writing, Q&A, roleplay

### Training Sample Management

- **Fields**: Instruction, Input, Output, System Prompt
- **Metadata**: Category, Difficulty, Quality (1-5 stars), Tags
- **Workflow**: Draft → In Review → Approved/Rejected
- **Bulk Operations**: Approve, categorize, or delete multiple samples

### Quality Control

- Draft-first capture for review
- Duplicate detection via semantic similarity
- Auto-enrichment for categorization

---

## Live Capture API

**The Universal Capture API is AI Curator's flagship feature.** It allows any tool — your IDE, chat interface, browser extension, or custom script — to stream training data directly into your dataset in real-time.

**For the explorer:** Your best AI conversations are training data. Capture them from OpenCode, OpenWebUI, or any tool as they happen, before they disappear. Build your dataset naturally, without manual copy-pasting.

**For the builder:** Integrate AI Curator into your product workflow. Your support tickets, code reviews, and team conversations become proprietary training data. No export scripts, no file juggling — just a simple HTTP POST.

Any tool can send data via HTTP:

```bash
curl -X POST http://localhost:3333/api/capture \
  -H "Content-Type: application/json" \
  -d '{
    "source": "my-ide",
    "apiVersion": "1.0",
    "records": [{
      "instruction": "Explain quicksort",
      "output": "Quicksort is a divide-and-conquer algorithm...",
      "category": "coding",
      "qualityRating": 4
    }]
  }'
```

**Endpoint:** `POST /api/capture`  
**Docs:** `http://localhost:3333/docs`

---

## CLI Reference

**For shell-oriented power users**, AI Curator provides a comprehensive command-line interface for managing datasets, importing from external sources, and automating export workflows. While the web UI is perfect for interactive curation, the CLI excels at bulk operations, scripting, and integration into data pipelines.

| Command                     | Description                          |
| --------------------------- | ------------------------------------ |
| `curator`                   | Start server (http://localhost:3333) |
| `curator search <query>`    | Search Kaggle and Hugging Face       |
| `curator download <source>` | Download and import from Kaggle/HF   |
| `curator import <file>`     | Import local file (JSON, JSONL, CSV) |
| `curator export`            | Export dataset to training format    |
| `curator reset`             | Reset database                       |
| `curator help`              | Show all commands                    |

**Environment Variables:**

| Variable                  | Default    | Description                |
| ------------------------- | ---------- | -------------------------- |
| `AI_CURATOR_PORT`         | 3333       | Server port                |
| `AI_CURATOR_HOST`         | localhost  | Server host                |
| `AI_CURATOR_OPEN_BROWSER` | true       | Auto-open browser on start |
| `AI_CURATOR_DATA_DIR`     | ~/.curator | Data directory             |
| `HUGGINGFACE_TOKEN`       | -          | HF API token for downloads |
| `HUGGINGFACE_USERNAME`    | -          | HF username                |

---

## Export Formats

AI Curator exports to all major training formats:

- **Alpaca** (JSON) — Instruction-following format
- **JSONL** — Line-delimited JSON for training pipelines
- **MLX** — Apple Silicon optimized (Mistral/LLaMA chat template)

**Export Options:**

- Filter by status, quality, category
- Train/test/validation splits (e.g., 0.8,0.1,0.1)
- Stratified splitting to maintain category balance
- With or without metadata

---

## Import Formats

AI Curator accepts standard dataset formats:

- **JSON** — Array of objects or JSON Lines
- **JSONL** — Line-delimited JSON
- **CSV** — Comma-separated values

**Auto-detection:** Format is automatically detected from file extension and content.

---

## Privacy & Security

- **100% Local** — SQLite database on your machine
- **No Cloud** — No external API calls
- **No Tracking** — Zero analytics or telemetry
- **MIT License** — Full transparency

---

## Development

### Tech Stack

- **Frontend**: Vue 3 + Nuxt 4 + Tailwind CSS
- **Backend**: Nuxt 4 API routes
- **Database**: SQLite (Drizzle ORM)

### Build from Source

```bash
git clone https://github.com/elgap/ai-curator.git
cd ai-curator
npm install
npm run dev
```

### Commands

```bash
npm run db:reset      # Reset database
npm run test          # Run tests
npm run typecheck     # Type checking
npm run build         # Production build
npm run lint          # Run ESLint
```

### Project Structure

```
ai-curator/
├── app/              # Nuxt frontend
├── server/           # Backend API
├── bin/              # CLI scripts
└── docs/             # Documentation
```

---

## Documentation

---

## Contributing

Contributions welcome:

- **Plugins** — Build integrations for your favorite tools
- **Documentation** — Tutorials and examples
- **Bug Reports** — Help us improve

---

## License

MIT License — see [LICENSE](LICENSE)

---

[AI Curator](https://github.com/elgap/ai-curator) and [EdukaAI Studio](https://github.com/elgap/edukaai-studio) are part of [EdukaAI](https://eduka.elgap.ai) project by ElGap — making AI & fine-tuning accessible through open-source, no-code, zero config tools.

