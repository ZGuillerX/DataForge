<div align="center">

# ⚡ DataForge

### Plataforma de Procesamiento de Datos — Sistema Backend Basado en Jobs Asíncronos

![Node](https://img.shields.io/badge/node.js-20+-brightgreen?logo=node.js)
![TypeScript](https://img.shields.io/badge/typescript-5.4-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue?logo=postgresql)
![Redis](https://img.shields.io/badge/redis-7-red?logo=redis)
![BullMQ](https://img.shields.io/badge/bullmq-queue-orange)
![Prisma](https://img.shields.io/badge/prisma-ORM-2D3748?logo=prisma)
![Arquitectura](https://img.shields.io/badge/arquitectura-modular-purple)
![Estado](https://img.shields.io/badge/estado-activo-success)

_Sistema backend para procesamiento de datos mediante jobs asíncronos desacoplados de la API._

</div>

---

## 📌 Descripción general

**DataForge** es un sistema backend que procesa archivos de datos (CSV / Excel) sin bloquear la API, usando una cola de jobs asíncronos con workers independientes.

Funcionalidades implementadas:

- Importación de archivos CSV / Excel con validación por fila
- Procesamiento en background mediante cola BullMQ + Redis
- Deduplicación de registros por email, teléfono y similitud fuzzy
- Exportación bajo demanda en CSV o JSON
- Fallos por fila: un registro inválido no aborta el job completo
- Estado rastreable con logs estructurados por job

---

## 🧠 Estilo de arquitectura

> **Arquitectura modular por dominios + capas de servicio + workers asíncronos**

Los controllers solo manejan entrada/salida HTTP.  
Todo el procesamiento pesado se delega de forma asíncrona mediante jobs y workers.  
La API y el Worker corren como **procesos separados** — escalables de forma independiente.

```
Cliente (HTTP Request)
        │
        ▼
┌───────────────────┐
│   API (Express)   │  ← Controllers → Services → Repositories
└───────────────────┘
        │
        │  Crea Job + Envía a la Cola
        ▼
┌───────────────────┐
│   Cola (Redis)    │  ← BullMQ — desacopla API del procesamiento
└───────────────────┘
        │
        │  Worker toma el job
        ▼
┌───────────────────┐
│     Workers       │  ← Proceso separado, ejecutado independientemente
└───────────────────┘
        │
   ┌────┴──────────────────────┐
   │            │              │
   ▼            ▼              ▼
Importación  Exportación   Deduplicación
   │            │              │
   ▼            ▼              ▼
Chunks →    Query DB →    Email / Phone /
Validar     Streaming     Fuzzy Matching
   │            │              │
   ▼            ▼              ▼
┌────────────────────────────────────────┐
│          Base de datos PostgreSQL      │
└────────────────────────────────────────┘
        │
        ▼
┌───────────────────┐
│  Almacenamiento   │  ← Sistema de archivos local / compatible S3
└───────────────────┘
```

---

## 🏗️ Diseño del sistema

### Capas del sistema

| Capa             | Responsabilidad                                                              |
| ---------------- | ---------------------------------------------------------------------------- |
| **Controllers**  | Reciben requests HTTP, validan entrada, delegan a servicios                  |
| **Services**     | Orquestan operaciones, crean jobs, aplican reglas de negocio                 |
| **Repositories** | Acceso a datos mediante Prisma ORM. Sin lógica de negocio                    |
| **Queue**        | Desacopla API del procesamiento. Redis + BullMQ                              |
| **Workers**      | Consumen jobs de la cola. Corren como proceso independiente                  |
| **Processors**   | Lógica específica por job: import por chunks, export streaming, reglas dedup |
| **Shared**       | Logger, clases de error, middlewares, constantes, utilidades                 |

---

## 📁 Estructura del proyecto

```
DataForge/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── controllers/        auth.controller.ts
│   │   │   ├── services/           auth.service.ts
│   │   │   ├── repositories/       auth.repository.ts
│   │   │   ├── dto/                auth.dto.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── users/
│   │   │   ├── controllers/        users.controller.ts
│   │   │   ├── services/           users.service.ts
│   │   │   ├── repositories/       users.repository.ts
│   │   │   └── users.module.ts
│   │   │
│   │   ├── files/
│   │   │   ├── controllers/        files.controller.ts
│   │   │   ├── services/           files.service.ts
│   │   │   ├── repositories/       files.repository.ts
│   │   │   ├── storage/            local.storage.ts
│   │   │   └── files.module.ts
│   │   │
│   │   ├── jobs/
│   │   │   ├── controllers/        jobs.controller.ts
│   │   │   ├── services/           jobs.service.ts
│   │   │   ├── repositories/       jobs.repository.ts
│   │   │   ├── processors/
│   │   │   │   ├── import.processor.ts
│   │   │   │   ├── export.processor.ts
│   │   │   │   └── dedup.processor.ts
│   │   │   ├── queues/             jobs.queue.ts
│   │   │   ├── workers/            jobs.worker.ts
│   │   │   ├── enums/              job-status.enum.ts / job-type.enum.ts
│   │   │   ├── dto/                create-job.dto.ts
│   │   │   └── jobs.module.ts
│   │   │
│   │   ├── records/
│   │   │   └── repositories/       records.repository.ts
│   │   │
│   │   └── duplicates/
│   │       ├── services/           duplicate.service.ts
│   │       ├── strategies/
│   │       │   ├── email.strategy.ts
│   │       │   ├── phone.strategy.ts
│   │       │   └── fuzzy.strategy.ts
│   │       └── repositories/       duplicates.repository.ts
│   │
│   ├── shared/
│   │   ├── utils/                  logger.util.ts / chunk.util.ts / file.util.ts
│   │   ├── errors/                 app-error.ts
│   │   ├── middleware/             auth / error / logger
│   │   ├── constants/              job.constants.ts / pagination.ts
│   │   ├── interfaces/             job.interface.ts / user.interface.ts
│   │   └── types/                  request.type.ts
│   │
│   ├── config/
│   │   ├── env.ts                  Variables de entorno validadas con Zod
│   │   ├── database.ts             Singleton de Prisma client
│   │   ├── redis.ts                Conexión IORedis
│   │   └── storage.ts              Configuración del driver de almacenamiento
│   │
│   ├── app.ts                      Factory de la app Express
│   ├── server.ts                   Entry point de la API
│   └── worker.ts                   Entry point del Worker
│
├── prisma/
│   └── schema.prisma               Esquema de base de datos
│
├── database/
│   └── seeds/                      seed.ts
│
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## ⚙️ Stack tecnológico

| Categoría           | Tecnología                                |
| ------------------- | ----------------------------------------- |
| Runtime             | Node.js 20                                |
| Lenguaje            | TypeScript 5.4                            |
| Framework           | Express 4                                 |
| Base de datos       | PostgreSQL 16                             |
| ORM                 | Prisma 5                                  |
| Cola de tareas      | Redis 7 + BullMQ 5                        |
| Parsing de archivos | csv-parser + ExcelJS                      |
| Fuzzy matching      | Fuse.js                                   |
| Autenticación       | JWT + bcrypt                              |
| Validación          | Zod                                       |
| Logging             | Winston                                   |
| Almacenamiento      | Sistema de archivos local / compatible S3 |
| Contenedorización   | Docker + docker-compose                   |

---

## 🗄️ Modelo de base de datos

```
users                                files
──────────────────────               ──────────────────────────
id             UUID PK               id           UUID PK
email          VARCHAR UNIQUE        user_id      UUID FK → users
password_hash  TEXT                  filename     TEXT
name           TEXT                  path         TEXT
created_at     TIMESTAMP             size         INT
updated_at     TIMESTAMP             mime_type    TEXT
                                     type         ENUM(IMPORT, EXPORT)
                                     created_at   TIMESTAMP

jobs                                 records
────────────────────────────         ──────────────────────────
id              UUID PK              id              UUID PK
user_id         UUID FK → users      job_id          UUID FK → jobs
type            ENUM(IMPORT,         row_index       INT
                EXPORT, DEDUP)       data            JSONB
status          ENUM(PENDING,        is_valid        BOOLEAN
                RUNNING,             error_message   TEXT
                DONE, FAILED)        is_duplicate    BOOLEAN
input_file_id   UUID FK NULL         created_at      TIMESTAMP
output_file_id  UUID FK NULL
total_rows      INT                  duplicates
processed_rows  INT                  ──────────────────────────
failed_rows     INT                  id               UUID PK
error_log       JSONB                record_id        UUID FK → records
filters         JSONB                duplicate_of_id  UUID FK → records
created_at      TIMESTAMP            rule_triggered   TEXT
updated_at      TIMESTAMP            score            FLOAT
started_at      TIMESTAMP NULL       created_at       TIMESTAMP
completed_at    TIMESTAMP NULL
```

---

## 🔌 Endpoints de la API

### Autenticación

```
POST   /api/v1/auth/register        Registrar nuevo usuario
POST   /api/v1/auth/login           Iniciar sesión y obtener token JWT
```

### Usuarios

```
GET    /api/v1/users/me             Ver perfil
PATCH  /api/v1/users/me             Actualizar perfil
```

### Archivos

```
POST   /api/v1/files/upload         Subir archivo CSV/Excel
GET    /api/v1/files                Listar archivos del usuario
GET    /api/v1/files/:id            Ver metadata del archivo
GET    /api/v1/files/:id/download   Descargar archivo
```

### Jobs

```
POST   /api/v1/jobs/import          Crear job de importación
POST   /api/v1/jobs/export          Crear job de exportación
POST   /api/v1/jobs/dedup           Crear job de deduplicación
GET    /api/v1/jobs                 Listar jobs (paginado)
GET    /api/v1/jobs/:id             Ver estado + progreso del job
GET    /api/v1/jobs/:id/results     Ver registros procesados (paginado)
```

### Ejemplo de respuesta — estado de job

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "IMPORT",
    "status": "RUNNING",
    "totalRows": 100000,
    "processedRows": 47300,
    "failedRows": 120,
    "errorLog": null,
    "createdAt": "2026-04-22T10:00:00Z",
    "startedAt": "2026-04-22T10:00:02Z"
  }
}
```

---

## 🔄 Flujos principales

### 📥 Flujo de importación

```
Usuario → POST /files/upload → archivo guardado en disco
                ↓
       POST /jobs/import { file_id }
                ↓
       Service crea Job (status = PENDING)
                ↓
       Job se envía a la cola Redis
                ↓
       Worker toma el job
                ↓
       Processor parsea CSV/Excel
                ↓
       Divide en chunks (1000 filas por chunk)
                ↓
       Por chunk: valida → guarda registros → actualiza progreso
                ↓
       Por fila: errores guardados, el job continúa
                ↓
       Job → status = DONE / FAILED
```

### 📤 Flujo de exportación

```
Usuario → POST /jobs/export { filters, format }
                ↓
       Service crea Job (status = PENDING)
                ↓
       Job se envía a la cola
                ↓
       Worker consulta la base de datos
                ↓
       Genera archivo en streaming (CSV o JSON)
                ↓
       Guarda archivo en almacenamiento
                ↓
       Job → output_file_id asignado → status = DONE
                ↓
       GET /files/:id/download → descarga del archivo
```

### 🔁 Flujo de deduplicación

```
Usuario → POST /jobs/dedup { source_job_id, rules }
                ↓
       Worker escanea registros del job origen
                ↓
       Aplica estrategias en orden:
          email   → coincidencia exacta por campo email
          phone   → coincidencia exacta normalizada
          fuzzy   → similitud Fuse.js ≥ 0.85
                ↓
       Marca duplicados → guarda en tabla duplicates
                ↓
       Job → status = DONE, processedRows = duplicados encontrados
```

---

## ⚙️ Ciclo de vida de un job

```
           ┌──────────┐
           │ PENDING  │   Job creado, esperando en la cola
           └────┬─────┘
                │ Worker lo toma
                ▼
           ┌──────────┐
           │ RUNNING  │   Procesamiento en curso
           └────┬─────┘
          ┌─────┴───────┐
          ▼             ▼
       ┌──────┐     ┌────────┐
       │ DONE │     │ FAILED │   Reintentado N veces con backoff exponencial
       └──────┘     └────────┘
```

Cada job registra: `total_rows` / `processed_rows` / `failed_rows` / `error_log`

---

## 🚀 Cómo ejecutar el proyecto

### Requisitos previos

- Node.js 20+
- PostgreSQL 16
- Redis 7
- Docker (opcional)

### Setup local

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/tu-usuario/dataforge
cd dataforge
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de DB y Redis

# 3. Ejecutar migraciones de base de datos
npm run prisma:migrate

# 4. Seed de datos demo (opcional)
npm run prisma:seed

# 5. Iniciar API y Worker en terminales separadas
npm run dev          # Terminal 1 — API en :3000
npm run worker       # Terminal 2 — Procesador de jobs
```

### Setup con Docker (recomendado)

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f api
docker-compose logs -f worker
```

---

## 📋 Scripts disponibles

```bash
npm run dev              # Inicia la API en modo desarrollo
npm run worker           # Inicia el Worker en modo desarrollo
npm run build            # Compila TypeScript a dist/
npm run start            # Ejecuta la API compilada
npm run prisma:generate  # Regenera el Prisma client
npm run prisma:migrate   # Ejecuta las migraciones
npm run prisma:studio    # Abre Prisma Studio (GUI de DB)
npm run prisma:seed      # Crea usuario demo en la DB
```

---

## 🧩 Principios de diseño

- **Separación de responsabilidades** — Controllers, Services y Repositories nunca mezclan responsabilidades
- **Procesamiento async primero** — Ninguna operación pesada corre de forma síncrona en la API
- **Procesamiento por chunks** — Los archivos nunca se cargan completos en memoria
- **Tolerancia a fallos por fila** — Una fila con error no aborta el job completo
- **Workers independientes** — Corren como proceso separado; la arquitectura permite múltiples instancias, aunque no fue validado con carga real
- **Estructura modular por dominio** — Cada funcionalidad es un módulo autocontenido
- **Jobs observables** — Cada job tiene logs estructurados y estado rastreable

---

## ⚠️ Decisiones de diseño clave

| Decisión                              | Razón                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| API y Worker como procesos separados  | Evita que el procesamiento pesado bloquee las respuestas de la API           |
| BullMQ + Redis para la cola           | Persistencia confiable de jobs, reintentos automáticos y visibilidad         |
| Procesamiento por chunks (1000 filas) | Controla el uso de memoria con archivos grandes                              |
| Manejo de errores por fila            | Los fallos parciales no pierden el lote completo                             |
| Zod para validar variables de entorno | Falla al inicio si hay mala configuración, no silenciosamente en producción  |
| ExcelJS en lugar de xlsx              | Mantenido activamente, sin vulnerabilidades conocidas de prototype pollution |

---

## 🔍 Decisiones reales y límites conocidos

**¿Por qué chunks de 1000 filas?**  
Es un valor configurable via `CHUNK_SIZE` en env. 1000 es un punto de partida para bulk inserts en PostgreSQL sin saturar el event loop. No tengo benchmarks propios que justifiquen ese número con carga real.

**¿Qué pasa cuando falla una fila?**  
El error se guarda en `records.error_message` y `jobs.error_log`, pero el job continúa. Decisión deliberada: un CSV de 50k filas con 3 filas malformadas no debería abortar todo el proceso.

**¿Por qué API y Worker en procesos distintos?**  
Un worker BullMQ bloqueante en el mismo proceso que Express degradaría el tiempo de respuesta. La separación permite reiniciar el worker sin afectar la API, y viceversa.

**¿Por qué se reemplazó `xlsx` por `ExcelJS`?**  
`xlsx` tenía una vulnerabilidad de prototype pollution (alta severidad). ExcelJS es más grande pero activamente mantenido y sin ese vector conocido.

**Límites que no fueron validados:**

- Volumen real: no hay benchmarks con archivos de cientos de miles de filas en este entorno
- Múltiples workers simultáneos no fueron probados bajo concurrencia
- La estrategia fuzzy (Fuse.js) puede ser lenta con datasets grandes — no se evaluó la complejidad O(n²)
- El driver S3 está previsto en el código de configuración pero no fue integrado ni probado

---

## 🧨 Anti-patrones evitados

- Lógica de negocio en controllers
- Procesamiento de archivos sin cola (todo síncrono)
- Cargar archivos completos en memoria
- Punto único de fallo (archivo = todo o nada)
- Acoplamiento directo entre la capa API y la capa de procesamiento

---

## 💡 Mejoras futuras

- Actualizaciones de jobs en tiempo real mediante WebSockets
- Escalado multi-nodo de workers con configuración de concurrencia separada
- Algoritmos de fuzzy matching avanzados (Levenshtein, fonético)
- Dashboard de análisis para datasets procesados
- Aislamiento multi-tenant completo
- Integración con S3 para almacenamiento en producción
- Documentación OpenAPI / Swagger

---

## 📊 Casos de uso

- Plataformas SaaS con importación masiva de datos
- Sistemas CRM con deduplicación de contactos
- Pipelines tipo ETL para limpieza de datos
- Dashboards de administración con operaciones bulk asíncronas
- Herramientas de calidad de datos

---

<div align="center">

**DataForge** — Construido con principios de ingeniería backend real, no solo CRUD.

</div>
