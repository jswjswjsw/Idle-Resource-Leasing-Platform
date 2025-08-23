import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// 加载测试环境变量
dotenv.config({ path: '.env.test' });

// 全局测试变量
declare global {
  var prisma: PrismaClient;
  var testUser: any;
  var testResource: any;
  var testOrder: any;
}

// 创建测试数据库实例
global.prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db'
    }
  }
});

// 测试前置设置
beforeAll(async () => {
  // 连接数据库
  await global.prisma.$connect();
  
  // 清理测试数据
  await cleanDatabase();
  
  // 创建测试数据
  await seedTestData();
});

// 每个测试前的设置
beforeEach(async () => {
  // 开始事务（如果需要的话）
});

// 每个测试后的清理
afterEach(async () => {
  // 回滚事务或清理特定数据
});

// 测试后置清理
afterAll(async () => {
  // 清理测试数据
  await cleanDatabase();
  
  // 断开数据库连接
  await global.prisma.$disconnect();
});

/**
 * 清理数据库
 */
async function cleanDatabase() {
  const tablenames = await global.prisma.$queryRaw<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname='public'`
  ).catch(() => []);
  
  if (tablenames.length === 0) {
    // SQLite 清理方式
    await global.prisma.favorite.deleteMany();
    await global.prisma.review.deleteMany();
    await global.prisma.message.deleteMany();
    await global.prisma.payment.deleteMany();
    await global.prisma.order.deleteMany();
    await global.prisma.notification.deleteMany();
    await global.prisma.resource.deleteMany();
    await global.prisma.oAuthAccount.deleteMany();
    await global.prisma.userVerification.deleteMany();
    await global.prisma.paymentMethod.deleteMany();
    await global.prisma.address.deleteMany();
    await global.prisma.user.deleteMany();
    await global.prisma.category.deleteMany();
    await global.prisma.systemConfig.deleteMany();
  } else {
    // PostgreSQL 清理方式
    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        await global.prisma.$executeRawUnsafe(`TRUNCATE TABLE \"public\".\"${tablename}\" CASCADE;`);
      }
    }
  }
}

/**
 * 创建测试种子数据
 */
async function seedTestData() {
  // 创建测试分类
  const testCategory = await global.prisma.category.create({
    data: {
      id: 'test-category-id',
      name: '测试分类',
      description: '用于测试的分类',
      isActive: true
    }
  });

  // 创建测试用户
  global.testUser = await global.prisma.user.create({
    data: {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      password: '$2a$10$abcdefghijklmnopqrstuvwxyz', // 加密后的密码
      verified: true,
      isActive: true
    }
  });

  // 创建测试资源
  global.testResource = await global.prisma.resource.create({
    data: {
      id: 'test-resource-id',
      title: '测试资源',
      description: '这是一个用于测试的资源',
      categoryId: testCategory.id,
      price: 100,
      priceUnit: 'DAY',
      images: JSON.stringify(['test-image.jpg']),
      location: '测试地点',
      latitude: 39.9042,
      longitude: 116.4074,
      status: 'AVAILABLE',
      ownerId: global.testUser.id,
      deposit: 50
    }
  });

  // 创建测试订单
  global.testOrder = await global.prisma.order.create({
    data: {
      id: 'test-order-id',
      resourceId: global.testResource.id,
      renterId: global.testUser.id,
      ownerId: global.testUser.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-02'),
      totalPrice: 100,
      deposit: 50,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      deliveryMethod: 'PICKUP'
    }
  });
}

/**
 * 测试工具函数
 */
export const testUtils = {
  /**
   * 创建测试用户
   */
  async createTestUser(userData: Partial<any> = {}) {
    return await global.prisma.user.create({
      data: {
        username: 'testuser' + Math.random().toString(36).substring(7),
        email: `test${Math.random().toString(36).substring(7)}@example.com`,
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz',
        verified: true,
        isActive: true,
        ...userData
      }
    });
  },

  /**
   * 创建测试资源
   */
  async createTestResource(resourceData: Partial<any> = {}) {
    const user = resourceData.ownerId ? null : await this.createTestUser();
    
    return await global.prisma.resource.create({
      data: {
        title: '测试资源' + Math.random().toString(36).substring(7),
        description: '这是一个用于测试的资源',
        categoryId: 'test-category-id',
        price: 100,
        priceUnit: 'DAY',
        images: JSON.stringify(['test-image.jpg']),
        location: '测试地点',
        latitude: 39.9042,
        longitude: 116.4074,
        status: 'AVAILABLE',
        ownerId: user?.id || global.testUser.id,
        deposit: 50,
        ...resourceData
      }
    });
  },

  /**
   * 创建测试订单
   */
  async createTestOrder(orderData: Partial<any> = {}) {
    const resource = orderData.resourceId ? null : await this.createTestResource();
    const renter = orderData.renterId ? null : await this.createTestUser();
    
    return await global.prisma.order.create({
      data: {
        resourceId: resource?.id || global.testResource.id,
        renterId: renter?.id || global.testUser.id,
        ownerId: resource?.ownerId || global.testUser.id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
        totalPrice: 100,
        deposit: 50,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        deliveryMethod: 'PICKUP',
        ...orderData
      }
    });
  },

  /**
   * 等待指定时间
   */
  async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * 生成随机字符串
   */
  randomString(length: number = 10) {
    return Math.random().toString(36).substring(2, length + 2);
  },

  /**
   * 生成随机邮箱
   */
  randomEmail() {
    return `test-${this.randomString()}@example.com`;
  }
};