import { Route, RoutePeriod, RouteStop, Stop } from '../types';

export const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

export function periodLabel(period?: RoutePeriod) {
  return period === 'MORNING' ? 'Manha' : period === 'AFTERNOON' ? 'Tarde' : period === 'NIGHT' ? 'Noite' : 'Periodo';
}

export function periodColor(period?: RoutePeriod) {
  return period === 'MORNING' ? 'info' : period === 'AFTERNOON' ? 'warning' : period === 'NIGHT' ? 'coolGray' : 'muted';
}

export function normalizeTime(value?: string | null) {
  if (!value) return '--:--';
  const [hour = '00', minute = '00'] = value.split(':');
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

export function addMinutesToTime(value?: string | null, minutes = 0) {
  if (!value) return '--:--';

  const [hourValue, minuteValue] = normalizeTime(value).split(':').map(Number);
  if (!Number.isFinite(hourValue) || !Number.isFinite(minuteValue)) return normalizeTime(value);

  const totalMinutes = (hourValue * 60 + minuteValue + minutes) % (24 * 60);
  const normalized = totalMinutes < 0 ? totalMinutes + 24 * 60 : totalMinutes;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function getStopOffsetMinutes(stop: Stop | RouteStop) {
  const offset = Number((stop as RouteStop).estimatedArrival ?? 0);
  return Number.isFinite(offset) ? offset : 0;
}

export function getStopOrder(stop: Stop | RouteStop, fallbackIndex: number) {
  const order = Number((stop as RouteStop).stopOrder ?? fallbackIndex + 1);
  return Number.isFinite(order) ? order : fallbackIndex + 1;
}

export function getStopPassTime(route: Route | null | undefined, stop: Stop | RouteStop, fallbackTime?: string) {
  return addMinutesToTime(route?.startTime ?? fallbackTime, getStopOffsetMinutes(stop));
}

export function formatRouteWindow(route?: Route | null) {
  if (!route) return '--:--';
  const start = normalizeTime(route.startTime);
  const end = route.endTime ? normalizeTime(route.endTime) : null;
  return end ? `${start} - ${end}` : start;
}
