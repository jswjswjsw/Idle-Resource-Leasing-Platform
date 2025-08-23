-- 数据库初始化脚本
-- 闲置资源租赁平台数据库

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS idle_resource_rental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE idle_resource_rental;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(255) PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `phone` VARCHAR(20) UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `avatar` TEXT,
  `credit_score` INT DEFAULT 100,
  `verified` BOOLEAN DEFAULT FALSE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_login_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_username` (`username`),
  INDEX `idx_phone` (`phone`)
);

-- 用户验证表
CREATE TABLE IF NOT EXISTS `user_verifications` (
  `id` VARCHAR(255) PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `verification_type` ENUM('PHONE', 'EMAIL', 'IDENTITY', 'ZHIMA_CREDIT') NOT NULL,
  `verified_value` VARCHAR(255) NOT NULL,
  `verified` BOOLEAN DEFAULT FALSE,
  `verified_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_verification` (`user_id`, `verification_type`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 用户地址表
CREATE TABLE IF NOT EXISTS `addresses` (
  `id` VARCHAR(255) PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `label` VARCHAR(50) NOT NULL,
  `address` TEXT NOT NULL,
  `latitude` FLOAT,
  `longitude` FLOAT,
  `is_default` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_addresses` (`user_id`)
);

-- 资源分类表
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(255) PRIMARY KEY,
  `name` VARCHAR(50) UNIQUE NOT NULL,
  `name_en` VARCHAR(50),
  `description` TEXT,
  `icon` TEXT,
  `parent_id` VARCHAR(255),
  `sort_order` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
);

-- 资源表
CREATE TABLE IF NOT EXISTS `resources` (
  `id` VARCHAR(255) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category_id` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `price_unit` ENUM('HOUR', 'DAY', 'WEEK', 'MONTH') NOT NULL,
  `images` LONGTEXT,
  `location` TEXT NOT NULL,
  `latitude` FLOAT NOT NULL,
  `longitude` FLOAT NOT NULL,
  `status` ENUM('AVAILABLE', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE') DEFAULT 'AVAILABLE',
  `rating` DECIMAL(2, 1) DEFAULT 0.0,
  `review_count` INT DEFAULT 0,
  `tags` TEXT,
  `owner_id` VARCHAR(255) NOT NULL,
  `deposit` DECIMAL(10, 2) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`),
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_category` (`category_id`),
  INDEX `idx_owner` (`owner_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_location` (`latitude`, `longitude`)
);

-- 订单表
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(255) PRIMARY KEY,
  `resource_id` VARCHAR(255) NOT NULL,
  `renter_id` VARCHAR(255) NOT NULL,
  `owner_id` VARCHAR(255) NOT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `total_price` DECIMAL(10, 2) NOT NULL,
  `deposit` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED') DEFAULT 'PENDING',
  `payment_status` ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED') DEFAULT 'PENDING',
  `notes` TEXT,
  `delivery_method` ENUM('PICKUP', 'DELIVERY', 'EXPRESS') DEFAULT 'PICKUP',
  `delivery_address` TEXT,
  `delivery_fee` DECIMAL(10, 2) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`),
  FOREIGN KEY (`renter_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`),
  INDEX `idx_resource_orders` (`resource_id`),
  INDEX `idx_renter_orders` (`renter_id`),
  INDEX `idx_owner_orders` (`owner_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_payment_status` (`payment_status`)
);

-- 支付记录表
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(255) PRIMARY KEY,
  `order_id` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(10) DEFAULT 'CNY',
  `payment_method` ENUM('ALIPAY', 'WECHAT', 'UNIONPAY', 'BALANCE') NOT NULL,
  `payment_gateway` VARCHAR(50) NOT NULL,
  `transaction_id` VARCHAR(255) UNIQUE,
  `status` ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED') DEFAULT 'PENDING',
  `paid_at` DATETIME,
  `refunded_at` DATETIME,
  `refund_amount` DECIMAL(10, 2),
  `refund_reason` TEXT,
  `metadata` LONGTEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  INDEX `idx_order_payments` (`order_id`),
  INDEX `idx_transaction_id` (`transaction_id`)
);

-- 用户支付方式表
CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` VARCHAR(255) PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `type` ENUM('ALIPAY', 'WECHAT', 'UNIONPAY', 'BALANCE') NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `is_default` BOOLEAN DEFAULT FALSE,
  `details` LONGTEXT,
  `is_valid` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_payment_methods` (`user_id`)
);

