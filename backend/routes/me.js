const express = require("express");
const db = require("../db");
const { getCurrentUserId, setCurrentUserId } = require("../current-user");

const router = express.Router();

router.get("/", async (req, res) => {
  const currentUserId = getCurrentUserId();
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
      [currentUserId]
    );

    if (rows.length > 0) {
      return res.json(rows[0]);
    }
  } catch (error) {
    // Fallback response below keeps demo running without breaking when DB shape differs.
  }

  return res.json({
    id: currentUserId,
    name: `User ${currentUserId}`,
    email: `user${currentUserId}@example.com`,
    family_id: 1,
  });
});

router.post("/switch", async (req, res) => {
  const nextUserId = Number(req.body?.user_id);
  if (!Number.isFinite(nextUserId) || nextUserId <= 0) {
    return res.status(400).json({ error: "user_id must be a positive number." });
  }

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
      [nextUserId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Target user not found in family_members." });
    }

    setCurrentUserId(nextUserId);
    return res.json({ message: "Current user switched.", user: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
