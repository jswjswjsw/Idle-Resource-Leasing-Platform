import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始插入种子数据...');

  // 1. 创建示例用户
  const hashedPassword = await bcrypt.hash('123456', 12);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        username: '管理员',
        password: hashedPassword,
        phone: '13800138001',
        avatar: 'https://example.com/avatars/admin.jpg',
        creditScore: 1000,
        verified: true,
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'user1@example.com',
        username: '张三',
        password: hashedPassword,
        phone: '13800138002',
        avatar: 'https://example.com/avatars/user1.jpg',
        creditScore: 950,
        verified: true,
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'user2@example.com',
        username: '李四',
        password: hashedPassword,
        phone: '13800138003',
        avatar: 'https://example.com/avatars/user2.jpg',
        creditScore: 880,
        verified: false,
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'user3@example.com',
        username: '王五',
        password: hashedPassword,
        phone: '13800138004',
        avatar: 'https://example.com/avatars/user3.jpg',
        creditScore: 750,
        verified: true,
        isActive: true
      }
    })
  ]);

  console.log(`✅ 创建了 ${users.length} 个用户`);

  // 2. 创建资源分类
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: '电子设备',
        nameEn: 'Electronics',
        description: '手机、相机、电脑等电子设备',
        icon: '📱',
        sortOrder: 1
      }
    }),
    prisma.category.create({
      data: {
        name: '家居用品',
        nameEn: 'Home Appliances',
        description: '家具、家电、厨具等家居用品',
        icon: '🏠',
        sortOrder: 2
      }
    }),
    prisma.category.create({
      data: {
        name: '户外装备',
        nameEn: 'Outdoor Equipment',
        description: '帐篷、烧烤架、运动器材等户外装备',
        icon: '🏕️',
        sortOrder: 3
      }
    }),
    prisma.category.create({
      data: {
        name: '交通工具',
        nameEn: 'Transportation',
        description: '汽车、电动车、自行车等交通工具',
        icon: '🚗',
        sortOrder: 4
      }
    }),
    prisma.category.create({
      data: {
        name: '办公设备',
        nameEn: 'Office Equipment',
        description: '打印机、投影仪、办公桌椅等办公设备',
        icon: '💼',
        sortOrder: 5
      }
    })
  ]);

  console.log(`✅ 创建了 ${categories.length} 个分类`);

  // 3. 创建示例资源
  const resources = await Promise.all([
    prisma.resource.create({
      data: {
        title: '佳能EOS R5专业相机',
        description: '4500万像素全画幅专业相机，支持8K视频录制，适合专业摄影师和摄影爱好者使用。包含标准镜头和三脚架。',
        categoryId: categories[0].id,
        price: 150.00,
        priceUnit: 'DAY',
        images: JSON.stringify([
          'https://example.com/images/canon-r5-1.jpg',
          'https://example.com/images/canon-r5-2.jpg',
          'https://example.com/images/canon-r5-3.jpg'
        ]),
        location: '北京市朝阳区三里屯',
        latitude: 39.9388,
        longitude: 116.4608,
        ownerId: users[0].id,
        deposit: 500.00,
        tags: JSON.stringify(['相机', '摄影', '专业', '佳能', '全画幅']),
        status: 'AVAILABLE'
      }
    }),
    prisma.resource.create({
      data: {
        title: '大疆Mavic 3无人机',
        description: '专业级航拍无人机，支持4K/60fps视频录制，飞行时间长达46分钟，配备哈苏相机。适合航拍、测绘、婚礼等场景。',
        categoryId: categories[0].id,
        price: 200.00,
        priceUnit: 'DAY',
        images: JSON.stringify([
          'https://example.com/images/mavic3-1.jpg',
          'https://example.com/images/mavic3-2.jpg'
        ]),
        location: '上海市浦东新区陆家嘴',
        latitude: 31.2304,
        longitude: 121.4737,
        ownerId: users[1].id,
        deposit: 800.00,
        tags: JSON.stringify(['无人机', '航拍', '大疆', '4K', '专业']),
        status: 'AVAILABLE'
      }
    }),
    prisma.resource.create({
      data: {
        title: '苹果MacBook Pro 16寸',
        description: 'M2 Pro芯片，32GB内存，1TB SSD，专业级笔记本电脑。适合视频剪辑、图形设计、编程开发等高强度工作。',
        categoryId: categories[0].id,
        price: 100.00,
        priceUnit: 'DAY',
        images: JSON.stringify([
          'https://example.com/images/macbook-pro-1.jpg',
          'https://example.com/images/macbook-pro-2.jpg'
        ]),
        location: '深圳市南山区科技园',
        latitude: 22.5431,
        longitude: 114.0579,
        ownerId: users[2].id,
        deposit: 300.00,
        tags: JSON.stringify(['笔记本', '苹果', 'M2', '专业', '编程']),
        status: 'AVAILABLE'
      }
    }),
    prisma.resource.create({
      data: {
        title: '现代简约沙发床',
        description: '可折叠沙发床，展开后是1.5米双人床，适合小户型或临时客人住宿。面料易清洁，框架稳固。',
        categoryId: categories[1].id,
        price: 50.00,
        priceUnit: 'DAY',
        images: JSON.stringify([
          'https://example.com/images/sofa-bed-1.jpg',
          'https://example.com/images/sofa-bed-2.jpg'
        ]),
        location: '广州市天河区珠江新城',
        latitude: 23.1291,
        longitude: 113.2644,
        ownerId: users[3].id,
        deposit: 100.00,
        tags: JSON.stringify(['沙发床', '家具', '简约', '折叠', '小户型']),
        status: 'AVAILABLE'
      }
    }),
    prisma.resource.create({
      data: {
        title: '露营帐篷套装',
        description: '4-6人自动帐篷，包含地席、睡袋、营地灯等全套装备。适合家庭露营、朋友聚会等户外活动。',
        categoryId: categories[2].id,
        price: 80.00,
        priceUnit: 'DAY',
        images: JSON.stringify([
          'https://example.com/images/tent-1.jpg',
          'https://example.com/images/tent-2.jpg'
        ]),
        location: '杭州市西湖区',
        latitude: 30.2741,
        longitude: 120.1551,
        ownerId: users[0].id,
        deposit: 150.00,
        tags: JSON.stringify(['帐篷', '露营', '户外', '套装', '家庭']),
        status: 'AVAILABLE'
      }
    })
  ]);

  console.log(`✅ 创建了 ${resources.length} 个资源`);

  // 4. 创建用户地址
  const addresses = await Promise.all([
    prisma.address.create({
      data: {
        userId: users[0].id,
        label: '家',
        address: '北京市朝阳区三里屯SOHO A座',
        latitude: 39.9388,
        longitude: 116.4608,
        isDefault: true
      }
    }),
    prisma.address.create({
      data: {
        userId: users[1].id,
        label: '公司',
        address: '上海市浦东新区陆家嘴金融中心',
        latitude: 31.2304,
        longitude: 121.4737,
        isDefault: true
      }
    })
  ]);

  console.log(`✅ 创建了 ${addresses.length} 个地址`);

  // 5. 创建系统配置
  const systemConfigs = await Promise.all([
    prisma.systemConfig.create({
      data: {
        key: 'siteName',
        value: '闲置资源租赁平台',
        type: 'string',
        isPublic: true
      }
    }),
    prisma.systemConfig.create({
      data: {
        key: 'maxRentalDays',
        value: '30',
        type: 'number',
        isPublic: true
      }
    }),
    prisma.systemConfig.create({
      data: {
        key: 'depositPercentage',
        value: '0.3',
        type: 'number',
        isPublic: true
      }
    })
  ]);

  console.log(`✅ 创建了 ${systemConfigs.length} 个系统配置`);

  console.log('🎉 种子数据插入完成！');
  console.log('📊 数据概览：');
  console.log(`   - 用户: ${users.length}`);
  console.log(`   - 分类: ${categories.length}`);
  console.log(`   - 资源: ${resources.length}`);
  console.log(`   - 地址: ${addresses.length}`);
  console.log(`   - 系统配置: ${systemConfigs.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });