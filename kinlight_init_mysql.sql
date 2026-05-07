-- KinLight / 208_Design MySQL database initialization
-- Usage in terminal:
--   mysql -u root -p < kinlight_init_mysql.sql
--
-- Usage in MySQL Workbench:
--   Open this file, then click Execute.
--
-- This script drops and recreates the demo database so it matches the
-- backend routes used by the current project.

DROP DATABASE IF EXISTS kinlight;
CREATE DATABASE kinlight
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE kinlight;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS weekly_echo_summaries;
DROP TABLE IF EXISTS pet_messages;
DROP TABLE IF EXISTS care_messages;
DROP TABLE IF EXISTS daily_drops;
DROP TABLE IF EXISTS member_items;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS mood_entries;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS family_members;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS families;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- Families
-- =========================
CREATE TABLE families (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Users
-- =========================
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  family_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  avatar_url VARCHAR(500),
  pet_name VARCHAR(255),
  pet_type VARCHAR(100) DEFAULT 'dog',
  pet_subtitle VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_family
    FOREIGN KEY (family_id) REFERENCES families(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Family members
-- This table links app users into a family with a role label.
-- The frontend currently uses the linked user id as the member identifier.
-- =========================
CREATE TABLE family_members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  family_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_family_members_user (user_id),
  CONSTRAINT fk_family_members_family
    FOREIGN KEY (family_id) REFERENCES families(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_family_members_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Posts / shared moments
-- =========================
CREATE TABLE posts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  family_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  family_member_id BIGINT,
  title VARCHAR(255),
  content TEXT,
  media_url VARCHAR(500),
  media_type VARCHAR(50) DEFAULT 'image',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_family
    FOREIGN KEY (family_id) REFERENCES families(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_posts_member_user
    FOREIGN KEY (family_member_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Mood Jar records
-- =========================
CREATE TABLE mood_entries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  family_id BIGINT NOT NULL,
  mood VARCHAR(100) NOT NULL,
  comment TEXT,
  entry_date DATE NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'private',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_mood_entries_user_date (user_id, entry_date),
  CONSTRAINT fk_mood_entries_family
    FOREIGN KEY (family_id) REFERENCES families(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_mood_entries_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Pet messages
-- =========================
CREATE TABLE pet_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sender_user_id BIGINT NOT NULL,
  receiver_user_id BIGINT NOT NULL,
  family_id BIGINT NOT NULL,
  message VARCHAR(1000) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_pet_messages_sender
    FOREIGN KEY (sender_user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pet_messages_receiver
    FOREIGN KEY (receiver_user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pet_messages_family
    FOREIGN KEY (family_id) REFERENCES families(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Care messages
-- =========================
CREATE TABLE care_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sender_user_id BIGINT NOT NULL,
  receiver_user_id BIGINT NOT NULL,
  family_id BIGINT NOT NULL,
  care_type VARCHAR(100) NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_care_messages_sender
    FOREIGN KEY (sender_user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_care_messages_receiver
    FOREIGN KEY (receiver_user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_care_messages_family
    FOREIGN KEY (family_id) REFERENCES families(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Daily Drop item catalogue
-- =========================
CREATE TABLE items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  icon VARCHAR(255),
  price INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- User inventory
-- family_member_id matches the current backend route contract and stores
-- the active user's id for inventory ownership.
-- =========================
CREATE TABLE member_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  family_member_id BIGINT NOT NULL,
  item_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_member_item (family_member_id, item_id),
  CONSTRAINT fk_member_items_user
    FOREIGN KEY (family_member_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_member_items_item
    FOREIGN KEY (item_id) REFERENCES items(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Daily Drop claim records
-- =========================
CREATE TABLE daily_drops (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  family_member_id BIGINT NOT NULL,
  drop_date VARCHAR(10) NOT NULL,
  item_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_member_drop_date (family_member_id, drop_date),
  CONSTRAINT fk_daily_drops_user
    FOREIGN KEY (family_member_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_daily_drops_item
    FOREIGN KEY (item_id) REFERENCES items(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Weekly Echo summaries
-- =========================
CREATE TABLE weekly_echo_summaries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  family_id BIGINT NOT NULL,
  week_start VARCHAR(10) NOT NULL,
  subtitle VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  source VARCHAR(30) NOT NULL DEFAULT 'ai',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_family_week (family_id, week_start),
  CONSTRAINT fk_weekly_echo_family
    FOREIGN KEY (family_id) REFERENCES families(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Helpful indexes
-- =========================
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_posts_family_created_at ON posts(family_id, created_at);
CREATE INDEX idx_mood_entries_family_date ON mood_entries(family_id, entry_date);
CREATE INDEX idx_mood_entries_visibility ON mood_entries(visibility);
CREATE INDEX idx_pet_messages_receiver_read_created ON pet_messages(receiver_user_id, is_read, created_at);
CREATE INDEX idx_care_messages_receiver_read_created ON care_messages(receiver_user_id, is_read, created_at);
CREATE INDEX idx_member_items_member_id ON member_items(family_member_id);
CREATE INDEX idx_daily_drops_member_date ON daily_drops(family_member_id, drop_date);

-- =========================
-- Seed data
-- =========================
INSERT INTO families (id, name) VALUES
  (1, 'Demo Family');

INSERT INTO users (id, family_id, name, email, avatar_url, pet_name, pet_type, pet_subtitle) VALUES
  (1, 1, 'Grace', 'grace@example.com', NULL, 'Grace''s pet', 'dog', 'White Puppy · waiting for care'),
  (2, 1, 'Mom', 'mom@example.com', NULL, 'Mom''s pet', 'dog', 'Corgi Puppy · waiting for care'),
  (3, 1, 'Dad', 'dad@example.com', NULL, 'Dad''s pet', 'dog', 'White Puppy · waiting for care'),
  (4, 1, '度度', '123', NULL, '度度''s pet', 'dog', 'White Puppy · waiting for care'),
  (5, 1, 'cc', 'cc@example.com', NULL, 'cc''s pet', 'dog', 'White Puppy · waiting for care');

INSERT INTO family_members (id, family_id, user_id, role) VALUES
  (1, 1, 1, 'Daughter'),
  (2, 1, 2, 'Mother'),
  (3, 1, 3, 'Father'),
  (4, 1, 4, 'Family member'),
  (5, 1, 5, 'Family member');

INSERT INTO items (id, name, category, icon, price) VALUES
  (1, 'Pet Biscuit', 'food', '🍪', 0),
  (2, 'Pet Food', 'food', '🍖', 0),
  (3, 'Pet Milk', 'drink', '🥛', 0),
  (4, 'Pet Water', 'drink', '💧', 0),
  (5, 'Small Ball', 'toy', '🟠', 0),
  (6, 'Canned Tuna', 'food', '🥫', 0),
  (7, 'Fish Toy', 'toy', '🐟', 0),
  (8, 'Chew Toy', 'toy', '🪢', 0),
  (9, 'Plush Bear', 'toy', '🧸', 0),
  (10, 'Small Bone', 'food', '🦴', 0);

INSERT INTO member_items (family_member_id, item_id, quantity) VALUES
  (1, 1, 1),
  (1, 4, 1),
  (1, 2, 1),
  (2, 1, 1),
  (3, 1, 1);

-- Make AUTO_INCREMENT continue after explicit seed IDs.
ALTER TABLE families AUTO_INCREMENT = 2;
ALTER TABLE users AUTO_INCREMENT = 6;
ALTER TABLE family_members AUTO_INCREMENT = 6;
ALTER TABLE items AUTO_INCREMENT = 11;
ALTER TABLE posts AUTO_INCREMENT = 1;
ALTER TABLE mood_entries AUTO_INCREMENT = 1;
ALTER TABLE member_items AUTO_INCREMENT = 6;
ALTER TABLE daily_drops AUTO_INCREMENT = 1;
ALTER TABLE weekly_echo_summaries AUTO_INCREMENT = 1;
