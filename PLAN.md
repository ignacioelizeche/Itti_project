# Plan: Buscador Inteligente de Alianzas Comerciales — Itti

## Resumen del Proyecto

Desarrollar un **Buscador Inteligente de Alianzas Comerciales** que ayude al equipo de Itti (Ueno Bank) a identificar automáticamente empresas locales con alto potencial para establecer alianzas estratégicas (descuentos, premios, beneficios para usuarios, convenios, etc.).

El sistema no solo busca empresas, sino que las **analiza, puntua y justifica** por qué representan una buena oportunidad, reduciendo significativamente el tiempo de búsqueda y mejorando la calidad de las decisiones.

---

## Stack Tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Runtime | Node.js 20+ / TypeScript 5 | |
| Backend | Fastify | |
| ORM | Prisma | PostgreSQL + pgvector |
| IA análisis | Groq SDK (Llama 3.3 70B) | Gratis, sin tarjeta |
| IA embeddings | Ollama `nomic-embed-text` | Local, gratis |
| IA fallback | Ollama `llama3.1` | Local, gratis |
| Scraping | Playwright + Cheerio | |
| Cola tareas | BullMQ + Redis | |
| Places API | Google Places API (New) | $200/mes gratis (con tarjeta) |
| Mapa frontend | Leaflet.js + OpenStreetMap | Gratis, sin API key |
| Geocoding backend | Nominatim (OSM) | Gratis, sin API key |
| Frontend | Next.js 14 (App Router) + Tailwind | |
| Charts | Recharts | |
| Despliegue | Docker Compose | PostgreSQL + Redis |

---

## Arquitectura General

