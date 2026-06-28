# Plan: Buscador Inteligente de Alianzas Comerciales — Itti

## Resumen del Proyecto

Desarrollar un **Buscador Inteligente de Alianzas Comerciales** que ayude al equipo de Itti (Ueno Bank) a identificar automáticamente empresas locales con alto potencial para establecer alianzas estratégicas (descuentos, premios, beneficios para usuarios, convenios, etc.).

El sistema no solo busca empresas, sino que las **analiza, puntua y justifica** por qué representan una buena oportunidad, reduciendo significativamente el tiempo de búsqueda y mejorando la calidad de las decisiones.

---

## Stack Tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Runtime | Node.js 20+ / TypeScript 5 | |
| Backend | Fastify | Swagger UI at /docs |
| ORM | Prisma | PostgreSQL 16 + pgvector |
| IA análisis | Ollama `llama3.1:8b` | Local, CPU (Intel Xeon Gold 5218R, ~10-15 tok/sec) |
| IA embeddings | Ollama `nomic-embed-text` | 768-dim vectors, at 192.168.2.33:30068 |
| Scraping | Axios + Cheerio | + Apify for Instagram |
| Cola tareas | BullMQ + Redis | In-process worker |
| Places API | Google Places API (New) | $200/mes gratis |
| Validation | Zod | All endpoints |
| Testing | Vitest | 10 tests |
| Frontend | Next.js 14 (App Router) + Tailwind | |
| Charts | Recharts | |
| Despliegue | Docker Compose | PostgreSQL + Redis + API + Web |

---

## Arquitectura General

```
┌──────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js 14, port 3000)              │
│  Dashboard · Descubrir · Búsqueda · Empresas · Scoring    │
└───────────────────────────┬──────────────────────────────┘
                            │ fetch
┌───────────────────────────▼──────────────────────────────┐
│              API (Fastify + TS, port 3001)                 │
│  /api/discover · /api/search · /api/scores · /api/scrape  │
│  Swagger UI: /docs   |   Zod validation                   │
└───┬───────────────┬────────────────┬─────────────────────┘
    │               │                │
    ▼               ▼                ▼
┌─────────┐  ┌────────────┐  ┌───────────────┐
│Scraping │  │  AI Engine │  │Vector Search  │
│GPlaces   │  │  Ollama    │  │ pgvector +    │
│Apify IG  │  │ llama3.1:8b│  │ nomic-embed   │
│SimilarWeb│  │            │  │               │
└────┬────┘  └─────┬──────┘  └──────┬────────┘
     │             │                │
     ▼             ▼                ▼
┌──────────────────────────────────────────────────────────┐
│           PostgreSQL 16 + pgvector + Redis                 │
│  companies · scores · analyses · embeddings · jobs         │
└──────────────────────────────────────────────────────────┘
```

---

## Affinity Score — Pesos para Itti/Ueno

| Criterio | Peso | Justificación |
|----------|------|---------------|
| **Audiencia** (público objetivo) | 25% | Que el público de la empresa coincida con usuarios de Ueno (jóvenes 18-35, urbanos, digitales) |
| **Compatibilidad Ueno** | 20% | Que pueda ofrecer beneficios tangibles: descuentos, cashback, 2x1, etc. |
| **Presencia digital** | 15% | Fuerte presencia en redes = más visibilidad para promociones conjuntas |
| **Reputación** | 12% | Ratings y reseñas altas = confianza del público |
| **Rubro** | 10% | Que el sector sea relevante para el estilo de vida de los usuarios Ueno |
| **Ubicación** | 8% | Que esté en zonas de alta concentración de usuarios (Asunción, ciudades principales) |
| **Tamaño** | 5% | Empresas medianas/grandes tienen más capacidad de ejecutar alianzas |
| **Potencial de alianza** | 5% | Señales de que ya participan en programas similares |

---

## Categorías Iniciales

- Restaurantes / Gastronomía
- Tecnología
- Moda / Retail
- Fitness / Bienestar
- Educación

---

## Estructura del Proyecto

