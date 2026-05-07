const express = require("express");
const db = require("../db");
const { getCurrentUserId } = require("../current-user");

const router = express.Router();
let postsSchemaReadyPromise = null;

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

async function ensurePostsSchemaReady() {
  if (!postsSchemaReadyPromise) {
    postsSchemaReadyPromise = (async () => {
      const [columns] = await db.query(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'posts'
        `
      );

      const columnNames = new Set(
        Array.isArray(columns) ? columns.map((column) => column.COLUMN_NAME) : []
      );

      if (!columnNames.has("family_member_id")) {
        await db.query(
          `
          ALTER TABLE posts
          ADD COLUMN family_member_id INT NULL AFTER user_id
          `
        );
      }

      if (!columnNames.has("media_url")) {
        await db.query(
          `
          ALTER TABLE posts
          ADD COLUMN media_url VARCHAR(500) NULL AFTER content
          `
        );
      }

      if (!columnNames.has("media_type")) {
        await db.query(
          `
          ALTER TABLE posts
          ADD COLUMN media_type VARCHAR(50) NULL DEFAULT 'text' AFTER media_url
          `
        );
      }

      if (columnNames.has("image_url")) {
        await db.query(
          `
          UPDATE posts
          SET media_url = COALESCE(media_url, image_url)
          WHERE image_url IS NOT NULL AND image_url <> ''
          `
        );
      }

      await db.query(
        `
        UPDATE posts
        SET family_member_id = user_id
        WHERE family_member_id IS NULL
        `
      );

      await db.query(
        `
        UPDATE posts
        SET media_type = COALESCE(NULLIF(media_type, ''), 'text')
        WHERE media_type IS NULL OR media_type = ''
        `
      );
    })();
  }

  return postsSchemaReadyPromise;
}

router.get("/", async (req, res) => {
  try {
    await ensurePostsSchemaReady();
    const currentUser = await resolveCurrentUser();

    const [rows] = await db.query(
      `
      SELECT
        p.id,
        p.user_id,
        p.family_member_id,
        u.name AS user_name,
        p.family_id,
        p.title,
        p.content,
        p.media_url,
        p.media_type,
        p.created_at
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.family_id = ?
      ORDER BY p.created_at DESC
      `,
      [Number(currentUser.family_id)]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { title, content, media_url, media_type } = req.body;

  const normalizedTitle = title?.trim() || null;
  const normalizedContent = content?.trim() || null;
  const normalizedMediaUrl = media_url?.trim() || null;

  if (!normalizedTitle && !normalizedContent && !normalizedMediaUrl) {
    return res.status(400).json({ error: "At least one of title, content, or media_url is required." });
  }

  try {
    await ensurePostsSchemaReady();
    const currentUser = await resolveCurrentUser();

    const normalizedUserId = Number(currentUser.id);
    const normalizedFamilyMemberId = Number(currentUser.id);
    const normalizedFamilyId = Number(currentUser.family_id);

    const [result] = await db.query(
      `
      INSERT INTO posts (user_id, family_member_id, family_id, title, content, media_url, media_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        normalizedUserId,
        normalizedFamilyMemberId,
        normalizedFamilyId,
        normalizedTitle,
        normalizedContent,
        normalizedMediaUrl,
        media_type || "text",
      ]
    );

    const newPostId = result.insertId;

    const [rows] = await db.query(
      `
      SELECT
        p.id,
        p.user_id,
        p.family_member_id,
        u.name AS user_name,
        p.family_id,
        p.title,
        p.content,
        p.media_url,
        p.media_type,
        p.created_at
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
      LIMIT 1
      `,
      [newPostId]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  const postId = Number(req.params.id);

  if (!postId) {
    return res.status(400).json({ error: "Invalid post id." });
  }

  try {
    await ensurePostsSchemaReady();
    const currentUser = await resolveCurrentUser();

    const [result] = await db.query(
      `
      DELETE FROM posts
      WHERE id = ? AND family_id = ?
      `,
      [postId, Number(currentUser.family_id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Post not found." });
    }

    res.json({
      message: "Post deleted successfully.",
      id: postId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
