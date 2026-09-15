# A2 · Estrategia de estado y datos

## Sesión de usuario (JWT)

**Tool**: Zustand con middleware `persist` en AsyncStorage.

```
src/store/session.ts
```

```ts
type SessionState = {
  token: string | null;
  user: { id, email, name } | null;
  hydrated: boolean;
  setSession, clearSession, setUser, setHydrated,
  validateToken, logout
}
```

**Flujo**:
1. Login → `authService.login(email, password)` → recibe `{ token, user }`.
2. `setSession(token, user)` guarda en memoria + AsyncStorage (`occ-session`).
3. Al arrancar la app, Zustand rehidrata. `hydrated=true` indica que ya se leyó del storage.
4. `_layout.tsx` llama `validateToken()` → `GET /auth/me`. Si 401, limpia sesión.
5. Si el token expira durante uso, el interceptor de axios dispara `onUnauthorized` → limpia sesión → router redirige a login.

## Caché de vacantes (invalidación selectiva)

**No usamos caché global explícita**. El hook `useJobsSearch` mantiene estado local en memoria (`useState`) y descarta en cada cambio de query. Las razones:

1. **Simplicidad**: cada lista es efímera; al cambiar filtros, se reemplaza.
2. **Prefetch transparente**: el hook ya pide la página siguiente cuando el usuario está cerca del final (`PREFETCH_THRESHOLD=3`), sin tener que gestionar un caché de página 2/3/etc.

Cuando se invalida el detalle (`GET /jobs/:id`) tras aplicar o favoritear, **se confía en la siguiente visita** (no se invalida cache local porque no existe).

**Si la app creciera**, recomendaría TanStack Query (React Query):
- Caché por clave (`['jobs', query]`, `['job', id]`).
- Invalidación declarativa (`queryClient.invalidateQueries({ queryKey: ['jobs'] })`).
- Retry, prefetch y background refetch automáticos.
- Menos código en el hook.

## Estado optimista (Apply / Favorito)

Hoy la UI **no** implementa optimistic updates: muestra loading en el botón y actualiza el estado solo después del POST/DELETE. Esto es deliberado por dos razones:

1. **Los errores son probables** (409 ALREADY_APPLIED, 404 NOT_FOUND) y revertir la UI en esos casos puede confundir.
2. **El feedback visual del loading** es suficiente para el usuario.

**Si quisiéramos estado optimista**, el patrón sería:

```ts
const toggleFav = useMutation({
  mutationFn: actionsService.favorite,
  onMutate: async (jobId) => {
    await queryClient.cancelQueries({ queryKey: ['job', jobId] });
    const previous = queryClient.getQueryData(['job', jobId]);
    queryClient.setQueryData(['job', jobId], (old) => ({ ...old, favorited: true }));
    return { previous };
  },
  onError: (_err, _jobId, context) => {
    queryClient.setQueryData(['job', jobId], context.previous);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['job', jobId] }),
});
```

## Prefetch de jobs adyacentes para el swipe

**Estrategia**: cuando el usuario abre el detalle de un job, el componente carga **el job adyacente anterior y el siguiente** (job_N-1 y job_N+1) en paralelo. Esto habilita el swipe sin esperar la red.

```
al abrir job_N:
  Promise.all([
    jobsService.getById(job_N-1),  // si existe
    jobsService.getById(job_N+1),
  ])
```

Esto significa que cuando swipes del job_N al N+1, el detalle ya está en memoria (instantáneo).

**Para carga incremental** (cuando swipes al final de la página y necesitas la página siguiente), el hook `useJobsSearch` ya hace prefetch transparente. En `app/(tabs)/index.tsx`, la `FlashList.onEndReached` dispara `loadMore()` cuando faltan 3 items para el final (`PREFETCH_THRESHOLD`).

**Limitación actual**: el swipe navega entre jobs consecutivos (`job_N ± 1`). Si el usuario swipes muchas veces y llega al final de la página actual, el componente `JobDetailScreen` no carga más páginas. **Próxima mejora**: integrar el `useJobsSearch` en el detalle para tener `hasNext` y `loadMore` disponibles.

## Cuándo NO usar estas herramientas

- **Zustand para UI local** (formularios, modales): usar `useState` o `useReducer` local. Zustand es para estado **compartido entre rutas** o **persistido**.
- **AsyncStorage para datos grandes** (listas de >100 items): usar SQLite (expo-sqlite) o MMKV.
- **Zod en runtime** en hot paths: validar una vez al borde de la app (entrada de API), no en cada render.
