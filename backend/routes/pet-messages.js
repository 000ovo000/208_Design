const express = require("express");
const db = require("../db");
const { getCurrentUserId } = require("../current-user");

const router = express.Router();
let petMessagesSchemaReadyPromise = null;

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

async function ensurePetMessagesSchemaReady() {
  if (!petMessagesSchemaReadyPromise) {
    petMessagesSchemaReadyPromise = db.query(`
      CREATE TABLE IF NOT EXISTS pet_messages (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        sender_user_id BIGINT NOT NULL,
        receiver_user_id BIGINT NOT NULL,
        family_id BIGINT NOT NULL,
        message VARCHAR(1000) NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_pet_messages_receiver_read_created (receiver_user_id, is_read, created_at)
      )
    `);
  }

  return petMessagesSchemaReadyPromise;
}

router.post("/", async (req, res) => {
  try {
    await ensurePetMessagesSchemaReady();
    const currentUser = await resolveCurrentUser();
    const senderUserId = Number(req.body?.sender_user_id ?? currentUser.id);
    const receiverUserId = Number(req.body?.receiver_user_id);
    const message = String(req.body?.message || "").trim();

    if (!senderUserId || !receiverUserId || !message) {
      return res.status(400).json({
        error: "sender_user_id, receiver_user_id and message are required.",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO pet_messages (
        sender_user_id,
        receiver_user_id,
        family_id,
        message,
        is_read,
        read_at
      )
      VALUES (?, ?, ?, ?, 0, NULL)
      `,
      [senderUserId, receiverUserId, Number(currentUser.family_id), message]
    );

    const [rows] = await db.query(
      `
      SELECT
        pet_messages.id,
        pet_messages.sender_user_id,
        pet_messages.receiver_user_id,
        pet_messages.family_id,
        pet_messages.message,
        pet_messages.is_read,
        pet_messages.created_at,
        pet_messages.read_at,
        sender.name AS sender_name
      FROM pet_messages
      JOIN users sender ON sender.id = pet_messages.sender_user_id
      WHERE pet_messages.id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    return res.json(rows[0] ?? { id: result.insertId, message });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    await ensurePetMessagesSchemaReady();
    const currentUser = await resolveCurrentUser();

    const [rows] = await db.query(
      `
      SELECT
        pet_messages.id,
        pet_messages.sender_user_id,
        pet_messages.receiver_user_id,
        pet_messages.family_id,
        pet_messages.message,
        pet_messages.is_read,
        pet_messages.created_at,
        pet_messages.read_at,
        sender.name AS sender_name
      FROM pet_messages
      JOIN users sender ON sender.id = pet_messages.sender_user_id
      WHERE pet_messages.receiver_user_id = ?
      ORDER BY pet_messages.created_at ASC, pet_messages.id ASC
      `,
      [Number(currentUser.id)]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/unread", async (req, res) => {
  try {
    await ensurePetMessagesSchemaReady();
    const currentUser = await resolveCurrentUser();

    const [rows] = await db.query(
      `
      SELECT
        pet_messages.id,
        pet_messages.sender_user_id,
        pet_messages.receiver_user_id,
        pet_messages.family_id,
        pet_messages.message,
        pet_messages.is_read,
        pet_messages.created_at,
        pet_messages.read_at,
        sender.name AS sender_name
      FROM pet_messages
      JOIN users sender ON sender.id = pet_messages.sender_user_id
      WHERE pet_messages.receiver_user_id = ?
        AND pet_messages.is_read = 0
      ORDER BY pet_messages.created_at ASC, pet_messages.id ASC
      `,
      [Number(currentUser.id)]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    await ensurePetMessagesSchemaReady();
    const currentUser = await resolveCurrentUser();
    const messageId = Number(req.params.id);

    if (!messageId) {
      return res.status(400).json({ error: "Invalid message id." });
    }

    const [result] = await db.query(
      `
      UPDATE pet_messages
      SET is_read = 1,
          read_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND receiver_user_id = ?
        AND is_read = 0
      `,
      [messageId, Number(currentUser.id)]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Unread pet message not found." });
    }

    return res.json({ id: messageId, is_read: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
