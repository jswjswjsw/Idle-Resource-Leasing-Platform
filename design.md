# 闲置资源租赁平台 - 系统设计文档

## 📋 文档信息

**项目名称**：闲置资源租赁平台  
**文档版本**：v1.0  
**创建日期**：2024年12月20日  
**文档状态**：设计阶段  
**负责团队**：技术架构组  

---

## 🏗️ 系统架构设计

### 1. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层 (User Layer)                    │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Web浏览器      │   移动端App      │      管理后台            │
│   (React)       │ (React Native)  │     (React Admin)       │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    CDN + 负载均衡层                          │
│              阿里云CDN + SLB + Nginx                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API网关层                              │
│            Kong Gateway + JWT认证 + 限流                    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    应用服务层 (微服务)                        │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│  用户服务    │  资源服务    │  订单服务    │     支付服务         │
│ (User API)  │(Resource API)│ (Order API) │   (Payment API)     │
├─────────────┼─────────────┼─────────────┼─────────────────────┤
│  通讯服务    │  评价服务    │  通知服务    │     文件服务         │
│  (Chat API) │(Review API) │(Notify API) │    (File API)       │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      数据存储层                              │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│   MySQL     │    Redis    │Elasticsearch│      阿里云OSS       │
│  (主数据库)   │   (缓存)     │  (搜索引擎)   │    (文件存储)        │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      第三方服务层                            │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│   支付宝     │   微信支付   │   高德地图   │      环信IM          │
│  (支付)     │   (支付)     │  (地图定位)   │    (即时通讯)        │
├─────────────┼─────────────┼─────────────┼─────────────────────┤
│  阿里云短信   │  芝麻信用    │  阿里云推送   │    阿里云实人认证     │
│  (短信验证)   │  (信用评估)   │  (消息推送)   │    (身份验证)        │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
```

### 2. 微服务架构设计

#### 2.1 服务拆分原则
- **业务边界清晰**：按业务领域拆分服务
- **数据独立**：每个服务拥有独立的数据库
- **松耦合**：服务间通过API通信
- **高内聚**：相关功能聚合在同一服务内

#### 2.2 核心微服务

```typescript
// 服务注册中心配置
interface ServiceRegistry {
  serviceName: string;
  version: string;
  host: string;
  port: number;
  healthCheck: string;
  tags: string[];
}

// 用户服务 (User Service)
const userService: ServiceRegistry = {
  serviceName: 'user-service',
  version: '1.0.0',
  host: 'user-service.internal',
  port: 3001,
  healthCheck: '/health',
  tags: ['authentication', 'profile', 'credit']
};

// 资源服务 (Resource Service)
const resourceService: ServiceRegistry = {
  serviceName: 'resource-service',
  version: '1.0.0',
  host: 'resource-service.internal',
  port: 3002,
  healthCheck: '/health',
  tags: ['resources', 'search', 'recommendation']
};

// 订单服务 (Order Service)
const orderService: ServiceRegistry = {
  serviceName: 'order-service',
  version: '1.0.0',
  host: 'order-service.internal',
  port: 3003,
  healthCheck: '/health',
  tags: ['orders', 'booking', 'workflow']
};

// 支付服务 (Payment Service)
const paymentService: ServiceRegistry = {
  serviceName: 'payment-service',
  version: '1.0.0',
  host: 'payment-service.internal',
  port: 3004,
  healthCheck: '/health',
  tags: ['payment', 'wallet', 'settlement']
};

