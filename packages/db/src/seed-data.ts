/**
 * Deterministic seed data (KAN-96). Pure module — no DB access — so it can be
 * unit-tested without a database.
 */

export interface CategorySeed {
  slug: string;
  nameEn: string;
  nameHi: string | null;
  icon: string;
}

/** Interest categories, English + Hindi (F4.3). */
export const CATEGORIES: CategorySeed[] = [
  { slug: "food", nameEn: "Food & Dining", nameHi: "भोजन", icon: "utensils" },
  { slug: "travel", nameEn: "Travel", nameHi: "यात्रा", icon: "plane" },
  { slug: "music", nameEn: "Music", nameHi: "संगीत", icon: "music" },
  { slug: "sports", nameEn: "Sports", nameHi: "खेल", icon: "trophy" },
  { slug: "art", nameEn: "Art & Culture", nameHi: "कला", icon: "palette" },
  { slug: "gaming", nameEn: "Gaming", nameHi: "गेमिंग", icon: "gamepad" },
  { slug: "wellness", nameEn: "Wellness", nameHi: "स्वास्थ्य", icon: "heart" },
  { slug: "tech", nameEn: "Tech", nameHi: "तकनीक", icon: "cpu" },
  { slug: "outdoors", nameEn: "Outdoors", nameHi: "प्रकृति", icon: "mountain" },
  { slug: "nightlife", nameEn: "Nightlife", nameHi: "रात्रिजीवन", icon: "moon" },
];

const FIRST_NAMES = [
  "Aarav", "Ananya", "Arjun", "Diya", "Ishaan", "Kavya", "Krishna", "Meera",
  "Neha", "Priya", "Rahul", "Riya", "Rohan", "Sanya", "Vikram", "Zara",
  "Aditi", "Dev", "Farhan", "Gauri", "Harsh", "Ira", "Jai", "Kiran",
  "Lakshmi", "Manav", "Naina", "Omar", "Pooja", "Qadir", "Reva", "Sameer",
  "Tara", "Uday", "Vidya", "Yash", "Aisha", "Bunty", "Chirag", "Esha",
  "Faisal", "Geeta", "Hina", "Imran", "Juhi", "Kunal", "Lata", "Mohan",
  "Nisha", "Oscar",
];

export interface UserSeed {
  handle: string;
  displayName: string;
  email: string;
  locale: "en" | "hi";
  isCreator: boolean;
}

/** Deterministic pseudo-random generator (mulberry32) so seeds are stable. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate n demo users (50 per F4.3). */
export function demoUsers(count: number): UserSeed[] {
  const rand = rng(42);
  const seen = new Set<string>();
  const users: UserSeed[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length]!;
    let handle = `${first.toLowerCase()}${100 + Math.floor(rand() * 900)}`;
    while (seen.has(handle)) handle = `${first.toLowerCase()}${Math.floor(rand() * 10000)}`;
    seen.add(handle);
    users.push({
      handle,
      displayName: first,
      email: `${handle}@example.com`,
      locale: rand() < 0.3 ? "hi" : "en",
      isCreator: rand() < 0.2,
    });
  }
  return users;
}

export const MOMENT_TYPES = ["hangout", "event", "trip", "celebration", "activity"] as const;
export const MOMENT_STATUSES = [
  "draft",
  "scheduled",
  "live",
  "paused",
  "ended",
  "cancelled",
] as const;
export const MOMENT_PRIVACIES = ["public", "invite_only", "private"] as const;

export const DEMO_USER_COUNT = 50;
export const DEMO_MOMENT_COUNT = 30;

/** Placeholder photo CDN URLs for seeded media (F4.3: moments with photos). */
export function photoUrl(id: number): string {
  return `https://cdn.moments.example.com/seed/photos/${String(id).padStart(4, "0")}.jpg`;
}
