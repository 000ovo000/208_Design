const express = require("express");
const db = require("../db");
const { getCurrentUserId } = require("../current-user");

const router = express.Router();
let dailyDropSchemaReadyPromise = null;

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

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function ensureDailyDropSchemaReady() {
  if (!dailyDropSchemaReadyPromise) {
    dailyDropSchemaReadyPromise = db.query(`
      CREATE TABLE IF NOT EXISTS daily_drops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        family_member_id INT NOT NULL,
        drop_date VARCHAR(10) NOT NULL,
        item_id INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_member_drop_date (family_member_id, drop_date),
        INDEX idx_daily_drops_member_date (family_member_id, drop_date)
      )
    `);
  }

  return dailyDropSchemaReadyPromise;
}

router.get("/daily-drop/status", async (req, res) => {
  try {
    await ensureDailyDropSchemaReady();
    const currentUser = await resolveCurrentUser();
    const todayKey = getTodayKey();

    const [rows] = await db.query(
      `
      SELECT id
      FROM daily_drops
      WHERE family_member_id = ? AND drop_date = ?
      LIMIT 1
      `,
      [Number(currentUser.id), todayKey]
    );

    return res.json({ claimed: rows.length > 0 });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/daily-drop/claim", async (req, res) => {
  try {
    await ensureDailyDropSchemaReady();
    const currentUser = await resolveCurrentUser();
    const todayKey = getTodayKey();
    const itemId = Number(req.body?.item_id);

    if (!itemId) {
      return res.status(400).json({ error: "item_id is required." });
    }

    const [existing] = await db.query(
      `
      SELECT id
      FROM daily_drops
      WHERE family_member_id = ? AND drop_date = ?
      LIMIT 1
      `,
      [Number(currentUser.id), todayKey]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Daily drop already claimed today." });
    }

    const [itemRows] = await db.query(`SELECT id FROM items WHERE id = ? LIMIT 1`, [itemId]);
    if (itemRows.length === 0) {
      return res.status(404).json({ error: "Item not found." });
    }

    await db.query(
      `
      INSERT INTO daily_drops (family_member_id, drop_date, item_id)
      VALUES (?, ?, ?)
      `,
      [Number(currentUser.id), todayKey, itemId]
    );

    await db.query(
      `
      INSERT INTO member_items (family_member_id, item_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
      `,
      [Number(currentUser.id), itemId, 1]
    );

    return res.json({ claimed: true, item_id: itemId });
  } catch (error) {
    if (error && (error.code === "ER_DUP_ENTRY" || error.errno === 1062)) {
      return res.status(409).json({ error: "Daily drop already claimed today." });
    }
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
