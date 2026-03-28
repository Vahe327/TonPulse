<div align="center">
  <img src="frontend/public/icons/TP.png" alt="TonPulse" width="120" height="120" style="border-radius: 24px;" />
  <h1>TonPulse</h1>
  <p><strong>AI-Powered DeFi Trading Terminal for Telegram</strong></p>
  <p>
    <a href="README.ru.md">Русская версия</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/TON-Blockchain-0098EA?style=for-the-badge&logo=ton&logoColor=white" alt="TON" />
    <img src="https://img.shields.io/badge/STON.fi-DEX-00D4AA?style=for-the-badge" alt="STON.fi" />
    <img src="https://img.shields.io/badge/Telegram-Mini%20App-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram" />
    <img src="https://img.shields.io/badge/AI-Groq%20LLM-7C5CFC?style=for-the-badge" alt="AI" />
  </p>
</div>

---

## What is TonPulse?

TonPulse is a **full-featured DeFi trading terminal** that lives inside Telegram. It brings professional-grade trading tools, AI-powered analytics, and liquidity management to your pocket — all powered by the **STON.fi** protocol on the **TON blockchain**.

Every swap, every quote, every route goes through STON.fi. TonPulse is a grant project for the **STON.fi Grant Program**.

---

## Features

### Token Trading
- **Swap** any TON token pair through STON.fi with real-time quotes
- **Multi-hop routing** — finds the best path across liquidity pools
- **Slippage control** — configurable tolerance (0.5%, 1%, 3%, custom)
- **Pool liquidity display** — see TVL and 24h volume before you swap
- **Price impact warnings** — color-coded alerts for large trades
- **Swap confirmation** — review all details before signing

### Live Market Data
- **Real-time prices** via WebSocket — updates every 15 seconds
- **Candlestick charts** (1H / 4H / 1D) powered by TradingView Lightweight Charts
- **OHLCV data** from GeckoTerminal with STON.fi pool fallback
- **Price flash animations** — green/red flash when prices change
- **TVL & Volume** displayed for every token
- **Trending tokens** — sorted by liquidity and activity

### Portfolio Management
- **TON + Jetton balances** — automatic detection of all holdings
- **USD valuation** — real-time portfolio value in dollars
- **Per-token breakdown** — balance, price, value, portfolio share
- **24h P&L tracking** — see how your portfolio changed today
- **Custom jetton support** — icons loaded from on-chain metadata (IPFS supported)

### Liquidity Pools
- **Pool discovery** — browse all STON.fi pools, searchable and sortable
- **APR display** — 24h, 7d, 30d annualized returns
- **Add liquidity** — single-sided or balanced provision
- **Remove liquidity** — withdraw your LP positions
- **Create new pools** — pair any two tokens
- **LP position tracking** — see your share, earned fees, current value
- **Impermanent loss warnings** — educational tooltips

### Buy TON with Card (Fiat On-Ramp)
- **Three providers** — Mercuryo (Visa/Mastercard), Neocrypto, Telegram Wallet
- **Opens externally** — secure purchase pages open via Telegram's `openLink` / `openTelegramLink`
- **Step-by-step guides** — expandable instructions for each provider (EN/RU)
- **Auto-fill wallet** — your connected TON address is passed to the provider URL
- **AI-triggered** — the assistant detects an empty wallet and suggests buying TON

### Smart Onboarding (Zero to DeFi)

TonPulse guides complete beginners from zero crypto experience to earning yield:

1. **Create Wallet** — step-by-step Tonkeeper setup guide inside the chat
2. **Buy TON** — purchase with card via Mercuryo, Neocrypto, or Telegram Wallet
3. **First Swap** — AI-guided token exchange with explanations
4. **First LP** — AI recommends best pool, explains risks, one-tap provision
5. **Set Alerts** — protect positions with price notifications

The AI detects user level (beginner/intermediate/advanced) and adapts guidance accordingly. 10 interactive action cards enable trading directly from the chat.

### AI Assistant (Groq LLM)
TonPulse integrates three AI models for different tasks:

| Feature | Model | What it does |
|---------|-------|-------------|
| **Token Analysis** | llama-3.3-70b | Deep analysis with risk score (1-10), strengths, weaknesses, outlook |
| **Risk Badges** | llama-3.1-8b | Quick 1-10 risk scores shown next to every token |
| **Swap Insights** | llama-3.1-8b | One-line AI opinion before you swap (positive/neutral/negative) |
| **Chat Assistant** | llama-3.3-70b | Conversational DeFi advisor with portfolio context |

The AI assistant is **context-aware** — it knows your wallet balance, LP positions, and current market conditions. It provides actionable suggestions with 10 interactive action cards:

