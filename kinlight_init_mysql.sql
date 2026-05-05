-- KinLight / 208_Design MySQL database initialization
-- Usage in terminal:
--   mysql -u root -p < backend/init_mysql.sql
--
-- Usage in MySQL Workbench:
--   Open this file, then click Execute.
--
-- This script drops and recreates the demo database.

DROP DATABASE IF EXISTS kinlight;
CREATE DATABASE kinlight
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE kinlight;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS daily_drops;
DROP TABLE IF EXISTS my_items;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS moods;
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
-- Used by Home dropdown / Profile family list.
-- user_id links the displayed family member to a login user.
-- =========================
CREATE TABLE family_members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  family_id BIGINT NOT NULL,
  user_id BIGINT,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  email VARCHAR(255),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_family_members_family
    FOREIGN KEY (family_id) REFERENCES families(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_family_members_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Posts / Home scene photos
-- =========================
CREATE TABLE posts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  family_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  family_member_id BIGINT,
  title VARCHAR(255),
  content TEXT,
  image_url VARCHAR(500),
  video_url VARCHAR(500),
  media_type VARCHAR(50) DEFAULT 'image',
  topic VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_family
    FOREIGN KEY (family_id) REFERENCES families(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_posts_family_member
    FOREIGN KEY (family_member_id) REFERENCES family_members(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Mood Jar records
-- Private mood records are user-specific.
-- family_id allows family-level aggregation without exposing individual records directly.
-- =========================
CREATE TABLE moods (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  family_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  mood VARCHAR(100) NOT NULL,
  comment TEXT,
  visibility VARCHAR(20) NOT NULL DEFAULT 'private',
  mood_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_moods_user_date (user_id, mood_date),
  CONSTRAINT fk_moods_family
    FOREIGN KEY (family_id) REFERENCES families(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_moods_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Shop / DailyDrop item catalogue
-- =========================
CREATE TABLE items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  item_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url VARCHAR(500),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- User inventory
-- Each user's owned / used / placed items are isolated by user_id.
-- =========================
CREATE TABLE my_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  item_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  placed_slot VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_my_items_user_item (user_id, item_id),
  CONSTRAINT fk_my_items_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_my_items_item
    FOREIGN KEY (item_id) REFERENCES items(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- DailyDrop claim records
-- A user can claim once per day.
-- =========================
CREATE TABLE daily_drops (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  item_id BIGINT,
  claim_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_daily_drops_user_date (user_id, claim_date),
  CONSTRAINT fk_daily_drops_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_daily_drops_item
    FOREIGN KEY (item_id) REFERENCES items(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Helpful indexes
-- =========================
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_posts_family_user ON posts(family_id, user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_moods_family_user_date ON moods(family_id, user_id, mood_date);
CREATE INDEX idx_my_items_user_id ON my_items(user_id);
CREATE INDEX idx_daily_drops_user_date ON daily_drops(user_id, claim_date);

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

INSERT INTO family_members (id, family_id, user_id, name, role, email, avatar_url) VALUES
  (1, 1, 1, 'Grace', 'Daughter', 'grace@example.com', NULL),
  (2, 1, 2, 'Mom', 'Mother', 'mom@example.com', NULL),
  (3, 1, 3, 'Dad', 'Father', 'dad@example.com', NULL),
  (4, 1, 4, '度度', 'Family member', '123', NULL),
  (5, 1, 5, 'cc', 'Family member', 'cc@example.com', NULL);

INSERT INTO items (id, item_key, name, category, image_url, description) VALUES
  (1, 'pet-biscuit', 'Cookie', 'food', NULL, 'A small biscuit for the pet.'),
  (2, 'tennis-ball', 'Tennis Ball', 'toy', NULL, 'A light toy for the pet.'),
  (3, 'shopping-bag', 'Shopping Bag', 'decoration', NULL, 'A small decoration for the home scene.'),
  (4, 'soft-rug', 'Soft Rug', 'decoration', NULL, 'A warm rug for the room.'),
  (5, 'photo-frame', 'Photo Frame', 'decoration', NULL, 'A frame for small family moments.');

-- Optional starter inventory.
-- Keep this minimal to avoid making one user look like another user.
INSERT INTO my_items (user_id, item_id, quantity, is_used, placed_slot) VALUES
  (1, 1, 1, 0, NULL),
  (2, 1, 1, 0, NULL),
  (3, 1, 1, 0, NULL);

-- Make AUTO_INCREMENT continue after explicit seed IDs.
ALTER TABLE families AUTO_INCREMENT = 2;
ALTER TABLE users AUTO_INCREMENT = 6;
ALTER TABLE family_members AUTO_INCREMENT = 6;
ALTER TABLE items AUTO_INCREMENT = 6;
ALTER TABLE posts AUTO_INCREMENT = 1;
ALTER TABLE moods AUTO_INCREMENT = 1;
ALTER TABLE my_items AUTO_INCREMENT = 4;
ALTER TABLE daily_drops AUTO_INCREMENT = 1;