```
┌──────────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js 14)                    │
│   Dashboard · Búsqueda semántica · Filtros · Detalle     │
│               Leaflet + OpenStreetMap                     │
└───────────────────────────┬──────────────────────────────┘
                            │ fetch / axios
┌───────────────────────────▼──────────────────────────────┐
│                  API (Fastify + TS)                       │
│  /api/companies · /api/search · /api/scrape · /api/score │
└───┬───────────────┬────────────────┬─────────────────────┘
    │               │                │
    ▼               ▼                ▼
┌─────────┐  ┌────────────┐  ┌───────────────┐
│Scraping │  │  AI Engine │  │Vector Search  │
│Playwright│  │  Groq API  │  │ pgvector +    │
│Cheerio   │  │  Ollama    │  │ Ollama embed  │
│GPlaces   │  │            │  │               │
└────┬────┘  └─────┬──────┘  └──────┬────────┘
     │             │                │
     ▼             ▼                ▼
┌──────────────────────────────────────────────────────────┐
│              PostgreSQL 16 + pgvector                     │
│  companies · scores · analyses · embeddings · job_logs    │
│                      Redis (BullMQ)                       │
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
├── docker-compose.yml
├── .env.example
├── package.json                    # workspace root
├── tsconfig.base.json
├── PLAN.md
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── packages/
│   ├── api/                        # Fastify backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── config.ts
│   │   │   ├── plugins/
│   │   │   │   ├── prisma.ts
│   │   │   │   ├── cors.ts
│   │   │   │   └── redis.ts
│   │   │   ├── routes/
│   │   │   │   ├── companies.ts
│   │   │   │   ├── search.ts
│   │   │   │   ├── scrape.ts
│   │   │   │   ├── scores.ts
│   │   │   │   └── stats.ts
│   │   │   ├── services/
│   │   │   │   ├── scraper/
│   │   │   │   │   ├── google-places.ts
│   │   │   │   │   ├── directories.ts
│   │   │   │   │   ├── web-scraper.ts
│   │   │   │   │   ├── social-media.ts
│   │   │   │   │   ├── news.ts
│   │   │   │   │   └── normalizer.ts
│   │   │   │   ├── ai/
│   │   │   │   │   ├── groq-client.ts
│   │   │   │   │   ├── ollama-client.ts
│   │   │   │   │   ├── analyzer.ts
│   │   │   │   │   ├── scorer.ts
│   │   │   │   │   └── embeddings.ts
│   │   │   │   └── search/
│   │   │   │       ├── semantic.ts
│   │   │   │       └── hybrid.ts
│   │   │   ├── workers/
│   │   │   │   ├── scrape-worker.ts
│   │   │   │   ├── analyze-worker.ts
│   │   │   │   └── embed-worker.ts
│   │   │   └── utils/
│   │   │       ├── rate-limiter.ts
│   │   │       └── text-utils.ts
│   │   └── tests/
│   │
│   └── web/                        # Next.js frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── next.config.js
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── search/
│       │   │   │   └── page.tsx
│       │   │   ├── companies/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx
│       │   │   └── scrape/
│       │   │       └── page.tsx
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   └── Header.tsx
│       │   │   ├── companies/
│       │   │   │   ├── CompanyCard.tsx
│       │   │   │   ├── CompanyDetail.tsx
│       │   │   │   └── CategoryGrid.tsx
│       │   │   ├── scoring/
│       │   │   │   ├── ScoreBadge.tsx
│       │   │   │   ├── ScoreRadar.tsx
│       │   │   │   └── ScoreBreakdown.tsx
│       │   │   ├── search/
│       │   │   │   ├── SearchBar.tsx
│       │   │   │   ├── SearchResults.tsx
│       │   │   │   └── FilterSidebar.tsx
│       │   │   ├── dashboard/
│       │   │   │   ├── KPICards.tsx
│       │   │   │   ├── TopCompanies.tsx
│       │   │   │   └── Charts.tsx
│       │   │   └── maps/
│       │   │       └── LeafletMap.tsx
│       │   ├── lib/
│       │   │   ├── api.ts
│       │   │   └── types.ts
│       │   └── hooks/
│       │       ├── useSearch.ts
│       │       └── useCompanies.ts
│       └── public/
│
└── scripts/
    ├── init-db.sql
    └── seed-categories.ts
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
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  score     CompanyScore?
  analysis  CompanyAnalysis?
  embedding CompanyEmbedding?

  @@index([category])
  @@index([city])
  @@index([googleRating])
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
  embedding   Unsupported("vector(384)")
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
GET    /api/companies                        → Lista paginada + filtros
GET    /api/companies/:id                    → Detalle completo
GET    /api/companies/:id/analysis           → Análisis + justificación
GET    /api/companies/:id/score              → Score detallado con sub-scores

POST   /api/search                           → Búsqueda semántica (body: { query })
POST   /api/search/hybrid                    → Búsqueda híbrida (query + filtros)

GET    /api/scores/top?limit=10              → Top empresas por affinity
GET    /api/scores/by-category/:category     → Empresas por categoría

POST   /api/scrape/trigger                   → Disparar recolección
GET    /api/scrape/jobs                      → Historial de jobs
GET    /api/scrape/jobs/:id                  → Estado de un job

GET    /api/categories                       → Categorías disponibles
GET    /api/stats                            → Estadísticas generales
```

---

## Fases de Implementación

### Fase 1: Infraestructura Base (Días 1-2)

**Objetivo:** Tener el proyecto andando con Docker, base de datos y configuración.

- [ ] Inicializar monorepo con workspaces
- [ ] Crear `docker-compose.yml` (PostgreSQL 16 + pgvector, Redis 7)
- [ ] Configurar Prisma schema con todas las tablas
- [ ] Configurar `.env.example` con todas las variables
- [ ] Crear estructura de carpetas del backend
- [ ] Configurar Fastify con plugins (prisma, cors, redis)
- [ ] Verificar conexión a DB y hacer primer migration

**Archivos a crear:**
- `docker-compose.yml`
- `.env.example`
- `package.json` (root)
- `tsconfig.base.json`
- `prisma/schema.prisma`
- `packages/api/package.json`
- `packages/api/tsconfig.json`
- `packages/api/src/index.ts`
- `packages/api/src/config.ts`
- `packages/api/src/plugins/prisma.ts`
- `packages/api/src/plugins/cors.ts`
- `packages/api/src/plugins/redis.ts`

---

### Fase 2: Motor de Recolección de Datos (Días 3-6)

**Objetivo:** Poder buscar y recolectar datos de empresas desde múltiples fuentes.

