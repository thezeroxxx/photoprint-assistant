/** Russian formatting helpers: dates and plurals are always generated, never hardcoded. */

const plural = new Intl.PluralRules("ru-RU");

/** plural(5, ["обязательство", "обязательства", "обязательств"]) → "5 обязательств" */
export function pluralize(n: number, [one, few, many]: [string, string, string], withNumber = true): string {
  const form = plural.select(n);
  const word = form === "one" ? one : form === "few" ? few : many;
  return withNumber ? `${n} ${word}` : word;
}

const fullDate = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const shortDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });
const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatToday = (d = new Date()) => capitalize(fullDate.format(d));
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

/** "Сегодня, 14:30" / "Вчера, 09:10" / "3 нояб." */
export function formatRelative(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (days === 0) return `Сегодня, ${time.format(d)}`;
  if (days === 1) return `Вчера, ${time.format(d)}`;
  return shortDate.format(d);
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "Доброе утро!";
  if (h >= 12 && h < 18) return "Добрый день!";
  return "Добрый вечер!";
}

export const formatCost = (usd: number | null) =>
  usd === null ? "—" : usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(3)}`;

export const formatSeconds = (ms: number | null) =>
  ms === null ? "—" : `${(ms / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} с`;

const dayMonth = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "long" });

/** "пт, 13 ноября" from "2026-11-13". */
export const formatDay = (isoDay: string) => dayMonth.format(new Date(`${isoDay}T00:00`));

/** "пт, 13 ноября, 09:00" from "2026-11-13T09:00" (local time). */
export const formatReminder = (local: string) => `${dayMonth.format(new Date(local))}, ${local.slice(11, 16)}`;
