const express = require("express");
const db = require("../db");
const { getCurrentUserId } = require("../current-user");

const router = express.Router();
let postsSchemaReadyPromise = null;
const ALBUM_REACTION_TYPES = new Set(["smile", "love", "clap", "wow", "sad"]);

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

      await db.query(`
        CREATE TABLE IF NOT EXISTS post_reactions (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          post_id BIGINT NOT NULL,
          family_id BIGINT NOT NULL,
          user_id BIGINT NOT NULL,
          reaction_type VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_post_reaction_user (post_id, user_id),
          INDEX idx_post_reactions_family_created (family_id, created_at),
          INDEX idx_post_reactions_post (post_id),
          CONSTRAINT fk_post_reactions_post
            FOREIGN KEY (post_id) REFERENCES posts(id)
            ON DELETE CASCADE,
          CONSTRAINT fk_post_reactions_family
            FOREIGN KEY (family_id) REFERENCES families(id)
            ON DELETE CASCADE,
          CONSTRAINT fk_post_reactions_user
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE
        )
      `);
    })();
  }

  return postsSchemaReadyPromise;
}

function normalizeReactionComments(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    memberId: String(row.user_id),
    memberName: String(row.user_name || `User ${row.user_id}`),
    reaction: row.reaction_type,
  }));
}

async function attachReactionComments(posts) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return [];
  }

  const postIds = posts
    .map((post) => Number(post.id))
    .filter((postId) => Number.isFinite(postId) && postId > 0);

  if (postIds.length === 0) {
    return posts.map((post) => ({ ...post, reaction_comments: [] }));
  }

  const [reactionRows] = await db.query(
    `
    SELECT
      pr.post_id,
      pr.user_id,
      pr.reaction_type,
      u.name AS user_name
    FROM post_reactions pr
    JOIN users u ON u.id = pr.user_id
    WHERE pr.post_id IN (?)
    ORDER BY pr.updated_at ASC, pr.id ASC
    `,
    [postIds]
  );

  const reactionMap = (Array.isArray(reactionRows) ? reactionRows : []).reduce((accumulator, row) => {
    const postId = String(row.post_id);
    if (!accumulator[postId]) accumulator[postId] = [];
    accumulator[postId].push(row);
    return accumulator;
  }, {});

  return posts.map((post) => ({
    ...post,
    reaction_comments: normalizeReactionComments(reactionMap[String(post.id)]),
  }));
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

    res.json(await attachReactionComments(rows));
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

    const postsWithReactions = await attachReactionComments(rows);
    res.json(postsWithReactions[0] ?? rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id/reaction", async (req, res) => {
  const postId = Number(req.params.id);
  const reaction =
    typeof req.body?.reaction === "string" && req.body.reaction.trim()
      ? req.body.reaction.trim().toLowerCase()
      : null;

  if (!postId) {
    return res.status(400).json({ error: "Invalid post id." });
  }

  if (reaction !== null && !ALBUM_REACTION_TYPES.has(reaction)) {
    return res.status(400).json({ error: "Invalid reaction." });
  }

  try {
    await ensurePostsSchemaReady();
    const currentUser = await resolveCurrentUser();

    const [postRows] = await db.query(
      `
      SELECT id
      FROM posts
      WHERE id = ? AND family_id = ?
      LIMIT 1
      `,
      [postId, Number(currentUser.family_id)]
    );

    if (!postRows.length) {
      return res.status(404).json({ error: "Post not found." });
    }

    if (reaction === null) {
      await db.query(
        `
        DELETE FROM post_reactions
        WHERE post_id = ? AND user_id = ? AND family_id = ?
        `,
        [postId, Number(currentUser.id), Number(currentUser.family_id)]
      );
    } else {
      await db.query(
        `
        INSERT INTO post_reactions (
          post_id,
          family_id,
          user_id,
          reaction_type
        )
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          reaction_type = VALUES(reaction_type),
          updated_at = CURRENT_TIMESTAMP
        `,
        [postId, Number(currentUser.family_id), Number(currentUser.id), reaction]
      );
    }

    const [reactionRows] = await db.query(
      `
      SELECT
        pr.user_id,
        pr.reaction_type,
        u.name AS user_name
      FROM post_reactions pr
      JOIN users u ON u.id = pr.user_id
      WHERE pr.post_id = ?
      ORDER BY pr.updated_at ASC, pr.id ASC
      `,
      [postId]
    );

    return res.json({
      postId,
      reaction,
      reactionComments: normalizeReactionComments(reactionRows),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
