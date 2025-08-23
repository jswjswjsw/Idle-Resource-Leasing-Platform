#!/usr/bin/env node

const axios = require('axios');

// 配置
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function testConnection() {
  console.log('🚀 测试前后端连接...');
  
  const tests = [
    {
      name: '后端服务健康检查',
      url: `${API_BASE_URL}/health`
    },
    {
      name: '资源列表API',
      url: `${API_BASE_URL}/resources`
    },
    {
      name: '分类列表API',
      url: `${API_BASE_URL}/resources/categories`
    },
    {
      name: '热门资源API',
      url: `${API_BASE_URL}/resources/popular`
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`  测试 ${test.name}...`);
      
      const response = await axios.get(test.url, { timeout: 10000 });
      
      if (response.status === 200) {
        console.log(`  ✓ ${test.name} - 通过`);
        passed++;
      } else {
        console.log(`  ✗ ${test.name} - 失败 (状态码: ${response.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`  ✗ ${test.name} - 错误: ${error.message}`);
      failed++;
    }
  }

  console.log('====================================');
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  console.log(`总计: ${tests.length}`);
  
  if (failed === 0) {
    console.log('🎉 所有测试通过！前后端连接正常');
  } else {
    console.log(`❌ ${failed}个测试失败，请检查连接和配置`);
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️  测试数据库连接...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    if (response.data.success) {
      console.log('  ✓ 数据库连接正常');
    } else {
      console.log('  ✗ 数据库连接异常');
    }
  } catch (error) {
    console.log(`  ✗ 数据库连接失败: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🧪 前后端连接测试开始\n');
  
  await testConnection();
  await testDatabaseConnection();
  
  console.log('\n📋 测试完成！');
  console.log('如果遇到连接问题，请检查：');
  console.log('1. 后端服务是否已启动');
  console.log('2. 数据库是否已连接');
  console.log('3. 端口是否被占用');
  console.log('4. 网络连接是否正常');
}

if (require.main === module) {
  runAllTests().catch(console.error);
}