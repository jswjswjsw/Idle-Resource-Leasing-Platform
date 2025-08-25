import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始插入种子数据...');

  // 1. 创建系统配置
  await createSystemConfigs();
  
  // 2. 创建资源分类
  await createCategories();
  
  // 3. 创建测试用户
  await createTestUsers();
  
  // 4. 创建测试资源
  await createTestResources();

  console.log('✅ 种子数据插入完成！');
}

// 创建系统配置
async function createSystemConfigs() {
  console.log('📋 创建系统配置...');
  
  const configs = [
    {
      key: 'site_name',
      value: '闲置资源租赁平台',
      type: 'STRING',
      category: 'basic',
      description: '网站名称'
    },
    {
      key: 'site_description',
      value: '让闲置资源流动起来，创造更多价值',
      type: 'STRING',
      category: 'basic',
      description: '网站描述'
    },
    {
      key: 'default_credit_score',
      value: '100',
      type: 'NUMBER',
      category: 'user',
      description: '新用户默认信用分'
    },
    {
      key: 'min_rent_days',
      value: '1',
      type: 'NUMBER',
      category: 'business',
      description: '最小租赁天数'
    },
    {
      key: 'max_rent_days',
      value: '30',
      type: 'NUMBER',
      category: 'business',
      description: '最大租赁天数'
    },
    {
      key: 'service_fee_rate',
      value: '0.05',
      type: 'NUMBER',
      category: 'business',
      description: '平台服务费率'
    },
    {
      key: 'auto_confirm_hours',
      value: '72',
      type: 'NUMBER',
      category: 'business',
      description: '订单自动确认小时数'
    }
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config
    });
  }
}

// 创建资源分类
async function createCategories() {
  console.log('📂 创建资源分类...');
  
  // 一级分类
  const electronics = await prisma.category.upsert({
    where: { name: '数码电子' },
    update: {},
    create: {
      name: '数码电子',
      description: '手机、电脑、相机等电子产品',
      icon: '📱',
      sort: 1
    }
  });

  const tools = await prisma.category.upsert({
    where: { name: '工具设备' },
    update: {},
    create: {
      name: '工具设备',
      description: '各类工具和设备',
      icon: '🔧',
      sort: 2
    }
  });

  const vehicles = await prisma.category.upsert({
    where: { name: '交通工具' },
    update: {},
    create: {
      name: '交通工具',
      description: '汽车、自行车、电动车等',
      icon: '🚗',
      sort: 3
    }
  });

  const sports = await prisma.category.upsert({
    where: { name: '运动户外' },
    update: {},
    create: {
      name: '运动户外',
      description: '运动器材、户外用品',
      icon: '⚽',
      sort: 4
    }
  });

  const home = await prisma.category.upsert({
    where: { name: '家居用品' },
    update: {},
    create: {
      name: '家居用品',
      description: '家具、家电、生活用品',
      icon: '🏠',
      sort: 5
    }
  });

  // 二级分类
  const subCategories = [
    // 数码电子子分类
    { name: '手机数码', parentId: electronics.id, description: '手机、平板、智能手表等', icon: '📱' },
    { name: '电脑办公', parentId: electronics.id, description: '笔记本、台式机、办公设备', icon: '💻' },
    { name: '摄影摄像', parentId: electronics.id, description: '相机、摄像机、镜头等', icon: '📷' },
    { name: '游戏设备', parentId: electronics.id, description: '游戏机、VR设备等', icon: '🎮' },
    
    // 工具设备子分类
    { name: '电动工具', parentId: tools.id, description: '电钻、切割机等电动工具', icon: '⚡' },
    { name: '手动工具', parentId: tools.id, description: '扳手、螺丝刀等手动工具', icon: '🔨' },
    { name: '测量仪器', parentId: tools.id, description: '测距仪、水平仪等', icon: '📏' },
    { name: '园艺工具', parentId: tools.id, description: '割草机、修枝剪等', icon: '🌿' },
    
    // 交通工具子分类
    { name: '汽车', parentId: vehicles.id, description: '轿车、SUV、面包车等', icon: '🚗' },
    { name: '自行车', parentId: vehicles.id, description: '山地车、公路车、电动车', icon: '🚴' },
    { name: '摩托车', parentId: vehicles.id, description: '摩托车、电动摩托车', icon: '🏍️' },
    
    // 运动户外子分类
    { name: '健身器材', parentId: sports.id, description: '跑步机、哑铃、瑜伽垫等', icon: '💪' },
    { name: '户外装备', parentId: sports.id, description: '帐篷、睡袋、登山包等', icon: '🏕️' },
    { name: '球类运动', parentId: sports.id, description: '足球、篮球、网球等', icon: '⚽' },
    
    // 家居用品子分类
    { name: '家具', parentId: home.id, description: '桌椅、沙发、床等', icon: '🪑' },
    { name: '家电', parentId: home.id, description: '洗衣机、冰箱、空调等', icon: '🔌' },
    { name: '厨房用品', parentId: home.id, description: '锅具、餐具、小家电等', icon: '🍳' }
  ];

  for (const [index, subCategory] of subCategories.entries()) {
    await prisma.category.upsert({
      where: { name: subCategory.name },
      update: {},
      create: {
        ...subCategory,
        sort: index + 1
      }
    });
  }
}

