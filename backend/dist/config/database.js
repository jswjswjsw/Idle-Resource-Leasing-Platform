"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prisma = exports.extendedPrisma = exports.prisma = void 0;
exports.testDatabaseConnection = testDatabaseConnection;
exports.disconnectDatabase = disconnectDatabase;
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.checkMigrationStatus = checkMigrationStatus;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "Prisma", { enumerable: true, get: function () { return client_1.Prisma; } });
// 全局变量用于开发环境的Prisma实例
const globalForPrisma = globalThis;
// 创建Prisma实例，使用日志配置
exports.prisma = globalForPrisma.prisma ?? new client_1.PrismaClient({
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
    globalForPrisma.prisma = exports.prisma;
}
// 数据库连接测试
async function testDatabaseConnection() {
    try {
        await exports.prisma.$connect();
        console.log('✅ 数据库连接成功');
        return true;
    }
    catch (error) {
        console.error('❌ 数据库连接失败:', error);
        return false;
    }
}
// 数据库断开连接
async function disconnectDatabase() {
    try {
        await exports.prisma.$disconnect();
        console.log('✅ 数据库断开连接');
    }
    catch (error) {
        console.error('❌ 数据库断开连接失败:', error);
    }
}
// 数据库错误处理
// @ts-ignore - Prisma事件类型兼容性问题
exports.prisma.$on('error', (e) => {
    console.error('❌ Prisma错误:', e);
});
// 数据库查询日志（开发环境）
if (process.env.NODE_ENV === 'development') {
    // @ts-ignore - Prisma事件类型兼容性问题
    exports.prisma.$on('query', (e) => {
        console.log('📊 查询:', e.query);
        console.log('⏱️  参数:', e.params);
        console.log('⏰ 耗时:', e.duration + 'ms');
    });
}
// 数据库健康检查
async function checkDatabaseHealth() {
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        return { healthy: true, timestamp: new Date().toISOString() };
    }
    catch (error) {
        return { healthy: false, error: error, timestamp: new Date().toISOString() };
    }
}
// 数据库迁移状态检查
async function checkMigrationStatus() {
    try {
        const result = await exports.prisma.$queryRaw `
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
            tables: result,
            totalTables: result.length,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        return { error: error, timestamp: new Date().toISOString() };
    }
}
// 扩展Prisma客户端，添加自定义方法
exports.extendedPrisma = exports.prisma.$extends({
    result: {
        user: {
            fullName: {
                needs: { username: true },
                compute(user) {
                    return user.username;
                },
            },
        },
    },
    model: {
        user: {
            async findByEmail(email) {
                return exports.prisma.user.findUnique({
                    where: { email },
                    include: {
                        addresses: true,
                        paymentMethods: true,
                    },
                });
            },
        },
        resource: {
            async findAvailableResources(filters) {
                const where = { status: 'AVAILABLE' };
                if (filters?.category) {
                    where.categoryId = filters.category;
                }
                if (filters?.priceRange) {
                    where.price = {
                        gte: filters.priceRange.min,
                        lte: filters.priceRange.max,
                    };
                }
                return exports.prisma.resource.findMany({
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
//# sourceMappingURL=database.js.map