const express = require("express");
const db = require("../db");
const { getCurrentUserId } = require("../current-user");

const router = express.Router();
let weeklyEchoSchemaReadyPromise = null;

const WEEKLY_REWARDS = [
  { id: "pet-sofa1", name: "Pet Sofa 1", petType: "both", triggerType: "reaction" },
  { id: "pet-sofa2", name: "Pet Sofa 2", petType: "both", triggerType: "photo" },
  { id: "pet-sofa3", name: "Pet Sofa 3", petType: "both", triggerType: "mood" },
  { id: "pet-sofa4", name: "Pet Sofa 4", petType: "both", triggerType: "message" },
  { id: "pet-sofa5", name: "Pet Sofa 5", petType: "both", triggerType: "special" },
  { id: "cat-climber", name: "Cat Climber", petType: "cat", triggerType: "balanced" },
  { id: "cat-teaser", name: "Cat Teaser", petType: "cat", triggerType: "reaction" },
  { id: "carrot-toy", name: "Carrot Toy", petType: "dog", triggerType: "balanced" },
];

async function resolveCurrentUser() {
  try {
    const [rows] = await db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.pet_type,
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
    pet_type: "dog",
  };
}

function pad(value) {
  return `${value}`.padStart(2, "0");
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getCurrentWeekSunday(now = new Date()) {
  const current = startOfDay(now);
  current.setDate(current.getDate() - current.getDay());
  return current;
}

function getTargetReportRange(now = new Date()) {
  const currentWeekSunday = getCurrentWeekSunday(now);
  const weekStartDate = addDays(currentWeekSunday, -7);
  const weekEndDate = addDays(currentWeekSunday, -1);
  return {
    weekStartDate: formatDate(weekStartDate),
    weekEndDate: formatDate(weekEndDate),
  };
}

function isTruthyRefreshFlag(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "refresh";
}

async function ensureWeeklyEchoSchemaReady() {
  if (!weeklyEchoSchemaReadyPromise) {
    weeklyEchoSchemaReadyPromise = (async () => {
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

      await db.query(`
        CREATE TABLE IF NOT EXISTS weekly_echo_reports (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          family_id BIGINT NOT NULL,
          week_start_date DATE NOT NULL,
          week_end_date DATE NOT NULL,
          generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          connected_days INT NOT NULL DEFAULT 0,
          small_moments_count INT NOT NULL DEFAULT 0,
          pet_messages_count INT NOT NULL DEFAULT 0,
          photo_shares_count INT NOT NULL DEFAULT 0,
          gentle_reactions_count INT NOT NULL DEFAULT 0,
          mood_checkins_count INT NOT NULL DEFAULT 0,
          featured_pet_message TEXT NULL,
          unlocked_reward_id VARCHAR(100) NULL,
          report_text TEXT NULL,
          UNIQUE KEY uniq_family_week_range (family_id, week_start_date, week_end_date),
          INDEX idx_weekly_echo_reports_family_generated (family_id, generated_at),
          CONSTRAINT fk_weekly_echo_reports_family
            FOREIGN KEY (family_id) REFERENCES families(id)
            ON DELETE CASCADE
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS weekly_echo_reward_claims (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          report_id BIGINT NOT NULL,
          family_id BIGINT NOT NULL,
          claimed_by_user_id BIGINT NOT NULL,
          reward_id VARCHAR(100) NOT NULL,
          claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_weekly_echo_reward_claim (report_id, claimed_by_user_id),
          INDEX idx_weekly_echo_reward_claims_report (report_id),
          INDEX idx_weekly_echo_reward_claims_family (family_id, claimed_at),
          INDEX idx_weekly_echo_reward_claims_user (claimed_by_user_id, claimed_at),
          CONSTRAINT fk_weekly_echo_reward_claims_report
            FOREIGN KEY (report_id) REFERENCES weekly_echo_reports(id)
            ON DELETE CASCADE,
          CONSTRAINT fk_weekly_echo_reward_claims_family
            FOREIGN KEY (family_id) REFERENCES families(id)
            ON DELETE CASCADE,
          CONSTRAINT fk_weekly_echo_reward_claims_user
            FOREIGN KEY (claimed_by_user_id) REFERENCES users(id)
            ON DELETE CASCADE
        )
      `);

      const [claimIndexRows] = await db.query(
        `
        SELECT
          INDEX_NAME,
          COLUMN_NAME,
          SEQ_IN_INDEX,
          NON_UNIQUE
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'weekly_echo_reward_claims'
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
        `
      );

      const claimIndexes = new Map();
      claimIndexRows.forEach((row) => {
        const existing = claimIndexes.get(row.INDEX_NAME) ?? {
          columns: [],
          nonUnique: Number(row.NON_UNIQUE ?? 1),
        };
        existing.columns[Number(row.SEQ_IN_INDEX) - 1] = row.COLUMN_NAME;
        existing.nonUnique = Number(row.NON_UNIQUE ?? existing.nonUnique);
        claimIndexes.set(row.INDEX_NAME, existing);
      });

      const reportClaimIndex = claimIndexes.get("uniq_weekly_echo_reward_claim");
      const hasPerUserUniqueIndex =
        reportClaimIndex &&
        reportClaimIndex.nonUnique === 0 &&
        reportClaimIndex.columns.join(",") === "report_id,claimed_by_user_id";

      const reportForeignKeyIndex = Array.from(claimIndexes.entries()).find(
        ([indexName, index]) =>
          indexName !== "uniq_weekly_echo_reward_claim" && index.columns[0] === "report_id"
      );

      if (!reportForeignKeyIndex) {
        await db.query(`
          ALTER TABLE weekly_echo_reward_claims
          ADD INDEX idx_weekly_echo_reward_claims_report (report_id)
        `);
      }

      if (reportClaimIndex && !hasPerUserUniqueIndex) {
        await db.query(
          `ALTER TABLE weekly_echo_reward_claims DROP INDEX uniq_weekly_echo_reward_claim`
        );
      }

      if (!hasPerUserUniqueIndex) {
        await db.query(`
          ALTER TABLE weekly_echo_reward_claims
          ADD UNIQUE KEY uniq_weekly_echo_reward_claim (report_id, claimed_by_user_id)
        `);
      }

      const userClaimIndex = claimIndexes.get("idx_weekly_echo_reward_claims_user");
      const hasUserClaimIndex =
        userClaimIndex &&
        userClaimIndex.columns.join(",") === "claimed_by_user_id,claimed_at";

      if (!hasUserClaimIndex) {
        await db.query(`
          ALTER TABLE weekly_echo_reward_claims
          ADD INDEX idx_weekly_echo_reward_claims_user (claimed_by_user_id, claimed_at)
        `);
      }
    })();
  }

  return weeklyEchoSchemaReadyPromise;
}

function normalizePetType(petType) {
  return String(petType || "").trim().toLowerCase() === "cat" ? "cat" : "dog";
}

function selectWeeklyReward(stats, petType) {
  const normalizedPetType = normalizePetType(petType);
  const availableRewards = WEEKLY_REWARDS.filter(
    (reward) => reward.petType === "both" || reward.petType === normalizedPetType
  );

  if (
    stats.connectedDays <= 0 &&
    stats.smallMomentsCount <= 0 &&
    stats.petMessagesCount <= 0 &&
    stats.photoSharesCount <= 0 &&
    stats.gentleReactionsCount <= 0 &&
    stats.moodCheckinsCount <= 0
  ) {
    return null;
  }

  if (stats.photoSharesCount >= 2) {
    return availableRewards.find((reward) => reward.triggerType === "photo") ?? availableRewards[0];
  }

  if (stats.moodCheckinsCount >= 3) {
    return availableRewards.find((reward) => reward.triggerType === "mood") ?? availableRewards[0];
  }

  if (stats.petMessagesCount >= 3) {
    return availableRewards.find((reward) => reward.triggerType === "message") ?? availableRewards[0];
  }

  if (stats.gentleReactionsCount >= 5) {
    return availableRewards.find((reward) => reward.triggerType === "reaction") ?? availableRewards[0];
  }

  return availableRewards.find((reward) => reward.triggerType === "balanced") ?? availableRewards[0];
}

function buildReportText({ stats, featuredPetMessage, reward }) {
  const lines = [
    `Your family kept ${stats.connectedDays} connected day${stats.connectedDays === 1 ? "" : "s"}.`,
    `This week, your family shared ${stats.smallMomentsCount} small moment${stats.smallMomentsCount === 1 ? "" : "s"}.`,
    `${stats.petMessagesCount} pet messages, ${stats.photoSharesCount} photo shares, ${stats.gentleReactionsCount} gentle reactions, and ${stats.moodCheckinsCount} mood check-ins left traces through the week.`,
  ];

  if (featuredPetMessage) {
    lines.push(`One small note stayed with the pet: "${featuredPetMessage}".`);
  }

  if (reward) {
    lines.push(`${reward.name} was unlocked for the family pet.`);
  } else {
    lines.push("No weekly keepsake was unlocked this time, but the board still kept the week.");
  }

  return lines.join("\n");
}

function normalizeKeepsakeCategory(category) {
  const value = String(category ?? "").trim().toLowerCase();

  if (value === "food") return { category: "food", label: "Food" };
  if (value === "drink") return { category: "drink", label: "Drink" };
  if (value === "toy" || value === "basic-toy" || value === "care") {
    return { category: "basic-toy", label: "Basic toy" };
  }

  return null;
}

function formatKeepsakePreview(names) {
  const uniqueNames = Array.from(new Set(names.filter(Boolean)));
  if (uniqueNames.length > 3) {
    return `${uniqueNames.slice(0, 3).join(", ")}, ...`;
  }

  return uniqueNames.join(", ");
}

function buildWeeklySummary({ stats, featuredPetMessage }) {
  const safeMessage = featuredPetMessage || "No shared note this week yet.";

  return {
    subtitle: `${stats.connectedDays} connected day${stats.connectedDays === 1 ? "" : "s"} · ${stats.smallMomentsCount} small moment${stats.smallMomentsCount === 1 ? "" : "s"}`,
    body: [
      `This week, your family shared ${stats.smallMomentsCount} small moment${stats.smallMomentsCount === 1 ? "" : "s"}.`,
      `Latest note from this week: "${safeMessage}".`,
      `${stats.petMessagesCount} pet messages, ${stats.photoSharesCount} photo shares, ${stats.gentleReactionsCount} gentle reactions, and ${stats.moodCheckinsCount} mood check-ins stayed on the board.`,
    ].join("\n"),
  };
}

async function fetchWeeklyStats(familyId, weekStartDate, weekEndDate) {
  const nextDate = formatDate(addDays(new Date(`${weekEndDate}T00:00:00`), 1));

  const [
    [connectedDayRows],
    [smallMomentRows],
    [petMessageRows],
    [photoShareRows],
    [gentleReactionRows],
    [moodRows],
    [featuredPetMessageRows],
  ] = await Promise.all([
    db.query(
      `
      SELECT COUNT(DISTINCT activity_date) AS connected_days
      FROM (
        SELECT DATE(created_at) AS activity_date
        FROM posts
        WHERE family_id = ? AND created_at >= ? AND created_at < ?
        UNION
        SELECT DATE(created_at) AS activity_date
        FROM pet_messages
        WHERE family_id = ? AND created_at >= ? AND created_at < ?
        UNION
        SELECT DATE(created_at) AS activity_date
        FROM post_reactions
        WHERE family_id = ? AND created_at >= ? AND created_at < ?
        UNION
        SELECT entry_date AS activity_date
        FROM mood_entries
        WHERE family_id = ? AND entry_date >= ? AND entry_date <= ?
      ) AS weekly_activity
      `,
      [
        Number(familyId), weekStartDate, nextDate,
        Number(familyId), weekStartDate, nextDate,
        Number(familyId), weekStartDate, nextDate,
        Number(familyId), weekStartDate, weekEndDate,
      ]
    ),
    db.query(
      `
      SELECT
        (
          SELECT COUNT(*)
          FROM posts
          WHERE family_id = ? AND created_at >= ? AND created_at < ?
        ) +
        (
          SELECT COUNT(*)
          FROM pet_messages
          WHERE family_id = ? AND created_at >= ? AND created_at < ?
        ) +
        (
          SELECT COUNT(*)
          FROM mood_entries
          WHERE family_id = ? AND entry_date >= ? AND entry_date <= ?
        ) AS small_moments_count
      `,
      [
        Number(familyId), weekStartDate, nextDate,
        Number(familyId), weekStartDate, nextDate,
        Number(familyId), weekStartDate, weekEndDate,
      ]
    ),
    db.query(
      `
      SELECT COUNT(*) AS pet_messages_count
      FROM pet_messages
      WHERE family_id = ? AND created_at >= ? AND created_at < ?
      `,
      [Number(familyId), weekStartDate, nextDate]
    ),
    db.query(
      `
      SELECT COUNT(*) AS photo_shares_count
      FROM posts
      WHERE family_id = ?
        AND created_at >= ?
        AND created_at < ?
        AND (
          (media_type = 'image' AND media_url IS NOT NULL AND media_url <> '')
          OR (media_url IS NOT NULL AND media_url <> '')
        )
      `,
      [Number(familyId), weekStartDate, nextDate]
    ),
    db.query(
      `
      SELECT COUNT(*) AS gentle_reactions_count
      FROM post_reactions
      WHERE family_id = ? AND created_at >= ? AND created_at < ?
      `,
      [Number(familyId), weekStartDate, nextDate]
    ),
    db.query(
      `
      SELECT COUNT(*) AS mood_checkins_count
      FROM mood_entries
      WHERE family_id = ? AND entry_date >= ? AND entry_date <= ?
      `,
      [Number(familyId), weekStartDate, weekEndDate]
    ),
    db.query(
      `
      SELECT recent_messages.message AS featured_text
      FROM (
        SELECT message, created_at
        FROM pet_messages
        WHERE family_id = ?
          AND created_at >= ?
          AND created_at < ?
          AND message IS NOT NULL
          AND TRIM(message) <> ''
        ORDER BY created_at DESC
        LIMIT 50
      ) AS recent_messages
      ORDER BY recent_messages.created_at DESC
      LIMIT 1
      `,
      [Number(familyId), weekStartDate, nextDate]
    ),
  ]);

  const stats = {
    connectedDays: Number(connectedDayRows[0]?.connected_days ?? 0),
    smallMomentsCount: Number(smallMomentRows[0]?.small_moments_count ?? 0),
    petMessagesCount: Number(petMessageRows[0]?.pet_messages_count ?? 0),
    photoSharesCount: Number(photoShareRows[0]?.photo_shares_count ?? 0),
    gentleReactionsCount: Number(gentleReactionRows[0]?.gentle_reactions_count ?? 0),
    moodCheckinsCount: Number(moodRows[0]?.mood_checkins_count ?? 0),
    featuredPetMessage: String(featuredPetMessageRows[0]?.featured_text ?? "").trim(),
  };

  console.log(
    `[weekly-echo] stats family=${Number(familyId)} week=${weekStartDate}..${weekEndDate} connectedDays=${stats.connectedDays} smallMoments=${stats.smallMomentsCount} moodCheckins=${stats.moodCheckinsCount} petMessages=${stats.petMessagesCount} photos=${stats.photoSharesCount} reactions=${stats.gentleReactionsCount}`
  );

  return stats;
}

async function fetchLatestSourceUpdatedAt(familyId, weekStartDate, weekEndDate) {
  const nextDate = formatDate(addDays(new Date(`${weekEndDate}T00:00:00`), 1));
  const [rows] = await db.query(
    `
    SELECT GREATEST(
      COALESCE((
        SELECT MAX(created_at)
        FROM posts
        WHERE family_id = ? AND created_at >= ? AND created_at < ?
      ), '1970-01-01 00:00:00'),
      COALESCE((
        SELECT MAX(created_at)
        FROM pet_messages
        WHERE family_id = ? AND created_at >= ? AND created_at < ?
      ), '1970-01-01 00:00:00'),
      COALESCE((
        SELECT MAX(created_at)
        FROM post_reactions
        WHERE family_id = ? AND created_at >= ? AND created_at < ?
      ), '1970-01-01 00:00:00'),
      COALESCE((
        SELECT MAX(created_at)
        FROM mood_entries
        WHERE family_id = ? AND entry_date >= ? AND entry_date <= ?
      ), '1970-01-01 00:00:00')
    ) AS latest_source_updated_at
    `,
    [
      Number(familyId), weekStartDate, nextDate,
      Number(familyId), weekStartDate, nextDate,
      Number(familyId), weekStartDate, nextDate,
      Number(familyId), weekStartDate, weekEndDate,
    ]
  );

  return String(rows[0]?.latest_source_updated_at ?? "1970-01-01 00:00:00");
}

function shouldRegenerateReport(existingReport, latestSourceUpdatedAt, forceRefresh = false) {
  if (forceRefresh) return true;
  if (!existingReport) return true;
  if (!latestSourceUpdatedAt) return false;

  const latestSourceTime = new Date(String(latestSourceUpdatedAt).replace(" ", "T"));
  const generatedAt = new Date(String(existingReport.generated_at ?? "").replace(" ", "T"));

  if (Number.isNaN(latestSourceTime.getTime()) || Number.isNaN(generatedAt.getTime())) {
    return false;
  }

  return latestSourceTime.getTime() > generatedAt.getTime();
}

async function getReportByRange(familyId, weekStartDate, weekEndDate) {
  const [rows] = await db.query(
    `
    SELECT
      id,
      family_id,
      DATE_FORMAT(week_start_date, '%Y-%m-%d') AS week_start_date,
      DATE_FORMAT(week_end_date, '%Y-%m-%d') AS week_end_date,
      generated_at,
      connected_days,
      small_moments_count,
      pet_messages_count,
      photo_shares_count,
      gentle_reactions_count,
      mood_checkins_count,
      featured_pet_message,
      unlocked_reward_id,
      report_text
    FROM weekly_echo_reports
    WHERE family_id = ? AND week_start_date = ? AND week_end_date = ?
    LIMIT 1
    `,
    [Number(familyId), weekStartDate, weekEndDate]
  );

  return rows[0] ?? null;
}

async function getLatestReport(familyId) {
  const [rows] = await db.query(
    `
    SELECT
      id,
      family_id,
      DATE_FORMAT(week_start_date, '%Y-%m-%d') AS week_start_date,
      DATE_FORMAT(week_end_date, '%Y-%m-%d') AS week_end_date,
      generated_at,
      connected_days,
      small_moments_count,
      pet_messages_count,
      photo_shares_count,
      gentle_reactions_count,
      mood_checkins_count,
      featured_pet_message,
      unlocked_reward_id,
      report_text
    FROM weekly_echo_reports
    WHERE family_id = ?
    ORDER BY week_start_date DESC, id DESC
    LIMIT 1
    `,
    [Number(familyId)]
  );

  return rows[0] ?? null;
}

async function generateReport({ familyId, petType, weekStartDate, weekEndDate }) {
  const stats = await fetchWeeklyStats(familyId, weekStartDate, weekEndDate);
  const reward = selectWeeklyReward(stats, petType);
  const reportText = buildReportText({
    stats,
    featuredPetMessage: stats.featuredPetMessage,
    reward,
  });
  const existingReport = await getReportByRange(familyId, weekStartDate, weekEndDate);

  if (existingReport) {
    await db.query(
      `
      UPDATE weekly_echo_reports
      SET
        generated_at = CURRENT_TIMESTAMP,
        connected_days = ?,
        small_moments_count = ?,
        pet_messages_count = ?,
        photo_shares_count = ?,
        gentle_reactions_count = ?,
        mood_checkins_count = ?,
        featured_pet_message = ?,
        unlocked_reward_id = ?,
        report_text = ?
      WHERE id = ?
      `,
      [
        stats.connectedDays,
        stats.smallMomentsCount,
        stats.petMessagesCount,
        stats.photoSharesCount,
        stats.gentleReactionsCount,
        stats.moodCheckinsCount,
        stats.featuredPetMessage || null,
        reward?.id ?? null,
        reportText,
        Number(existingReport.id),
      ]
    );
  } else {
    await db.query(
      `
      INSERT INTO weekly_echo_reports (
        family_id,
        week_start_date,
        week_end_date,
        generated_at,
        connected_days,
        small_moments_count,
        pet_messages_count,
        photo_shares_count,
        gentle_reactions_count,
        mood_checkins_count,
        featured_pet_message,
        unlocked_reward_id,
        report_text
      )
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Number(familyId),
        weekStartDate,
        weekEndDate,
        stats.connectedDays,
        stats.smallMomentsCount,
        stats.petMessagesCount,
        stats.photoSharesCount,
        stats.gentleReactionsCount,
        stats.moodCheckinsCount,
        stats.featuredPetMessage || null,
        reward?.id ?? null,
        reportText,
      ]
    );
  }

  return getReportByRange(familyId, weekStartDate, weekEndDate);
}

function findRewardById(rewardId) {
  return WEEKLY_REWARDS.find((reward) => reward.id === rewardId) ?? null;
}

async function getRewardClaim(reportId, userId) {
  const [rows] = await db.query(
    `
    SELECT id, reward_id, claimed_at, claimed_by_user_id
    FROM weekly_echo_reward_claims
    WHERE report_id = ? AND claimed_by_user_id = ?
    LIMIT 1
    `,
    [Number(reportId), Number(userId)]
  );

  return rows[0] ?? null;
}

function serializeReport(report, rewardClaim) {
  const unlockedReward = findRewardById(report?.unlocked_reward_id);

  return {
    reportId: Number(report?.id ?? 0),
    familyId: Number(report?.family_id ?? 0),
    weekStartDate: report?.week_start_date ?? null,
    weekEndDate: report?.week_end_date ?? null,
    connectedDays: Number(report?.connected_days ?? 0),
    smallMomentsCount: Number(report?.small_moments_count ?? 0),
    petMessagesCount: Number(report?.pet_messages_count ?? 0),
    photoSharesCount: Number(report?.photo_shares_count ?? 0),
    gentleReactionsCount: Number(report?.gentle_reactions_count ?? 0),
    moodCheckinsCount: Number(report?.mood_checkins_count ?? 0),
    featuredPetMessage: report?.featured_pet_message ?? "",
    reportText: report?.report_text ?? "",
    unlockedReward: unlockedReward
      ? {
          id: unlockedReward.id,
          name: unlockedReward.name,
        }
      : null,
    rewardClaimed: Boolean(rewardClaim),
  };
}

async function fetchWeeklyDailyDropKeepsakes(familyId, weekStartDate) {
  try {
    const [rows] = await db.query(
      `
      SELECT
        i.name AS item_name,
        i.category,
        COUNT(*) AS item_count
      FROM daily_drops dd
      JOIN items i ON dd.item_id = i.id
      JOIN family_members fm ON dd.family_member_id = fm.user_id
      WHERE fm.family_id = ?
        AND dd.drop_date >= ?
      GROUP BY i.name, i.category
      ORDER BY item_count DESC, item_name ASC
      `,
      [Number(familyId), weekStartDate]
    );

    const summaryMap = new Map();

    rows.forEach((row) => {
      const normalized = normalizeKeepsakeCategory(row.category);
      if (!normalized) return;

      const current = summaryMap.get(normalized.category) ?? {
        category: normalized.category,
        label: normalized.label,
        count: 0,
        names: [],
      };
      current.count += Number(row.item_count ?? 0);
      if (row.item_name && !current.names.includes(row.item_name)) {
        current.names.push(row.item_name);
      }
      summaryMap.set(normalized.category, current);
    });

    return ["food", "drink", "basic-toy"]
      .map((category) => {
        const summary = summaryMap.get(category);
        if (!summary || summary.count <= 0) return null;

        return {
          category: summary.category,
          label: summary.label,
          count: summary.count,
          preview: formatKeepsakePreview(summary.names),
        };
      })
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

router.post("/summary", async (req, res) => {
  try {
    await ensureWeeklyEchoSchemaReady();
    const currentUser = await resolveCurrentUser();
    const { weekStartDate, weekEndDate } = getTargetReportRange(new Date());
    const stats = await fetchWeeklyStats(currentUser.family_id, weekStartDate, weekEndDate);
    const keepsakes = await fetchWeeklyDailyDropKeepsakes(currentUser.family_id, weekStartDate);

    return res.json({
      summary: buildWeeklySummary({
        stats,
        featuredPetMessage: stats.featuredPetMessage || "No shared note this week yet.",
      }),
      stats: {
        petMessages: stats.petMessagesCount,
        photoShares: stats.photoSharesCount,
        gentleReactions: stats.gentleReactionsCount,
        moodCheckIns: stats.moodCheckinsCount,
        connectedDays: stats.connectedDays,
        smallMoments: stats.smallMomentsCount,
      },
      keepsakes,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/current", async (req, res) => {
  try {
    await ensureWeeklyEchoSchemaReady();
    const currentUser = await resolveCurrentUser();
    const now = new Date();
    const isSunday = now.getDay() === 0;
    const targetRange = getTargetReportRange(now);
    const forceRefresh = isTruthyRefreshFlag(String(req.query?.refresh || ""));

    let report = await getReportByRange(
      currentUser.family_id,
      targetRange.weekStartDate,
      targetRange.weekEndDate
    );
    const latestSourceUpdatedAt = await fetchLatestSourceUpdatedAt(
      currentUser.family_id,
      targetRange.weekStartDate,
      targetRange.weekEndDate
    );

    console.log(
      `[weekly-echo] current user=${Number(currentUser.id)} family=${Number(
        currentUser.family_id
      )} week=${targetRange.weekStartDate}..${targetRange.weekEndDate} forceRefresh=${forceRefresh} latestSourceUpdatedAt=${latestSourceUpdatedAt} existingReportId=${Number(
        report?.id ?? 0
      )}`
    );

    if (shouldRegenerateReport(report, latestSourceUpdatedAt, forceRefresh)) {
      report = await generateReport({
        familyId: currentUser.family_id,
        petType: currentUser.pet_type,
        weekStartDate: targetRange.weekStartDate,
        weekEndDate: targetRange.weekEndDate,
      });
    } else if (!report && isSunday) {
      report = await generateReport({
        familyId: currentUser.family_id,
        petType: currentUser.pet_type,
        weekStartDate: targetRange.weekStartDate,
        weekEndDate: targetRange.weekEndDate,
      });
    } else if (!report) {
      report = await getLatestReport(currentUser.family_id);
    }

    if (!report) {
      report = await generateReport({
        familyId: currentUser.family_id,
        petType: currentUser.pet_type,
        weekStartDate: targetRange.weekStartDate,
        weekEndDate: targetRange.weekEndDate,
      });
    }

    if (!report) {
      return res.json(null);
    }

    const rewardClaim = await getRewardClaim(report.id, currentUser.id);
    return res.json(serializeReport(report, rewardClaim));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/regenerate-current", async (req, res) => {
  try {
    await ensureWeeklyEchoSchemaReady();
    const currentUser = await resolveCurrentUser();
    const now = new Date();
    const targetRange = getTargetReportRange(now);

    const report = await generateReport({
      familyId: currentUser.family_id,
      petType: currentUser.pet_type,
      weekStartDate: targetRange.weekStartDate,
      weekEndDate: targetRange.weekEndDate,
    });

    if (!report) {
      return res.status(404).json({ error: "Weekly Echo report could not be generated." });
    }

    const rewardClaim = await getRewardClaim(report.id, currentUser.id);
    console.log(
      `[weekly-echo] manually regenerated reportId=${Number(report.id)} family=${Number(
        currentUser.family_id
      )} week=${targetRange.weekStartDate}..${targetRange.weekEndDate}`
    );
    return res.json(serializeReport(report, rewardClaim));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/:reportId/claim-reward", async (req, res) => {
  let connection = null;

  try {
    await ensureWeeklyEchoSchemaReady();
    const currentUser = await resolveCurrentUser();
    const reportId = Number(req.params.reportId);

    if (!reportId) {
      return res.status(400).json({ error: "Invalid report id." });
    }

    const [reportRows] = await db.query(
      `
      SELECT
        id,
        family_id,
        DATE_FORMAT(week_start_date, '%Y-%m-%d') AS week_start_date,
        DATE_FORMAT(week_end_date, '%Y-%m-%d') AS week_end_date,
        unlocked_reward_id
      FROM weekly_echo_reports
      WHERE id = ? AND family_id = ?
      LIMIT 1
      `,
      [reportId, Number(currentUser.family_id)]
    );

    const targetReport = reportRows[0] ?? null;
    if (!targetReport) {
      return res.status(404).json({ error: "Weekly Echo report not found." });
    }

    const reward = findRewardById(targetReport.unlocked_reward_id);
    if (!reward) {
      const rewardClaim = await getRewardClaim(reportId, currentUser.id);
      const [fullReportRows] = await db.query(
        `
        SELECT
          id,
          family_id,
          DATE_FORMAT(week_start_date, '%Y-%m-%d') AS week_start_date,
          DATE_FORMAT(week_end_date, '%Y-%m-%d') AS week_end_date,
          connected_days,
          small_moments_count,
          pet_messages_count,
          photo_shares_count,
          gentle_reactions_count,
          mood_checkins_count,
          featured_pet_message,
          unlocked_reward_id,
          report_text
        FROM weekly_echo_reports
        WHERE id = ?
        LIMIT 1
        `,
        [reportId]
      );
      return res.json(serializeReport(fullReportRows[0], rewardClaim));
    }

    const existingClaim = await getRewardClaim(reportId, currentUser.id);
    if (existingClaim) {
      const [fullReportRows] = await db.query(
        `
        SELECT
          id,
          family_id,
          DATE_FORMAT(week_start_date, '%Y-%m-%d') AS week_start_date,
          DATE_FORMAT(week_end_date, '%Y-%m-%d') AS week_end_date,
          connected_days,
          small_moments_count,
          pet_messages_count,
          photo_shares_count,
          gentle_reactions_count,
          mood_checkins_count,
          featured_pet_message,
          unlocked_reward_id,
          report_text
        FROM weekly_echo_reports
        WHERE id = ?
        LIMIT 1
        `,
        [reportId]
      );
      return res.json(serializeReport(fullReportRows[0], existingClaim));
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.query(
      `
      INSERT INTO items (name, category, icon, price)
      SELECT ?, 'weekly-reward', NULL, 0
      WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = ?)
      `,
      [reward.name, reward.name]
    );

    const [itemRows] = await connection.query(
      `SELECT id FROM items WHERE name = ? LIMIT 1`,
      [reward.name]
    );
    const rewardItemId = Number(itemRows[0]?.id ?? 0);

    if (!rewardItemId) {
      throw new Error("Weekly reward item could not be prepared.");
    }

    await connection.query(
      `
      INSERT INTO weekly_echo_reward_claims (
        report_id,
        family_id,
        claimed_by_user_id,
        reward_id,
        claimed_at
      )
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [reportId, Number(currentUser.family_id), Number(currentUser.id), reward.id]
    );

    await connection.query(
      `
      INSERT INTO member_items (family_member_id, item_id, quantity)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE quantity = quantity + 1
      `,
      [Number(currentUser.id), rewardItemId]
    );

    await connection.commit();
    connection.release();
    connection = null;

    const [fullReportRows] = await db.query(
      `
      SELECT
        id,
        family_id,
        DATE_FORMAT(week_start_date, '%Y-%m-%d') AS week_start_date,
        DATE_FORMAT(week_end_date, '%Y-%m-%d') AS week_end_date,
        connected_days,
        small_moments_count,
        pet_messages_count,
        photo_shares_count,
        gentle_reactions_count,
        mood_checkins_count,
        featured_pet_message,
        unlocked_reward_id,
        report_text
      FROM weekly_echo_reports
      WHERE id = ?
      LIMIT 1
      `,
      [reportId]
    );
    const rewardClaim = await getRewardClaim(reportId, currentUser.id);

    return res.json(serializeReport(fullReportRows[0], rewardClaim));
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }

    if (error && (error.code === "ER_DUP_ENTRY" || error.errno === 1062)) {
      try {
        const currentUser = await resolveCurrentUser();
        const reportId = Number(req.params.reportId);
        const [reportRows] = await db.query(
          `
          SELECT
            id,
            family_id,
            DATE_FORMAT(week_start_date, '%Y-%m-%d') AS week_start_date,
            DATE_FORMAT(week_end_date, '%Y-%m-%d') AS week_end_date,
            connected_days,
            small_moments_count,
            pet_messages_count,
            photo_shares_count,
            gentle_reactions_count,
            mood_checkins_count,
            featured_pet_message,
            unlocked_reward_id,
            report_text
          FROM weekly_echo_reports
          WHERE id = ?
          LIMIT 1
          `,
          [reportId]
        );
        const rewardClaim = await getRewardClaim(reportId, currentUser.id);
        return res.json(serializeReport(reportRows[0], rewardClaim));
      } catch (fallbackError) {
        // fall through to default response below
      }
    }

    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
