# A5 · Performance

## Métricas a monitorear en producción

### Mobile (app)

| Métrica | Herramienta | Umbral aceptable |
|---|---|---|
| **FPS en scroll** | FlashList perf monitor / React DevTools Profiler | ≥55 fps en scroll medio |
| **TTI (Time to Interactive)** | `expo-startup-time` o Sentry | <2s en cold start |
| **Frame drops** | `react-native-performance` | <1% frames >16ms |
| **Network requests** | Sentry breadcrumbs, OpenTelemetry | p95 <500ms |
| **JS bundle size** | EAS Build report | <10MB (Android), <25MB (iOS) |
| **Memory** | Xcode/Android Studio Profiler | <150MB steady state |

### Backend

| Métrica | Herramienta | Umbral |
|---|---|---|
| **Latencia p50/p95** | Prometheus + Grafana | p50 <50ms, p95 <200ms |
| **Throughput** | Prometheus | >500 req/s por instancia |
| **Error rate 4xx/5xx** | Sentry / Datadog | <1% |
| **JWT expirations** | Custom metric | ~100% expiran dentro de 1h |
| **Job apply conflicts (409)** | Counter | Esperable; rate no debe crecer |

## Optimizaciones concretas para la lista de vacantes

### 1. `estimatedItemSize` correcto

FlashList usa esta estimación para calcular el tamaño de los items no renderizados. Si es muy bajo, hay reflows; si es muy alto, se renderizan de más.

```tsx
<FlashList
  estimatedItemSize={120}  // ≈ altura medida de JobCard
/>
```

Si la altura varía (ej. títulos de 2 líneas vs 1), considerar `getItemType` o un componente con altura fija.

### 2. `memo` en `JobCard`

```tsx
export default memo(JobCard);
```

FlashList ya hace memo internamente, pero esto garantiza que un re-render del padre (cambio de filtro) no re-renderice los items visibles si sus props no cambiaron.

### 3. Key extractors estables

```tsx
keyExtractor={(item) => item.id}
```

Nunca uses el índice: invalida el caché de items al reordenar.

### 4. `removeClippedSubviews` y `windowSize`

Por defecto, FlashList ya optimiza esto. En RN nativo, esos props a veces empeoran la performance. Confiar en FlashList.

### 5. Skeleton en lugar de spinner

```tsx
ListEmptyComponent={loading ? <SkeletonList /> : <EmptyState />}
```

Percepción: 300ms con skeleton se siente más rápido que 300ms con spinner.

## Gestión de prefetch sin impactar el render inicial

El render inicial de `JobSearchScreen` muestra el skeleton y dispara `useJobsSearch` con `page=1`. **No dispara prefetch hasta que el usuario interactúa** (scroll).

Cuando el usuario hace scroll y faltan `PREFETCH_THRESHOLD=3` items para el final:

```ts
onEndReached = makeOnEndReached(loadMore, hasNext, jobs.length);

// dentro de makeOnEndReached:
if (distanceFromEnd <= PREFETCH_THRESHOLD) loadMore();
```

Esto significa que cuando el usuario está leyendo los items 18-20 de la página 1, **ya se está pidiendo la página 2 en background**. Cuando llegue al item 20 y la lista lo necesite, ya está en memoria.

**Garantía de no parpadeo**:
- `setLoadingMore(true)` no se renderiza como spinner encima; solo se usa internamente para evitar dobles cargas.
- El UI thread no se bloquea: `axios` resuelve en JS thread pero no afecta el render.
- Si la página 2 falla, `hasNext` queda en `false` y el swipe se detiene (cubierto en `JobDetailScreen` cuando se navega al final).

**Si la lista fuera infinita** (10k+ items) o tuviera scroll extremo, recomendaría:
- `windowSize` bajo (3-5).
- Paginación por cursor en lugar de offset.
- Virtualización adicional con `FlashList MasonryFlashList` si los items tienen alturas variables.

## Monitoreo en código

Para activar `expo-performance` (recomendado):

```ts
import { PerformanceObserver } from 'react-native-performance';

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Enviar a Sentry/Datadog
    Sentry.metrics.distribution('flashlist.render', entry.duration);
  }
});
observer.observe({ entryTypes: ['measure', 'navigation'] });
```

Esto queda como mejora futura; el spec no pidió integración con SaaS de métricas.
