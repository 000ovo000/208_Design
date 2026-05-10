USE `kinlight_db`;

-- =========================================================
-- Kinlight demo seed data
-- Run this after kinlight_db.sql on an empty kinlight_db database.
-- This file only inserts seed data. It does not change table structure.
--
-- Note:
-- The current schema has no table for "owned pets".
-- Therefore this seed sets each user's current Home pet using users.pet_type / users.pet_name.
-- If the frontend stores unlocked pets in localStorage, "each user owns all pets" must still be handled by frontend state.
-- =========================================================

START TRANSACTION;

-- 1. One family
INSERT INTO `families` (`id`, `name`, `created_at`) VALUES
(1, 'Kinlight Family', '2026-04-20 09:00:00')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`);

-- 2. Grace / Mom / Dad users
INSERT INTO `users`
(`id`, `family_id`, `name`, `email`, `avatar_url`, `pet_name`, `pet_type`, `pet_subtitle`, `created_at`, `updated_at`)
VALUES
(1, 1, 'Grace', 'grace@kinlight.demo', '/images/profile_photo/grace.png', 'Mochi', 'dog', 'A soft little companion for quiet days.', '2026-04-20 09:05:00', '2026-05-08 09:00:00'),
(2, 1, 'Mom', 'mom@kinlight.demo', '/images/profile_photo/mom.png', 'Mimi', 'cat', 'A calm companion for gentle care.', '2026-04-20 09:06:00', '2026-05-08 09:00:00'),
(3, 1, 'Dad', 'dad@kinlight.demo', '/images/profile_photo/dad.png', 'Bunbun', 'rabbit', 'A steady companion for practical love.', '2026-04-20 09:07:00', '2026-05-08 09:00:00')
ON DUPLICATE KEY UPDATE
  `family_id` = VALUES(`family_id`),
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `avatar_url` = VALUES(`avatar_url`),
  `pet_name` = VALUES(`pet_name`),
  `pet_type` = VALUES(`pet_type`),
  `pet_subtitle` = VALUES(`pet_subtitle`),
  `updated_at` = VALUES(`updated_at`);

-- 3. Family member mapping
INSERT INTO `family_members` (`id`, `family_id`, `user_id`, `role`, `created_at`) VALUES
(1, 1, 1, 'daughter', '2026-04-20 09:10:00'),
(2, 1, 2, 'mom', '2026-04-20 09:10:00'),
(3, 1, 3, 'dad', '2026-04-20 09:10:00')
ON DUPLICATE KEY UPDATE
  `family_id` = VALUES(`family_id`),
  `user_id` = VALUES(`user_id`),
  `role` = VALUES(`role`);

-- 4. Items: food, drinks, toys, and weekly room rewards
INSERT INTO `items` (`id`, `name`, `category`, `icon`, `price`, `created_at`) VALUES
(1, 'Pet Water', 'drink', 'pet-water', 0, '2026-04-20 09:15:00'),
(2, 'Pet Milk', 'drink', 'pet-milk', 0, '2026-04-20 09:15:00'),
(3, 'Canned Tuna', 'food', 'canned-tuna', 0, '2026-04-20 09:15:00'),
(4, 'Pet Food', 'food', 'pet-food', 0, '2026-04-20 09:15:00'),
(5, 'Pet Biscuit', 'food', 'pet-biscuit', 0, '2026-04-20 09:15:00'),
(6, 'Small Bone', 'toy', 'small-bone', 0, '2026-04-20 09:15:00'),
(7, 'Small Ball', 'toy', 'small-ball', 0, '2026-04-20 09:15:00'),
(8, 'Chew Toy', 'toy', 'chew-toy', 0, '2026-04-20 09:15:00'),
(9, 'Plush Bear', 'toy', 'plush-bear', 0, '2026-04-20 09:15:00'),
(10, 'Fish Toy', 'toy', 'fish-toy', 0, '2026-04-20 09:15:00'),
(11, 'Cookie', 'food', 'cookie', 0, '2026-04-20 09:15:00'),
(12, 'Tennis Ball', 'toy', 'tennis-ball', 0, '2026-04-20 09:15:00'),
(13, 'Pet Sofa 1', 'room-decor', 'pet-sofa1-5', 0, '2026-04-20 09:15:00'),
(14, 'Pet Sofa 3', 'room-decor', 'pet-sofa3', 0, '2026-04-20 09:15:00'),
(15, 'Cat Climber', 'room-decor', 'cat-climber', 0, '2026-04-20 09:15:00'),
(16, 'Cat Teaser', 'toy', 'cat-teaser', 0, '2026-04-20 09:15:00'),
(17, 'Carrot Toy', 'toy', 'carrot-toy', 0, '2026-04-20 09:15:00'),
(18, 'Pet Sofa 5', 'room-decor', 'pet-sofa5', 0, '2026-04-20 09:15:00')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `category` = VALUES(`category`),
  `icon` = VALUES(`icon`),
  `price` = VALUES(`price`);

-- 5. Different food and toy inventory for each user
INSERT INTO `member_items` (`family_member_id`, `item_id`, `quantity`, `acquired_at`) VALUES
-- Grace inventory
(1, 1, 2, '2026-04-21 10:00:00'),
(1, 2, 1, '2026-04-22 10:00:00'),
(1, 5, 4, '2026-04-23 10:00:00'),
(1, 7, 3, '2026-04-24 10:00:00'),
(1, 9, 1, '2026-04-25 10:00:00'),
(1, 16, 1, '2026-04-26 10:00:00'),

-- Mom inventory
(2, 2, 3, '2026-04-21 10:05:00'),
(2, 3, 2, '2026-04-22 10:05:00'),
(2, 4, 3, '2026-04-23 10:05:00'),
(2, 6, 1, '2026-04-24 10:05:00'),
(2, 8, 2, '2026-04-25 10:05:00'),
(2, 17, 1, '2026-04-26 10:05:00'),

-- Dad inventory
(3, 1, 1, '2026-04-21 10:10:00'),
(3, 4, 2, '2026-04-22 10:10:00'),
(3, 5, 2, '2026-04-23 10:10:00'),
(3, 6, 3, '2026-04-24 10:10:00'),
(3, 10, 1, '2026-04-25 10:10:00'),
(3, 12, 2, '2026-04-26 10:10:00')
ON DUPLICATE KEY UPDATE
  `quantity` = VALUES(`quantity`),
  `acquired_at` = VALUES(`acquired_at`);

-- 6. Different active Home room item for each user
INSERT INTO `member_active_items` (`id`, `family_member_id`, `item_id`, `slot`, `activated_at`) VALUES
(1, 1, 14, 'room-decor', '2026-05-01 12:00:00'),
(2, 2, 15, 'room-decor', '2026-05-01 12:05:00'),
(3, 3, 13, 'room-decor', '2026-05-01 12:10:00')
ON DUPLICATE KEY UPDATE
  `item_id` = VALUES(`item_id`),
  `activated_at` = VALUES(`activated_at`);

-- 7. Album posts: 3 images for each member, each with a note
INSERT INTO `posts`
(`id`, `family_id`, `user_id`, `family_member_id`, `title`, `content`, `media_url`, `media_type`, `created_at`, `updated_at`)
VALUES
(1, 1, 1, 1, 'Birthday colors', 'A small birthday corner for Grace.', '/images/grace_album/G3.png', 'image', '2026-04-22 18:20:00', '2026-04-22 18:20:00'),
(2, 1, 1, 1, 'Sunset painting', 'Finished a sunset painting today.', '/images/grace_album/G2.png', 'image', '2026-04-27 17:35:00', '2026-04-27 17:35:00'),
(3, 1, 1, 1, 'Art table afternoon', 'A cheerful art moment from my desk.', '/images/grace_album/G1.png', 'image', '2026-05-03 15:10:00', '2026-05-03 15:10:00'),

(4, 1, 2, 2, 'Dumpling table', 'Made dumplings at home today.', '/images/mom_album/M3.png', 'image', '2026-04-23 11:30:00', '2026-04-23 11:30:00'),
(5, 1, 2, 2, 'Fresh flowers', 'Fresh flowers by the window.', '/images/mom_album/M2.png', 'image', '2026-04-29 09:40:00', '2026-04-29 09:40:00'),
(6, 1, 2, 2, 'Cookies before baking', 'Cookies ready for the oven.', '/images/mom_album/M1.png', 'image', '2026-05-04 16:15:00', '2026-05-04 16:15:00'),

(7, 1, 3, 3, 'Breakfast check-in', 'A warm breakfast to start the day.', '/images/dad_album/D1.png', 'image', '2026-04-24 08:15:00', '2026-04-24 08:15:00'),
(8, 1, 3, 3, 'Balcony plants', 'Watered the balcony plants this morning.', '/images/dad_album/D2.png', 'image', '2026-04-30 10:25:00', '2026-04-30 10:25:00'),
(9, 1, 3, 3, 'Fixed the shelf', 'Finished fixing the living room shelf.', '/images/dad_album/D3.png', 'image', '2026-05-06 14:45:00', '2026-05-06 14:45:00')
ON DUPLICATE KEY UPDATE
  `family_id` = VALUES(`family_id`),
  `user_id` = VALUES(`user_id`),
  `family_member_id` = VALUES(`family_member_id`),
  `title` = VALUES(`title`),
  `content` = VALUES(`content`),
  `media_url` = VALUES(`media_url`),
  `media_type` = VALUES(`media_type`),
  `created_at` = VALUES(`created_at`),
  `updated_at` = VALUES(`updated_at`);

-- 8. Mood capsule records from 2026-04-20 to 2026-05-08 for Grace / Mom / Dad
INSERT INTO `mood_entries`
(`user_id`, `family_id`, `mood`, `comment`, `entry_date`, `visibility`, `created_at`)
VALUES
(1, 1, 'happy', 'Spent a quiet evening drawing and thinking about home.', '2026-04-20', 'full', '2026-04-20 20:00:00'),
(1, 1, 'calm', 'A calm day with a small moment worth remembering.', '2026-04-21', 'full', '2026-04-21 20:00:00'),
(1, 1, 'connected', 'Felt close to family after sharing a little update.', '2026-04-22', 'full', '2026-04-22 20:00:00'),
(1, 1, 'tired', 'A bit tired, but still felt supported.', '2026-04-23', 'soft', '2026-04-23 20:00:00'),
(1, 1, 'grateful', 'Grateful for small family messages today.', '2026-04-24', 'full', '2026-04-24 20:00:00'),
(1, 1, 'calm', 'A slow and peaceful mood check-in.', '2026-04-25', 'full', '2026-04-25 20:00:00'),
(1, 1, 'happy', 'Had a bright moment that made the day lighter.', '2026-04-26', 'full', '2026-04-26 20:00:00'),
(1, 1, 'thoughtful', 'Thinking about family and little routines.', '2026-04-27', 'soft', '2026-04-27 20:00:00'),
(1, 1, 'connected', 'Felt connected through a shared photo.', '2026-04-28', 'full', '2026-04-28 20:00:00'),
(1, 1, 'calm', 'Quiet but comfortable today.', '2026-04-29', 'full', '2026-04-29 20:00:00'),
(1, 1, 'happy', 'A small happy moment in the afternoon.', '2026-04-30', 'full', '2026-04-30 20:00:00'),
(1, 1, 'tired', 'Low energy, but the family space felt gentle.', '2026-05-01', 'soft', '2026-05-01 20:00:00'),
(1, 1, 'grateful', 'Grateful for being noticed in a small way.', '2026-05-02', 'full', '2026-05-02 20:00:00'),
(1, 1, 'connected', 'A warm message made the day feel closer.', '2026-05-03', 'full', '2026-05-03 20:00:00'),
(1, 1, 'calm', 'Calm mood, nothing too heavy.', '2026-05-04', 'full', '2026-05-04 20:00:00'),
(1, 1, 'happy', 'Felt happy after uploading a small moment.', '2026-05-05', 'full', '2026-05-05 20:00:00'),
(1, 1, 'thoughtful', 'A reflective day with a soft feeling.', '2026-05-06', 'soft', '2026-05-06 20:00:00'),
(1, 1, 'connected', 'Felt connected across distance.', '2026-05-07', 'full', '2026-05-07 20:00:00'),
(1, 1, 'calm', 'Peaceful end to the day.', '2026-05-08', 'private', '2026-05-08 20:00:00'),

(2, 1, 'calm', 'A calm family day with simple routines.', '2026-04-20', 'full', '2026-04-20 21:00:00'),
(2, 1, 'grateful', 'Grateful for the little updates from everyone.', '2026-04-21', 'full', '2026-04-21 21:00:00'),
(2, 1, 'busy', 'Busy day, but still checked in.', '2026-04-22', 'soft', '2026-04-22 21:00:00'),
(2, 1, 'warm', 'Warm mood after preparing something at home.', '2026-04-23', 'full', '2026-04-23 21:00:00'),
(2, 1, 'calm', 'A quiet and steady day.', '2026-04-24', 'full', '2026-04-24 21:00:00'),
(2, 1, 'happy', 'Happy to see small family moments.', '2026-04-25', 'full', '2026-04-25 21:00:00'),
(2, 1, 'tired', 'A little tired from housework.', '2026-04-26', 'soft', '2026-04-26 21:00:00'),
(2, 1, 'grateful', 'Grateful for ordinary family time.', '2026-04-27', 'full', '2026-04-27 21:00:00'),
(2, 1, 'warm', 'A warm and caring mood today.', '2026-04-28', 'full', '2026-04-28 21:00:00'),
(2, 1, 'calm', 'Calm evening after a full day.', '2026-04-29', 'full', '2026-04-29 21:00:00'),
(2, 1, 'busy', 'Busy but manageable.', '2026-04-30', 'soft', '2026-04-30 21:00:00'),
(2, 1, 'happy', 'A small cheerful moment in the kitchen.', '2026-05-01', 'full', '2026-05-01 21:00:00'),
(2, 1, 'grateful', 'Grateful for family closeness.', '2026-05-02', 'full', '2026-05-02 21:00:00'),
(2, 1, 'calm', 'Peaceful and settled.', '2026-05-03', 'full', '2026-05-03 21:00:00'),
(2, 1, 'warm', 'Warm mood from a shared photo.', '2026-05-04', 'full', '2026-05-04 21:00:00'),
(2, 1, 'tired', 'Tired, but in a soft way.', '2026-05-05', 'soft', '2026-05-05 21:00:00'),
(2, 1, 'happy', 'Happy with today''s little family rhythm.', '2026-05-06', 'full', '2026-05-06 21:00:00'),
(2, 1, 'grateful', 'Grateful for gentle communication.', '2026-05-07', 'full', '2026-05-07 21:00:00'),
(2, 1, 'calm', 'Calm and quiet.', '2026-05-08', 'private', '2026-05-08 21:00:00'),

(3, 1, 'steady', 'A steady day with a practical mood.', '2026-04-20', 'full', '2026-04-20 22:00:00'),
(3, 1, 'happy', 'Happy after finishing something useful.', '2026-04-21', 'full', '2026-04-21 22:00:00'),
(3, 1, 'focused', 'Focused on small tasks at home.', '2026-04-22', 'full', '2026-04-22 22:00:00'),
(3, 1, 'calm', 'Calm evening with family in mind.', '2026-04-23', 'full', '2026-04-23 22:00:00'),
(3, 1, 'tired', 'A bit tired, but okay.', '2026-04-24', 'soft', '2026-04-24 22:00:00'),
(3, 1, 'helpful', 'Felt helpful after fixing something.', '2026-04-25', 'full', '2026-04-25 22:00:00'),
(3, 1, 'steady', 'Steady and ordinary day.', '2026-04-26', 'full', '2026-04-26 22:00:00'),
(3, 1, 'happy', 'A happy little family update.', '2026-04-27', 'full', '2026-04-27 22:00:00'),
(3, 1, 'focused', 'Focused but relaxed.', '2026-04-28', 'soft', '2026-04-28 22:00:00'),
(3, 1, 'calm', 'Calm mood, simple routine.', '2026-04-29', 'full', '2026-04-29 22:00:00'),
(3, 1, 'helpful', 'Helpful mood after doing a small task.', '2026-04-30', 'full', '2026-04-30 22:00:00'),
(3, 1, 'tired', 'Tired but comfortable.', '2026-05-01', 'full', '2026-05-01 22:00:00'),
(3, 1, 'steady', 'Steady day, nothing too stressful.', '2026-05-02', 'soft', '2026-05-02 22:00:00'),
(3, 1, 'happy', 'Happy to see family activity.', '2026-05-03', 'full', '2026-05-03 22:00:00'),
(3, 1, 'calm', 'Calm and grounded.', '2026-05-04', 'full', '2026-05-04 22:00:00'),
(3, 1, 'focused', 'Focused on home details.', '2026-05-05', 'full', '2026-05-05 22:00:00'),
(3, 1, 'helpful', 'Helpful and settled.', '2026-05-06', 'soft', '2026-05-06 22:00:00'),
(3, 1, 'steady', 'Steady evening.', '2026-05-07', 'full', '2026-05-07 22:00:00'),
(3, 1, 'happy', 'Happy with the week ending gently.', '2026-05-08', 'private', '2026-05-08 22:00:00')
ON DUPLICATE KEY UPDATE
  `mood` = VALUES(`mood`),
  `comment` = VALUES(`comment`),
  `visibility` = VALUES(`visibility`),
  `created_at` = VALUES(`created_at`);

COMMIT;
