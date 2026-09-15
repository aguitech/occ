# A3 · Navegación y Deep Linking

## Estructura de rutas (Expo Router)

```
src/app/
├── _layout.tsx              ← Stack raíz (GestureHandlerRootView)
├── index.tsx                ← Redirect según sesión
├── (auth)/
│   ├── _layout.tsx          ← Stack auth (solo si NO hay token)
│   └── login.tsx
├── (tabs)/
│   ├── _layout.tsx          ← Stack tabs (solo si HAY token)
│   ├── index.tsx            ← Búsqueda (JobSearchScreen)
│   └── activity.tsx         ← Mis actividades (ActivityScreen)
└── job/[id].tsx             ← Detalle (presentación modal)
```

## Grupos y rutas protegidas

Los **grupos** (paréntesis) organizan rutas sin afectar la URL:
- `(auth)/*` → rutas públicas; se ocultan si hay sesión activa.
- `(tabs)/*` → rutas privadas; redirigen a login si no hay token.

**Implementación**:
```tsx
// (auth)/_layout.tsx
if (hydrated && token) return null; // oculta login si ya hay sesión

// (tabs)/_layout.tsx
if (hydrated && !token) return <Redirect href="/(auth)/login" />;
```

`hydrated` es la flag del store Zustand que indica que ya se leyó del AsyncStorage. Mientras no esté en `true`, mostramos `ActivityIndicator` para evitar un redirect prematuro.

## Diagrama

```mermaid
flowchart TD
  Start([App arranca]) --> Hydrate{Zustand<br/>hydrated?}
  Hydrate -->|No| Loader[ActivityIndicator]
  Loader --> Hydrate
  Hydrate -->|Sí| HasToken{token?}
  HasToken -->|No| Login[/login]
  HasToken -->|Sí| Tabs[/tabs]
  Login -->|onLogin OK| Tabs
  Tabs --> Search[index]
  Tabs --> Activity[activity]
  Search -->|onPressJob| Detail[/job/id]
  Detail -->|swipe| Detail
  Detail -->|close| Search
```

## Deep Linking desde notificaciones

**Scheme**: `occ://` (definido en `app.json`).

**Tap en notificación**:
- `features/notifications/service.ts` registra `notifee.onForegroundEvent` y lee `detail.notification.data.jobId`.
- Llama `Linking.openURL(\`occ://vacante/${jobId}\`)`.
- Expo Router matchea `occ://vacante/:id` con la ruta `job/[id].tsx`.
- Esa ruta abre el `BottomSheet` modal automáticamente.

**Tres estados del tap**:

| Estado | Comportamiento |
|---|---|
| **Foreground** | `onForegroundEvent` recibe el PRESS → abre deep link. |
| **Background** | Notifee emite el evento en background; al volver al foreground, el handler dispara el deep link. |
| **Quit (app cerrada)** | El tap "abre" la app desde cero. Expo Router maneja el `Linking` inicial; `_layout.tsx` valida la sesión antes de navegar (espera `validateToken()` para no abrir detail si no hay auth). |

**Flujo quit-state**:
1. Usuario toca la notificación con la app cerrada.
2. Android lanza la app con el intent `occ://vacante/job_005`.
3. `app/_layout.tsx` ejecuta `initApi()` + `validateToken()`.
4. Si token válido → navega a `/(tabs)` y luego Expo Router resuelve el deep link a `job/[id]`.
5. Si token inválido → limpia sesión, redirige a `/(auth)/login`, y al volver a hidratar se puede navegar al detalle (si el usuario re-login).

## Coexistencia BottomSheetModal + Expo Router

`job/[id].tsx` usa `presentation: 'modal'` en el Stack de Expo Router:

```tsx
<Stack.Screen name="job/[id]" options={{ presentation: 'modal' }} />
```

Esto significa que la pantalla `job/[id]` se monta **encima** de la pantalla anterior (`(tabs)/index`), como un modal nativo. El `BottomSheet` interno es solo UI (gestionado por Gorhom), no es un route. Esto permite:

- Cerrar el sheet (`onClose` → `router.back()`) sin perder el scroll de la lista subyacente.
- Swipe horizontal dentro del sheet → solo afecta el sheet, no la lista de fondo.
- Cuando el sheet está abierto, la lista de búsqueda sigue accesible para hacer prefetch.

## Sincronización del índice de swipe con la lista al cerrar

Hoy el detalle es independiente de la lista (no conoce su índice). Al cerrar, el sheet simplemente se cierra con `router.back()` y la lista queda como estaba. Si quisiéramos sincronizar el índice activo (highlight en la lista):

```ts
// En job/[id].tsx, al cerrar:
const onClose = () => {
  router.back();
  router.setParams({ activeJobId: job?.id }); // hypothetical
};
```

Esto requeriría que la lista leyera el parámetro `activeJobId` de la URL y resaltara ese item. **No se implementó** por simplicidad y porque el spec no lo exigía explícitamente.

## URL scheme para testing manual

```bash
# Android
adb shell am start -W -a android.intent.action.VIEW -d "occ://vacante/job_005"

# iOS
xcrun simctl openurl booted "occ://vacante/job_005"
```
