# Alliance Finder — Intelligent Partnership Discovery for Ueno Bank

> Finding the right business partners shouldn't take weeks. Ollama does it in minutes.

![511 companies](https://img.shields.io/badge/Empresas-511-0066FF?style=flat-square)
![398 analyzed](https://img.shields.io/badge/Analizadas-398-10B981?style=flat-square)
![8 criteria](https://img.shields.io/badge/Criterios-8-F59E0B?style=flat-square)
![100% local](https://img.shields.io/badge/IA-100%25%20Local-8B5CF6?style=flat-square)
![Zero cloud](https://img.shields.io/badge/Cloud-Zero%20Dependencies-EF4444?style=flat-square)

---

## Demo

[![Demo Video](brag-output-2026-06-29-143022/thumbnail.jpg)](https://raw.githubusercontent.com/ignacioelizeche/Itti_project/main/brag-output-2026-06-29-143022/brag.mp4)

> **[▶ Ver video completo (20 s)](https://raw.githubusercontent.com/ignacioelizeche/Itti_project/main/brag-output-2026-06-29-143022/brag.mp4)**

**511 empresas en Paraguay. 398 analizadas por IA local. 8 criterios ponderados. Un pipeline — desde consulta en lenguaje natural hasta decisión de aprobar/rechazar.**

---

## El Problema

Encontrar alianzas comerciales para un banco como Ueno requiere semanas de investigación manual: buscar empresas, verificar datos, evaluar compatibilidad, tomar decisiones. **El equipo pierde tiempo en tareas repetitivas que una IA puede hacer en minutos.**

## La Solución

Un sistema que convierte una consulta en lenguaje natural ("restaurantes saludables con buen Instagram en Asunción") en una lista rankeada de empresas socias potenciales, analizadas con IA local y listas para decidir.

**Pipeline completo en 4 pasos:**
1. **Descubrir** — El usuario describe lo que busca → la IA genera consultas optimizadas
2. **Recolectar** — Google Places + Instagram + Facebook + web scraping → datos completos
3. **Analizar** — Ollama evalúa 8 criterios ponderados → score de 0 a 100 + justificación
4. **Decidir** — El equipo aprueba o rechaza cada alianza con contexto completo

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                │
│    Dashboard │ Descubrir │ Búsqueda │ Empresas │ Score  │
└──────────────────────────┬──────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────┐
│                  Backend (Fastify + TypeScript)          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Discover │  │ Scraper  │  │ Enricher │  │ Scorer │ │
│  │  (IA)    │  │ (Places) │  │ (IG+FB)  │  │ (LLM)  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└──────┬───────────────┬───────────────┬─────────────────┘
       │               │               │
┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│ PostgreSQL  │ │    Redis    │ │   Ollama    │
│ + pgvector  │ │  (BullMQ)   │ │ (llama3.1)  │
└─────────────┘ └─────────────┘ └─────────────┘
```

## Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Runtime | Node.js | 20+ |
| Backend | Fastify | 5 |
| Frontend | Next.js | 14 (App Router) |
| ORM | Prisma | 6 |
| Base de datos | PostgreSQL + pgvector | 16 |
| Cola de tareas | BullMQ + Redis | 5 / 7 |
| IA (LLM) | Ollama (llama3.1:8b) | Local |
| Embeddings | Ollama (nomic-embed-text) | Local |
| Estilos | Tailwind CSS | 3 |
| Gráficos | Recharts | - |
| Icons | Lucide React | - |

## Características Principales

### 1. Descubrimiento Inteligente con IA
El usuario describe en lenguaje natural lo que busca (ej: "restaurantes saludables con buen Instagram en Asunción"), y el sistema:
- Genera automáticamente 3 consultas optimizadas de Google Places
- Busca y guarda las empresas encontradas
- Enriquece datos de redes sociales (Instagram, Facebook)
- Analiza y puntúa cada empresa con IA

### 2. Pipeline de Análisis Multi-Step
Cada empresa pasa por un pipeline de 3 llamadas a LLM:
1. **Extracción de atributos** → industria, público objetivo, tono de marca, tamaño
2. **Cálculo de Score de Afinidad** → 8 dimensiones ponderadas (Audiencia 25%, Compatibilidad Ueno 20%, Digital 15%, Reputación 12%, Rubro 10%, Ubicación 8%, Tamaño 5%, Potencial 5%)
3. **Generación de justificación** → párrafo explicativo para cada empresa

### 3. Búsqueda Semántica
- Embeddings vectoriales de 768 dimensiones con pgvector
- Búsqueda por similitud coseno
- Búsqueda híbrida (vectorial + filtros SQL)

### 4. Enriquecimiento Multi-Fuente
- **Google Places** → dirección, rating, reseñas, teléfono, web
- **Instagram (Apify)** → seguidores, engagement, posts, bio
- **SimilarWeb** → tráfico web mensual, bounce rate
- **Web scraping** → descripción, redes sociales adicionales

### 5. Sistema de Decisiones
- Flujo de aprobar/rechazar alianzas
- Filtros por estado (pendiente/decidido)
- Historial de decisiones para entrenamiento futuro

## Requisitos Previos

- Node.js 20+
- Docker y Docker Compose
- Ollama instalado y corriendo
- API Key de Google Maps Platform
- (Opcional) API Key de Apify para Instagram scraping

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd itti-alliances
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
# Database
DATABASE_URL=postgresql://itti:itti_secret@localhost:5432/itti_alliances

# Redis
REDIS_URL=redis://localhost:6379

# AI - Ollama (local)
OLLAMA_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_CHAT_MODEL=llama3.1

# Google Maps Platform
GOOGLE_MAPS_API_KEY=tu_api_key_aquí

# Apify (opcional, para Instagram)
APIFY_API_TOKEN=tu_token_aquí

# App
API_PORT=3001
NODE_ENV=development
```

### 3. Iniciar servicios基础

```bash
# PostgreSQL + Redis
docker-compose up -d

# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate --schema=packages/api/prisma/schema.prisma
```

### 4. Configurar Ollama

```bash
# Instalar modelos necesarios
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

### 5. Iniciar el servidor

```bash
# Modo desarrollo (API + Frontend)
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- API: http://localhost:3001

## Uso

### Descubrir Alianzas
1. Ir a la página **Descubrir**
2. Describir lo que buscás en lenguaje natural
3. El sistema genera consultas, busca empresas y las analiza automáticamente

### Analizar Empresas
1. Ir a la página **Scoring**
2. Hacer clic en "Analizar" para empresas individuales
3. O usar "Analizar Batch" para procesar múltiples empresas

### Tomar Decisiones
1. Ir a la página **Decisiones**
2. Revisar empresas analizadas
3. Aprobar o rechazar cada alianza potencial

## API Endpoints

### Descubrimiento
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/discover` | Búsqueda inteligente con IA |

### Búsqueda
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/search` | Búsqueda semántica |
| POST | `/api/search/hybrid` | Búsqueda híbrida |

### Empresas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/scores/top` | Top empresas por score |
| GET | `/api/scores/stats` | Estadísticas generales |
| GET | `/api/scores/company/:id` | Detalle de empresa |
| PATCH | `/api/scores/company/:id` | Actualizar empresa |
| POST | `/api/scores/analyze/:id` | Analizar empresa |
| POST | `/api/scores/analyze-batch` | Análisis batch |
| POST | `/api/scores/full-flow` | Pipeline completo |

### Decisiones
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/scores/decide/:id` | Aprobar/rechazar |
| GET | `/api/scores/decisions` | Listar decisiones |

### Enriquecimiento
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/enrich/companies` | Empresas para enriquecer |
| POST | `/api/enrich/batch` | Enriquecimiento batch |

### Scraping
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/scrape/trigger` | Iniciar scraping |
| GET | `/api/scrape/jobs` | Listar trabajos |
| GET | `/api/scrape/stats` | Estadísticas |

## Estructura del Proyecto

```
itti-alliances/
├── packages/
│   ├── api/                    # Backend Fastify
│   │   ├── prisma/            # Schema y migraciones
│   │   └── src/
│   │       ├── config.ts      # Configuración
│   │       ├── index.ts       # Entry point
│   │       ├── plugins/       # Fastify plugins
│   │       ├── routes/        # API endpoints
│   │       ├── services/      # Lógica de negocio
│   │       │   ├── ai/        # LLM, embeddings, scoring
│   │       │   ├── scraper/   # Google Places, Instagram, etc.
│   │       │   └── search/    # Búsqueda semántica
│   │       └── workers/       # BullMQ workers
│   └── web/                   # Frontend Next.js
│       └── src/
│           ├── app/           # Pages (App Router)
│           ├── components/    # Componentes React
│           └── lib/           # Utilidades
├── docker-compose.yml         # PostgreSQL + Redis
├── .env.example              # Variables de entorno
└── package.json              # Root config
```

## Score de Afinidad — 8 Criterios Ponderados

| Criterio | Peso | Qué evalúa |
|----------|------|-----------|
| **Audiencia** | 25% | Que el público coincida con usuarios Ueno (jóvenes 18-35, urbanos, digitales) |
| **Compatibilidad Ueno** | 20% | Capacidad de ofrecer beneficios: descuentos, cashback, 2x1 |
| **Presencia Digital** | 15% | Fuerza en redes sociales = más visibilidad para promociones |
| **Reputación** | 12% | Ratings y reseñas altas = confianza del público |
| **Rubro** | 10% | Relevancia del sector para el estilo de vida Ueno |
| **Ubicación** | 8% | Presencia en zonas de alta concentración de usuarios |
| **Tamaño** | 5% | Capacidad de ejecutar alianzas |
| **Potencial** | 5% | Señales de participación en programas similares |

---

## Por Qué Ollama (No la Nube)

- **Datos sensibles** — Información de empresas y alianzas bancarias nunca sale del servidor
- **Sin costos recurrentes** — $0/mes en tokens de API (vs. cientos con OpenAI/Claude)
- **Sin dependencia externa** — Funciona sin internet, sin rate limits, sin downtime de proveedores
- **Velocidad** — llama3.1:8b en CPU local: ~10-15 tok/sec, suficiente para el pipeline
- **Control total** — Modelo ajustable, fine-tuneable, ejecutable en cualquier momento

---

## Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | Sí |
| `REDIS_URL` | URL de conexión a Redis | Sí |
| `OLLAMA_URL` | URL del servidor Ollama | Sí |
| `OLLAMA_CHAT_MODEL` | Modelo de chat (default: llama3.1) | No |
| `OLLAMA_EMBED_MODEL` | Modelo de embeddings (default: nomic-embed-text) | No |
| `GOOGLE_MAPS_API_KEY` | API Key de Google Maps Platform | Sí |
| `APIFY_API_TOKEN` | Token de Apify para Instagram | No |
| `API_PORT` | Puerto del backend (default: 3001) | No |
| `NODE_ENV` | Entorno (development/production) | No |

---

## Licencia

Proyecto privado — Itti / Ueno Bank
