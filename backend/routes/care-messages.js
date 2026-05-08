const express = require("express");
const db = require("../db");
const { getCurrentUserId } = require("../current-user");

const router = express.Router();
let careMessagesSchemaReadyPromise = null;

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

async function ensureCareMessagesSchemaReady() {
  if (!careMessagesSchemaReadyPromise) {
    careMessagesSchemaReadyPromise = db.query(`
      CREATE TABLE IF NOT EXISTS care_messages (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        sender_user_id BIGINT NOT NULL,
        receiver_user_id BIGINT NOT NULL,
        family_id BIGINT NOT NULL,
        care_type VARCHAR(100) NOT NULL,
        message VARCHAR(500) NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_care_messages_receiver_read_created (receiver_user_id, is_read, created_at)
      )
    `);
  }

  return careMessagesSchemaReadyPromise;
}

function buildCareMessage({ senderName, careType }) {
  const normalizedType = String(careType || "").trim().toLowerCase();

  if (normalizedType === "tea" || normalizedType === "food" || normalizedType === "feed") {
    return `收到来自 ${senderName} 的投喂关心`;
  }
  if (normalizedType === "toy" || normalizedType === "toys") {
    return `收到来自 ${senderName} 的玩具关心`;
  }
  if (normalizedType === "hug") {
    return `收到来自 ${senderName} 的拥抱关心`;
  }
  if (normalizedType === "pet" || normalizedType === "love" || normalizedType === "care") {
    return `收到来自 ${senderName} 的陪伴关心`;
  }
  if (normalizedType === "mood-support" || normalizedType === "mood_support") {
    return `收到来自 ${senderName} 的情绪支持`;
  }

  return `收到来自 ${senderName} 的关心`;
}

router.post("/", async (req, res) => {
  try {
    await ensureCareMessagesSchemaReady();
    const currentUser = await resolveCurrentUser();
    const senderUserId = Number(req.body?.sender_user_id ?? currentUser.id);
    const receiverUserId = Number(req.body?.receiver_user_id);
    const careType = String(req.body?.care_type || "").trim();

    if (!senderUserId || !receiverUserId || !careType) {
      return res.status(400).json({
        error: "sender_user_id, receiver_user_id and care_type are required.",
      });
    }

    const senderName = String(req.body?.sender_name || currentUser.name || "Family");
    const message =
      typeof req.body?.message === "string" && req.body.message.trim()
        ? req.body.message.trim()
        : buildCareMessage({ senderName, careType });

    const [result] = await db.query(
      `
      INSERT INTO care_messages (
        sender_user_id,
        receiver_user_id,
        family_id,
        care_type,
        message,
        is_read,
        read_at
      )
      VALUES (?, ?, ?, ?, ?, 0, NULL)
      `,
      [
        senderUserId,
        receiverUserId,
        Number(currentUser.family_id),
        careType,
        message,
      ]
    );

    const [rows] = await db.query(
      `
      SELECT
        care_messages.id,
        care_messages.sender_user_id,
        care_messages.receiver_user_id,
        care_messages.family_id,
        care_messages.care_type,
        care_messages.message,
        care_messages.is_read,
        care_messages.created_at,
        care_messages.read_at,
        sender.name AS sender_name
      FROM care_messages
      JOIN users sender ON sender.id = care_messages.sender_user_id
      WHERE care_messages.id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    return res.json(rows[0] ?? { id: result.insertId, message, care_type: careType });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/unread", async (req, res) => {
  try {
    await ensureCareMessagesSchemaReady();
    const currentUser = await resolveCurrentUser();

    const [rows] = await db.query(
      `
      SELECT
        care_messages.id,
        care_messages.sender_user_id,
        care_messages.receiver_user_id,
        care_messages.family_id,
        care_messages.care_type,
        care_messages.message,
        care_messages.is_read,
        care_messages.created_at,
        care_messages.read_at,
        sender.name AS sender_name
      FROM care_messages
      JOIN users sender ON sender.id = care_messages.sender_user_id
      WHERE care_messages.receiver_user_id = ?
        AND care_messages.is_read = 0
      ORDER BY care_messages.created_at ASC, care_messages.id ASC
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
    await ensureCareMessagesSchemaReady();
    const currentUser = await resolveCurrentUser();
    const messageId = Number(req.params.id);

    if (!messageId) {
      return res.status(400).json({ error: "Invalid message id." });
    }

    const [result] = await db.query(
      `
      UPDATE care_messages
      SET is_read = 1,
          read_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND receiver_user_id = ?
        AND is_read = 0
      `,
      [messageId, Number(currentUser.id)]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Unread care message not found." });
    }

    return res.json({ id: messageId, is_read: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