```
Itti_Project/
├── docker-compose.yml          # postgres + redis + api + web
├── Dockerfile                  # API build
├── Dockerfile.web              # Frontend build
├── README.md                   # Full docs, architecture, install
├── PLAN.md
│
├── packages/
│   ├── api/                    # Fastify backend (port 3001)
│   │   ├── src/
│   │   │   ├── index.ts        # Server + in-process BullMQ worker
│   │   │   ├── config.ts       # dotenv from project root
│   │   │   ├── lib/prisma.ts   # Prisma singleton
│   │   │   ├── plugins/        # prisma, cors, redis, swagger
│   │   │   ├── schemas/        # Zod validation (all endpoints)
│   │   │   ├── routes/         # discover, search, scores, scrape, enrichment
│   │   │   ├── services/
│   │   │   │   ├── ai/         # ollama-client, analyzer, scorer, embeddings
│   │   │   │   ├── scraper/    # google-places, instagram-apify, similarweb, facebook, normalizer
│   │   │   │   └── search/     # semantic (parameterized SQL)
│   │   │   ├── workers/        # analyze-worker, scrape-worker
│   │   │   └── __tests__/      # Vitest (10 tests)
│   │   └── package.json        # test, test:watch scripts
│   │
│   └── web/                    # Next.js 14 (port 3000)
│       └── src/app/            # Dashboard, Discover, Search, Companies, Scoring, Decisions
│
└── ueno alianzas/              # Reports, data (gitignored)
```

---

## Modelo de Base de Datos (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Company {
  id                 Int       @id @default(autoincrement())
  name               String
  slug               String    @unique
  category           String?
  subcategory        String?
  description        String?
  address            String?
  latitude           Float?
  longitude          Float?
  city               String    @default("Asunción")
  country            String    @default("Paraguay")
  phone              String?
  email              String?
  website            String?
  instagram          String?
  facebook           String?
  googleRating       Decimal?  @map("google_rating")
  googleReviews      Int?      @map("google_reviews_count")
  instagramFollowers Int?      @map("instagram_followers")
  sizeEstimate       String?   @map("size_estimate")
  foundedYear        Int?      @map("founded_year")
  lastScrapedAt      DateTime? @map("last_scraped_at")
  dataSources        Json?     @map("data_sources")
  humanDecision      String?   @map("human_decision")
  humanNote          String?   @map("human_note")
  decidedAt          DateTime? @map("decided_at")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  score     CompanyScore?
  analysis  CompanyAnalysis?
  embedding CompanyEmbedding?

  @@index([category])
  @@index([city])
  @@index([googleRating])
  @@index([humanDecision])
}

model CompanyScore {
  id                  Int      @id @default(autoincrement())
  companyId           Int      @unique @map("company_id")
  categoryFit         Decimal  @map("category_fit")
  locationFit         Decimal  @map("location_fit")
  audienceOverlap     Decimal  @map("audience_overlap")
  businessSize        Decimal  @map("business_size")
  digitalPresence     Decimal  @map("digital_presence")
  reputation          Decimal
  ittiCompatibility   Decimal  @map("itti_compatibility")
  alliancePotential   Decimal  @map("alliance_potential")
  totalScore          Decimal  @map("total_score")
  scoreLabel          String   @map("score_label")
  calculatedAt        DateTime @default(now()) @map("calculated_at")

  company Company @relation(fields: [companyId], references: [id])
}

model CompanyAnalysis {
  id             Int      @id @default(autoincrement())
  companyId      Int      @unique @map("company_id")
  summary        String?
  strengths      String?
  weaknesses     String?
  recommendation String?
  fullAnalysis   String?  @map("full_analysis")
  modelUsed      String?  @map("model_used")
  createdAt      DateTime @default(now()) @map("created_at")

  company Company @relation(fields: [companyId], references: [id])
}

model CompanyEmbedding {
  id          Int      @id @default(autoincrement())
  companyId   Int      @unique @map("company_id")
  embedding   Unsupported("vector(768)")
  contentHash String   @map("content_hash")
  createdAt   DateTime @default(now()) @map("created_at")

  company Company @relation(fields: [companyId], references: [id])
}

model ScrapeJob {
  id           Int       @id @default(autoincrement())
  source       String
  category     String?
  status       String    @default("pending")
  totalFound   Int       @default(0) @map("total_found")
  newCompanies Int       @default(0) @map("new_companies")
  errors       Json?
  startedAt    DateTime? @map("started_at")
  completedAt  DateTime? @map("completed_at")
  createdAt    DateTime  @default(now()) @map("created_at")
}