// 通讯服务 (Communication Service)
const communicationService: ServiceRegistry = {
  serviceName: 'communication-service',
  version: '1.0.0',
  host: 'communication-service.internal',
  port: 3005,
  healthCheck: '/health',
  tags: ['chat', 'notification', 'websocket']
};
```

---

## 🗄️ 数据库设计

### 1. MySQL 主数据库设计

#### 1.1 用户相关表

```sql
-- 用户基础信息表
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `nickname` varchar(50) NOT NULL COMMENT '昵称',
  `avatar` varchar(500) DEFAULT NULL COMMENT '头像URL',
  `gender` tinyint(1) DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
  `birthday` date DEFAULT NULL COMMENT '生日',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `id_card` varchar(18) DEFAULT NULL COMMENT '身份证号',
  `id_card_verified` tinyint(1) DEFAULT 0 COMMENT '身份证是否验证',
  `face_verified` tinyint(1) DEFAULT 0 COMMENT '人脸是否验证',
  `credit_score` int(11) DEFAULT 600 COMMENT '信用分数',
  `credit_level` varchar(20) DEFAULT 'BRONZE' COMMENT '信用等级',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone` (`phone`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_credit_score` (`credit_score`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础信息表';

-- 用户地址表
CREATE TABLE `user_addresses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '地址ID',
  `user_id` bigint(20) unsigned NOT NULL COMMENT '用户ID',
  `name` varchar(50) NOT NULL COMMENT '收货人姓名',
  `phone` varchar(20) NOT NULL COMMENT '联系电话',
  `province` varchar(50) NOT NULL COMMENT '省份',
  `city` varchar(50) NOT NULL COMMENT '城市',
  `district` varchar(50) NOT NULL COMMENT '区县',
  `address` varchar(200) NOT NULL COMMENT '详细地址',
  `longitude` decimal(10,7) DEFAULT NULL COMMENT '经度',
  `latitude` decimal(10,7) DEFAULT NULL COMMENT '纬度',
  `is_default` tinyint(1) DEFAULT 0 COMMENT '是否默认地址',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_location` (`longitude`, `latitude`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户地址表';

-- 用户钱包表
CREATE TABLE `user_wallets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '钱包ID',
  `user_id` bigint(20) unsigned NOT NULL COMMENT '用户ID',
  `balance` decimal(10,2) DEFAULT 0.00 COMMENT '余额',
  `frozen_amount` decimal(10,2) DEFAULT 0.00 COMMENT '冻结金额',
  `total_income` decimal(10,2) DEFAULT 0.00 COMMENT '总收入',
  `total_expense` decimal(10,2) DEFAULT 0.00 COMMENT '总支出',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户钱包表';
```

#### 1.2 资源相关表

```sql
-- 资源分类表
CREATE TABLE `resource_categories` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `parent_id` int(11) unsigned DEFAULT 0 COMMENT '父分类ID',
  `name` varchar(50) NOT NULL COMMENT '分类名称',
  `icon` varchar(200) DEFAULT NULL COMMENT '分类图标',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源分类表';

-- 资源信息表
CREATE TABLE `resources` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '资源ID',
  `user_id` bigint(20) unsigned NOT NULL COMMENT '发布用户ID',
  `category_id` int(11) unsigned NOT NULL COMMENT '分类ID',
  `title` varchar(100) NOT NULL COMMENT '资源标题',
  `description` text COMMENT '资源描述',
  `specifications` json DEFAULT NULL COMMENT '规格参数',
  `images` json DEFAULT NULL COMMENT '图片列表',
  `videos` json DEFAULT NULL COMMENT '视频列表',
  `daily_price` decimal(8,2) NOT NULL COMMENT '日租金',
  `hourly_price` decimal(8,2) DEFAULT NULL COMMENT '时租金',
  `deposit` decimal(8,2) NOT NULL COMMENT '押金',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT '原价',
  `condition_score` tinyint(1) DEFAULT 5 COMMENT '成色评分(1-5)',
  `location_province` varchar(50) NOT NULL COMMENT '所在省份',
  `location_city` varchar(50) NOT NULL COMMENT '所在城市',
  `location_district` varchar(50) NOT NULL COMMENT '所在区县',
  `location_address` varchar(200) DEFAULT NULL COMMENT '详细地址',
  `longitude` decimal(10,7) DEFAULT NULL COMMENT '经度',
  `latitude` decimal(10,7) DEFAULT NULL COMMENT '纬度',
  `delivery_methods` json DEFAULT NULL COMMENT '交付方式',
  `available_start_date` date DEFAULT NULL COMMENT '可租开始日期',
  `available_end_date` date DEFAULT NULL COMMENT '可租结束日期',
  `available_time_slots` json DEFAULT NULL COMMENT '可租时间段',
  `tags` json DEFAULT NULL COMMENT '标签',
  `view_count` int(11) DEFAULT 0 COMMENT '浏览次数',
  `favorite_count` int(11) DEFAULT 0 COMMENT '收藏次数',
  `order_count` int(11) DEFAULT 0 COMMENT '订单次数',
  `rating` decimal(3,2) DEFAULT 5.00 COMMENT '评分',
  `rating_count` int(11) DEFAULT 0 COMMENT '评价数量',
  `status` varchar(20) DEFAULT 'DRAFT' COMMENT '状态：DRAFT-草稿，PUBLISHED-已发布，RENTED-已出租，OFFLINE-下线',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_location` (`longitude`, `latitude`),
  KEY `idx_price` (`daily_price`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  FULLTEXT KEY `ft_title_desc` (`title`, `description`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `resource_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源信息表';
```

#### 1.3 订单相关表

```sql
-- 订单表
CREATE TABLE `orders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(32) NOT NULL COMMENT '订单号',
  `resource_id` bigint(20) unsigned NOT NULL COMMENT '资源ID',
  `renter_id` bigint(20) unsigned NOT NULL COMMENT '租客ID',
  `owner_id` bigint(20) unsigned NOT NULL COMMENT '出租方ID',
  `rental_start_date` datetime NOT NULL COMMENT '租赁开始时间',
  `rental_end_date` datetime NOT NULL COMMENT '租赁结束时间',
  `rental_days` int(11) NOT NULL COMMENT '租赁天数',
  `rental_hours` int(11) DEFAULT NULL COMMENT '租赁小时数',
  `daily_price` decimal(8,2) NOT NULL COMMENT '日租金',
  `hourly_price` decimal(8,2) DEFAULT NULL COMMENT '时租金',
  `total_rent` decimal(10,2) NOT NULL COMMENT '总租金',
  `deposit` decimal(8,2) NOT NULL COMMENT '押金',
  `service_fee` decimal(8,2) DEFAULT 0.00 COMMENT '服务费',
  `delivery_fee` decimal(8,2) DEFAULT 0.00 COMMENT '配送费',
  `insurance_fee` decimal(8,2) DEFAULT 0.00 COMMENT '保险费',
  `total_amount` decimal(10,2) NOT NULL COMMENT '订单总金额',
  `delivery_method` varchar(20) NOT NULL COMMENT '交付方式',
  `delivery_address` json DEFAULT NULL COMMENT '配送地址',
  `pickup_address` json DEFAULT NULL COMMENT '自提地址',
  `renter_notes` text COMMENT '租客备注',
  `owner_notes` text COMMENT '出租方备注',
  `status` varchar(20) DEFAULT 'PENDING' COMMENT '订单状态',
  `cancel_reason` varchar(200) DEFAULT NULL COMMENT '取消原因',
  `cancelled_by` bigint(20) unsigned DEFAULT NULL COMMENT '取消人ID',
  `cancelled_at` timestamp NULL DEFAULT NULL COMMENT '取消时间',
  `confirmed_at` timestamp NULL DEFAULT NULL COMMENT '确认时间',
  `delivered_at` timestamp NULL DEFAULT NULL COMMENT '交付时间',
  `returned_at` timestamp NULL DEFAULT NULL COMMENT '归还时间',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT '完成时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_resource_id` (`resource_id`),
  KEY `idx_renter_id` (`renter_id`),
  KEY `idx_owner_id` (`owner_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`),
  FOREIGN KEY (`renter_id`) REFERENCES `users` (`id`),
  FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 支付记录表
CREATE TABLE `payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '支付ID',
  `payment_no` varchar(32) NOT NULL COMMENT '支付单号',
  `order_id` bigint(20) unsigned NOT NULL COMMENT '订单ID',
  `user_id` bigint(20) unsigned NOT NULL COMMENT '支付用户ID',
  `payment_type` varchar(20) NOT NULL COMMENT '支付类型：RENT-租金，DEPOSIT-押金，REFUND-退款',
  `payment_method` varchar(20) NOT NULL COMMENT '支付方式',
  `amount` decimal(10,2) NOT NULL COMMENT '支付金额',
  `currency` varchar(3) DEFAULT 'CNY' COMMENT '货币类型',
  `third_party_no` varchar(64) DEFAULT NULL COMMENT '第三方支付单号',
  `status` varchar(20) DEFAULT 'PENDING' COMMENT '支付状态',
  `paid_at` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  `refunded_at` timestamp NULL DEFAULT NULL COMMENT '退款时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_no` (`payment_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';
```

### 2. Redis 缓存设计

#### 2.1 缓存策略

```typescript
// Redis 缓存键设计规范
interface CacheKeyPattern {
  pattern: string;
  ttl: number; // 过期时间(秒)
  description: string;
}

// 缓存键模式定义
const cacheKeys: Record<string, CacheKeyPattern> = {
  // 用户相关缓存
  USER_INFO: {
    pattern: 'user:info:{userId}',
    ttl: 3600, // 1小时
    description: '用户基础信息缓存'
  },
  USER_SESSION: {
    pattern: 'user:session:{sessionId}',
    ttl: 86400, // 24小时
    description: '用户会话缓存'
  },
  USER_CREDIT: {
    pattern: 'user:credit:{userId}',
    ttl: 1800, // 30分钟
    description: '用户信用信息缓存'
  },
  
  // 资源相关缓存
  RESOURCE_INFO: {
    pattern: 'resource:info:{resourceId}',
    ttl: 1800, // 30分钟
    description: '资源详情缓存'
  },
  RESOURCE_LIST: {
    pattern: 'resource:list:{categoryId}:{page}:{filters}',
    ttl: 300, // 5分钟
    description: '资源列表缓存'
  },
  HOT_RESOURCES: {
    pattern: 'resource:hot:{cityCode}',
    ttl: 600, // 10分钟
    description: '热门资源缓存'
  },
  
  // 搜索相关缓存
  SEARCH_RESULT: {
    pattern: 'search:result:{keyword}:{filters}:{page}',
    ttl: 300, // 5分钟
    description: '搜索结果缓存'
  },
  SEARCH_SUGGESTIONS: {
    pattern: 'search:suggestions:{keyword}',
    ttl: 3600, // 1小时
    description: '搜索建议缓存'
  },
  
  // 订单相关缓存
  ORDER_INFO: {
    pattern: 'order:info:{orderId}',
    ttl: 1800, // 30分钟
    description: '订单详情缓存'
  },
  USER_ORDERS: {
    pattern: 'order:user:{userId}:{status}:{page}',
    ttl: 300, // 5分钟
    description: '用户订单列表缓存'
  },
  
  // 地理位置缓存
  GEO_RESOURCES: {
    pattern: 'geo:resources:{longitude}:{latitude}:{radius}',
    ttl: 600, // 10分钟
    description: '地理位置资源缓存'
  },
  
  // 统计数据缓存
  STATS_DAILY: {
    pattern: 'stats:daily:{date}',
    ttl: 86400, // 24小时
    description: '每日统计数据缓存'
  },
  
  // 限流缓存
  RATE_LIMIT: {
    pattern: 'rate:limit:{userId}:{action}',
    ttl: 3600, // 1小时
    description: '用户操作限流缓存'
  }
};

// 缓存管理器
class CacheManager {
  private redis: Redis;
  
  constructor(redis: Redis) {
    this.redis = redis;
  }
  
  /**
   * 生成缓存键
   * @param pattern 缓存键模式
   * @param params 参数对象
   */
  generateKey(pattern: string, params: Record<string, string>): string {
    let key = pattern;
    Object.entries(params).forEach(([param, value]) => {
      key = key.replace(`{${param}}`, value);
    });
    return key;
  }
  
  /**
   * 设置缓存
   * @param keyType 缓存键类型
   * @param params 参数
   * @param data 数据
   */
  async set(keyType: string, params: Record<string, string>, data: any): Promise<void> {
    const config = cacheKeys[keyType];
    if (!config) throw new Error(`Unknown cache key type: ${keyType}`);
    
    const key = this.generateKey(config.pattern, params);
    await this.redis.setex(key, config.ttl, JSON.stringify(data));
  }
  
  /**
   * 获取缓存
   * @param keyType 缓存键类型
   * @param params 参数
   */
  async get<T>(keyType: string, params: Record<string, string>): Promise<T | null> {
    const config = cacheKeys[keyType];
    if (!config) throw new Error(`Unknown cache key type: ${keyType}`);
    
    const key = this.generateKey(config.pattern, params);
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  /**
   * 删除缓存
   * @param keyType 缓存键类型
   * @param params 参数
   */
  async delete(keyType: string, params: Record<string, string>): Promise<void> {
    const config = cacheKeys[keyType];
    if (!config) throw new Error(`Unknown cache key type: ${keyType}`);
    
    const key = this.generateKey(config.pattern, params);
    await this.redis.del(key);
  }
  
  /**
   * 批量删除缓存
   * @param pattern 匹配模式
   */
  async deleteByPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### 3. Elasticsearch 搜索设计

#### 3.1 索引结构设计

```json
{
  "mappings": {
    "properties": {
      "id": {
        "type": "long"
      },
      "title": {
        "type": "text",
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_smart",
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "description": {
        "type": "text",
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_smart"
      },
      "category_id": {
        "type": "integer"
      },
      "category_name": {
        "type": "keyword"
      },
      "daily_price": {
        "type": "float"
      },
      "deposit": {
        "type": "float"
      },
      "condition_score": {
        "type": "integer"
      },
      "location": {
        "type": "geo_point"
      },
      "location_city": {
        "type": "keyword"
      },
      "location_district": {
        "type": "keyword"
      },
      "tags": {
        "type": "keyword"
      },
      "rating": {
        "type": "float"
      },
      "rating_count": {
        "type": "integer"
      },
      "view_count": {
        "type": "integer"
      },
      "order_count": {
        "type": "integer"
      },
      "status": {
        "type": "keyword"
      },
      "created_at": {
        "type": "date"
      },
      "updated_at": {
        "type": "date"
      },
      "owner_id": {
        "type": "long"
      },
      "owner_credit_score": {
        "type": "integer"
      },
      "available_dates": {
        "type": "date_range"
      }
    }
  },
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "ik_max_word": {
          "type": "ik_max_word"
        },
        "ik_smart": {
          "type": "ik_smart"
        }
      }
    }
  }
}
```

---

## 🔌 API接口设计

### 1. RESTful API 规范

#### 1.1 API 设计原则
- **RESTful风格**：使用标准HTTP方法
- **统一响应格式**：标准化的响应结构
- **版本控制**：通过URL路径进行版本管理
- **状态码规范**：使用标准HTTP状态码
- **分页查询**：统一的分页参数和响应

#### 1.2 通用响应格式

```typescript
// 统一响应接口
interface ApiResponse<T = any> {
  code: number;           // 业务状态码
  message: string;        // 响应消息
  data?: T;              // 响应数据
  timestamp: number;      // 时间戳
  requestId: string;      // 请求ID
}

// 分页响应接口
interface PaginationResponse<T> {
  items: T[];            // 数据列表
  total: number;         // 总数量
  page: number;          // 当前页码
  pageSize: number;      // 每页大小
  totalPages: number;    // 总页数
  hasNext: boolean;      // 是否有下一页
  hasPrev: boolean;      // 是否有上一页
}

// 错误响应接口
interface ErrorResponse {
  code: number;
  message: string;
  details?: any;
  timestamp: number;
  requestId: string;
  path: string;
}
```

#### 1.3 核心API接口

```typescript
// 用户认证相关API
namespace AuthAPI {
  // 发送验证码
  interface SendSmsRequest {
    phone: string;
    type: 'register' | 'login' | 'reset_password';
  }
  
  // 手机号注册
  interface RegisterRequest {
    phone: string;
    smsCode: string;
    password: string;
    nickname: string;
    inviteCode?: string;
  }
  
  // 登录请求
  interface LoginRequest {
    phone?: string;
    email?: string;
    password?: string;
    smsCode?: string;
    loginType: 'password' | 'sms' | 'wechat' | 'alipay';
    thirdPartyCode?: string;
  }
  
  // 登录响应
  interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: UserProfile;
  }
  
  // 用户资料
  interface UserProfile {
    id: number;
    phone: string;
    email?: string;
    nickname: string;
    avatar?: string;
    gender: number;
    birthday?: string;
    realName?: string;
    idCardVerified: boolean;
    faceVerified: boolean;
    creditScore: number;
    creditLevel: string;
    status: number;
  }
}

// 资源管理相关API
namespace ResourceAPI {
  // 资源搜索请求
  interface SearchRequest {
    keyword?: string;
    categoryId?: number;
    cityCode?: string;
    longitude?: number;
    latitude?: number;
    radius?: number; // 搜索半径(km)
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    conditionScore?: number;
    tags?: string[];
    sortBy?: 'price' | 'distance' | 'rating' | 'created_at';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }
  
  // 资源详情
  interface ResourceDetail {
    id: number;
    userId: number;
    categoryId: number;
    categoryName: string;
    title: string;
    description: string;
    specifications: Record<string, any>;
    images: string[];
    videos: string[];
    dailyPrice: number;
    hourlyPrice?: number;
    deposit: number;
    originalPrice?: number;
    conditionScore: number;
    location: {
      province: string;
      city: string;
      district: string;
      address?: string;
      longitude?: number;
      latitude?: number;
    };
    deliveryMethods: string[];
    availableStartDate?: string;
    availableEndDate?: string;
    availableTimeSlots?: any[];
    tags: string[];
    viewCount: number;
    favoriteCount: number;
    orderCount: number;
    rating: number;
    ratingCount: number;
    status: string;
    owner: {
      id: number;
      nickname: string;
      avatar?: string;
      creditScore: number;
      creditLevel: string;
    };
    createdAt: string;
    updatedAt: string;
  }
  
  // 发布资源请求
  interface PublishRequest {
    categoryId: number;
    title: string;
    description: string;
    specifications?: Record<string, any>;
    images: string[];
    videos?: string[];
    dailyPrice: number;
    hourlyPrice?: number;
    deposit: number;
    originalPrice?: number;
    conditionScore: number;
    locationProvince: string;
    locationCity: string;
    locationDistrict: string;
    locationAddress?: string;
    longitude?: number;
    latitude?: number;
    deliveryMethods: string[];
    availableStartDate?: string;
    availableEndDate?: string;
    availableTimeSlots?: any[];
    tags?: string[];
  }
}

// 订单管理相关API
namespace OrderAPI {
  // 创建订单请求
  interface CreateOrderRequest {
    resourceId: number;
    rentalStartDate: string;
    rentalEndDate: string;
    deliveryMethod: string;
    deliveryAddress?: {
      name: string;
      phone: string;
      province: string;
      city: string;
      district: string;
      address: string;
    };
    renterNotes?: string;
  }
  
  // 订单详情
  interface OrderDetail {
    id: number;
    orderNo: string;
    resourceId: number;
    resource: {
      id: number;
      title: string;
      images: string[];
      dailyPrice: number;
      hourlyPrice?: number;
    };
    renterId: number;
    renter: {
      id: number;
      nickname: string;
      avatar?: string;
      phone: string;
    };
    ownerId: number;
    owner: {
      id: number;
      nickname: string;
      avatar?: string;
      phone: string;
    };
    rentalStartDate: string;
    rentalEndDate: string;
    rentalDays: number;
    rentalHours?: number;
    totalRent: number;
    deposit: number;
    serviceFee: number;
    deliveryFee: number;
    insuranceFee: number;
    totalAmount: number;
    deliveryMethod: string;
    deliveryAddress?: any;
    pickupAddress?: any;
    renterNotes?: string;
    ownerNotes?: string;
    status: string;
    cancelReason?: string;
    cancelledBy?: number;
    cancelledAt?: string;
    confirmedAt?: string;
    deliveredAt?: string;
    returnedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

### 2. WebSocket 实时通信设计

#### 2.1 WebSocket 连接管理

```typescript
// WebSocket 消息类型定义
interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  messageId: string;
}

// 聊天消息
interface ChatMessage extends WebSocketMessage {
  type: 'chat_message';
  data: {
    conversationId: string;
    senderId: number;
    receiverId: number;
    messageType: 'text' | 'image' | 'voice' | 'file' | 'location';
    content: string;
    metadata?: any;
  };
}

// 订单状态更新
interface OrderStatusUpdate extends WebSocketMessage {
  type: 'order_status_update';
  data: {
    orderId: number;
    status: string;
    message: string;
  };
}

// 系统通知
interface SystemNotification extends WebSocketMessage {
  type: 'system_notification';
  data: {
    title: string;
    content: string;
    notificationType: 'info' | 'warning' | 'error' | 'success';
    actionUrl?: string;
  };
}

// WebSocket 连接管理器
class WebSocketManager {
  private connections: Map<number, WebSocket> = new Map();
  private userRooms: Map<number, Set<string>> = new Map();
  
  /**
   * 用户连接
   * @param userId 用户ID
   * @param ws WebSocket连接
   */
  connect(userId: number, ws: WebSocket): void {
    this.connections.set(userId, ws);
    
    // 加入用户个人房间
    this.joinRoom(userId, `user_${userId}`);
    
    ws.on('close', () => {
      this.disconnect(userId);
    });
    
    ws.on('message', (data) => {
      this.handleMessage(userId, data);
    });
  }
  
  /**
   * 用户断开连接
   * @param userId 用户ID
   */
  disconnect(userId: number): void {
    this.connections.delete(userId);
    this.userRooms.delete(userId);
  }
  
  /**
   * 加入房间
   * @param userId 用户ID
   * @param roomId 房间ID
   */
  joinRoom(userId: number, roomId: string): void {
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(roomId);
  }
  
  /**
   * 离开房间
   * @param userId 用户ID
   * @param roomId 房间ID
   */
  leaveRoom(userId: number, roomId: string): void {
    const rooms = this.userRooms.get(userId);
    if (rooms) {
      rooms.delete(roomId);
    }
  }
  
  /**
   * 发送消息给指定用户
   * @param userId 用户ID
   * @param message 消息
   */
  sendToUser(userId: number, message: WebSocketMessage): void {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  /**
   * 发送消息给房间内所有用户
   * @param roomId 房间ID
   * @param message 消息
   */
  sendToRoom(roomId: string, message: WebSocketMessage): void {
    this.userRooms.forEach((rooms, userId) => {
      if (rooms.has(roomId)) {
        this.sendToUser(userId, message);
      }
    });
  }
  
  /**
   * 处理接收到的消息
   * @param userId 用户ID
   * @param data 消息数据
   */
  private handleMessage(userId: number, data: any): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'chat_message':
          this.handleChatMessage(userId, message as ChatMessage);
          break;
        case 'join_room':
          this.joinRoom(userId, message.data.roomId);
          break;
        case 'leave_room':
          this.leaveRoom(userId, message.data.roomId);
          break;
        case 'ping':
          this.sendToUser(userId, { type: 'pong', data: {}, timestamp: Date.now(), messageId: message.messageId });
          break;
      }
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  }
  
  /**
   * 处理聊天消息
   * @param senderId 发送者ID
   * @param message 聊天消息
   */
  private async handleChatMessage(senderId: number, message: ChatMessage): Promise<void> {
    // 保存消息到数据库
    await this.saveChatMessage(message.data);
    
    // 转发消息给接收者
    this.sendToUser(message.data.receiverId, message);
    
    // 发送推送通知
    await this.sendPushNotification(message.data.receiverId, {
      title: '新消息',
      body: message.data.content,
      data: {
        type: 'chat',
        conversationId: message.data.conversationId
      }
    });
  }
  
  /**
   * 保存聊天消息
   * @param messageData 消息数据
   */
  private async saveChatMessage(messageData: any): Promise<void> {
    // 实现消息保存逻辑
  }
  
  /**
   * 发送推送通知
   * @param userId 用户ID
   * @param notification 通知内容
   */
  private async sendPushNotification(userId: number, notification: any): Promise<void> {
    // 实现推送通知逻辑
  }
}
```

---

## 🎨 前端架构设计

### 1. Web前端架构

#### 1.1 项目结构

```
web-frontend/
├── public/                     # 静态资源
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/             # 通用组件
│   │   ├── common/            # 基础组件
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── Loading/
│   │   ├── business/          # 业务组件
│   │   │   ├── ResourceCard/
│   │   │   ├── OrderCard/
│   │   │   ├── UserAvatar/
│   │   │   └── ChatWindow/
│   │   └── layout/            # 布局组件
│   │       ├── Header/
│   │       ├── Footer/
│   │       ├── Sidebar/
│   │       └── Layout/
│   ├── pages/                 # 页面组件
│   │   ├── Home/             # 首页
│   │   ├── Search/           # 搜索页
│   │   ├── Resource/         # 资源相关页面
│   │   │   ├── List/
│   │   │   ├── Detail/
│   │   │   └── Publish/
│   │   ├── Order/            # 订单相关页面
│   │   │   ├── List/
│   │   │   ├── Detail/
│   │   │   └── Create/
│   │   ├── User/             # 用户相关页面
│   │   │   ├── Profile/
│   │   │   ├── Settings/
│   │   │   └── Wallet/
│   │   └── Auth/             # 认证相关页面
│   │       ├── Login/
│   │       ├── Register/
│   │       └── ForgotPassword/
│   ├── hooks/                # 自定义Hooks
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   ├── useGeolocation.ts
│   │   └── useDebounce.ts
│   ├── store/                # 状态管理
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── resourceSlice.ts
│   │   │   ├── orderSlice.ts
│   │   │   └── chatSlice.ts
│   │   ├── api/
│   │   │   ├── authApi.ts
│   │   │   ├── resourceApi.ts
│   │   │   ├── orderApi.ts
│   │   │   └── userApi.ts
│   │   └── index.ts
│   ├── services/             # 服务层
│   │   ├── api.ts           # API配置
│   │   ├── websocket.ts     # WebSocket服务
│   │   ├── geolocation.ts   # 地理位置服务
│   │   ├── payment.ts       # 支付服务
│   │   └── upload.ts        # 文件上传服务
│   ├── utils/               # 工具函数
│   │   ├── format.ts        # 格式化工具
│   │   ├── validation.ts    # 验证工具
│   │   ├── storage.ts       # 存储工具
│   │   └── constants.ts     # 常量定义
│   ├── styles/              # 样式文件
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── themes/
│   ├── types/               # TypeScript类型定义
│   │   ├── api.ts
│   │   ├── user.ts
│   │   ├── resource.ts
│   │   └── order.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── setupTests.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

#### 1.2 核心组件设计

```typescript
// 资源卡片组件
import React from 'react';
import { Card, Image, Tag, Rate, Button } from 'antd';
import { HeartOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Resource } from '@/types/resource';
import { formatPrice, formatDistance } from '@/utils/format';

interface ResourceCardProps {
  resource: Resource;
  onFavorite?: (resourceId: number) => void;
  onView?: (resourceId: number) => void;
  className?: string;
}

/**
 * 资源卡片组件
 * 用于展示资源的基本信息，包括图片、标题、价格、评分等
 */
const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onFavorite,
  onView,
  className
}) => {
  // 处理收藏操作
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(resource.id);
  };
  
  // 处理查看详情
  const handleView = () => {
    onView?.(resource.id);
  };
  
  return (
    <Card
      className={`resource-card ${className || ''}`}
      hoverable
      cover={
        <div className="resource-card-cover">
          <Image
            src={resource.images[0]}
            alt={resource.title}
            preview={false}
            fallback="/images/placeholder.png"
          />
          <div className="resource-card-overlay">
            <Button
              type="text"
              icon={<HeartOutlined />}
              className="favorite-btn"
              onClick={handleFavorite}
            />
          </div>
        </div>
      }
      onClick={handleView}
    >
      <div className="resource-card-content">
        {/* 标题 */}
        <h3 className="resource-title" title={resource.title}>
          {resource.title}
        </h3>
        
        {/* 价格 */}
        <div className="resource-price">
          <span className="daily-price">
            ¥{formatPrice(resource.dailyPrice)}/天
          </span>
          {resource.hourlyPrice && (
            <span className="hourly-price">
              ¥{formatPrice(resource.hourlyPrice)}/时
            </span>
          )}
        </div>
        
        {/* 位置信息 */}
        <div className="resource-location">
          <EnvironmentOutlined />
          <span>{resource.location.district}</span>
          {resource.distance && (
            <span className="distance">
              {formatDistance(resource.distance)}
            </span>
          )}
        </div>
        
        {/* 评分和标签 */}
        <div className="resource-meta">
          <Rate
            disabled
            allowHalf
            value={resource.rating}
            className="resource-rating"
          />
          <span className="rating-count">
            ({resource.ratingCount})
          </span>
        </div>
        
        {/* 标签 */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="resource-tags">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <Tag key={index} size="small">
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResourceCard;
```

#### 1.3 状态管理设计

```typescript
// Redux Toolkit 状态管理
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { resourceApi } from '@/store/api/resourceApi';
import { Resource, ResourceSearchParams } from '@/types/resource';

// 异步操作：搜索资源
export const searchResources = createAsyncThunk(
  'resource/searchResources',
  async (params: ResourceSearchParams) => {
    const response = await resourceApi.search(params);
    return response.data;
  }
);

// 异步操作：获取资源详情
export const getResourceDetail = createAsyncThunk(
  'resource/getResourceDetail',
  async (resourceId: number) => {
    const response = await resourceApi.getDetail(resourceId);
    return response.data;
  }
);

// 资源状态接口
interface ResourceState {
  // 搜索相关
  searchParams: ResourceSearchParams;
  searchResults: Resource[];
  searchTotal: number;
  searchLoading: boolean;
  searchError: string | null;
  
  // 详情相关
  currentResource: Resource | null;
  detailLoading: boolean;
  detailError: string | null;
  
  // 收藏列表
  favorites: number[];
  
  // 分类数据
  categories: any[];
  
  // 热门推荐
  hotResources: Resource[];
  
  // 最近浏览
  recentViewed: Resource[];
}

// 初始状态
const initialState: ResourceState = {
  searchParams: {
    keyword: '',
    categoryId: undefined,
    page: 1,
    pageSize: 20
  },
  searchResults: [],
  searchTotal: 0,
  searchLoading: false,
  searchError: null,
  currentResource: null,
  detailLoading: false,
  detailError: null,
  favorites: [],
  categories: [],
  hotResources: [],
  recentViewed: []
};

// 创建资源切片
const resourceSlice = createSlice({
  name: 'resource',
  initialState,
  reducers: {
    // 更新搜索参数
    updateSearchParams: (state, action: PayloadAction<Partial<ResourceSearchParams>>) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    
    // 清空搜索结果
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchTotal = 0;
    },
    
    // 添加到收藏
    addToFavorites: (state, action: PayloadAction<number>) => {
      if (!state.favorites.includes(action.payload)) {
        state.favorites.push(action.payload);
      }
    },
    
    // 从收藏中移除
    removeFromFavorites: (state, action: PayloadAction<number>) => {
      state.favorites = state.favorites.filter(id => id !== action.payload);
    },
    
    // 添加到最近浏览
    addToRecentViewed: (state, action: PayloadAction<Resource>) => {
      const resource = action.payload;
      // 移除已存在的记录
      state.recentViewed = state.recentViewed.filter(item => item.id !== resource.id);
      // 添加到开头
      state.recentViewed.unshift(resource);
      // 限制最多保存20条记录
      if (state.recentViewed.length > 20) {
        state.recentViewed = state.recentViewed.slice(0, 20);
      }
    },
    
    // 设置分类数据
    setCategories: (state, action: PayloadAction<any[]>) => {
      state.categories = action.payload;
    },
    
    // 设置热门资源
    setHotResources: (state, action: PayloadAction<Resource[]>) => {
      state.hotResources = action.payload;
    }
  },
  
  // 处理异步操作
  extraReducers: (builder) => {
    // 搜索资源
    builder
      .addCase(searchResources.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchResources.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.items;
        state.searchTotal = action.payload.total;
      })
      .addCase(searchResources.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.error.message || '搜索失败';
      })
      // 获取资源详情
      .addCase(getResourceDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(getResourceDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentResource = action.payload;
        // 添加到最近浏览
        resourceSlice.caseReducers.addToRecentViewed(state, {
          type: 'resource/addToRecentViewed',
          payload: action.payload
        });
      })
      .addCase(getResourceDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.error.message || '获取详情失败';
      });
  }
});

