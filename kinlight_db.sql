CREATE DATABASE IF NOT EXISTS `kinlight_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kinlight_db`;


-- Table structure for table `families`
--


CREATE TABLE `families` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `family_id` bigint NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pet_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pet_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'dog',
  `pet_subtitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_family_id` (`family_id`),
  CONSTRAINT `fk_users_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `family_members`
--

CREATE TABLE `family_members` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `family_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `role` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_family_members_user` (`user_id`),
  KEY `idx_family_members_family_id` (`family_id`),
  CONSTRAINT `fk_family_members_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_family_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `family_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `family_member_id` bigint DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `media_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'image',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_posts_user` (`user_id`),
  KEY `fk_posts_member_user` (`family_member_id`),
  KEY `idx_posts_family_created_at` (`family_id`,`created_at`),
  CONSTRAINT `fk_posts_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_posts_member_user` FOREIGN KEY (`family_member_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_posts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `post_reactions`
--

CREATE TABLE `post_reactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `post_id` bigint NOT NULL,
  `family_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `reaction_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_post_reaction_user` (`post_id`,`user_id`),
  KEY `idx_post_reactions_family_created` (`family_id`,`created_at`),
  KEY `idx_post_reactions_post` (`post_id`),
  KEY `fk_post_reactions_user` (`user_id`),
  CONSTRAINT `fk_post_reactions_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_reactions_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_reactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `pet_messages`
--

CREATE TABLE `pet_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sender_user_id` bigint NOT NULL,
  `receiver_user_id` bigint NOT NULL,
  `family_id` bigint NOT NULL,
  `message` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pet_messages_receiver_read_created` (`receiver_user_id`,`is_read`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `care_messages`
--


CREATE TABLE `care_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sender_user_id` bigint NOT NULL,
  `receiver_user_id` bigint NOT NULL,
  `family_id` bigint NOT NULL,
  `care_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_care_messages_receiver_read_created` (`receiver_user_id`,`is_read`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `mood_entries`
--



CREATE TABLE `mood_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `family_id` bigint NOT NULL,
  `mood` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `entry_date` date NOT NULL,
  `visibility` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'private',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mood_entries_user_date` (`user_id`,`entry_date`),
  KEY `idx_mood_entries_family_date` (`family_id`,`entry_date`),
  KEY `idx_mood_entries_visibility` (`visibility`),
  CONSTRAINT `fk_mood_entries_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mood_entries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `daily_drops`
--

CREATE TABLE `daily_drops` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `family_member_id` bigint NOT NULL,
  `drop_date` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_member_drop_date` (`family_member_id`,`drop_date`),
  KEY `fk_daily_drops_item` (`item_id`),
  KEY `idx_daily_drops_member_date` (`family_member_id`,`drop_date`),
  CONSTRAINT `fk_daily_drops_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_daily_drops_user` FOREIGN KEY (`family_member_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `weekly_echo_summaries`
--


CREATE TABLE `weekly_echo_summaries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `family_id` bigint NOT NULL,
  `week_start` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ai',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_family_week` (`family_id`,`week_start`),
  CONSTRAINT `fk_weekly_echo_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `weekly_echo_reports`
--


CREATE TABLE `weekly_echo_reports` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `family_id` bigint NOT NULL,
  `week_start_date` date NOT NULL,
  `week_end_date` date NOT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `connected_days` int NOT NULL DEFAULT '0',
  `small_moments_count` int NOT NULL DEFAULT '0',
  `pet_messages_count` int NOT NULL DEFAULT '0',
  `photo_shares_count` int NOT NULL DEFAULT '0',
  `gentle_reactions_count` int NOT NULL DEFAULT '0',
  `mood_checkins_count` int NOT NULL DEFAULT '0',
  `featured_pet_message` text COLLATE utf8mb4_unicode_ci,
  `unlocked_reward_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `report_text` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_family_week_range` (`family_id`,`week_start_date`,`week_end_date`),
  KEY `idx_weekly_echo_reports_family_generated` (`family_id`,`generated_at`),
  CONSTRAINT `fk_weekly_echo_reports_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `weekly_echo_reward_claims`
--


CREATE TABLE `weekly_echo_reward_claims` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `report_id` bigint NOT NULL,
  `family_id` bigint NOT NULL,
  `claimed_by_user_id` bigint NOT NULL,
  `reward_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `claimed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_weekly_echo_reward_claim` (`report_id`,`claimed_by_user_id`),
  KEY `idx_weekly_echo_reward_claims_family` (`family_id`,`claimed_at`),
  KEY `idx_weekly_echo_reward_claims_report` (`report_id`),
  KEY `idx_weekly_echo_reward_claims_user` (`claimed_by_user_id`,`claimed_at`),
  CONSTRAINT `fk_weekly_echo_reward_claims_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_weekly_echo_reward_claims_report` FOREIGN KEY (`report_id`) REFERENCES `weekly_echo_reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_weekly_echo_reward_claims_user` FOREIGN KEY (`claimed_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `member_items`
--


CREATE TABLE `member_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `family_member_id` bigint NOT NULL,
  `item_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `acquired_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_member_item` (`family_member_id`,`item_id`),
  KEY `fk_member_items_item` (`item_id`),
  KEY `idx_member_items_member_id` (`family_member_id`),
  CONSTRAINT `fk_member_items_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_member_items_user` FOREIGN KEY (`family_member_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `member_active_items`
--


CREATE TABLE `member_active_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `family_member_id` int NOT NULL,
  `item_id` int NOT NULL,
  `slot` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'room-decor',
  `activated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_member_slot` (`family_member_id`,`slot`),
  KEY `idx_member_active_items_member` (`family_member_id`),
  KEY `idx_member_active_items_item` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