- [ ] Google Places API client (buscar por categoría + ubicación)
- [ ] Scraper de directorios locales (PaginasAmarillas, Guía Commercial)
- [ ] Scraper de sitios web (Playwright + Cheerio)
- [ ] Scraper de redes sociales (Instagram, Facebook públicos)
- [ ] Scraper de noticias (Google News)
- [ ] Pipeline de deduplicación y normalización
- [ ] Workers de BullMQ para jobs de scraping
- [ ] Rate limiting entre requests (1-3s delay)

**Archivos a crear:**
- `packages/api/src/services/scraper/google-places.ts`
- `packages/api/src/services/scraper/directories.ts`
- `packages/api/src/services/scraper/web-scraper.ts`
- `packages/api/src/services/scraper/social-media.ts`
- `packages/api/src/services/scraper/news.ts`
- `packages/api/src/services/scraper/normalizer.ts`
- `packages/api/src/workers/scrape-worker.ts`
- `packages/api/src/utils/rate-limiter.ts`
- `packages/api/src/routes/scrape.ts`

---

### Fase 3: Motor de Análisis IA (Días 7-9)

**Objetivo:** Analizar cada empresa con IA, calcular Affinity Score y generar justificación.

- [ ] Groq client para análisis con Llama 3.3 70B
- [ ] Ollama client para embeddings y fallback
- [ ] Extracción de atributos con LLM (JSON estructurado)
- [ ] Affinity Score con los pesos recalibrados para Itti/Ueno
- [ ] Generación de justificación en lenguaje natural
- [ ] Batch processing con BullMQ

**Archivos a crear:**
- `packages/api/src/services/ai/groq-client.ts`
- `packages/api/src/services/ai/ollama-client.ts`
- `packages/api/src/services/ai/analyzer.ts`
- `packages/api/src/services/ai/scorer.ts`
- `packages/api/src/services/ai/embeddings.ts`
- `packages/api/src/workers/analyze-worker.ts`
- `packages/api/src/workers/embed-worker.ts`

---

### Fase 4: Búsqueda Semántica (Días 10-11)

**Objetivo:** Permitir búsquedas en lenguaje natural sobre las empresas.

- [ ] Generación de embeddings con Ollama (`nomic-embed-text`, 384 dims)
- [ ] Índice HNSW en pgvector
- [ ] Búsqueda semántica pura (cosine similarity)
- [ ] Búsqueda híbrida (semántica + filtros SQL)

**Archivos a crear:**
- `packages/api/src/services/search/semantic.ts`
- `packages/api/src/services/search/hybrid.ts`
- `packages/api/src/routes/search.ts`

---

### Fase 5: API REST (Días 12-13)

**Objetivo:** Todos los endpoints funcionando y documentados.

- [ ] CRUD de empresas con filtros y paginación
- [ ] Detalle de empresa con score y análisis
- [ ] Endpoints de búsqueda semántica e híbrida
- [ ] Endpoints de scoring (top, por categoría)
- [ ] Endpoints de scraping (trigger, status, historial)
- [ ] Endpoint de estadísticas
- [ ] Validación de input con Zod

**Archivos a crear:**
- `packages/api/src/routes/companies.ts`
- `packages/api/src/routes/scores.ts`
- `packages/api/src/routes/stats.ts`
- `packages/api/src/schemas/` (Zod schemas)

---

### Fase 6: Frontend Dashboard (Días 14-19)

**Objetivo:** Interfaz completa para que el equipo de Itti use el sistema.

**Dashboard (/)**
- [ ] KPIs: total empresas, score promedio, empresas nuevas
- [ ] Top 10 recomendadas (cards con score badge)
- [ ] Gráfico de distribución por categoría (Recharts)
- [ ] Gráfico de distribución de scores (histograma)

**Búsqueda (/search)**
- [ ] SearchBar con placeholder en lenguaje natural
- [ ] Resultados como cards con score y justificación
- [ ] Sidebar de filtros (categoría, rango score, ubicación)
- [ ] Paginación

