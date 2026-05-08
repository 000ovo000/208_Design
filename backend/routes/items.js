const express = require("express");
const db = require("../db");
const { getCurrentUserId } = require("../current-user");

const router = express.Router();
let inventorySchemaReadyPromise = null;

const DAILY_DROP_SEEDS = [
  { name: "Pet Biscuit", category: "food", icon: "🍪" },
  { name: "Pet Food", category: "food", icon: "🍖" },
  { name: "Pet Milk", category: "drink", icon: "🥛" },
  { name: "Pet Water", category: "drink", icon: "💧" },
  { name: "Small Ball", category: "toy", icon: "🟠" },
  { name: "Canned Tuna", category: "food", icon: "🥫" },
  { name: "Fish Toy", category: "toy", icon: "🐟" },
  { name: "Small Bone", category: "food", icon: "🦴" },
  { name: "Chew Toy", category: "toy", icon: "🪢" },
  { name: "Plush Bear", category: "toy", icon: "🧸" },
];

const WEEKLY_REWARD_SEEDS = [
  {
    name: "Pet Sofa 1",
    category: "weekly-reward",
    icon: "/images/weekly-reward/both/pet-sofa1.png",
  },
  {
    name: "Pet Sofa 2",
    category: "weekly-reward",
    icon: "/images/weekly-reward/both/pet-sofa2.png",
  },
  {
    name: "Pet Sofa 3",
    category: "weekly-reward",
    icon: "/images/weekly-reward/both/pet-sofa3.png",
  },
  {
    name: "Pet Sofa 4",
    category: "weekly-reward",
    icon: "/images/weekly-reward/both/pet-sofa4.png",
  },
  {
    name: "Pet Sofa 5",
    category: "weekly-reward",
    icon: "/images/weekly-reward/both/pet-sofa5.png",
  },
  {
    name: "Cat Climber",
    category: "weekly-reward",
    icon: "/images/weekly-reward/cat/cat-climber2.png",
  },
  {
    name: "Cat Teaser",
    category: "weekly-reward",
    icon: "/images/weekly-reward/cat/cat-teaser.png",
  },
  {
    name: "Carrot Toy",
    category: "weekly-reward",
    icon: "/images/weekly-reward/dog/carrot-toy.png",
  },
];

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