// 导出actions
export const {
  updateSearchParams,
  clearSearchResults,
  addToFavorites,
  removeFromFavorites,
  addToRecentViewed,
  setCategories,
  setHotResources
} = resourceSlice.actions;

// 导出reducer
export default resourceSlice.reducer;

// 选择器
export const selectSearchResults = (state: RootState) => state.resource.searchResults;
export const selectSearchLoading = (state: RootState) => state.resource.searchLoading;
export const selectCurrentResource = (state: RootState) => state.resource.currentResource;
export const selectFavorites = (state: RootState) => state.resource.favorites;
export const selectHotResources = (state: RootState) => state.resource.hotResources;
```

### 2. 移动端架构设计

#### 2.1 React Native 项目结构

```
mobile-app/
├── android/                   # Android原生代码
├── ios/                      # iOS原生代码
├── src/
│   ├── components/           # 组件
│   │   ├── common/          # 通用组件
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── Loading/
│   │   ├── business/        # 业务组件
│   │   │   ├── ResourceCard/
│   │   │   ├── OrderCard/
│   │   │   └── ChatBubble/
│   │   └── navigation/      # 导航组件
│   ├── screens/             # 页面
│   │   ├── Home/
│   │   ├── Search/
│   │   ├── Resource/
│   │   ├── Order/
│   │   ├── Chat/
│   │   ├── Profile/
│   │   └── Auth/
│   ├── navigation/          # 导航配置
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── TabNavigator.tsx
│   ├── store/              # 状态管理
│   │   ├── slices/
│   │   ├── api/
│   │   └── index.ts
│   ├── services/           # 服务
│   │   ├── api.ts
│   │   ├── location.ts
│   │   ├── notification.ts
│   │   └── storage.ts
│   ├── utils/              # 工具
│   ├── hooks/              # 自定义Hooks
│   ├── types/              # 类型定义
│   └── constants/          # 常量
├── package.json
├── metro.config.js
├── babel.config.js
└── README.md
```

#### 2.2 移动端核心功能实现

```typescript
// 地理位置服务
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