**Detalle de empresa (/companies/[id])**
- [ ] Header: nombre, categoría, dirección, links
- [ ] Score badge grande + radar chart de sub-scores
- [ ] Justificación completa en lenguaje natural
- [ ] Mapa con Leaflet + OpenStreetMap
- [ ] Info: reseñas, seguidores, rating
- [ ] Fuentes de datos consultadas

**Explorar (/companies)**
- [ ] Grid de tarjetas de categorías
- [ ] Lista filtrada de empresas por categoría

**Panel de recolección (/scrape)**
- [ ] Botón "Iniciar nueva recolección"
- [ ] Selector de fuente y categoría
- [ ] Historial de jobs anteriores

**Archivos a crear:**
- `packages/web/src/app/layout.tsx`
- `packages/web/src/app/page.tsx`
- `packages/web/src/app/search/page.tsx`
- `packages/web/src/app/companies/page.tsx`
- `packages/web/src/app/companies/[id]/page.tsx`
- `packages/web/src/app/scrape/page.tsx`
- `packages/web/src/components/layout/Sidebar.tsx`
- `packages/web/src/components/layout/Header.tsx`
- `packages/web/src/components/companies/CompanyCard.tsx`
- `packages/web/src/components/companies/CompanyDetail.tsx`
- `packages/web/src/components/companies/CategoryGrid.tsx`
- `packages/web/src/components/scoring/ScoreBadge.tsx`
- `packages/web/src/components/scoring/ScoreRadar.tsx`
- `packages/web/src/components/scoring/ScoreBreakdown.tsx`
- `packages/web/src/components/search/SearchBar.tsx`
- `packages/web/src/components/search/SearchResults.tsx`
- `packages/web/src/components/search/FilterSidebar.tsx`
- `packages/web/src/components/dashboard/KPICards.tsx`
- `packages/web/src/components/dashboard/TopCompanies.tsx`
- `packages/web/src/components/dashboard/Charts.tsx`
- `packages/web/src/components/maps/LeafletMap.tsx`
- `packages/web/src/lib/api.ts`
- `packages/web/src/lib/types.ts`
- `packages/web/src/hooks/useSearch.ts`
- `packages/web/src/hooks/useCompanies.ts`

---

### Fase 7: Seed Data + Testing (Días 20-22)

**Objetivo:** Poblar con datos reales de Ueno y asegurar calidad.

- [ ] Seed con historial de empresas que Ueno ya se asoció
- [ ] Seed de categorías iniciales
- [ ] Tests de API (Vitest)
- [ ] Tests de scoring
- [ ] Performance: caché Redis, paginación, índices
- [ ] UX: loading states, empty states, error handling, responsive

**Archivos a crear:**
- `scripts/seed.ts`
- `scripts/seed-categories.ts`
- `packages/api/tests/` (archivos de test)

---

## Estimación de Tiempo

| Fase | Días | Descripción |
|------|------|-------------|
| 1 | 2 | Infraestructura: Docker, Prisma, config, esquema DB |
| 2 | 4 | Scraping: Google Places, directorios, web, redes, noticias |
| 3 | 3 | IA: análisis con Groq, scoring, justificaciones |
| 4 | 2 | Búsqueda semántica: embeddings Ollama, pgvector |
| 5 | 2 | API REST: todos los endpoints |
| 6 | 6 | Frontend: Dashboard, búsqueda, detalle, categorías, mapa |
| 7 | 3 | Seed data, testing, performance, UX polish |
| **Total** | **~22 días** | |

---

## Google Maps Platform — APIs Habilitadas

| API | Uso | Costo |
|-----|-----|-------|
| **Places API (New)** | Buscar empresas, detalles, reseñas, horarios | Dentro de $200/mes gratis |
| **Geocoding API** | Backup de geocodificación (Nominatim es primario) | Dentro de $200/mes gratis |

**Nota:** Configurar alerta de presupuesto en $1 USD en Google Cloud Console.

---

## Datos Necesarios (Pendientes)

- [ ] Lista de empresas que Ueno ya tiene asociadas (nombre, rubro, estado, tipo de beneficio)
- [ ] API key de Google Maps Platform
- [ ] Definir categorías exactas de Google Places para mapear a las nuestras
