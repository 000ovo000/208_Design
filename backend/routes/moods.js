const express = require("express");
const db = require("../db");
const { getCurrentUserId } = require("../current-user");

const router = express.Router();

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

router.get("/", async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser();
    const [rows] = await db.query(`
      SELECT 
        mood_entries.id,
        mood_entries.user_id,
        users.name AS user_name,
        mood_entries.mood,
        mood_entries.comment,
        DATE_FORMAT(mood_entries.entry_date, '%Y-%m-%d') AS entry_date,
        mood_entries.created_at
      FROM mood_entries
      JOIN users ON mood_entries.user_id = users.id
      WHERE mood_entries.family_id = ?
      ORDER BY mood_entries.entry_date DESC
    `, [Number(currentUser.family_id)]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { mood, comment, entry_date } = req.body;

  try {
    const currentUser = await resolveCurrentUser();
    const [result] = await db.query(
      `
      INSERT INTO mood_entries (user_id, family_id, mood, comment, entry_date)
      VALUES (?, ?, ?, ?, ?)
      `,
      [Number(currentUser.id), Number(currentUser.family_id), mood, comment || null, entry_date]
    );

    res.json({
      message: "Mood entry created successfully.",
      id: result.insertId,
    });
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
