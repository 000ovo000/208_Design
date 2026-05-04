const express = require("express");
const db = require("../db");
const { getCurrentUserId } = require("../current-user");

const router = express.Router();
let inventorySchemaReadyPromise = null;

const DAILY_DROP_SEEDS = [
  { name: "Pet Biscuit", category: "food", icon: "🍪" },
  { name: "Pet Milk", category: "food", icon: "🥛" },
  { name: "Water Bowl", category: "food", icon: "💧" },
  { name: "Small Ball", category: "toy", icon: "🟠" },
  { name: "Crunchy Kibble", category: "food", icon: "🥣" },
  { name: "Pet Brush", category: "toy", icon: "🪮" },
  { name: "Pet Bandana", category: "toy", icon: "🧣" },
  { name: "Fish Snack", category: "food", icon: "🐟" },
  { name: "Yarn Ball", category: "toy", icon: "🧶" },
  { name: "Feather Toy", category: "toy", icon: "🪶" },
  { name: "Cat Kibble", category: "food", icon: "🥣" },
  { name: "Tuna Bite", category: "food", icon: "🥫" },
  { name: "Toy Mouse", category: "toy", icon: "🐭" },
  { name: "Jingle Bell", category: "toy", icon: "🔔" },
  { name: "Scratching Pad", category: "toy", icon: "🧩" },
  { name: "Small Bone", category: "food", icon: "🦴" },
  { name: "Chew Toy", category: "toy", icon: "🪢" },
  { name: "Tennis Ball", category: "toy", icon: "🎾" },
  { name: "Puppy Kibble", category: "food", icon: "🥣" },
  { name: "Chicken Bite", category: "food", icon: "🍗" },
  { name: "Carrot Nibble", category: "food", icon: "🥕" },
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

      for (const { name, category, icon } of DAILY_DROP_SEEDS) {
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
      const [carrotRows] = await db.query(`SELECT id FROM items WHERE name = ? LIMIT 1`, ["Carrot"]);
      const [tennisRows] = await db.query(`SELECT id FROM items WHERE name = ? LIMIT 1`, ["Tennis Ball"]);

      if (carrotRows[0]?.id) {
        await db.query(
          `
          INSERT INTO member_items (family_member_id, item_id, quantity)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = GREATEST(member_items.quantity, VALUES(quantity))
          `,
          [Number(currentUser.id), Number(carrotRows[0].id), 2]
        );
      }

      if (tennisRows[0]?.id) {
        await db.query(
          `
          INSERT INTO member_items (family_member_id, item_id, quantity)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = GREATEST(member_items.quantity, VALUES(quantity))
          `,
          [Number(currentUser.id), Number(tennisRows[0].id), 1]
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

module.exports = router;
