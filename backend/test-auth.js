const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAuthentication() {
  console.log('🔐 测试用户认证系统...\n');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查通过:', health.data.message);

    // 2. 测试用户注册
    console.log('\n2. 测试用户注册...');
    const registerData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test123456',
      phone: '13800138000'
    };

    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
    console.log('✅ 注册成功:', registerResponse.data.message);
    console.log('   用户ID:', registerResponse.data.data.user.id);
    console.log('   用户名:', registerResponse.data.data.user.username);
    console.log('   Token:', registerResponse.data.data.token.substring(0, 20) + '...');

    const token = registerResponse.data.data.token;

    // 3. 测试用户登录
    console.log('\n3. 测试用户登录...');
    const loginData = {
      email: 'test@example.com',
      password: 'Test123456'
    };

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ 登录成功:', loginResponse.data.message);
    console.log('   用户:', loginResponse.data.data.user.username);

    // 4. 测试获取用户信息
    console.log('\n4. 测试获取用户信息...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 获取用户信息成功:', profileResponse.data.data.username);

    // 5. 测试更新用户信息
    console.log('\n5. 测试更新用户信息...');
    const updateData = {
      username: 'updateduser',
      phone: '13900139000',
      avatar: 'https://example.com/avatar.jpg'
    };

    const updateResponse = await axios.put(`${BASE_URL}/api/auth/profile`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 更新用户信息成功:', updateResponse.data.data.username);

    // 6. 测试获取用户列表
    console.log('\n6. 测试获取用户列表...');
    const usersResponse = await axios.get(`${BASE_URL}/api/users`);
    console.log('✅ 获取用户列表成功:', usersResponse.data.data.length, '个用户');

    // 7. 测试资源创建
    console.log('\n7. 测试资源创建...');
    const resourceData = {
      title: '测试相机',
      description: '这是一个测试用的相机资源',
      price: 150,
      images: ['https://example.com/camera1.jpg'],
      location: '北京市朝阳区',
      category: '电子设备'
    };

    const resourceResponse = await axios.post(`${BASE_URL}/api/resources`, resourceData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 资源创建成功:', resourceResponse.data.data.title);

    // 8. 测试获取资源列表
    console.log('\n8. 测试获取资源列表...');
    const resourcesResponse = await axios.get(`${BASE_URL}/api/resources`);
    console.log('✅ 获取资源列表成功:', resourcesResponse.data.data.length, '个资源');

    console.log('\n🎉 所有认证测试通过！');
    console.log('📊 用户认证系统运行正常');

  } catch (error) {
    if (error.response) {
      console.error('❌ API错误:', error.response.data);
    } else {
      console.error('❌ 连接错误:', error.message);
    }
  }
}

async function testErrorCases() {
  console.log('\n🚨 测试错误处理...\n');

  try {
    // 测试重复注册
    console.log('1. 测试重复注册...');
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test123456'
      });
    } catch (error) {
      console.log('✅ 重复注册正确处理:', error.response.data.message);
    }

    // 测试无效登录
    console.log('2. 测试无效登录...');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'wrong@example.com',
        password: 'WrongPassword'
      });
    } catch (error) {
      console.log('✅ 无效登录正确处理:', error.response.data.message);
    }

    // 测试无token访问
    console.log('3. 测试无token访问...');
    try {
      await axios.get(`${BASE_URL}/api/auth/profile`);
    } catch (error) {
      console.log('✅ 无token访问正确处理:', error.response.data.message);
    }

  } catch (error) {
    console.error('❌ 错误测试失败:', error.message);
  }
}

// 运行测试
async function runTests() {
  await testAuthentication();
  await testErrorCases();
  console.log('\n✅ 所有测试完成！');
}

if (require.main === module) {
  runTests();
}

module.exports = { testAuthentication, testErrorCases };