# OCC · Redarbor México

> Ejercicio técnico · Developer Lead Sr. React Native

Monorepo con un **backend Node.js + Express** que sirve una API REST de vacantes, y una **app móvil Expo (React Native 0.81)** que la consume.

## 🚀 Setup rápido

### Prerrequisitos

- Node.js 18+ (probado con 20.x)
- Para la app móvil: Expo CLI, simulador iOS/Android o Expo Go en dispositivo físico

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm start
# → http://localhost:3000
```

**Credenciales de prueba**: `test@occ.com.mx` / `Test1234`

### 2. App

```bash
cd app
cp .env.example .env
# Editar .env: API_BASE_URL=http://localhost:3000 (o tu IP local si pruebas en dispositivo físico)
npm install
npm start
# Escanea el QR con Expo Go (iOS/Android) o presiona 'i' / 'a' para simulador
```

> ⚠️ Si pruebas en un dispositivo físico, cambia `API_BASE_URL` en `app/.env` por la IP local de tu Mac (ej. `http://192.168.1.50:3000`).

## 🧱 Estructura

```
occ-lead-ejercicio/
├── app/                    ← Proyecto Expo (React Native)
├── backend/                ← Servidor Node.js + Express
├── docs/                   ← Decisiones arquitectónicas (A1-A5)
└── README.md
```

## ✅ Stack

### App
| Paquete | Categoría |
|---|---|
| Expo 54 + React Native 0.81 + TypeScript strict | Core |
| Expo Router 6 | Navegación file-based |
| Zustand 4.5 (+ persist) | Estado global y sesión |
| @shopify/flash-list 2.2 | Listas performantes |
| react-native-reanimated 4.1 | Animaciones (UI thread) |
| @gorhom/bottom-sheet 5 | Bottom sheet del detalle |
| react-native-gesture-handler 2.28 | Swipe entre vacantes |
| zod 3.24 | Validación + tipos |
| @notifee/react-native 9 | Notificaciones locales |
| axios | HTTP con interceptor de JWT |

### Backend
| Paquete | Categoría |
|---|---|
| Express 4 | HTTP |
| jsonwebtoken 9 | Auth (JWT 1h) |
| zod 3 | Validación de request |
| cors | CORS |

## 📡 Endpoints del backend

| Método | Path | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/login` | No | Login → JWT 1h |
| POST | `/auth/logout` | Sí | Invalida el token |
| GET | `/auth/me` | Sí | Valida JWT |
| GET | `/jobs` | No | Lista paginada (q, city, salary_min, salary_max, sort, page, limit) |
| GET | `/jobs/:id` | No | Detalle |
| POST | `/jobs/:id/apply` | Sí | Aplica (409 si ya aplicó) |
| DELETE | `/jobs/:id/apply` | Sí | Cancela aplicación (404 si no existe) |
| GET | `/applications` | Sí | Lista aplicaciones del usuario |
| POST | `/jobs/:id/favorite` | Sí | Agrega favorito (409 si ya) |
| DELETE | `/jobs/:id/favorite` | Sí | Quita favorito |
| GET | `/favorites` | Sí | Lista favoritos |

**Envelope**: `{ ok: true, data: {...} }` o `{ ok: false, error: { code, message } }`.

**Códigos de error**:
- `AUTH_REQUIRED` (401) · `INVALID_CREDENTIALS` (401) · `TOKEN_EXPIRED` (401)
- `NOT_FOUND` (404) · `ALREADY_APPLIED` (409) · `ALREADY_FAVORITED` (409) · `VALIDATION_ERROR` (422)

## 🖥️ Pantallas

1. **JobSearch** — FlashList con búsqueda (debounce 300ms), filtros inline (ciudad, salario), sort (5 opciones), paginación incremental, prefetch transparente.
2. **JobDetail** — BottomSheetModal (snap 60%/100%) con swipe horizontal entre vacantes (Reanimated + Gesture Handler, UI thread a 60fps). Acciones Aplicar/Favorito con feedback optimista.
3. **Login** — Form con validación, Zustand persist + AsyncStorage, validación del token al hidratar.
4. **Mis actividades** — Tabs Aplicaciones/Favoritos con cancelación inmediata.
5. **Notificaciones** — Notifee con canal Android importancia HIGH; tap → deep link `occ://vacante/:id`.

## 🧪 Tests

```bash
# Backend (Node test runner)
cd backend && npm test

# App (Jest)
cd app && npm test
```

Cubren: endpoints REST, schema Zod, store Zustand, hook useJobsSearch, servicio API.

## 📚 Documentación arquitectónica

- [A1 · Arquitectura del monorepo](./docs/A1-arquitectura-monorepo.md)
- [A2 · Estrategia de estado y datos](./docs/A2-estado-datos.md)
- [A3 · Navegación y Deep Linking](./docs/A3-navegacion-deep-linking.md)
- [A4 · Estrategia de calidad](./docs/A4-estrategia-calidad.md)
- [A5 · Performance](./docs/A5-performance.md)

## 🔧 Decisiones técnicas destacadas

1. **Sin base de datos** — store en memoria por simplicidad del spec (90 vacantes generadas al arrancar desde seed determinista).
2. **Validación con Zod en dos lados** — backend valida request, app valida respuesta (defensa en profundidad).
3. **Axios con interceptor** — JWT inyectado automáticamente; 401 dispara `clearSession()` y redirige a login.
4. **FlashList en lugar de FlatList** — mejor rendimiento con 90+ items y recicla views agresivamente.
5. **BottomSheetModal como modal route** — coexiste con la lista subyacente; cerrar el sheet no resetea el scroll.
6. **Swipe con prefetch** — al abrir un detalle, se cargan en paralelo `job_N-1` y `job_N+1` para swipe instantáneo.
7. **TypeScript strict sin `any`** — los tipos de API derivan de Zod con `z.infer<>`.
8. **Deep link con scheme `occ://`** — las notificaciones abren directamente el detalle.

## 🐛 Limitaciones conocidas

- El swipe entre jobs es secuencial (job_N ± 1). Si el usuario swipe muchas veces, no se cargan páginas adicionales dinámicamente (mejora futura: integrar `useJobsSearch` en el detalle).
- El estado de aplicar/favorito en el BottomSheet no se refleja en la lista al volver (la próxima vez que abras la lista se actualiza al hacer fetch).
- El backend guarda token blacklist en memoria; se pierde al reiniciar.
- Las notificaciones son **locales** (no push real con FCM/APNs); esto cumple el spec ("notificación local que simule el mensaje").

## 📝 Variables de entorno

### `backend/.env`
- `PORT` — puerto del servidor (default 3000)
- `JWT_SECRET` — secreto para firmar JWT (cambiar en producción)
- `CORS_ORIGIN` — origen permitido (default `*`)

### `app/.env`
- `API_BASE_URL` — URL del backend (ej. `http://localhost:3000`)

## 📄 Licencia

Privado · OCC · Redarbor México · 2026