// 创建测试用户
async function createTestUsers() {
  console.log('👥 创建测试用户...');
  
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const users = [
    {
      email: 'admin@trade.com',
      username: 'admin',
      password: hashedPassword,
      realName: '管理员',
      status: 'ACTIVE',
      isVerified: true,
      emailVerified: true,
      location: '北京市朝阳区',
      city: '北京市',
      district: '朝阳区',
      creditScore: 100
    },
    {
      email: 'user1@trade.com',
      username: 'user1',
      password: hashedPassword,
      realName: '张三',
      status: 'ACTIVE',
      isVerified: true,
      emailVerified: true,
      location: '上海市浦东新区',
      city: '上海市',
      district: '浦东新区',
      creditScore: 95
    },
    {
      email: 'user2@trade.com',
      username: 'user2',
      password: hashedPassword,
      realName: '李四',
      status: 'ACTIVE',
      isVerified: true,
      emailVerified: true,
      location: '广州市天河区',
      city: '广州市',
      district: '天河区',
      creditScore: 98
    }
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData
    });
  }
}

// 创建测试资源
async function createTestResources() {
  console.log('📦 创建测试资源...');
  
  // 获取用户和分类
  const users = await prisma.user.findMany({ take: 3 });
  const categories = await prisma.category.findMany({
    where: { parentId: { not: null } }
  });
  
  if (users.length === 0 || categories.length === 0) {
    console.log('跳过创建测试资源：缺少用户或分类数据');
    return;
  }

  const resources = [
    {
      title: 'MacBook Pro 13寸 2023款',
      description: '全新MacBook Pro，M2芯片，16GB内存，512GB存储。适合办公、开发、设计等用途。',
      categoryId: categories.find(c => c.name === '电脑办公')?.id || categories[0].id,
      ownerId: users[1].id,
      images: JSON.stringify(['/images/macbook1.jpg', '/images/macbook2.jpg']),
      pricePerDay: 150.00,
      deposit: 3000.00,
      location: '上海市浦东新区张江高科技园区',
      latitude: 31.2034,
      longitude: 121.5944,
      city: '上海市',
      district: '浦东新区',
      condition: 'EXCELLENT',
      minRentDays: 1,
      maxRentDays: 30
    },
    {
      title: 'Canon EOS R5 专业相机',
      description: '佳能专业全画幅无反相机，4500万像素，8K视频录制。包含24-70mm f/2.8镜头。',
      categoryId: categories.find(c => c.name === '摄影摄像')?.id || categories[1].id,
      ownerId: users[2].id,
      images: JSON.stringify(['/images/canon1.jpg', '/images/canon2.jpg']),
      pricePerDay: 300.00,
      deposit: 8000.00,
      location: '广州市天河区珠江新城',
      latitude: 23.1204,
      longitude: 113.3208,
      city: '广州市',
      district: '天河区',
      condition: 'GOOD',
      minRentDays: 1,
      maxRentDays: 7
    },
    {
      title: '小牛电动车 NGT',
      description: '小牛电动车NGT，续航80公里，智能锁车，GPS定位。适合城市通勤。',
      categoryId: categories.find(c => c.name === '自行车')?.id || categories[2].id,
      ownerId: users[1].id,
      images: JSON.stringify(['/images/niu1.jpg', '/images/niu2.jpg']),
      pricePerDay: 50.00,
      deposit: 1500.00,
      location: '北京市朝阳区国贸CBD',
      latitude: 39.9175,
      longitude: 116.4560,
      city: '北京市',
      district: '朝阳区',
      condition: 'GOOD',
      minRentDays: 1,
      maxRentDays: 15
    }
  ];

  for (const resourceData of resources) {
    await prisma.resource.create({
      data: {
        ...resourceData,
        status: 'AVAILABLE',
        publishedAt: new Date()
      }
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ 种子数据插入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });