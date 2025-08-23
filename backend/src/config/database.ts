import { PrismaClient, Prisma } from '@prisma/client';

// 全局变量用于开发环境的Prisma实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 创建Prisma实例，使用日志配置
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

// 开发环境：将Prisma实例保存到全局变量
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 数据库连接测试
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

// 数据库断开连接
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ 数据库断开连接');
  } catch (error) {
    console.error('❌ 数据库断开连接失败:', error);
  }
}

// 数据库错误处理
// @ts-ignore - Prisma事件类型兼容性问题
prisma.$on('error', (e: any) => {
  console.error('❌ Prisma错误:', e);
});

// 数据库查询日志（开发环境）
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore - Prisma事件类型兼容性问题
  prisma.$on('query', (e: any) => {
    console.log('📊 查询:', e.query);
    console.log('⏱️  参数:', e.params);
    console.log('⏰ 耗时:', e.duration + 'ms');
  });
}

// 数据库健康检查
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, timestamp: new Date().toISOString() };
  } catch (error) {
    return { healthy: false, error: error, timestamp: new Date().toISOString() };
  }
}

// 数据库迁移状态检查
export async function checkMigrationStatus() {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        table_name,
        table_rows,
        create_time,
        update_time
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY table_name;
    `;
    
    return {
      tables: result as any[],
      totalTables: (result as any[]).length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { error: error, timestamp: new Date().toISOString() };
  }
}

// 扩展Prisma客户端，添加自定义方法
export const extendedPrisma = prisma.$extends({
  result: {
    user: {
      fullName: {
        needs: { username: true },
        compute(user: any) {
          return user.username;
        },
      },
    },
  },
  model: {
    user: {
      async findByEmail(email: string) {
        return prisma.user.findUnique({
          where: { email },
          include: {
            addresses: true,
            paymentMethods: true,
          },
        });
      },
    },
    resource: {
      async findAvailableResources(filters?: any) {
        const where: any = { status: 'AVAILABLE' };
        
        if (filters?.category) {
          where.categoryId = filters.category;
        }
        
        if (filters?.priceRange) {
          where.price = {
            gte: filters.priceRange.min,
            lte: filters.priceRange.max,
          };
        }

        return prisma.resource.findMany({
          where,
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                creditScore: true,
                verified: true,
              },
            },
            category: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      },
    },
  },
});

export type ExtendedPrismaClient = typeof extendedPrisma;

export { Prisma };