async function ensureInventorySchemaReady() {
  if (!inventorySchemaReadyPromise) {
    inventorySchemaReadyPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          category VARCHAR(20) NOT NULL,
          icon VARCHAR(255) NULL,
          price INT DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const [itemColumns] = await db.query(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'items'
        `
      );
      const itemColumnNames = new Set(
        Array.isArray(itemColumns) ? itemColumns.map((column) => column.COLUMN_NAME) : []
      );

      if (!itemColumnNames.has("icon")) {
        await db.query(`ALTER TABLE items ADD COLUMN icon VARCHAR(255) NULL`);
      }

      if (!itemColumnNames.has("price")) {
        await db.query(`ALTER TABLE items ADD COLUMN price INT DEFAULT 0`);
      }

      await db.query(`
        CREATE TABLE IF NOT EXISTS member_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          family_member_id INT NOT NULL,
          item_id INT NOT NULL,
          quantity INT DEFAULT 1,
          acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_member_item (family_member_id, item_id),
          INDEX idx_member_items_member (family_member_id),
          INDEX idx_member_items_item (item_id)
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS member_active_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          family_member_id INT NOT NULL,
          item_id INT NOT NULL,
          slot VARCHAR(50) NOT NULL DEFAULT 'room-decor',
          activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_member_slot (family_member_id, slot),
          INDEX idx_member_active_items_member (family_member_id),
          INDEX idx_member_active_items_item (item_id)
        )
      `);

      for (const { name, category, icon } of [...DAILY_DROP_SEEDS, ...WEEKLY_REWARD_SEEDS]) {
        await db.query(
          `
          INSERT INTO items (name, category, icon, price)
          SELECT ?, ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = ?)
          `,
          [name, category, icon, 0, name]
        );
      }

      const currentUser = await resolveCurrentUser();
      const [petBiscuitRows] = await db.query(`SELECT id FROM items WHERE name = ? LIMIT 1`, ["Pet Biscuit"]);
      const [smallBallRows] = await db.query(`SELECT id FROM items WHERE name = ? LIMIT 1`, ["Small Ball"]);

      if (petBiscuitRows[0]?.id) {
        await db.query(
          `
          INSERT INTO member_items (family_member_id, item_id, quantity)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = GREATEST(member_items.quantity, VALUES(quantity))
          `,
          [Number(currentUser.id), Number(petBiscuitRows[0].id), 2]
        );
      }

      if (smallBallRows[0]?.id) {
        await db.query(
          `
          INSERT INTO member_items (family_member_id, item_id, quantity)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = GREATEST(member_items.quantity, VALUES(quantity))
          `,
          [Number(currentUser.id), Number(smallBallRows[0].id), 1]
        );
      }
    })();
  }

  return inventorySchemaReadyPromise;
}

router.get("/items", async (req, res) => {
  try {
    await ensureInventorySchemaReady();
    const [rows] = await db.query(
      `
      SELECT id, name, category, icon, price, created_at
      FROM items
      ORDER BY id ASC
      `
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/my-items", async (req, res) => {
  try {
    await ensureInventorySchemaReady();
    const currentUser = await resolveCurrentUser();

    const [rows] = await db.query(
      `
      SELECT
        mi.item_id,
        i.name,
        i.category,
        i.icon,
        mi.quantity
      FROM member_items mi
      JOIN items i ON mi.item_id = i.id
      WHERE mi.family_member_id = ?
      ORDER BY mi.item_id ASC
      `,
      [Number(currentUser.id)]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/my-items/active", async (req, res) => {
  try {
    await ensureInventorySchemaReady();
    const currentUser = await resolveCurrentUser();

    const [rows] = await db.query(
      `
      SELECT
        mai.id,
        mai.item_id,
        mai.slot,
        mai.activated_at,
        i.name,
        i.category,
        i.icon
      FROM member_active_items mai
      JOIN items i ON mai.item_id = i.id
      WHERE mai.family_member_id = ?
      ORDER BY mai.activated_at ASC, mai.id ASC
      `,
      [Number(currentUser.id)]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/my-items", async (req, res) => {
  try {
    await ensureInventorySchemaReady();
    const currentUser = await resolveCurrentUser();
    const itemId = Number(req.body?.item_id);
    const quantity = Number(req.body?.quantity ?? 1);

    if (!itemId || quantity <= 0) {
      return res.status(400).json({ error: "item_id and positive quantity are required." });
    }

    const [itemRows] = await db.query(`SELECT id FROM items WHERE id = ? LIMIT 1`, [itemId]);
    if (itemRows.length === 0) {
      return res.status(404).json({ error: "Item not found." });
    }

    await db.query(
      `
      INSERT INTO member_items (family_member_id, item_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
      `,
      [Number(currentUser.id), itemId, quantity]
    );

    res.json({ message: "Item added.", item_id: itemId, quantity_added: quantity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/my-items/use", async (req, res) => {
  try {
    await ensureInventorySchemaReady();
    const currentUser = await resolveCurrentUser();
    const itemId = Number(req.body?.item_id);
    const quantity = Number(req.body?.quantity ?? 1);

    if (!itemId || quantity <= 0) {
      return res.status(400).json({ error: "item_id and positive quantity are required." });
    }

    const [rows] = await db.query(
      `
      SELECT id, quantity
      FROM member_items
      WHERE family_member_id = ? AND item_id = ?
      LIMIT 1
      `,
      [Number(currentUser.id), itemId]
    );

    if (rows.length === 0 || Number(rows[0].quantity) < quantity) {
      return res.status(400).json({ error: "Not enough inventory." });
    }

    const remaining = Number(rows[0].quantity) - quantity;
    if (remaining <= 0) {
      await db.query(`DELETE FROM member_items WHERE id = ?`, [rows[0].id]);
    } else {
      await db.query(`UPDATE member_items SET quantity = ? WHERE id = ?`, [remaining, rows[0].id]);
    }

    res.json({ message: "Item used.", item_id: itemId, quantity_used: quantity, remaining });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/my-items/active", async (req, res) => {
  try {
    await ensureInventorySchemaReady();
    const currentUser = await resolveCurrentUser();
    const itemId = Number(req.body?.item_id);
    const active = req.body?.active !== false;
    const slot = typeof req.body?.slot === "string" && req.body.slot.trim()
      ? req.body.slot.trim()
      : "room-decor";

    if (!itemId) {
      return res.status(400).json({ error: "item_id is required." });
    }

    if (!active) {
      await db.query(
        `
        DELETE FROM member_active_items
        WHERE family_member_id = ? AND item_id = ? AND slot = ?
        `,
        [Number(currentUser.id), itemId, slot]
      );

      return res.json({ message: "Item deactivated.", item_id: itemId, active: false, slot });
    }

    const [itemRows] = await db.query(
      `
      SELECT i.id
      FROM items i
      JOIN member_items mi ON mi.item_id = i.id
      WHERE mi.family_member_id = ? AND i.id = ?
      LIMIT 1
      `,
      [Number(currentUser.id), itemId]
    );

    if (itemRows.length === 0) {
      return res.status(400).json({ error: "Item is not owned by the current user." });
    }

    await db.query(
      `
      INSERT INTO member_active_items (family_member_id, item_id, slot, activated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE
        item_id = VALUES(item_id),
        activated_at = CURRENT_TIMESTAMP
      `,
      [Number(currentUser.id), itemId, slot]
    );

    const [rows] = await db.query(
      `
      SELECT
        mai.id,
        mai.item_id,
        mai.slot,
        mai.activated_at,
        i.name,
        i.category,
        i.icon
      FROM member_active_items mai
      JOIN items i ON mai.item_id = i.id
      WHERE mai.family_member_id = ? AND mai.slot = ?
      LIMIT 1
      `,
      [Number(currentUser.id), slot]
    );

    res.json({
      message: "Item activated.",
      active: true,
      slot,
      item: rows[0] ?? null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