-- 评价表
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(255) PRIMARY KEY,
  `order_id` VARCHAR(255) UNIQUE NOT NULL,
  `reviewer_id` VARCHAR(255) NOT NULL,
  `reviewee_id` VARCHAR(255) NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT,
  `images` LONGTEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`reviewee_id`) REFERENCES `users`(`id`),
  INDEX `idx_reviewer_reviews` (`reviewer_id`),
  INDEX `idx_reviewee_reviews` (`reviewee_id`)
);

-- 收藏表
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` VARCHAR(255) PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `resource_id` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_resource` (`user_id`, `resource_id`),
  INDEX `idx_user_favorites` (`user_id`),
  INDEX `idx_resource_favorites` (`resource_id`)
);

-- 消息表
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(255) PRIMARY KEY,
  `order_id` VARCHAR(255) NOT NULL,
  `sender_id` VARCHAR(255) NOT NULL,
  `receiver_id` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `type` ENUM('TEXT', 'IMAGE', 'FILE', 'LOCATION', 'SYSTEM') DEFAULT 'TEXT',
  `is_read` BOOLEAN DEFAULT FALSE,
  `metadata` LONGTEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`),
  INDEX `idx_order_messages` (`order_id`),
  INDEX `idx_sender_messages` (`sender_id`),
  INDEX `idx_receiver_messages` (`receiver_id`),
  INDEX `idx_read_status` (`is_read`)
);

-- 通知表
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(255) PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('ORDER', 'MESSAGE', 'SYSTEM', 'PROMOTION', 'PAYMENT', 'REVIEW') NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `action_url` TEXT,
  `data` LONGTEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_notifications` (`user_id`),
  INDEX `idx_read_status` (`is_read`),
  INDEX `idx_type` (`type`)
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` VARCHAR(255) PRIMARY KEY,
  `key` VARCHAR(100) UNIQUE NOT NULL,
  `value` LONGTEXT NOT NULL,
  `type` VARCHAR(20) DEFAULT 'string',
  `is_public` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_key` (`key`),
  INDEX `idx_public` (`is_public`)
);

-- 插入基础数据
INSERT INTO `categories` (`id`, `name`, `name_en`, `description`, `icon`, `sort_order`) VALUES
(UNHEX(REPLACE(UUID(), '-', '')), '电子设备', 'Electronics', '手机、相机、电脑等电子设备', '📱', 1),
(UNHEX(REPLACE(UUID(), '-', '')), '家居用品', 'Home Appliances', '家具、家电、厨具等家居用品', '🏠', 2),
(UNHEX(REPLACE(UUID(), '-', '')), '户外装备', 'Outdoor Equipment', '帐篷、烧烤架、运动器材等户外装备', '🏕️', 3),
(UNHEX(REPLACE(UUID(), '-', '')), '交通工具', 'Transportation', '汽车、电动车、自行车等交通工具', '🚗', 4),
(UNHEX(REPLACE(UUID(), '-', '')), '办公设备', 'Office Equipment', '打印机、投影仪、办公桌椅等办公设备', '💼', 5);

-- 插入系统配置
INSERT INTO `system_configs` (`id`, `key`, `value`, `type`, `is_public`) VALUES
(UNHEX(REPLACE(UUID(), '-', '')), 'siteName', '闲置资源租赁平台', 'string', TRUE),
(UNHEX(REPLACE(UUID(), '-', '')), 'maxRentalDays', '30', 'number', TRUE),
(UNHEX(REPLACE(UUID(), '-', '')), 'depositPercentage', '0.3', 'number', TRUE),
(UNHEX(REPLACE(UUID(), '-', '')), 'platformCommission', '0.05', 'number', FALSE);

-- 插入测试用户
INSERT INTO `users` (`id`, `username`, `email`, `phone`, `password`, `credit_score`, `verified`, `is_active`) VALUES
(UNHEX(REPLACE(UUID(), '-', '')), '测试用户1', 'user1@example.com', '13800138001', '$2a$12$K9m1Xo5a5Z8mN3xP9v8Huem8X9lQ2o3m4n6P7q9r0s3t5u7v9w1x2y3', 950, TRUE, TRUE),
(UNHEX(REPLACE(UUID(), '-', '')), '测试用户2', 'user2@example.com', '13800138002', '$2a$12$K9m1Xo5a5Z8mN3xP9v8Huem8X9lQ2o3m4n6P7q9r0s3t5u7v9w1x2y3', 880, FALSE, TRUE);

COMMIT;