export type Chore = {
  id: string;
  title: string;
  category: string;
  points: number;
  days: number[];
};
export type Reward = {
  title: string;
  mode: "points" | "completion";
  target: number;
};
export type Week = {
  chores: Chore[];
  completed: Record<string, boolean>;
  reward: Reward;
  earned?: Record<string, number>;
};
export type Data = {
  version: 1;
  milestones?: Milestone[];
  chores: Chore[];
  reward: Reward;
  weeks: Record<string, Week>;
};
export const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export function weekKey(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dateFor(key: string, day = 0) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d + day);
}
export function seed(): Data {
  return {
    version: 1,
    chores: [
      {
        id: "bed",
        title: "Make my bed",
        category: "My space",
        points: 5,
        days: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        id: "teeth",
        title: "Brush my teeth",
        category: "Self care",
        points: 5,
        days: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        id: "toys",
        title: "Put away my toys",
        category: "My space",
        points: 10,
        days: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        id: "table",
        title: "Help set the table",
        category: "Helping out",
        points: 10,
        days: [0, 2, 4, 6],
      },
      {
        id: "plants",
        title: "Water the plants",
        category: "Helping out",
        points: 10,
        days: [1, 5],
      },
    ],
    reward: {
      title: "A trip to the ice cream shop",
      mode: "points",
      target: 150,
    },
    weeks: {},
  };
}
export function ensureWeek(data: Data, key: string): Data {
  return data.weeks[key]
    ? data
    : {
        ...data,
        weeks: {
          ...data.weeks,
          [key]: {
            chores: structuredClone(data.chores),
            completed: {},
            reward: { ...data.reward },
          },
        },
      };
}
export function stats(week: Week, day?: number) {
  let total = 0,
    done = 0,
    points = 0;
  const captured = captureWeek(week);
  for (const c of week.chores)
    for (const d of c.days)
      if (day === undefined || day === d) {
        total++;
        if (week.completed[`${c.id}:${d}`]) {
          done++;
          points += captured.earned?.[`${c.id}:${d}`] ?? c.points;
        }
      }
  return {
    total,
    done,
    points,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}
export function updateSettings(
  data: Data,
  key: string,
  chores: Chore[],
  reward: Reward,
): Data {
  const next = ensureWeek(data, key);
  return {
    ...next,
    chores,
    reward,
    weeks: {
      ...next.weeks,
      [key]: {
        ...next.weeks[key],
        ...captureWeek(next.weeks[key]),
        chores: structuredClone(chores),
        reward: { ...reward },
      },
    },
  };
}

export type Milestone = { id: string; title: string; target: number };
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
/** Capture legacy awards before changing a routine; retain awards for deleted missions. */
export function captureWeek(week: Week): Week {
  const earned = { ...week.earned };
  for (const chore of week.chores)
    for (const day of chore.days) {
      const key = `${chore.id}:${day}`;
      if (week.completed[key] && earned[key] === undefined)
        earned[key] = chore.points;
    }
  return { ...week, earned };
}
export function earningEntries(key: string, week: Week) {
  const captured = captureWeek(week);
  return Object.entries(captured.earned || {})
    .filter(([id]) => !!week.completed[id])
    .flatMap(([id, points]) => {
      const day = Number(id.slice(id.lastIndexOf(":") + 1));
      return Number.isInteger(day) && day >= 0 && day < 7
        ? [{ id: `${key}:${id}`, date: dayKey(dateFor(key, day)), points }]
        : [];
    });
}
export function pointsInRange(data: Data, from?: string, to?: string): number {
  if (from && to && from > to) return 0;
  return Object.entries(data.weeks)
    .flatMap(([key, week]) => earningEntries(key, week))
    .filter((e) => (!from || e.date >= from) && (!to || e.date <= to))
    .reduce((sum, e) => sum + e.points, 0);
}
export function setCompletion(
  data: Data,
  key: string,
  id: string,
  day: number,
): Data {
  const next = ensureWeek(data, key),
    week = captureWeek(next.weeks[key]);
  const chore = week.chores.find((c) => c.id === id && c.days.includes(day));
  if (!chore) return data;
  const entry = `${id}:${day}`,
    checked = !week.completed[entry];
  return {
    ...next,
    weeks: {
      ...next.weeks,
      [key]: {
        ...week,
        completed: { ...week.completed, [entry]: checked },
        earned: {
          ...week.earned,
          ...(checked ? { [entry]: chore.points } : {}),
        },
      },
    },
  };
}
export const ranks = [
  { title: "Squire", points: 0 },
  { title: "Apprentice knight", points: 100 },
  { title: "Knight", points: 300 },
  { title: "Guardian", points: 750 },
  { title: "Champion", points: 1500 },
];
export function rankFor(points: number) {
  return [...ranks].reverse().find((r) => points >= r.points) || ranks[0];
}
