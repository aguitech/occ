# A4 · Estrategia de calidad

## Pirámide de tests

```
        ┌──────────────────┐
        │   E2E (manual)   │  ← Flujo completo (no automatizamos Detox/Maestro por tiempo)
        └──────────────────┘
       ┌────────────────────┐
       │ Integración (HTTP) │  ← Backend con fetch real (Node test runner)
       └────────────────────┘
      ┌──────────────────────┐
      │   Unit (Jest/Node)   │  ← Store, hook, servicio, schemas
      └──────────────────────┘
```

## Qué testeamos en cada capa

| Capa | Herramienta | Cobertura |
|---|---|---|
| **Schemas Zod** | Jest | Round-trip: parsear respuesta del backend, validar shape. |
| **Servicios (api/modules)** | Jest + axios mock | Envelope OK, errores normalizados. |
| **Store (Zustand)** | Jest + AsyncStorage mock | Set/clear/validate. |
| **Hooks (useJobsSearch)** | Jest + renderHook | Debounce, reset, paginación. |
| **Backend endpoints** | Node test runner + fetch real | Auth, validación, sort, conflictos (409). |

**Lo que NO testeamos** (por scope/tiempo):
- Componentes React Native puros (render con React Native Testing Library).
- E2E real con Detox/Maestro.
- Snapshot testing.

## Convenciones de commits

Adopto **Conventional Commits** porque permite generar changelogs automáticos y conectar a semantic-release:

```
feat: agregar búsqueda por rango salarial
fix: corregir caché de sesión al expirar token
docs: documentar estrategia de deep linking
refactor: extraer lógica de paginación al hook
test: cubrir casos de error 409
chore: actualizar dependencias
```

**Formato**:
```
<type>(scope): <descripción corta>

<cuerpo opcional con detalles>
```

**Scopes comunes**: `app`, `backend`, `docs`, `auth`, `jobs`, `notifications`, `infra`.

## Branching

**Git Flow simplificado** (adecuado para equipos de 3-8 personas):

```
main         ← siempre deployable
└── develop  ← integración diaria
   ├── feature/JIRA-123-search-by-salary
   ├── feature/JIRA-456-deep-linking
   └── bugfix/JIRA-789-token-expired
```

**Reglas**:
- `main` solo recibe merges desde `develop` o hotfixes.
- PRs van de `feature/*` o `bugfix/*` → `develop`.
- Tags semánticas (`v1.2.3`) marcan releases en `main`.
- `develop` se deploya a staging automáticamente.

**Conventional Commits + Git Flow + semantic-release** permite que cada merge a `main` produzca un changelog automáticamente y bumpee la versión.

## Checklist de PR

Antes de aprobar un PR, debe cumplir:

- [ ] **Descripción clara** del cambio y motivación.
- [ ] **Tests** que cubren el cambio (unitarios o integración).
- [ ] **Tipado estricto** sin `any` (TypeScript strict mode).
- [ ] **Sin secretos** ni credenciales en el diff.
- [ ] **Sin console.log** innecesarios (solo los de debug intencionales).
- [ ] **Lint pasa** (ESLint + Prettier en CI).
- [ ] **Documentación actualizada** si cambia API o comportamiento (`docs/`).
- [ ] **Aprobación de al menos 1 reviewer**.
- [ ] **CI pasa** (build, tests, type-check).
- [ ] **Changelog/CHANGELOG.md actualizado** si es cambio visible para el usuario.

## CI (referencia, no implementado)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd backend && npm ci && npm test
      - run: cd app && npm ci && npm run type-check && npm test
```