class LocationService {
  /**
   * 请求位置权限
   */
  static async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '位置权限',
            message: '应用需要访问您的位置信息以提供附近的资源',
            buttonNeutral: '稍后询问',
            buttonNegative: '取消',
            buttonPositive: '确定',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }
  
  /**
   * 获取当前位置
   */
  static async getCurrentPosition(): Promise<LocationCoords> {
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('位置权限被拒绝');
    }
    
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(new Error(`获取位置失败: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
    });
  }
  
  /**
   * 监听位置变化
   */
  static watchPosition(
    onLocationChange: (coords: LocationCoords) => void,
    onError?: (error: Error) => void
  ): number {
    return Geolocation.watchPosition(
      (position) => {
        onLocationChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        onError?.(new Error(`位置监听失败: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // 10米变化才触发
        interval: 5000,     // 5秒间隔
        fastestInterval: 2000
      }
    );
  }
  
  /**
   * 停止位置监听
   */
  static clearWatch(watchId: number): void {
    Geolocation.clearWatch(watchId);
  }
}

export default LocationService;
```

---

## 🔒 安全设计

### 1. 身份认证与授权

#### 1.1 JWT认证机制

```typescript
// JWT认证服务
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Redis } from 'ioredis';

interface JWTPayload {
  userId: number;
  phone: string;
  role: string;
  sessionId: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthService {
  private redis: Redis;
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string = '15m';  // 访问令牌15分钟过期
  private refreshTokenExpiry: string = '7d';  // 刷新令牌7天过期
  
  constructor(redis: Redis) {
    this.redis = redis;
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
  }
  
  /**
   * 生成密码哈希
   * @param password 明文密码
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
  
  /**
   * 验证密码
   * @param password 明文密码
   * @param hashedPassword 哈希密码
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
  
  /**
   * 生成令牌对
   * @param payload JWT载荷
   */
  async generateTokenPair(payload: JWTPayload): Promise<TokenPair> {
    // 生成访问令牌
    const accessToken = jwt.sign(
      payload,
      this.accessTokenSecret,
      { expiresIn: this.accessTokenExpiry }
    );
    
    // 生成刷新令牌
    const refreshToken = jwt.sign(
      { userId: payload.userId, sessionId: payload.sessionId },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiry }
    );
    
    // 将刷新令牌存储到Redis
    const refreshTokenKey = `refresh_token:${payload.userId}:${payload.sessionId}`;
    await this.redis.setex(refreshTokenKey, 7 * 24 * 3600, refreshToken);
    
    // 存储用户会话信息
    const sessionKey = `user_session:${payload.sessionId}`;
    await this.redis.setex(sessionKey, 7 * 24 * 3600, JSON.stringify({
      userId: payload.userId,
      phone: payload.phone,
      role: payload.role,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }));
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15分钟
    };
  }
  
  /**
   * 验证访问令牌
   * @param token 访问令牌
   */
  async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as JWTPayload;
      
      // 检查会话是否有效
      const sessionKey = `user_session:${payload.sessionId}`;
      const sessionData = await this.redis.get(sessionKey);
      
      if (!sessionData) {
        return null; // 会话已过期或无效
      }
      
      // 更新最后活动时间
      const session = JSON.parse(sessionData);
      session.lastActivity = new Date().toISOString();
      await this.redis.setex(sessionKey, 7 * 24 * 3600, JSON.stringify(session));
      
      return payload;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * 刷新访问令牌
   * @param refreshToken 刷新令牌
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
    try {
      const payload = jwt.verify(refreshToken, this.refreshTokenSecret) as {
        userId: number;
        sessionId: string;
      };
      
      // 验证刷新令牌是否存在于Redis中
      const refreshTokenKey = `refresh_token:${payload.userId}:${payload.sessionId}`;
      const storedToken = await this.redis.get(refreshTokenKey);
      
      if (storedToken !== refreshToken) {
        return null; // 刷新令牌无效
      }
      
      // 获取用户信息
      const sessionKey = `user_session:${payload.sessionId}`;
      const sessionData = await this.redis.get(sessionKey);
      
      if (!sessionData) {
        return null; // 会话已过期
      }
      
      const session = JSON.parse(sessionData);
      
      // 生成新的令牌对
      return this.generateTokenPair({
        userId: payload.userId,
        phone: session.phone,
        role: session.role,
        sessionId: payload.sessionId
      });
    } catch (error) {
      return null;
    }
  }
  
  /**
   * 注销用户
   * @param sessionId 会话ID
   * @param userId 用户ID
   */
  async logout(sessionId: string, userId: number): Promise<void> {
    // 删除刷新令牌
    const refreshTokenKey = `refresh_token:${userId}:${sessionId}`;
    await this.redis.del(refreshTokenKey);
    
    // 删除会话信息
    const sessionKey = `user_session:${sessionId}`;
    await this.redis.del(sessionKey);
  }
  
  /**
   * 注销用户所有会话
   * @param userId 用户ID
   */
  async logoutAllSessions(userId: number): Promise<void> {
    // 查找用户所有会话
    const pattern = `refresh_token:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      // 删除所有刷新令牌
      await this.redis.del(...keys);
      
      // 删除对应的会话信息
      const sessionKeys = keys.map(key => {
        const sessionId = key.split(':')[2];
        return `user_session:${sessionId}`;
      });
      
      await this.redis.del(...sessionKeys);
    }
  }
}

export default AuthService;
```

#### 1.2 权限控制中间件

```typescript
// 权限控制中间件
import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/auth.service';
import { Redis } from 'ioredis';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    phone: string;
    role: string;
    sessionId: string;
  };
}

class AuthMiddleware {
  private authService: AuthService;
  
  constructor(redis: Redis) {
    this.authService = new AuthService(redis);
  }
  
  /**
   * JWT认证中间件
   */
  authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: '缺少认证令牌'
        });
        return;
      }
      
      const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
      const payload = await this.authService.verifyAccessToken(token);
      
      if (!payload) {
        res.status(401).json({
          success: false,
          message: '无效的认证令牌'
        });
        return;
      }
      
      // 将用户信息添加到请求对象
      req.user = {
        userId: payload.userId,
        phone: payload.phone,
        role: payload.role,
        sessionId: payload.sessionId
      };
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '认证服务异常'
      });
    }
  };
  
  /**
   * 角色权限检查
   * @param allowedRoles 允许的角色列表
   */
  authorize = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }
      
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: '权限不足'
        });
        return;
      }
      
      next();
    };
  };
  
  /**
   * 资源所有者检查
   * @param resourceIdParam 资源ID参数名
   * @param resourceType 资源类型
   */
  checkResourceOwnership = (resourceIdParam: string, resourceType: 'resource' | 'order') => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            message: '用户未认证'
          });
          return;
        }
        
        const resourceId = parseInt(req.params[resourceIdParam]);
        if (isNaN(resourceId)) {
          res.status(400).json({
            success: false,
            message: '无效的资源ID'
          });
          return;
        }
        
        // 这里需要根据实际的数据库查询来验证所有权
        // 示例代码，实际实现需要注入数据库服务
        const isOwner = await this.checkOwnership(req.user.userId, resourceId, resourceType);
        
        if (!isOwner && req.user.role !== 'admin') {
          res.status(403).json({
            success: false,
            message: '无权访问此资源'
          });
          return;
        }
        
        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: '权限检查失败'
        });
      }
    };
  };
  
  /**
   * 检查资源所有权（需要注入数据库服务）
   */
  private async checkOwnership(
    userId: number,
    resourceId: number,
    resourceType: 'resource' | 'order'
  ): Promise<boolean> {
    // 实际实现需要查询数据库
    // 这里只是示例
    return true;
  }
}

export default AuthMiddleware;
```

### 2. 数据加密

#### 2.1 敏感数据加密服务

```typescript
// 数据加密服务
import crypto from 'crypto';

interface EncryptionResult {
  encryptedData: string;
  iv: string;
}

class EncryptionService {
  private algorithm: string = 'aes-256-gcm';
  private secretKey: Buffer;
  
  constructor() {
    // 从环境变量获取密钥，实际部署时应使用密钥管理服务
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('缺少加密密钥');
    }
    this.secretKey = crypto.scryptSync(key, 'salt', 32);
  }
  
  /**
   * 加密敏感数据
   * @param plaintext 明文数据
   */
  encrypt(plaintext: string): EncryptionResult {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted + ':' + authTag.toString('hex'),
      iv: iv.toString('hex')
    };
  }
  
  /**
   * 解密敏感数据
   * @param encryptedData 加密数据
   * @param iv 初始化向量
   */
  decrypt(encryptedData: string, iv: string): string {
    const [encrypted, authTagHex] = encryptedData.split(':');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * 生成哈希值（用于数据完整性校验）
   * @param data 原始数据
   */
  generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * 验证哈希值
   * @param data 原始数据
   * @param hash 哈希值
   */
  verifyHash(data: string, hash: string): boolean {
    const computedHash = this.generateHash(data);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  }
  
  /**
   * 生成随机令牌
   * @param length 令牌长度
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

export default EncryptionService;
```

### 3. API安全防护

#### 3.1 请求频率限制

```typescript
// 频率限制中间件
import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';

interface RateLimitOptions {
  windowMs: number;     // 时间窗口（毫秒）
  maxRequests: number;  // 最大请求数
  message?: string;     // 限制消息
  skipSuccessfulRequests?: boolean; // 跳过成功请求
  skipFailedRequests?: boolean;     // 跳过失败请求
}

class RateLimitMiddleware {
  private redis: Redis;
  
  constructor(redis: Redis) {
    this.redis = redis;
  }
  
  /**
   * 创建频率限制中间件
   * @param options 限制选项
   */
  createRateLimit = (options: RateLimitOptions) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // 获取客户端标识（IP地址或用户ID）
        const identifier = this.getClientIdentifier(req);
        const key = `rate_limit:${identifier}:${req.route?.path || req.path}`;
        
        // 获取当前请求计数
        const current = await this.redis.get(key);
        const requestCount = current ? parseInt(current) : 0;
        
        // 检查是否超过限制
        if (requestCount >= options.maxRequests) {
          // 获取重置时间
          const ttl = await this.redis.ttl(key);
          
          res.status(429).json({
            success: false,
            message: options.message || '请求过于频繁，请稍后再试',
            retryAfter: ttl > 0 ? ttl : Math.ceil(options.windowMs / 1000)
          });
          return;
        }
        
        // 增加请求计数
        const pipeline = this.redis.pipeline();
        pipeline.incr(key);
        
        // 设置过期时间（仅在第一次请求时）
        if (requestCount === 0) {
          pipeline.expire(key, Math.ceil(options.windowMs / 1000));
        }
        
        await pipeline.exec();
        
        // 添加响应头
        res.set({
          'X-RateLimit-Limit': options.maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, options.maxRequests - requestCount - 1).toString(),
          'X-RateLimit-Reset': new Date(Date.now() + options.windowMs).toISOString()
        });
        
        next();
      } catch (error) {
        console.error('频率限制中间件错误:', error);
        next(); // 发生错误时不阻止请求
      }
    };
  };
  
  /**
   * 获取客户端标识
   */
  private getClientIdentifier(req: Request): string {
    // 优先使用用户ID（如果已认证）
    const user = (req as any).user;
    if (user?.userId) {
      return `user:${user.userId}`;
    }
    
    // 使用IP地址
    return `ip:${req.ip || req.connection.remoteAddress || 'unknown'}`;
  }
  
  /**
   * 登录频率限制（更严格）
   */
  loginRateLimit = this.createRateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 5,           // 最多5次尝试
    message: '登录尝试过于频繁，请15分钟后再试'
  });
  
  /**
   * API频率限制（一般）
   */
  apiRateLimit = this.createRateLimit({
    windowMs: 60 * 1000,      // 1分钟
    maxRequests: 100,         // 最多100次请求
    message: 'API请求过于频繁，请稍后再试'
  });
  
  /**
   * 搜索频率限制
   */
  searchRateLimit = this.createRateLimit({
    windowMs: 60 * 1000,      // 1分钟
    maxRequests: 30,          // 最多30次搜索
    message: '搜索请求过于频繁，请稍后再试'
  });
}

export default RateLimitMiddleware;
```

---

## 🚀 部署架构

### 1. 阿里云架构设计

#### 1.1 云服务架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        阿里云架构                              │
├─────────────────────────────────────────────────────────────┤
│  CDN (全球加速)                                              │
│  ├── 静态资源缓存                                            │
│  └── 图片/视频加速                                           │
├─────────────────────────────────────────────────────────────┤
│  SLB (负载均衡)                                              │
│  ├── HTTPS终结                                              │
│  ├── 健康检查                                               │
│  └── 流量分发                                               │
├─────────────────────────────────────────────────────────────┤
│  ECS集群 (弹性计算)                                          │
│  ├── Web服务器 (Nginx)                                      │
│  ├── API服务器 (Node.js)                                    │
│  ├── WebSocket服务器                                        │
│  └── 定时任务服务器                                          │
├─────────────────────────────────────────────────────────────┤
│  数据层                                                      │
│  ├── RDS MySQL (主从复制)                                   │
│  ├── Redis集群 (缓存/会话)                                   │
│  ├── Elasticsearch (搜索)                                   │
│  └── OSS (对象存储)                                          │
├─────────────────────────────────────────────────────────────┤
│  监控与安全                                                  │
│  ├── CloudMonitor (监控告警)                                │
│  ├── WAF (Web应用防火墙)                                     │
│  ├── Anti-DDoS (DDoS防护)                                   │
│  └── RAM (访问控制)                                          │
└─────────────────────────────────────────────────────────────┘
```

#### 1.2 Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Nginx反向代理
  nginx:
    image: nginx:alpine
    container_name: trade-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./ssl:/etc/nginx/ssl
      - ./web/dist:/usr/share/nginx/html
    depends_on:
      - api
      - websocket
    networks:
      - trade-network
    restart: unless-stopped

  # API服务
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: trade-api
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://root:${MYSQL_ROOT_PASSWORD}@mysql:3306/trade_db
      - REDIS_URL=redis://redis:6379
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - mysql
      - redis
      - elasticsearch
    networks:
      - trade-network
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  # WebSocket服务
  websocket:
    build:
      context: ./websocket
      dockerfile: Dockerfile
    container_name: trade-websocket
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
    depends_on:
      - redis
    networks:
      - trade-network
    restart: unless-stopped

  # MySQL数据库
  mysql:
    image: mysql:8.0
    container_name: trade-mysql
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=trade_db
      - MYSQL_USER=trade_user
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/conf.d:/etc/mysql/conf.d
      - ./mysql/init:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    networks:
      - trade-network
    restart: unless-stopped
    command: >
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --innodb-buffer-pool-size=256M
      --max-connections=200

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: trade-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
      - ./redis/redis.conf:/etc/redis/redis.conf
    ports:
      - "6379:6379"
    networks:
      - trade-network
    restart: unless-stopped

  # Elasticsearch搜索
  elasticsearch:
    image: elasticsearch:8.8.0
    container_name: trade-elasticsearch
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    networks:
      - trade-network
    restart: unless-stopped

  # Kibana (可选，用于ES管理)
  kibana:
    image: kibana:8.8.0
    container_name: trade-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    networks:
      - trade-network
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
  elasticsearch_data:

networks:
  trade-network:
    driver: bridge
```

#### 1.3 Nginx配置

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    # 基础配置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 上游服务器
    upstream api_backend {
        least_conn;
        server api:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }
    
    upstream websocket_backend {
        server websocket:3001;
    }
    
    # 包含站点配置
    include /etc/nginx/conf.d/*.conf;
}
```

```nginx
# nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name localhost;
    
    # SSL配置
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API接口
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # WebSocket连接
    location /ws/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket特殊配置
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # 文件上传
    location /uploads/ {
        alias /app/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 2. 监控与日志

#### 2.1 应用监控配置

```typescript
// 监控服务
import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';

interface MetricData {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  activeConnections: number;
}

class MonitoringService {
  private redis: Redis;
  private metrics: Map<string, MetricData[]> = new Map();
  
  constructor(redis: Redis) {
    this.redis = redis;
    this.startMetricsCollection();
  }
  
  /**
   * 性能监控中间件
   */
  performanceMiddleware = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();
      const startCpuUsage = process.cpuUsage();
      
      // 监听响应结束事件
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        const cpuUsage = process.cpuUsage(startCpuUsage);
        
        // 记录性能指标
        this.recordMetric('api_response_time', {
          timestamp: Date.now(),
          value: responseTime,
          tags: {
            method: req.method,
            route: req.route?.path || req.path,
            status: res.statusCode.toString()
          }
        });
        
        // 记录CPU使用情况
        this.recordMetric('api_cpu_usage', {
          timestamp: Date.now(),
          value: cpuUsage.user + cpuUsage.system,
          tags: {
            method: req.method,
            route: req.route?.path || req.path
          }
        });
        
        // 异常响应时间告警
        if (responseTime > 5000) {
          this.sendAlert('slow_response', {
            route: req.route?.path || req.path,
            responseTime,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      next();
    };
  };
  
  /**
   * 记录自定义指标
   * @param metricName 指标名称
   * @param data 指标数据
   */
  recordMetric(metricName: string, data: MetricData): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    
    const metrics = this.metrics.get(metricName)!;
    metrics.push(data);
    
    // 保持最近1000条记录
    if (metrics.length > 1000) {
      metrics.shift();
    }
    
    // 异步存储到Redis
    this.storeMetricToRedis(metricName, data);
  }
  
  /**
   * 获取系统性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      responseTime: this.getAverageResponseTime(),
      memoryUsage,
      cpuUsage,
      activeConnections: this.getActiveConnections()
    };
  }
  
  /**
   * 发送告警
   * @param alertType 告警类型
   * @param data 告警数据
   */
  private async sendAlert(alertType: string, data: any): Promise<void> {
    try {
      const alertData = {
        type: alertType,
        timestamp: new Date().toISOString(),
        data,
        severity: this.getAlertSeverity(alertType)
      };
      
      // 存储告警到Redis
      await this.redis.lpush('alerts', JSON.stringify(alertData));
      await this.redis.ltrim('alerts', 0, 999); // 保持最近1000条告警
      
      // 这里可以集成钉钉、企业微信等告警通知
      console.warn(`[ALERT] ${alertType}:`, data);
    } catch (error) {
      console.error('发送告警失败:', error);
    }
  }
  
  /**
   * 获取告警严重程度
   */
  private getAlertSeverity(alertType: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      slow_response: 'medium',
      high_memory: 'high',
      high_cpu: 'high',
      database_error: 'critical',
      redis_error: 'high'
    };
    
    return severityMap[alertType] || 'low';
  }
  
  /**
   * 启动指标收集
   */
  private startMetricsCollection(): void {
    // 每30秒收集一次系统指标
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // 记录内存使用情况
      this.recordMetric('system_memory', {
        timestamp: Date.now(),
        value: memoryUsage.heapUsed,
        tags: { type: 'heap_used' }
      });
      
      // 记录CPU使用情况
      this.recordMetric('system_cpu', {
        timestamp: Date.now(),
        value: cpuUsage.user + cpuUsage.system,
        tags: { type: 'total' }
      });
      
      // 内存使用告警（超过500MB）
      if (memoryUsage.heapUsed > 500 * 1024 * 1024) {
        this.sendAlert('high_memory', {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          timestamp: new Date().toISOString()
        });
      }
    }, 30000);
  }
  
  /**
   * 存储指标到Redis
   */
  private async storeMetricToRedis(metricName: string, data: MetricData): Promise<void> {
    try {
      const key = `metrics:${metricName}`;
      await this.redis.zadd(key, data.timestamp, JSON.stringify(data));
      
      // 保持最近24小时的数据
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      await this.redis.zremrangebyscore(key, 0, oneDayAgo);
    } catch (error) {
      console.error('存储指标到Redis失败:', error);
    }
  }
  
  /**
   * 获取平均响应时间
   */
  private getAverageResponseTime(): number {
    const responseTimeMetrics = this.metrics.get('api_response_time') || [];
    if (responseTimeMetrics.length === 0) return 0;
    
    const total = responseTimeMetrics.reduce((sum, metric) => sum + metric.value, 0);
    return total / responseTimeMetrics.length;
  }
  
  /**
   * 获取活跃连接数
   */
  private getActiveConnections(): number {
    // 这里需要根据实际的连接池实现
    return 0;
  }
}

