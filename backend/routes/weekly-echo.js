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
    // Use demo fallback below.
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

function getWeekKey(date) {
  return toMysqlDateTime(date).slice(0, 10);
}

function toMysqlDateTime(date) {
  const pad = (value) => `${value}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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
        source VARCHAR(30) NOT NULL DEFAULT 'ai',
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
    // Summary generation should still work when the demo database is unavailable.
  }
}

function buildFallbackSummary({ stats, posts, moods, userName, storySignals }) {
  const photos = Array.isArray(storySignals?.photos) ? storySignals.photos : [];
  const decorations = Array.isArray(storySignals?.unlockedDecorations)
    ? storySignals.unlockedDecorations.filter(Boolean)
    : [];
  const firstDogMessage = photos.find((photo) => photo.dogMessage?.trim())?.dogMessage?.trim();
  const firstReaction = photos.find((photo) => photo.reaction)?.reaction;
  const firstDecoration = decorations[0];

  const lines = [
    `This week, your family shared ${stats.photoShares ?? posts.length ?? photos.length} small moments.`,
  ];

  if (firstDogMessage) {
    lines.push(`The family dog carried a note: "${firstDogMessage}".`);
  } else if (posts[0]?.content || posts[0]?.title) {
    lines.push(`${posts[0].user_name || "Someone"} shared ${posts[0].title || posts[0].content}.`);
  }

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

function parseAiSummary(content) {
  const cleaned = String(content || "").trim();
  if (!cleaned) return null;

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed.subtitle === "string" && typeof parsed.body === "string") {
      return {
        subtitle: parsed.subtitle.slice(0, 120),
        body: parsed.body.slice(0, 420),
      };
    }
  } catch (error) {
    // Fall through to plain text handling.
  }

  const [firstLine, ...rest] = cleaned.split(/\r?\n/).filter(Boolean);
  return {
    subtitle: (firstLine || "This week's echo").slice(0, 120),
    body: (rest.join(" ") || cleaned).slice(0, 420),
  };
}

async function fetchWeeklyPosts(familyId, weekStart) {
  try {
    const [rows] = await db.query(
      `
      SELECT
        p.title,
        p.content,
        p.media_type,
        p.created_at,
        u.name AS user_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.family_id = ? AND p.created_at >= ?
      ORDER BY p.created_at DESC
      LIMIT 20
      `,
      [Number(familyId), toMysqlDateTime(weekStart)]
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
      [Number(familyId), toMysqlDateTime(weekStart).slice(0, 10)]
    );
    return rows;
  } catch (error) {
    return [];
  }
}

async function createAiSummary({ stats, moments, storySignals, posts, moods, userName, petName }) {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const baseUrl = (process.env.AI_API_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

  if (!apiKey) return null;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You write warm weekly family recap stories for a pet-themed app. Return strict JSON with subtitle and body. The body must be 4-5 short English lines separated by newline characters. Cover this week's photos, dog-carried messages, mood beads, lightweight family reactions, and unlocked pet decorations when data exists. Do not invent names, events, or counts.",
        },
        {
          role: "user",
          content: `Create the blackboard text for "This Week's Echo" from this data:\n${JSON.stringify({
            userName,
            petName,
            stats,
            pageMoments: moments,
            storySignals,
            weeklyPosts: posts,
            weeklyMoods: moods,
          })}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`AI request failed: ${response.status} ${details}`);
  }

  const result = await response.json();
  return parseAiSummary(result?.choices?.[0]?.message?.content);
}

router.post("/summary", async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser();
    const weekStart = getWeekStart();
    const weekKey = getWeekKey(weekStart);
    const cachedSummary = await getCachedSummary(currentUser.family_id, weekKey);

    if (cachedSummary) {
      return res.json({
        summary: {
          subtitle: cachedSummary.subtitle,
          body: cachedSummary.body,
        },
        source: cachedSummary.source,
        weekStart: weekKey,
      });
    }

    const [posts, moods] = await Promise.all([
      fetchWeeklyPosts(currentUser.family_id, weekStart),
      fetchWeeklyMoods(currentUser.family_id, weekStart),
    ]);

    const stats = req.body?.stats || {};
    const moments = Array.isArray(req.body?.moments) ? req.body.moments : [];
    const storySignals = req.body?.storySignals && typeof req.body.storySignals === "object"
      ? req.body.storySignals
      : {};
    const fallback = buildFallbackSummary({
      stats,
      posts,
      moods,
      userName: currentUser.name,
      storySignals,
    });

    try {
      const summary = await createAiSummary({
        stats,
        moments,
        storySignals,
        posts,
        moods,
        userName: currentUser.name,
        petName: req.body?.petName || "your pet",
      });

      if (summary) {
        await saveWeeklySummary(currentUser.family_id, weekKey, summary, "ai");
      }

      return res.json({
        summary: summary || fallback,
        source: summary ? "ai" : "fallback",
        weekStart: weekKey,
      });
    } catch (error) {
      return res.status(502).json({
        error: error.message,
        summary: fallback,
        source: "fallback",
        weekStart: weekKey,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