model SearchLog {
  id          Int      @id @default(autoincrement())
  query       String
  resultCount Int      @map("result_count")
  topScore    Decimal? @map("top_score")
  createdAt   DateTime @default(now()) @map("created_at")
}
```

---

## Endpoints de API

```
POST   /api/discover                           → Búsqueda inteligente con IA
POST   /api/search                             → Búsqueda semántica
POST   /api/search/hybrid                      → Búsqueda híbrida

GET    /api/scores/company/:id                 → Empresa con datos completos
POST   /api/scores/analyze/:companyId          → Analizar empresa con IA
POST   /api/scores/analyze-batch               → Analizar en lote
POST   /api/scores/full-flow                   → Pipeline completo (enrich + analyze)
GET    /api/scores/stats                       → Estadísticas de scoring
PATCH  /api/scores/company/:companyId          → Actualizar empresa
POST   /api/scores/:companyId/decide           → Aprobar/rechazar alianza
GET    /api/scores/decisions                   → Filtrar por decisión

POST   /api/scrape/trigger                     → Disparar recolección

POST   /api/enrich/batch                       → Enriquecer empresas

GET    /health                                 → Estado del sistema
GET    /docs                                   → Swagger UI
```

---

## Fases de Implementación

### Fase 1: Infraestructura Base — ✅ COMPLETADA
- Docker (PostgreSQL 16 + pgvector, Redis 7)
- Prisma schema, Fastify with plugins
- Port 3001, CORS, Redis connection

### Fase 2: Motor de Recolección de Datos — ✅ COMPLETADA
- Google Places API, directories scraper, web scraper
- Social media scraper (Apify Instagram, Facebook)
- BullMQ workers, SimilarWeb scraper (siteworthtraffic.com)
- 511 companies in DB (303 Ueno alliances + 99 Google Places + 109 Discover)

### Fase 3: Motor de Análisis IA — ✅ COMPLETADA
- Ollama `llama3.1:8b` local (CPU, Intel Xeon Gold 5218R, ~10-15 tok/sec)
- `nomic-embed-text` (768-dim embeddings) at `192.168.2.33:30068`
- 8 weighted criteria scoring (0-100)
- Auto-enrichment before analysis (Instagram, SimilarWeb, Facebook)
- 398+ companies fully analyzed

### Fase 4: Búsqueda Semántica — ✅ COMPLETADA
- pgvector HNSW index, semantic search, hybrid search
- SQL injection fixed (parameterized queries)

### Fase 5: API REST — ✅ COMPLETADA
- All endpoints: Discover, Search, Scores, Scrape, Enrichment, Decisions
- Zod validation on all endpoints
- Swagger/OpenAPI at `http://localhost:3001/docs/`
- Prisma singleton (`src/lib/prisma.ts`), single process

### Fase 6: Frontend Dashboard — ✅ COMPLETADA
- Dashboard, Search, Companies, Company Detail, Scoring, Discover, Decisions
- Sidebar: Dashboard → Descubrir → Búsqueda → Empresas → Scoring → Decisiones

### Fase 7: Quality — ✅ COMPLETADA
- Vitest test suite (10 tests passing)
- Docker + Prisma production builds
- `.env` from project root via `fileURLToPath`
- README.md with architecture, install, API reference

### Fase 8: Presentación
- [ ] Preparar slides de presentación
- [ ] Demo en vivo del sistema
- [ ] Documentar métricas de rendimiento

---

## Google Maps Platform — APIs Habilitadas

| API | Uso | Estado |
|-----|-----|--------|
| **Places API (New)** | Buscar empresas, detalles, reseñas | ✅ Configurada |
| **Geocoding API** | Backup de geocodificación | ✅ Configurada |

## Servicios Externos

| Servicio | Uso | Estado |
|----------|-----|--------|
| **Ollama** (192.168.2.33:30068) | Análisis + embeddings | ✅ Local |
| **Apify** | Instagram scraping | ✅ $5/mes |
| **Google Places** | Business data | ✅ $200/mes gratis |

---

## Datos Necesarios

- [x] Lista de empresas que Ueno ya tiene asociadas (303 companies)
- [x] API key de Google Maps Platform (configured)
- [x] Apify token for Instagram scraping (configured)
- [x] Ollama running on 192.168.2.33:30068 (llama3.1:8b + nomic-embed-text)
