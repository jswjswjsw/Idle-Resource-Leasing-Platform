const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAPIConnection() {
  console.log('🧪 测试API连接...');
  
  try {
    // 测试健康检查
    console.log('1. 测试健康检查...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查通过:', health.data);

    // 测试API连接
    console.log('2. 测试API连接...');
    const test = await axios.get(`${BASE_URL}/api/test`);
    console.log('✅ API连接成功:', test.data);

    // 测试获取资源
    console.log('3. 测试获取资源...');
    const resources = await axios.get(`${BASE_URL}/api/resources`);
    console.log('✅ 资源获取成功:', {
      count: resources.data.data.length,
      sample: resources.data.data[0]
    });

    // 测试创建资源
    console.log('4. 测试创建资源...');
    const newResource = {
      title: '测试相机',
      description: '这是一个测试资源',
      price: 100,
      images: ['test.jpg'],
      location: '测试地点'
    };
    const created = await axios.post(`${BASE_URL}/api/resources`, newResource);
    console.log('✅ 资源创建成功:', created.data);

    console.log('\n🎉 所有API测试通过！');
    console.log('📊 后端API已完全连接并运行正常');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAPIConnection();