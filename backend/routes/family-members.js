const express = require("express");
const db = require("../db");

const router = express.Router();
const CURRENT_USER_ID = Number(process.env.CURRENT_USER_ID || 1);

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
      [CURRENT_USER_ID]
    );

    if (rows.length > 0) return rows[0];
  } catch (error) {
    // fallback below
  }

  return {
    id: CURRENT_USER_ID,
    name: `User ${CURRENT_USER_ID}`,
    email: `user${CURRENT_USER_ID}@example.com`,
    family_id: 1,
  };
}

router.get("/", async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser();
    const [rows] = await db.query(`
      SELECT
        users.id,
        users.name,
        users.email,
        users.avatar_url,
        family_members.role
      FROM family_members
      JOIN users ON family_members.user_id = users.id
      WHERE family_members.family_id = ?
      ORDER BY users.id ASC
    `, [Number(currentUser.family_id)]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }

  try {
    const currentUser = await resolveCurrentUser();
    const [userResult] = await db.query(
      `
      INSERT INTO users (name, email, avatar_url)
      VALUES (?, ?, ?)
      `,
      [name.trim(), email?.trim() || null, null]
    );

    const newUserId = userResult.insertId;

    await db.query(
      `
      INSERT INTO family_members (family_id, user_id, role)
      VALUES (?, ?, ?)
      `,
      [Number(currentUser.family_id), newUserId, role || "member"]
    );

    res.json({
      message: "Family member added successfully.",
      id: newUserId,
      name: name.trim(),
      email: email?.trim() || null,
      avatar_url: null,
      role: role || "member",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({ error: "Invalid user id." });
  }

  try {
    const currentUser = await resolveCurrentUser();
    await db.query(
      `
      DELETE FROM family_members
      WHERE family_id = ?
      AND user_id = ?
      `,
      [Number(currentUser.family_id), userId]
    );

    await db.query(
      `
      DELETE FROM member_items
      WHERE family_member_id = ?
      `,
      [userId]
    );

    await db.query(
      `
      DELETE FROM users
      WHERE id = ?
      `,
      [userId]
    );

    res.json({
      message: "Family member deleted successfully.",
      id: userId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
