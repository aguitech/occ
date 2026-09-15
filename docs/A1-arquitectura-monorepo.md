# A1 · Arquitectura del monorepo

## Estructura raíz

```
occ-lead-ejercicio/
├── app/                    ← Proyecto Expo (React Native 0.81)
│   ├── app.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── app/            ← Rutas (Expo Router file-based)
│       │   ├── _layout.tsx
│       │   ├── index.tsx
│       │   ├── (auth)/login.tsx
│       │   ├── (tabs)/{index,activity}.tsx
│       │   └── job/[id].tsx
│       ├── components/     ← UI reusables (JobCard)
│       ├── constants/      ← config.ts (API_BASE_URL)
│       ├── features/
│       │   └── notifications/service.ts
│       ├── hooks/          ← useJobsSearch
│       ├── services/       ← api.ts, modules.ts, init.ts
│       ├── store/          ← session.ts (Zustand)
│       ├── types/          ← api.ts (Zod schemas)
│       └── __tests__/
├── backend/                ← Node.js + Express
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── config.js
│       ├── data/store.js   ← in-memory store
│       ├── middleware/auth.js
│       ├── routes/{auth,jobs,actions}.js
│       ├── seed/jobs.js    ← 90 vacantes deterministas
│       ├── utils/envelope.js
│       └── __tests__/api.test.js
├── docs/                   ← Esta carpeta
└── README.md
```

## Justificación del patrón

### App: feature-first con módulos compartidos

```
src/
├── app/           ← Rutas (Expo Router file-based)
├── components/    ← UI compartida entre features
├── features/      ← Servicios específicos (notifications)
├── hooks/         ← Lógica reutilizable de UI
├── services/      ← Capa de red (centralizada)
├── store/         ← Estado global (Zustand)
├── types/         ← Schemas Zod compartidos
└── constants/     ← Configuración
```

**Criterio de encapsulación**:
- **Compartido** en `services/`, `types/`, `store/`, `components/`, `hooks/`, `constants/`: aquello que se reutiliza entre features y rutas.
- **Encapsulado por feature** en `features/<feature>/`: cuando un módulo tiene un dominio propio (notifications, payments, etc.) y no se reutiliza.
- **Las rutas** viven en `app/` siguiendo convención de Expo Router; cada ruta importa lo que necesita de los features/hooks/services.

### Backend: capas por responsabilidad

```
src/
├── server.js          ← Bootstrap + routing
├── config.js          ← Configuración
├── middleware/        ← Auth transversal
├── routes/            ← Endpoints REST
├── data/              ← Store in-memory
├── seed/              ← Datos iniciales
├── utils/             ← Helpers (envelope, errores)
└── __tests__/         ← Tests con Node test runner
```

**Criterio de compartido vs encapsulado**:
- `utils/` y `middleware/` son compartidos (transversal).
- `routes/` agrupa por dominio (auth, jobs, actions). Las acciones (apply/favorite) están en `actions.js` pero se montan bajo `/jobs/:id/apply` y `/jobs/:id/favorite` para mantener URLs RESTful.
- `data/store.js` es único: cualquier estado vive ahí.

## Decisión clave

> **Monorepo plano** (no npm workspaces, no yarn, no pnpm) por simplicidad. Ambos proyectos son `npm install` independientes. Esto evita resolver conflictos de versiones React/RN entre proyectos y mantiene el setup de CI mínimo.

Si el equipo crece, migrar a **pnpm workspaces** o **Turborepo** aporta:
- Cache de builds (`turbo run build` solo recompila lo que cambió).
- Compartir tipos TypeScript entre backend y app vía `packages/shared`.
- Pipelines paralelas por proyecto.

Hoy no es necesario; mantener la barrera simple hasta tener evidencia de fricción.
