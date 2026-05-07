const express = require("express");
const db = require("../db");
const { getCurrentUserId } = require("../current-user");

const router = express.Router();
let moodSchemaReadyPromise = null;

function isValidDateString(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

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
    // fallback below
  }

  return {
    id: getCurrentUserId(),
    name: `User ${getCurrentUserId()}`,
    email: `user${getCurrentUserId()}@example.com`,
    family_id: 1,
  };
}

async function ensureMoodsSchemaReady() {
  if (!moodSchemaReadyPromise) {
    moodSchemaReadyPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS mood_entries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          family_id INT NOT NULL,
          mood VARCHAR(100) NOT NULL,
          comment TEXT NULL,
          entry_date DATE NOT NULL,
          visibility VARCHAR(20) NOT NULL DEFAULT 'private',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uk_mood_entries_user_date (user_id, entry_date),
          INDEX idx_mood_entries_family_date (family_id, entry_date),
          INDEX idx_mood_entries_user (user_id)
        )
      `);
      await db.query(`
        ALTER TABLE mood_entries
        ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'private'
      `);
      await db.query(`CREATE INDEX idx_mood_entries_visibility ON mood_entries (visibility)`);
    })().catch(async () => {
      // Retry with compatibility-safe checks for MySQL variants without IF EXISTS support.
      const [columns] = await db.query(`SHOW COLUMNS FROM mood_entries LIKE 'visibility'`);
      if (!Array.isArray(columns) || columns.length === 0) {
        await db.query(
          `ALTER TABLE mood_entries ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'private'`
        );
      }
      const [indexes] = await db.query(`SHOW INDEX FROM mood_entries WHERE Key_name = 'idx_mood_entries_visibility'`);
      if (!Array.isArray(indexes) || indexes.length === 0) {
        await db.query(`CREATE INDEX idx_mood_entries_visibility ON mood_entries (visibility)`);
      }
    });
  }

  return moodSchemaReadyPromise;
}

function normalizeVisibility(value) {
  if (value === "soft" || value === "full" || value === "private") return value;
  return "private";
}

router.get("/", async (req, res) => {
  try {
    await ensureMoodsSchemaReady();
    const currentUser = await resolveCurrentUser();
    const scope = String(req.query?.scope || "family").trim().toLowerCase() === "self" ? "self" : "family";
    const startDate = isValidDateString(req.query?.startDate) ? String(req.query.startDate).trim() : null;
    const endDate = isValidDateString(req.query?.endDate) ? String(req.query.endDate).trim() : null;
    const whereClauses = ["mood_entries.family_id = ?"];
    const params = [Number(currentUser.family_id)];

    if (scope === "self") {
      whereClauses.push("mood_entries.user_id = ?");
      params.push(Number(currentUser.id));
    }

    if (startDate) {
      whereClauses.push("mood_entries.entry_date >= ?");
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push("mood_entries.entry_date <= ?");
      params.push(endDate);
    }

    const [rows] = await db.query(
      `
      SELECT 
        mood_entries.id,
        mood_entries.user_id,
        mood_entries.family_id,
        users.name AS user_name,
        mood_entries.mood,
        mood_entries.comment,
        mood_entries.visibility,
        DATE_FORMAT(mood_entries.entry_date, '%Y-%m-%d') AS entry_date,
        mood_entries.created_at
      FROM mood_entries
      JOIN users ON mood_entries.user_id = users.id
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY mood_entries.entry_date DESC
    `,
      params
    );

    const currentUserId = Number(currentUser.id);
    const visibleRows =
      scope === "self"
        ? rows.map((row) => ({
            ...row,
            visibility: normalizeVisibility(row.visibility),
          }))
        : rows
            .filter((row) => {
              const ownerId = Number(row.user_id);
              if (ownerId === currentUserId) return true;
              const visibility = normalizeVisibility(row.visibility);
              return visibility !== "private";
            })
            .map((row) => {
              const ownerId = Number(row.user_id);
              const visibility = normalizeVisibility(row.visibility);
              const isOwner = ownerId === currentUserId;
              const canViewComment = isOwner || visibility === "full";

              return {
                ...row,
                visibility,
                comment: canViewComment ? row.comment : null,
              };
            });

    console.log(
      `[moods] scope=${scope} user=${Number(currentUser.id)} family=${Number(
        currentUser.family_id
      )} startDate=${startDate ?? "-"} endDate=${endDate ?? "-"} rows=${visibleRows.length}`
    );

    res.json(visibleRows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { mood, comment, entry_date, visibility } = req.body ?? {};
  const normalizedVisibility = normalizeVisibility(visibility);
  if (typeof mood !== "string" || !mood.trim()) {
    return res.status(400).json({ error: "mood is required." });
  }
  if (typeof entry_date !== "string" || !entry_date.trim()) {
    return res.status(400).json({ error: "entry_date is required." });
  }

  try {
    await ensureMoodsSchemaReady();
    const currentUser = await resolveCurrentUser();
    const [result] = await db.query(
      `
      INSERT INTO mood_entries (user_id, family_id, mood, comment, entry_date, visibility)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        Number(currentUser.id),
        Number(currentUser.family_id),
        mood,
        comment || null,
        entry_date,
        normalizedVisibility,
      ]
    );

    res.json({
      message: "Mood entry created successfully.",
      id: result.insertId,
      visibility: normalizedVisibility,
    });
    console.log(
      `[moods] created id=${Number(result.insertId)} user=${Number(currentUser.id)} family=${Number(
        currentUser.family_id
      )} entry_date=${entry_date} visibility=${normalizedVisibility} mood=${mood}`
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "You have already added a mood today. Please come back tomorrow.",
      });
    }

    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
