const express = require("express");
const db = require("../db");
const { getCurrentUserId } = require("../current-user");

const router = express.Router();
let weeklyEchoSchemaReadyPromise = null;

async function resolveCurrentUser() {
  try {
    const [rows] = await db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        fm.family_id
      FROM family_members fm
      JOIN users u ON fm.user_id = u.id
      WHERE fm.user_id = ?
      LIMIT 1
      `,
      [getCurrentUserId()]
    );

    if (rows.length > 0) return rows[0];
  } catch (error) {
    // Use fallback below if the database is not ready yet.
  }

  return {
    id: getCurrentUserId(),
    name: `User ${getCurrentUserId()}`,
    email: `user${getCurrentUserId()}@example.com`,
    family_id: 1,
  };
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - diff);
  return start;
}

function formatDateTime(date) {
  const pad = (value) => `${value}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getWeekKey(date) {
  return formatDateTime(date).slice(0, 10);
}

function normalizeKeepsakeCategory(category) {
  const value = String(category ?? "").trim().toLowerCase();

  if (value === "food") return { category: "food", label: "Food" };
  if (value === "drink") return { category: "drink", label: "Drink" };
  if (value === "toy" || value === "basic-toy" || value === "care") {
    return { category: "basic-toy", label: "Basic toy" };
  }

  return null;
}

function formatKeepsakePreview(names) {
  const uniqueNames = Array.from(new Set(names.filter(Boolean)));
  if (uniqueNames.length > 3) {
    return `${uniqueNames.slice(0, 3).join(", ")}, ...`;
  }

  return uniqueNames.join(", ");
}

async function ensureWeeklyEchoSchemaReady() {
  if (!weeklyEchoSchemaReadyPromise) {
    weeklyEchoSchemaReadyPromise = db.query(`
      CREATE TABLE IF NOT EXISTS weekly_echo_summaries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        family_id INT NOT NULL,
        week_start VARCHAR(10) NOT NULL,
        subtitle VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        source VARCHAR(30) NOT NULL DEFAULT 'activity',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_family_week (family_id, week_start)
      )
    `);
  }

  return weeklyEchoSchemaReadyPromise;
}

async function getCachedSummary(familyId, weekKey) {
  try {
    await ensureWeeklyEchoSchemaReady();
    const [rows] = await db.query(
      `
      SELECT subtitle, body, source
      FROM weekly_echo_summaries
      WHERE family_id = ? AND week_start = ?
      LIMIT 1
      `,
      [Number(familyId), weekKey]
    );

    return rows[0] || null;
  } catch (error) {
    return null;
  }
}

async function saveWeeklySummary(familyId, weekKey, summary, source) {
  try {
    await ensureWeeklyEchoSchemaReady();
    await db.query(
      `
      INSERT INTO weekly_echo_summaries (family_id, week_start, subtitle, body, source)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        subtitle = VALUES(subtitle),
        body = VALUES(body),
        source = VALUES(source)
      `,
      [Number(familyId), weekKey, summary.subtitle, summary.body, source]
    );
  } catch (error) {
    // An uncached activity summary is acceptable for the demo flow.
  }
}

function getDateKey(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function buildActivityStats({ requestStats, posts, moods, petMessages, storySignals }) {
  const photos = posts.filter((post) => Boolean(post.media_url) || post.media_type === "image");
  const storyPhotos = Array.isArray(storySignals?.photos) ? storySignals.photos : [];
  const gentleReactions = storyPhotos.filter((photo) => Boolean(photo?.reaction)).length;
  const connectedDates = new Set();

  posts.forEach((post) => {
    const key = getDateKey(post.created_at);
    if (key) connectedDates.add(key);
  });
  moods.forEach((mood) => {
    const key = getDateKey(mood.entry_date);
    if (key) connectedDates.add(key);
  });
  petMessages.forEach((message) => {
    const key = getDateKey(message.created_at);
    if (key) connectedDates.add(key);
  });

  return {
    petMessages: petMessages.length || Number(requestStats.petMessages) || 0,
    photoShares: photos.length || Number(requestStats.photoShares) || storyPhotos.length || 0,
    gentleReactions: gentleReactions || Number(requestStats.gentleReactions) || 0,
    moodCheckIns: moods.length || Number(requestStats.moodCheckIns) || 0,
    connectedDays: connectedDates.size || Number(requestStats.connectedDays) || 0,
    smallMoments:
      posts.length +
        moods.length +
        petMessages.length +
        (gentleReactions || Number(requestStats.gentleReactions) || 0) ||
      Number(requestStats.smallMoments) ||
      0,
  };
}

function getFeaturedPetMessage(petMessages) {
  return petMessages.find((message) => message?.message?.trim())?.message?.trim() || "";
}

function buildActivitySummary({ stats, posts, moods, petMessages, userName, storySignals }) {
  const photos = Array.isArray(storySignals?.photos) ? storySignals.photos : [];
  const decorations = Array.isArray(storySignals?.unlockedDecorations)
    ? storySignals.unlockedDecorations.filter(Boolean)
    : [];
  const featuredPetMessage = getFeaturedPetMessage(petMessages);
  const firstReaction = photos.find((photo) => photo?.reaction)?.reaction;
  const firstDecoration = decorations[0];

  const lines = [
    `This week, your family shared ${stats.photoShares ?? posts.length ?? photos.length} small moments.`,
  ];

  lines.push(
    featuredPetMessage
      ? `Latest note from this week: "${featuredPetMessage}".`
      : "Latest note from this week: No shared note this week yet."
  );

  lines.push(`You added ${stats.moodCheckIns ?? moods.length ?? 0} calm mood beads.`);

  if (firstReaction) {
    lines.push(`A ${firstReaction} reaction made one photo feel noticed.`);
  } else {
    lines.push("Small replies kept the family lightly connected.");
  }

  if (firstDecoration) {
    lines.push(`${firstDecoration} was unlocked for the family pet.`);
  }

  return {
    subtitle: `${userName}'s family kept ${stats.connectedDays ?? 0} connected day${stats.connectedDays === 1 ? "" : "s"}.`,
    body: lines.slice(0, 5).join("\n"),
  };
}

async function fetchWeeklyPosts(familyId, weekStart) {
  try {
    const [rows] = await db.query(
      `
      SELECT
        p.title,
        p.content,
        p.media_url,
        p.media_type,
        p.created_at,
        u.name AS user_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.family_id = ? AND p.created_at >= ?
      ORDER BY p.created_at DESC
      LIMIT 20
      `,
      [Number(familyId), formatDateTime(weekStart)]
    );
    return rows;
  } catch (error) {
    return [];
  }
}

async function fetchWeeklyMoods(familyId, weekStart) {
  try {
    const [rows] = await db.query(
      `
      SELECT
        mood_entries.mood,
        mood_entries.comment,
        mood_entries.entry_date,
        users.name AS user_name
      FROM mood_entries
      JOIN users ON mood_entries.user_id = users.id
      WHERE mood_entries.family_id = ? AND mood_entries.entry_date >= ?
      ORDER BY mood_entries.entry_date DESC
      LIMIT 20
      `,
      [Number(familyId), formatDateTime(weekStart).slice(0, 10)]
    );
    return rows;
  } catch (error) {
    return [];
  }
}

async function fetchWeeklyPetMessages(familyId, weekStart) {
  try {
    const [rows] = await db.query(
      `
      SELECT
        message,
        created_at
      FROM pet_messages
      WHERE family_id = ? AND created_at >= ?
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [Number(familyId), formatDateTime(weekStart)]
    );
    return rows;
  } catch (error) {
    return [];
  }
}

async function fetchWeeklyDailyDropKeepsakes(familyId, weekStart) {
  try {
    const [rows] = await db.query(
      `
      SELECT
        i.category,
        i.name,
        COUNT(*) AS item_count
      FROM daily_drops dd
      JOIN items i ON dd.item_id = i.id
      JOIN family_members fm ON dd.family_member_id = fm.user_id
      WHERE fm.family_id = ? AND dd.drop_date >= ?
      GROUP BY i.category, i.name
      ORDER BY MIN(dd.drop_date) ASC, i.name ASC
      `,
      [Number(familyId), formatDateTime(weekStart).slice(0, 10)]
    );

    const summaryMap = new Map();

    rows.forEach((row) => {
      const normalized = normalizeKeepsakeCategory(row.category);
      if (!normalized) return;

      const summary = summaryMap.get(normalized.category) ?? {
        category: normalized.category,
        label: normalized.label,
        count: 0,
        names: [],
      };

      const itemCount = Number(row.item_count) || 0;
      summary.count += itemCount;
      if (row.name && !summary.names.includes(row.name)) {
        summary.names.push(row.name);
      }
      summaryMap.set(normalized.category, summary);
    });

    return ["food", "drink", "basic-toy"]
      .map((category) => {
        const summary = summaryMap.get(category);
        if (!summary || summary.count <= 0) return null;

        return {
          category: summary.category,
          label: summary.label,
          count: summary.count,
          preview: formatKeepsakePreview(summary.names),
        };
      })
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

router.post("/summary", async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser();
    const weekStart = getWeekStart();
    const weekKey = getWeekKey(weekStart);
    const [posts, moods, petMessages, keepsakes] = await Promise.all([
      fetchWeeklyPosts(currentUser.family_id, weekStart),
      fetchWeeklyMoods(currentUser.family_id, weekStart),
      fetchWeeklyPetMessages(currentUser.family_id, weekStart),
      fetchWeeklyDailyDropKeepsakes(currentUser.family_id, weekStart),
    ]);

    const stats =
      req.body?.stats && typeof req.body.stats === "object" ? req.body.stats : {};
    const storySignals =
      req.body?.storySignals && typeof req.body.storySignals === "object"
        ? req.body.storySignals
        : {};
    const activityStats = buildActivityStats({
      requestStats: stats,
      posts,
      moods,
      petMessages,
      storySignals,
    });
    const summary = buildActivitySummary({
      stats: activityStats,
      posts,
      moods,
      petMessages,
      userName: currentUser.name,
      storySignals,
    });

    await saveWeeklySummary(currentUser.family_id, weekKey, summary, "activity");

    return res.json({
      summary,
      stats: activityStats,
      source: "activity",
      weekStart: weekKey,
      keepsakes,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
