-- 闲置资源租赁平台数据库初始化SQL脚本
-- 基于项目实际的Prisma Schema生成
-- 适用于阿里云RDS MySQL 8.0
-- 数据库名: tradeplatform

USE tradeplatform;

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 删除已存在的表（如果存在）
DROP TABLE IF EXISTS system_logs;
DROP TABLE IF EXISTS system_configs;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS _ChatParticipants;
DROP TABLE IF EXISTS chat_rooms;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- 用户表
CREATE TABLE users (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    email VARCHAR(191) UNIQUE,
    phone VARCHAR(191) UNIQUE,
    username VARCHAR(191) NOT NULL UNIQUE,
    password VARCHAR(191),
    avatar VARCHAR(191),
    realName VARCHAR(191),
    idCard VARCHAR(191),
    status ENUM('ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    isVerified BOOLEAN NOT NULL DEFAULT false,
    emailVerified BOOLEAN NOT NULL DEFAULT false,
    phoneVerified BOOLEAN NOT NULL DEFAULT false,
    githubId VARCHAR(191) UNIQUE,
    wechatId VARCHAR(191) UNIQUE,
    googleId VARCHAR(191) UNIQUE,
    giteeId VARCHAR(191) UNIQUE,
    bio TEXT,
    location VARCHAR(191),
    latitude DOUBLE,
    longitude DOUBLE,
    city VARCHAR(191),
    district VARCHAR(191),
    creditScore INT NOT NULL DEFAULT 100,
    totalRentals INT NOT NULL DEFAULT 0,
    totalEarnings DECIMAL(10,2) NOT NULL DEFAULT 0,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    lastLoginAt DATETIME(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 资源分类表
CREATE TABLE categories (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL UNIQUE,
    description VARCHAR(191),
    icon VARCHAR(191),
    sort INT NOT NULL DEFAULT 0,
    isActive BOOLEAN NOT NULL DEFAULT true,
    parentId VARCHAR(191),
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (parentId) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 资源表  
CREATE TABLE resources (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    title VARCHAR(191) NOT NULL,
    description TEXT NOT NULL,
    categoryId VARCHAR(191) NOT NULL,
    ownerId VARCHAR(191) NOT NULL,
    images TEXT NOT NULL,
    pricePerDay DECIMAL(8,2) NOT NULL,
    pricePerHour DECIMAL(8,2),
    deposit DECIMAL(8,2) NOT NULL,
    minRentDays INT NOT NULL DEFAULT 1,
    maxRentDays INT NOT NULL DEFAULT 30,
    location VARCHAR(191) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    city VARCHAR(191) NOT NULL,
    district VARCHAR(191) NOT NULL,
    address VARCHAR(191),
    status ENUM('DRAFT', 'AVAILABLE', 'RENTED', 'MAINTENANCE', 'OFFLINE') NOT NULL DEFAULT 'AVAILABLE',
    condition_field ENUM('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR') NOT NULL DEFAULT 'GOOD',
    isNegotiable BOOLEAN NOT NULL DEFAULT false,
    viewCount INT NOT NULL DEFAULT 0,
    favoriteCount INT NOT NULL DEFAULT 0,
    orderCount INT NOT NULL DEFAULT 0,
    rating DOUBLE DEFAULT 0,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    publishedAt DATETIME(3),
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 订单表
CREATE TABLE orders (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    orderNo VARCHAR(191) NOT NULL UNIQUE,
    customerId VARCHAR(191) NOT NULL,
    ownerId VARCHAR(191) NOT NULL,
    resourceId VARCHAR(191) NOT NULL,
    startDate DATETIME(3) NOT NULL,
    endDate DATETIME(3) NOT NULL,
    actualStartDate DATETIME(3),
    actualEndDate DATETIME(3),
    rentDays INT NOT NULL,
    pricePerDay DECIMAL(8,2) NOT NULL,
    totalPrice DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(8,2) NOT NULL,
    serviceFee DECIMAL(8,2) NOT NULL DEFAULT 0,
    finalAmount DECIMAL(10,2) NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'DISPUTED') NOT NULL DEFAULT 'PENDING',
    cancelReason VARCHAR(191),
    refundAmount DECIMAL(10,2),
    customerNote VARCHAR(191),
    ownerNote VARCHAR(191),
    adminNote VARCHAR(191),
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    confirmedAt DATETIME(3),
    completedAt DATETIME(3),
    cancelledAt DATETIME(3),
    FOREIGN KEY (customerId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (resourceId) REFERENCES resources(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入系统配置数据
INSERT INTO `system_configs` VALUES 
('config_001','site_name','闲置资源租赁平台','STRING','basic','网站名称',1,NOW(),NOW()),
('config_002','site_description','让闲置资源流动起来，创造更多价值','STRING','basic','网站描述',1,NOW(),NOW()),
('config_003','default_credit_score','100','NUMBER','user','新用户默认信用分',1,NOW(),NOW()),
('config_004','min_rent_days','1','NUMBER','business','最小租赁天数',1,NOW(),NOW()),
('config_005','max_rent_days','30','NUMBER','business','最大租赁天数',1,NOW(),NOW()),
('config_006','service_fee_rate','0.05','NUMBER','business','平台服务费率',1,NOW(),NOW()),
('config_007','auto_confirm_hours','72','NUMBER','business','订单自动确认小时数',1,NOW(),NOW());

SET FOREIGN_KEY_CHECKS = 1;