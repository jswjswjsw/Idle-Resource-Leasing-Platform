-- 闲置资源租赁平台数据库完整初始化SQL脚本
-- 适用于阿里云RDS MySQL 8.0
-- 执行前请确保已创建数据库实例

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS tradeplatform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    condition ENUM('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR') NOT NULL DEFAULT 'GOOD',
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

-- 支付表
CREATE TABLE payments (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    paymentNo VARCHAR(191) NOT NULL UNIQUE,
    orderId VARCHAR(191) NOT NULL,
    userId VARCHAR(191) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method ENUM('ALIPAY', 'WECHAT', 'BANK_CARD', 'BALANCE') NOT NULL,
    channel ENUM('WEB', 'APP', 'H5', 'SCAN') NOT NULL,
    type ENUM('ORDER', 'DEPOSIT', 'REFUND', 'WITHDRAW') NOT NULL,
    thirdPartyId VARCHAR(191),
    thirdPartyData TEXT,
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    failReason VARCHAR(191),
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    paidAt DATETIME(3),
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评价表
CREATE TABLE reviews (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    orderId VARCHAR(191) NOT NULL,
    resourceId VARCHAR(191) NOT NULL,
    authorId VARCHAR(191) NOT NULL,
    targetId VARCHAR(191) NOT NULL,
    rating INT NOT NULL,
    content TEXT NOT NULL,
    images TEXT,
    type ENUM('RESOURCE', 'USER') NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX reviews_orderId_authorId_type_key (orderId, authorId, type),
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (resourceId) REFERENCES resources(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (targetId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 收藏表
CREATE TABLE favorites (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    userId VARCHAR(191) NOT NULL,
    resourceId VARCHAR(191) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX favorites_userId_resourceId_key (userId, resourceId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (resourceId) REFERENCES resources(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 聊天室表
CREATE TABLE chat_rooms (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    orderId VARCHAR(191) UNIQUE,
    type ENUM('ORDER', 'GROUP', 'SYSTEM') NOT NULL DEFAULT 'ORDER',
    name VARCHAR(191),
    isActive BOOLEAN NOT NULL DEFAULT true,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 聊天室参与者关联表
CREATE TABLE _ChatParticipants (
    A VARCHAR(191) NOT NULL,
    B VARCHAR(191) NOT NULL,
    UNIQUE INDEX _ChatParticipants_AB_unique (A, B),
    INDEX _ChatParticipants_B_index (B),
    FOREIGN KEY (A) REFERENCES chat_rooms(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (B) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 消息表
CREATE TABLE messages (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    chatRoomId VARCHAR(191) NOT NULL,
    senderId VARCHAR(191) NOT NULL,
    receiverId VARCHAR(191),
    content TEXT NOT NULL,
    type ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM') NOT NULL DEFAULT 'TEXT',
    fileUrl VARCHAR(191),
    fileName VARCHAR(191),
    fileSize INT,
    isRead BOOLEAN NOT NULL DEFAULT false,
    isDeleted BOOLEAN NOT NULL DEFAULT false,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    readAt DATETIME(3),
    FOREIGN KEY (chatRoomId) REFERENCES chat_rooms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 通知表
CREATE TABLE notifications (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    userId VARCHAR(191) NOT NULL,
    title VARCHAR(191) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('ORDER', 'PAYMENT', 'MESSAGE', 'SYSTEM', 'REVIEW', 'PROMOTION') NOT NULL,
    data TEXT,
    isRead BOOLEAN NOT NULL DEFAULT false,
    isDeleted BOOLEAN NOT NULL DEFAULT false,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    readAt DATETIME(3),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 文件表
CREATE TABLE files (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    userId VARCHAR(191) NOT NULL,
    originalName VARCHAR(191) NOT NULL,
    fileName VARCHAR(191) NOT NULL UNIQUE,
    filePath VARCHAR(191) NOT NULL,
    fileSize INT NOT NULL,
    mimeType VARCHAR(191) NOT NULL,
    fileHash VARCHAR(191),
    category ENUM('AVATAR', 'RESOURCE', 'MESSAGE', 'DOCUMENT', 'OTHER') NOT NULL,
    isPublic BOOLEAN NOT NULL DEFAULT false,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    expiresAt DATETIME(3),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统配置表
CREATE TABLE system_configs (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    key VARCHAR(191) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'TEXT') NOT NULL DEFAULT 'STRING',
    category VARCHAR(191) NOT NULL DEFAULT 'system',
    description VARCHAR(191),
    isActive BOOLEAN NOT NULL DEFAULT true,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统日志表
CREATE TABLE system_logs (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    level ENUM('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL') NOT NULL DEFAULT 'INFO',
    module VARCHAR(191) NOT NULL,
    action VARCHAR(191) NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    userId VARCHAR(191),
    ip VARCHAR(191),
    userAgent TEXT,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入初始数据

-- 插入资源分类
INSERT INTO categories (id, name, description, icon, sort, isActive) VALUES
('cat_electronics', '电子设备', '手机、电脑、相机等电子产品', '📱', 1, true),
('cat_vehicles', '交通工具', '汽车、自行车、电动车等', '🚗', 2, true),
('cat_tools', '工具设备', '电钻、锯子、测量工具等', '🔧', 3, true),
('cat_furniture', '家具家电', '桌椅、沙发、家电等', '🛋️', 4, true),
('cat_sports', '运动器材', '健身器材、球类、户外用品等', '⚽', 5, true),
('cat_books', '图书音像', '书籍、DVD、游戏等', '📚', 6, true),
('cat_clothing', '服装配饰', '衣服、鞋帽、包包等', '👔', 7, true),
('cat_spaces', '空间场地', '会议室、工作室、停车位等', '🏢', 8, true),
('cat_office', '办公设备', '打印机、投影仪、办公桌椅等', '💼', 9, true),
('cat_outdoor', '户外装备', '帐篷、烧烤架、野营用品等', '🏕️', 10, true);

-- 插入系统配置
INSERT INTO system_configs (id, key, value, type, category, description) VALUES
('config_001', 'site_name', '闲置资源租赁平台', 'STRING', 'basic', '网站名称'),
('config_002', 'site_description', '让闲置资源流动起来，创造更多价值', 'STRING', 'basic', '网站描述'),
('config_003', 'default_credit_score', '100', 'NUMBER', 'user', '新用户默认信用分'),
('config_004', 'min_rent_days', '1', 'NUMBER', 'business', '最小租赁天数'),
('config_005', 'max_rent_days', '30', 'NUMBER', 'business', '最大租赁天数'),
('config_006', 'service_fee_rate', '0.05', 'NUMBER', 'business', '平台服务费率'),
('config_007', 'auto_confirm_hours', '72', 'NUMBER', 'business', '订单自动确认小时数'),
('config_008', 'platform_commission', '0.05', 'NUMBER', 'payment', '平台佣金率（5%）'),
('config_009', 'deposit_percentage', '0.3', 'NUMBER', 'rental', '押金比例（30%）'),
('config_010', 'upload_max_size', '10485760', 'NUMBER', 'upload', '文件上传最大尺寸（10MB）'),
('config_011', 'allowed_file_types', '["jpg","jpeg","png","gif","pdf","doc","docx"]', 'JSON', 'upload', '允许的文件类型'),
('config_012', 'max_images_per_resource', '10', 'NUMBER', 'upload', '每个资源最大图片数量'),
('config_013', 'chat_enabled', 'true', 'BOOLEAN', 'feature', '聊天功能开关'),
('config_014', 'review_enabled', 'true', 'BOOLEAN', 'feature', '评价功能开关');

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_resources_category ON resources(categoryId);
CREATE INDEX idx_resources_owner ON resources(ownerId);
CREATE INDEX idx_resources_location ON resources(city, district);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_orders_customer ON orders(customerId);
CREATE INDEX idx_orders_owner ON orders(ownerId);
CREATE INDEX idx_orders_resource ON orders(resourceId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(startDate, endDate);
CREATE INDEX idx_payments_order ON payments(orderId);
CREATE INDEX idx_payments_user ON payments(userId);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_messages_chatroom ON messages(chatRoomId);
CREATE INDEX idx_messages_sender ON messages(senderId);
CREATE INDEX idx_notifications_user ON notifications(userId);
CREATE INDEX idx_notifications_type ON notifications(type);

SET FOREIGN_KEY_CHECKS = 1;

-- 验证表创建成功
SELECT 'Database initialization completed successfully!' as status;
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'tradeplatform';
