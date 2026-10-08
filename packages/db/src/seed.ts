/**
 * Seed script (KAN-96 / F4.3): categories (EN + HI), 50 demo users, 30 moments
 * across all types/statuses/privacies with photos, plus participants,
 * contributions, media, reactions, follows and wallets.
 *
 * Run with: pnpm db:seed  (DATABASE_URL defaults per .env.example)
 */
import { createDb } from "./client";
import {
  badges,
  categories,
  contributions,
  follows,
  mediaAssets,
  momentParticipants,
  moments,
  reactions,
  users,
  wallets,
} from "./schema";
import {
  CATEGORIES,
  DEMO_MOMENT_COUNT,
  DEMO_USER_COUNT,
  MOMENT_PRIVACIES,
  MOMENT_STATUSES,
  MOMENT_TYPES,
  demoUsers,
  photoUrl,
  rng,
} from "./seed-data";

const CITIES: Array<[string, string, string]> = [
  // [city, country, h3 approx]
  ["Mumbai", "India", "8830a2c549fffff"],
  ["Delhi", "India", "883a2c54d7fffff"],
  ["Bengaluru", "India", "8861a2c547fffff"],
  ["Jaipur", "India", "8843a2c541fffff"],
  ["Goa", "India", "8862a2c545fffff"],
  ["Pune", "India", "8831a2c543fffff"],
];

const MOMENT_TITLES = [
  "Sunset chai at Marine Drive",
  "Old Delhi food walk",
  "Indie gig at The Beehive",
  "Sunday hike to Nandi Hills",
  "Board games & biryani night",
  "Street photography walk",
  "Book club: October reads",
  "Bouldering session",
  "Rooftop movie night",
  "Cycling the sea link",
  "Pottery workshop",
  "Salsa social evening",
  "Startup founders breakfast",
  "Quiz night at the pub",
  "Yoga in the park",
  "Flea market crawl",
  "Karaoke showdown",
  "Coding meetup: AI tools",
  "Picnic at Lodhi Gardens",
  "Midnight dessert run",
  "Trek to Rajmachi",
  "Chess in the café",
  "Language exchange: Hindi-English",
  "Vinyl listening session",
  "Badminton doubles",
  "Art gallery hop",
  "Cooking dal bafla together",
  "Stargazing at Pawna Lake",
  "Heritage walk: Fort area",
  "Coffee cupping tasting",
];