export default MonitoringService;
```

#### 2.2 日志管理

```typescript
// 日志服务
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request, Response, NextFunction } from 'express';

interface LogContext {
  userId?: number;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

class LoggerService {
  private logger: winston.Logger;
  
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'trade-platform',
        version: process.env.APP_VERSION || '1.0.0'
      },
      transports: [
        // 控制台输出
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        
        // 错误日志文件
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true
        }),
        
        // 应用日志文件
        new DailyRotateFile({
          filename: 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          zippedArchive: true
        }),
        
        // 访问日志文件
        new DailyRotateFile({
          filename: 'logs/access-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'http',
          maxSize: '20m',
          maxFiles: '7d',
          zippedArchive: true
        })
      ]
    });
  }
  
  /**
   * 请求日志中间件
   */
  requestLogger = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();
      const requestId = this.generateRequestId();
      
      // 添加请求ID到请求对象
      (req as any).requestId = requestId;
      
      // 记录请求开始
      this.info('Request started', {
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.userId
      });
      
      // 监听响应结束
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        this.logger.log('http', 'Request completed', {
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: (req as any).user?.userId
        });
      });
      
      next();
    };
  };
  
  /**
   * 记录信息日志
   * @param message 日志消息
   * @param context 上下文信息
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }
  
  /**
   * 记录警告日志
   * @param message 日志消息
   * @param context 上下文信息
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }
  
  /**
   * 记录错误日志
   * @param message 日志消息
   * @param error 错误对象
   * @param context 上下文信息
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(message, {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }
  
  /**
   * 记录调试日志
   * @param message 日志消息
   * @param context 上下文信息
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }
  
  /**
   * 记录业务操作日志
   * @param action 操作类型
   * @param details 操作详情
   * @param context 上下文信息
   */
  logBusinessAction(
    action: string,
    details: Record<string, any>,
    context?: LogContext
  ): void {
    this.logger.info(`Business Action: ${action}`, {
      ...context,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * 记录安全事件
   * @param event 安全事件类型
   * @param details 事件详情
   * @param context 上下文信息
   */
  logSecurityEvent(
    event: string,
    details: Record<string, any>,
    context?: LogContext
  ): void {
    this.logger.warn(`Security Event: ${event}`, {
      ...context,
      event,
      details,
      timestamp: new Date().toISOString(),
      severity: 'security'
    });
  }
  
  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default LoggerService;
```

### 3. 性能优化

#### 3.1 数据库优化策略

```sql
-- 数据库索引优化
-- 用户表索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 资源表索引
CREATE INDEX idx_resources_owner_id ON resources(owner_id);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_location ON resources(latitude, longitude);
CREATE INDEX idx_resources_price ON resources(daily_price);
CREATE INDEX idx_resources_created_at ON resources(created_at);

-- 复合索引
CREATE INDEX idx_resources_search ON resources(category, status, daily_price);
CREATE INDEX idx_resources_location_search ON resources(latitude, longitude, status);

-- 订单表索引
CREATE INDEX idx_orders_renter_id ON orders(renter_id);
CREATE INDEX idx_orders_resource_id ON orders(resource_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_date_range ON orders(start_date, end_date);

-- 支付表索引
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- 评价表索引
CREATE INDEX idx_reviews_resource_id ON reviews(resource_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- 消息表索引
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- 分区表（针对大数据量）
-- 按月分区操作日志表
ALTER TABLE operation_logs PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    PARTITION p202403 VALUES LESS THAN (202404),
    -- 继续添加更多分区...
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

#### 3.2 缓存策略

```typescript
// 缓存管理器
import { Redis } from 'ioredis';

interface CacheOptions {
  ttl?: number;           // 过期时间（秒）
  prefix?: string;        // 键前缀
  serialize?: boolean;    // 是否序列化
}

class CacheManager {
  private redis: Redis;
  private defaultTTL: number = 3600; // 默认1小时
  
  constructor(redis: Redis) {
    this.redis = redis;
  }
  
  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param options 缓存选项
   */
  async set(
    key: string,
    value: any,
    options: CacheOptions = {}
  ): Promise<void> {
    const {
      ttl = this.defaultTTL,
      prefix = 'cache',
      serialize = true
    } = options;
    
    const cacheKey = `${prefix}:${key}`;
    const cacheValue = serialize ? JSON.stringify(value) : value;
    
    if (ttl > 0) {
      await this.redis.setex(cacheKey, ttl, cacheValue);
    } else {
      await this.redis.set(cacheKey, cacheValue);
    }
  }
  
  /**
   * 获取缓存
   * @param key 缓存键
   * @param options 缓存选项
   */
  async get<T = any>(
    key: string,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const {
      prefix = 'cache',
      serialize = true
    } = options;
    
    const cacheKey = `${prefix}:${key}`;
    const value = await this.redis.get(cacheKey);
    
    if (value === null) {
      return null;
    }
    
    return serialize ? JSON.parse(value) : value;
  }
  
  /**
   * 删除缓存
   * @param key 缓存键
   * @param prefix 键前缀
   */
  async del(key: string, prefix: string = 'cache'): Promise<void> {
    const cacheKey = `${prefix}:${key}`;
    await this.redis.del(cacheKey);
  }
  
  /**
   * 批量删除缓存
   * @param pattern 匹配模式
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  /**
   * 缓存装饰器
   * @param cacheKey 缓存键生成函数
   * @param ttl 过期时间
   */
  cacheDecorator(
    cacheKey: (...args: any[]) => string,
    ttl: number = this.defaultTTL
  ) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const key = cacheKey(...args);
        
        // 尝试从缓存获取
        const cached = await this.cacheManager.get(key);
        if (cached !== null) {
          return cached;
        }
        
        // 执行原方法
        const result = await method.apply(this, args);
        
        // 存储到缓存
        await this.cacheManager.set(key, result, { ttl });
        
        return result;
      };
    };
  }
  
  /**
   * 热点数据预加载
   */
  async preloadHotData(): Promise<void> {
    try {
      // 预加载热门资源分类
      const categories = await this.getPopularCategories();
      await this.set('popular_categories', categories, { ttl: 1800 }); // 30分钟
      
      // 预加载热门城市
      const cities = await this.getPopularCities();
      await this.set('popular_cities', cities, { ttl: 3600 }); // 1小时
      
      // 预加载系统配置
      const config = await this.getSystemConfig();
      await this.set('system_config', config, { ttl: 600 }); // 10分钟
      
      console.log('热点数据预加载完成');
    } catch (error) {
      console.error('热点数据预加载失败:', error);
    }
  }
  
  /**
   * 获取热门分类（示例）
   */
  private async getPopularCategories(): Promise<string[]> {
    // 这里应该查询数据库获取热门分类
    return ['electronics', 'vehicles', 'tools', 'sports'];
  }
  
  /**
   * 获取热门城市（示例）
   */
  private async getPopularCities(): Promise<string[]> {
    // 这里应该查询数据库获取热门城市
    return ['北京', '上海', '广州', '深圳', '杭州'];
  }
  
  /**
   * 获取系统配置（示例）
   */
  private async getSystemConfig(): Promise<Record<string, any>> {
    // 这里应该查询数据库获取系统配置
    return {
      platformFeeRate: 0.05,
      minDepositRatio: 0.2,
      maxRentalDays: 30
    };
  }
}

export default CacheManager;
```

---

## 🧪 测试策略

### 1. 单元测试

#### 1.1 Jest配置

```json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000
};
```

#### 1.2 测试示例

```typescript
// tests/services/auth.service.test.ts
import AuthService from '../../src/services/auth.service';
import { Redis } from 'ioredis';
import bcrypt from 'bcrypt';

// Mock Redis
const mockRedis = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  expire: jest.fn()
} as unknown as Redis;

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let authService: AuthService;
  
  beforeEach(() => {
    authService = new AuthService(mockRedis);
    jest.clearAllMocks();
  });
  
  describe('hashPassword', () => {
    it('应该正确哈希密码', async () => {
      // Arrange
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword';
      mockBcrypt.hash.mockResolvedValue(hashedPassword);
      
      // Act
      const result = await authService.hashPassword(password);
      
      // Assert
      expect(result).toBe(hashedPassword);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
    
    it('应该在密码为空时抛出错误', async () => {
      // Arrange
      const password = '';
      
      // Act & Assert
      await expect(authService.hashPassword(password))
        .rejects.toThrow('密码不能为空');
    });
  });
  
  describe('verifyPassword', () => {
    it('应该正确验证密码', async () => {
      // Arrange
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword';
      mockBcrypt.compare.mockResolvedValue(true);
      
      // Act
      const result = await authService.verifyPassword(password, hashedPassword);
      
      // Assert
      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
    
    it('应该在密码错误时返回false', async () => {
      // Arrange
      const password = 'wrongPassword';
      const hashedPassword = 'hashedPassword';
      mockBcrypt.compare.mockResolvedValue(false);
      
      // Act
      const result = await authService.verifyPassword(password, hashedPassword);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('generateTokenPair', () => {
    it('应该生成访问令牌和刷新令牌', async () => {
      // Arrange
      const payload = {
        userId: 1,
        phone: '13800138000',
        role: 'user'
      };
      
      // Mock Redis operations
      mockRedis.set = jest.fn().mockResolvedValue('OK');
      mockRedis.expire = jest.fn().mockResolvedValue(1);
      
      // Act
      const result = await authService.generateTokenPair(payload);
      
      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.expiresIn).toBe(900); // 15分钟
    });
  });
});
```

### 2. 集成测试

```typescript
// tests/integration/auth.integration.test.ts
import request from 'supertest';
import app from '../../src/app';
import { DatabaseManager } from '../../src/database';
import { Redis } from 'ioredis';

describe('Auth Integration Tests', () => {
  let redis: Redis;
  
  beforeAll(async () => {
    // 初始化测试数据库
    await DatabaseManager.connect();
    redis = new Redis(process.env.REDIS_TEST_URL);
  });
  
  afterAll(async () => {
    // 清理测试数据
    await DatabaseManager.disconnect();
    await redis.disconnect();
  });
  
  beforeEach(async () => {
    // 清理测试数据
    await redis.flushdb();
  });
  
  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      // Arrange
      const userData = {
        phone: '13800138000',
        password: 'testPassword123',
        nickname: '测试用户',
        verificationCode: '123456'
      };
      
      // Mock验证码
      await redis.set('sms:13800138000', '123456', 'EX', 300);
      
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: '注册成功',
        data: {
          user: {
            phone: '13800138000',
            nickname: '测试用户'
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String)
          }
        }
      });
    });
    
    it('应该在手机号已存在时返回错误', async () => {
      // Arrange - 先创建一个用户
      const existingUser = {
        phone: '13800138000',
        password: 'password123',
        nickname: '已存在用户',
        verificationCode: '123456'
      };
      
      await redis.set('sms:13800138000', '123456', 'EX', 300);
      await request(app).post('/api/auth/register').send(existingUser);
      
      // Act - 尝试用相同手机号注册
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phone: '13800138000',
          password: 'newPassword123',
          nickname: '新用户',
          verificationCode: '123456'
        })
        .expect(400);
      
      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: '手机号已被注册'
      });
    });
  });
  
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 创建测试用户
      const userData = {
        phone: '13800138000',
        password: 'testPassword123',
        nickname: '测试用户',
        verificationCode: '123456'
      };
      
      await redis.set('sms:13800138000', '123456', 'EX', 300);
      await request(app).post('/api/auth/register').send(userData);
    });
    
    it('应该成功登录', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'testPassword123'
        })
        .expect(200);
      
      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: '登录成功',
        data: {
          user: {
            phone: '13800138000',
            nickname: '测试用户'
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String)
          }
        }
      });
    });
    
    it('应该在密码错误时返回错误', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'wrongPassword'
        })
        .expect(401);
      
      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: '手机号或密码错误'
      });
    });
  });
});
```

### 3. 端到端测试

```typescript
// tests/e2e/user-journey.e2e.test.ts
import { chromium, Browser, Page } from 'playwright';

describe('用户完整流程测试', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await chromium.launch({ headless: false });
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });
  
  afterEach(async () => {
    await page.close();
  });
  
  it('用户注册、登录、发布资源、下单的完整流程', async () => {
    // 1. 用户注册
    await page.click('[data-testid="register-button"]');
    await page.fill('[data-testid="phone-input"]', '13800138000');
    await page.fill('[data-testid="password-input"]', 'testPassword123');
    await page.fill('[data-testid="nickname-input"]', '测试用户');
    
    // 模拟获取验证码
    await page.click('[data-testid="get-code-button"]');
    await page.fill('[data-testid="code-input"]', '123456');
    
    await page.click('[data-testid="register-submit"]');
    
    // 验证注册成功
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('注册成功');
    
    // 2. 发布资源
    await page.click('[data-testid="publish-resource"]');
    await page.fill('[data-testid="resource-title"]', '测试资源');
    await page.selectOption('[data-testid="resource-category"]', 'electronics');
    await page.fill('[data-testid="resource-description"]', '这是一个测试资源');
    await page.fill('[data-testid="daily-price"]', '100');
    await page.fill('[data-testid="deposit"]', '500');
    
    // 上传图片
    await page.setInputFiles('[data-testid="image-upload"]', 'tests/fixtures/test-image.jpg');
    
    await page.click('[data-testid="publish-submit"]');
    
    // 验证发布成功
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('发布成功');
    
    // 3. 搜索和预订资源
    await page.fill('[data-testid="search-input"]', '测试资源');
    await page.click('[data-testid="search-button"]');
    
    // 点击搜索结果
    await page.click('[data-testid="resource-item"]:first-child');
    
    // 选择租赁日期
    await page.click('[data-testid="start-date"]');
    await page.click('[data-testid="date-today"]');
    await page.click('[data-testid="end-date"]');
    await page.click('[data-testid="date-tomorrow"]');
    
    await page.click('[data-testid="book-now"]');
    
    // 4. 支付
    await page.click('[data-testid="pay-button"]');
    
    // 模拟支付成功
    await page.waitForSelector('[data-testid="payment-success"]');
    
    // 验证订单创建成功
    await expect(page.locator('[data-testid="order-status"]'))
      .toContainText('待确认');
  });
  
  it('响应式设计测试', async () => {
    // 测试移动端视图
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 验证移动端导航
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // 测试平板视图
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // 验证平板端布局
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    
    // 测试桌面端视图
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 验证桌面端布局
    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
  });
});
```

---

## 📋 总结

本设计文档详细规划了闲置资源租赁平台的技术架构和实现方案，涵盖了：

### 🏗️ 核心架构
- **微服务架构**：API服务、WebSocket服务、定时任务服务
- **数据库设计**：MySQL主数据库 + Redis缓存 + Elasticsearch搜索
- **前端架构**：React Web应用 + React Native移动应用

### 🔐 安全设计
- **JWT认证机制**：访问令牌 + 刷新令牌双令牌体系
- **权限控制**：基于角色的访问控制（RBAC）
- **数据加密**：敏感数据AES-256-GCM加密
- **API安全**：请求频率限制、输入验证、HTTPS强制

### 🚀 性能优化
- **缓存策略**：多层缓存架构，热点数据预加载
- **数据库优化**：索引优化、分区表、读写分离
- **CDN加速**：静态资源全球分发
- **负载均衡**：多实例部署，自动扩缩容

### 📊 监控运维
- **应用监控**：性能指标收集、异常告警
- **日志管理**：结构化日志、日志轮转、安全审计
- **部署架构**：Docker容器化、阿里云原生服务

### 🧪 质量保证
- **测试策略**：单元测试、集成测试、端到端测试
- **代码质量**：TypeScript类型安全、ESLint代码规范
- **持续集成**：自动化测试、自动化部署

该设计方案确保了系统的**高可用性**、**高性能**、**高安全性**和**可扩展性**，为闲置资源租赁平台的成功运营提供了坚实的技术基础。