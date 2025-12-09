import { create } from 'zustand';
import { cardValidationsApi } from '../api/cardValidations';
import { driversApi } from '../api/drivers';
import { routesApi } from '../api/routes';
import { PendingValidation, CardValidationStatus, Driver, Route } from '../types';
import { getPendingValidations, getUnsyncedValidations, markValidationSynced } from '../database/validations.repo';

interface SyncStore {
  pendingValidations: PendingValidation[];
  isSyncing: boolean;
  lastSyncAt: string | null;
  addValidation: (
    v: Omit<PendingValidation, 'id' | 'synced'>,
  ) => void;
  loadPending: () => Promise<void>;
  syncAll: () => Promise<void>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function resolveDriver(validationDriverId: string, driversCache: Map<string, Driver>) {
  const cached = driversCache.get(validationDriverId);
  if (cached) return cached;

  try {
    const driver = await driversApi.getByUserId(validationDriverId);
    if (driver) {
      driversCache.set(validationDriverId, driver);
    }

    return driver;
  } catch {
    return null;
  }
}

function resolveRouteId(validation: PendingValidation, driver: Driver | null, routes: Route[]) {
  if (validation.routeId) return validation.routeId;
  const resolvedDriverId = driver?.id ?? validation.driverId;

  const driverRoutes = routes.filter((route) => (
    (
      String(route.driverId) === String(resolvedDriverId) ||
      String(route.driver?.id) === String(resolvedDriverId)
    )
  ));
  const activeRoute = driverRoutes.find((route) => route.active === 1) ?? driverRoutes[0];

  return activeRoute?.id ?? null;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  pendingValidations: [],
  isSyncing: false,
  lastSyncAt: null,

  addValidation: (v) => {
    const newValidation: PendingValidation = {
      ...v,
      id: generateId(),
      synced: false,
    };
    set((state) => ({
      pendingValidations: [...state.pendingValidations, newValidation],
    }));
  },

  loadPending: async () => {
    try {
      const rows = await getPendingValidations();
      set({ pendingValidations: rows });
    } catch {
      // ignore DB errors on load
    }
  },

  syncAll: async () => {
    const { isSyncing } = get();
    if (isSyncing) return;

    const unsynced = await getUnsyncedValidations();
    if (unsynced.length === 0) return;

    set({ isSyncing: true });

    try {
      const [routesResult] = await Promise.allSettled([routesApi.list()]);
      const routes = routesResult.status === 'fulfilled' ? routesResult.value : [];
      const driversCache = new Map<string, Driver>();

      await Promise.allSettled(
        unsynced.map(async (v) => {
          const driver = await resolveDriver(v.driverId, driversCache);
          const routeId = resolveRouteId(v, driver, routes);
          const driverId = driver?.id ? String(driver.id) : v.driverId;

          if (!routeId) {
            throw new Error('Nenhuma rota ativa encontrada para sincronizar a validação.');
          }

          await cardValidationsApi.create(v.studentId, {
            studentId: Number(v.studentId),
            driverId: Number(driverId),
            routeId: Number(routeId),
            latitude: v.latitude,
            longitude: v.longitude,
            status: v.status as CardValidationStatus,
            validationTime: v.timestamp,
          });
          await markValidationSynced(v.id);
          return v.id;
        }),
      );

      const rows = await getPendingValidations();

      set({
        pendingValidations: rows,
        lastSyncAt: new Date().toISOString(),
      });
    } finally {
      set({ isSyncing: false });
    }
  },
}));