async function main() {
  const db = createDb();
  const rand = rng(2026);

  console.log("[seed] inserting categories…");
  await db
    .insert(categories)
    .values(CATEGORIES.map((c) => ({ slug: c.slug, nameEn: c.nameEn, nameHi: c.nameHi, icon: c.icon })))
    .onConflictDoNothing();

  const categoryRows = await db.select().from(categories);
  const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));

  console.log("[seed] inserting users…");
  const userRows = demoUsers(DEMO_USER_COUNT);
  await db
    .insert(users)
    .values(
      userRows.map((u) => ({
        handle: u.handle,
        displayName: u.displayName,
        email: u.email,
        locale: u.locale,
        isCreator: u.isCreator,
      })),
    )
    .onConflictDoNothing();

  const insertedUsers = await db.select({ id: users.id, handle: users.handle }).from(users);
  const byHandle = new Map(insertedUsers.map((u) => [u.handle, u.id]));
  const userIds = userRows.map((u) => byHandle.get(u.handle)!);

  console.log("[seed] inserting wallets…");
  await db
    .insert(wallets)
    .values(userIds.map((id) => ({ userId: id })))
    .onConflictDoNothing();

  console.log("[seed] inserting follows…");
  const followValues: Array<{ followerId: string; followeeId: string }> = [];
  for (const uid of userIds) {
    const targets = 3 + Math.floor(rand() * 5);
    for (let i = 0; i < targets; i++) {
      const other = userIds[Math.floor(rand() * userIds.length)]!;
      if (other !== uid && !followValues.some((f) => f.followerId === uid && f.followeeId === other)) {
        followValues.push({ followerId: uid, followeeId: other });
      }
    }
  }
  await db.insert(follows).values(followValues).onConflictDoNothing();

  console.log(`[seed] inserting ${DEMO_MOMENT_COUNT} moments with photos…`);
  const catSlugs = CATEGORIES.map((c) => c.slug);
  for (let i = 0; i < DEMO_MOMENT_COUNT; i++) {
    const hostId = userIds[Math.floor(rand() * userIds.length)]!;
    const [city, country, h3] = CITIES[i % CITIES.length]!;
    const type = MOMENT_TYPES[i % MOMENT_TYPES.length]!;
    const status = MOMENT_STATUSES[i % MOMENT_STATUSES.length]!;
    const privacy = MOMENT_PRIVACIES[i % MOMENT_PRIVACIES.length]!;
    const slug = catSlugs[i % catSlugs.length]!;

    const insertedMoment = await db
      .insert(moments)
      .values({
        hostId,
        categoryId: categoryIdBySlug.get(slug),
        title: MOMENT_TITLES[i % MOMENT_TITLES.length]!,
        description: `Demo moment #${i + 1} — seeded for ${type} in ${city}.`,
        type,
        status,
        privacy,
        h3Index: h3,
        city,
        country,
        startsAt: new Date(Date.now() + i * 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + (i + 4) * 3_600_000).toISOString(),
        maxParticipants: 2 + Math.floor(rand() * 18),
      })
      .returning({ id: moments.id });
    const moment = insertedMoment[0];
    if (!moment) throw new Error("insert moment returned no row");

    // cover + gallery photos
    const photoCount = 2 + Math.floor(rand() * 4);
    const photos = Array.from({ length: photoCount }, (_, p) => ({
      ownerId: hostId,
      momentId: moment.id,
      kind: "photo" as const,
      cdnUrl: photoUrl(i * 10 + p),
      width: 1600,
      height: 1200,
      sizeBytes: 400_000 + Math.floor(rand() * 600_000),
      status: "ready" as const,
    }));
    await db.insert(mediaAssets).values(photos);

    // participants: host + a few others
    const participants: Array<{ momentId: string; userId: string; role: "host" | "participant" }> = [
      { momentId: moment.id, userId: hostId, role: "host" },
    ];
    const memberCount = 1 + Math.floor(rand() * 6);
    for (let m = 0; m < memberCount; m++) {
      const uid = userIds[Math.floor(rand() * userIds.length)]!;
      if (uid !== hostId && !participants.some((p) => p.userId === uid)) {
        participants.push({ momentId: moment.id, userId: uid, role: "participant" });
      }
    }
    await db.insert(momentParticipants).values(participants).onConflictDoNothing();

    // a contribution with a photo + reactions
    const contributor = participants[1]?.userId ?? hostId;
    const insertedContribution = await db
      .insert(contributions)
      .values({ momentId: moment.id, authorId: contributor, type: "photo", body: `From ${city}!` })
      .returning({ id: contributions.id });
    const contribution = insertedContribution[0];
    if (!contribution) throw new Error("insert contribution returned no row");
    await db.insert(reactions).values([
      { contributionId: contribution.id, userId: hostId, kind: "like" },
      { contributionId: contribution.id, userId: contributor, kind: "love" },
    ]).onConflictDoNothing();
  }

  console.log("[seed] inserting badges…");
  await db
    .insert(badges)
    .values([
      { slug: "early-adopter", name: "Early Adopter", description: "Joined during the beta.", tier: "gold" },
      { slug: "moment-maker", name: "Moment Maker", description: "Hosted 10 moments.", tier: "silver" },
      { slug: "storyteller", name: "Storyteller", description: "50 contributions shared.", tier: "bronze" },
    ])
    .onConflictDoNothing();

  console.log("[seed] done ✓");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