| Card | Action |
|------|--------|
| **Buy TON** | Open fiat on-ramp providers with wallet pre-filled |
| **Swap** | Execute token swap directly from chat |
| **Add Liquidity** | One-tap LP provision to recommended pool |
| **Set Alert** | Create price alert from conversation |
| **Token Info** | Detailed token analysis card |
| **Portfolio** | Portfolio summary with positions |
| **Pool Recommend** | AI-picked best pools with APR |
| **Education** | DeFi concepts explained simply |
| **Connect Wallet** | Wallet connection prompt |
| **Confirm Action** | Transaction confirmation before signing |

**Rate limit:** 10 AI requests/hour per user. Results are cached in Redis.

### Price Alerts
- **Set price targets** — get notified when a token goes above or below your price
- **Telegram notifications** — alerts delivered directly to your Telegram chat
- **Repeating alerts** — fire every time the condition is met, not just once
- **Manage alerts** — create, view, delete from the Alerts tab

### Telegram-Native Experience
- **Haptic feedback** — tap responses on every interaction
- **Dark theme** — premium dark UI that matches Telegram
- **Safe area** — respects Telegram viewport and keyboard
- **Smooth animations** — spring-based transitions via Framer Motion
- **Pull-to-refresh** — native gesture support
- **Bottom navigation** — 5 tabs (Market, Swap, Portfolio, AI, Settings)

### Multi-Language
- **English** and **Russian** — full UI translation via i18next
- AI responses also localized to user's language
- Language switch in Settings

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Python 3.11+ | Runtime |
| FastAPI | REST API + WebSocket |
| PostgreSQL 16 | Primary database |
| Redis 7 | Cache, pub/sub, rate limiting |
| SQLAlchemy 2.0 (async) | ORM with Alembic migrations |
| httpx | Async HTTP client |
| Groq API | AI inference (Llama models) |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework |
| Vite 6 | Build tool with HMR |
| @telegram-apps/sdk-react | Telegram Mini App SDK |
| @tonconnect/ui-react | TON wallet connection |
| @ston-fi/sdk | STON.fi DEX integration |
| zustand | State management |
| framer-motion | Animations |
| lightweight-charts | TradingView candlestick charts |
| react-i18next | Internationalization |
| Mercuryo / Neocrypto | Fiat-to-crypto on-ramp (external links) |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker + Docker Compose | Containerization |
| Nginx | Reverse proxy + SSL |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Telegram WebApp                        │
│  ┌─────────┐ ┌──────┐ ┌───────────┐ ┌────┐ ┌──────────┐│
│  │ Market  │ │ Swap │ │ Portfolio │ │ AI │ │ Settings ││
│  └────┬────┘ └──┬───┘ └─────┬─────┘ └─┬──┘ └────┬─────┘│
│       └─────────┴───────────┴──────────┴─────────┘      │
│                         React 18                         │
│              zustand │ framer-motion │ i18next           │
└──────────────────────────┬──────────────────────────────┘
                           │ REST + WebSocket
┌──────────────────────────┴──────────────────────────────┐
│                      FastAPI Backend                     │
│  ┌──────────┐ ┌───────────┐ ┌─────────┐ ┌────────────┐ │
│  │ Token &  │ │  Swap &   │ │   AI    │ │  Alert &   │ │
│  │  Price   │ │ Liquidity │ │ Service │ │ Portfolio  │ │
│  └────┬─────┘ └─────┬─────┘ └────┬────┘ └──────┬─────┘ │
└───────┼─────────────┼────────────┼──────────────┼───────┘
        │             │            │              │
   ┌────┴────┐  ┌─────┴─────┐ ┌───┴───┐ ┌─────────┐ ┌──────┴──────┐
   │ STON.fi │  │ TON Center│ │ Groq  │ │Mercuryo │ │ PostgreSQL  │
   │   API   │  │    API    │ │  API  │ │Neocrypto│ │  + Redis    │
   └─────────┘  └───────────┘ └───────┘ └─────────┘ └─────────────┘
```

---

## API Endpoints

### Tokens
```
GET  /api/v1/tokens                          — List all tokens with prices
GET  /api/v1/tokens/{address}                — Token details + stats
GET  /api/v1/tokens/{address}/ohlcv          — Candlestick chart data
```

### Swap
```
GET  /api/v1/swap/pairs?token={address}      — Find tradeable pairs
GET  /api/v1/swap/quote                      — Get swap quote
POST /api/v1/swap/build-transaction          — Build swap TX payload
```

### Portfolio
```
GET  /api/v1/portfolio?wallet={address}      — Full portfolio with positions
```

### Liquidity
```
GET  /api/v1/pools                           — Browse pools (search, sort, paginate)
GET  /api/v1/pools/{address}                 — Pool details
POST /api/v1/liquidity/simulate              — Simulate LP provision
POST /api/v1/liquidity/build-transaction     — Build LP TX payload
GET  /api/v1/liquidity/positions             — User LP positions
```

### AI
```
POST /api/v1/ai/analyze-token               — Deep token analysis
POST /api/v1/ai/risk-scores                  — Batch risk scoring
GET  /api/v1/ai/swap-insight                 — Swap sentiment
POST /api/v1/ai/chat                         — Smart assistant chat
```

### Alerts & User
```
GET    /api/v1/alerts                        — List alerts
POST   /api/v1/alerts                        — Create alert
DELETE /api/v1/alerts/{id}                   — Delete alert
GET    /api/v1/user                          — User profile
PATCH  /api/v1/user                          — Update settings
```

### Real-time
```
WS   /api/v1/ws/prices                      — Live price stream
```

---

## Quick Start (Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.11+

### 1. Clone and configure

```bash
git clone https://github.com/your-org/tonpulse.git
cd tonpulse
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start with Docker Compose

```bash
docker compose up -d
```

This starts: PostgreSQL, Redis, Backend (FastAPI), Frontend (Vite), Nginx.

### 3. Run database migrations

```bash
docker compose exec backend alembic upgrade head
```

### 4. Open the app

- Development: `http://localhost:5173`
- Via Telegram: Set your bot's Mini App URL to your domain

---

## Production Deployment

### Option A: PM2 (bare metal / VPS)

#### Backend

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name tonpulse-backend
```

#### Frontend

```bash
cd frontend
npm ci
npm run build
pm2 start serve-prod.cjs --name tonpulse-frontend
```

The production server (`serve-prod.cjs`) serves the built `dist/` folder on port 5173 with:
- SPA fallback (all routes serve `index.html`)
- Long-term caching for hashed assets (JS, CSS, fonts)
- Minimal memory footprint

#### Nginx

Configure Nginx to proxy:
- `/api/*` and `/ws/*` → `http://127.0.0.1:8000`
- Everything else → `http://127.0.0.1:5173`

```bash
# SSL with Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

### Option B: Docker Compose

```bash
cp .env.example .env
# Edit .env with production values
docker compose up -d --build
docker compose exec backend alembic upgrade head
```

### Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Enable Mini App: Bot Settings → Menu Button → Set URL
3. Set the URL to `https://your-domain.com`

---

## Environment Variables

| Variable | Description | Required |
|----------|------------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `GROQ_API_KEY` | Groq API key for AI features | Yes |
| `TON_API_KEY` | TON Center API key | Recommended |
| `STONFI_API_URL` | STON.fi API base URL | No (default provided) |
| `COINGECKO_API_URL` | CoinGecko API URL | No (default provided) |
| `APP_URL` | Public app URL | Yes (production) |
| `CORS_ORIGINS` | Allowed CORS origins | Yes (production) |

---

## Project Structure

```
tonpulse/
├── docker-compose.yml
├── .env.example
├── README.md
├── README.ru.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/versions/
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── redis_client.py
│       ├── models/          # SQLAlchemy models
│       ├── schemas/         # Pydantic schemas
│       ├── api/v1/          # API endpoints
│       ├── services/        # Business logic (11 services)
│       ├── tasks/           # Background tasks
│       └── utils/           # Helpers, constants, AI prompts
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── public/
│   │   ├── icons/TP.png     # App icon
│   │   └── tonconnect-manifest.json
│   └── src/
│       ├── App.tsx
│       ├── i18n/            # EN + RU translations
│       ├── hooks/           # 10 custom hooks
│       ├── store/           # Zustand stores
│       ├── services/        # API client
│       ├── components/      # 65+ components
│       ├── pages/           # 8 pages
│       ├── styles/          # CSS tokens, animations
│       └── utils/           # Formatting, constants
│
└── nginx/
    └── nginx.conf
```

---

## STON.fi Grant Compliance

TonPulse is built for the **STON.fi Grant Program ($10,000)**. Every requirement is met:

| Requirement | Implementation |
|-------------|---------------|
| STON.fi SDK integration | All swaps route through `@ston-fi/sdk` and STON.fi HTTP API |
| DeFi product | Full trading terminal: swap, portfolio, liquidity, alerts |
| Clear milestones | Modular codebase, each feature independently testable |
| Long-term vision | Extensible architecture, AI features, multi-language |

**Value for STON.fi:** Every TonPulse user generates trading volume on STON.fi. The AI assistant actively recommends pools and swaps through the protocol.

---

## License

MIT

---

<div align="center">
  <p>
    <strong>Built with STON.fi</strong> | Powered by TON Blockchain | AI by Groq
  </p>
</div>
