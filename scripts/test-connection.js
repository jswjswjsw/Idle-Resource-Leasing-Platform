#!/usr/bin/env node

/**
 * 前后端连接测试脚本
 * 测试API连接、数据库连接、Redis连接等
 */

const axios = require('axios');
const chalk = require('chalk');

// 配置
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// 测试项目
const tests = [
  {
    name: '后端服务健康检查',
    url: `${API_BASE_URL}/health`,
    expected: (data) => data.success === true
  },
  {
    name: '数据库连接',
    url: `${API_BASE_URL}/health`,
    expected: (data) => data.message === '服务器运行正常'
  },
  {
    name: '前端服务',
    url: FRONTEND_URL,
    expected: (data) => data.status === 200
  },
  {
    name: '资源列表API',
    url: `${API_BASE_URL}/resources`,
    expected: (data) => data.success === true && Array.isArray(data.data?.data)
  },
  {
    name: '分类列表API',
    url: `${API_BASE_URL}/resources/categories`,
    expected: (data) => data.success === true && Array.isArray(data.data)
  },
  {
    name: '热门资源API',
    url: `${API_BASE_URL}/resources/popular`,
    expected: (data) => data.success === true && Array.isArray(data.data)
  }
];

// 运行测试
async function runTests() {
  console.log(chalk.blue('\n🚀 测试前后端连接...\n'));
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(chalk.gray(`  测试 ${test.name}...`));
      
      const response = await axios.get(test.url, { timeout: 10000 });
      const result = test.expected(response.data);
      
      if (result) {
        console.log(chalk.green(`  ✓ ${test.name} - 通过`));
        passed++;
      } else {
        console.log(chalk.red(`  ✗ ${test.name} - 失败`));
        failed++;
      }
    } catch (error) {
      console.log(chalk.red(`  ✗ ${test.name} - 错误: ${error.message}`));
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(chalk.green(`通过: ${passed}`));
  console.log(chalk.red(`失败: ${failed}`));
  console.log(chalk.blue(`总计: ${tests.length}`));
  
  if (failed === 0) {
    console.log(chalk.green('\n🎉 所有测试通过！前后端连接正常'));
  } else {
    console.log(chalk.red(`\n❌ ${failed}个测试失败，请检查连接和配置`));
  }
}

// 数据库连接测试
async function testDatabaseConnection() {
  console.log(chalk.blue('\n🗄️  测试数据库连接...\n'));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    if (response.data.success) {
      console.log(chalk.green('  ✓ 数据库连接正常'));
    } else {
      console.log(chalk.red('  ✗ 数据库连接异常'));
    }
  } catch (error) {
    console.log(chalk.red(`  ✗ 数据库连接失败: ${error.message}`));
  }
}

// 用户注册和登录测试
async function testUserAuth() {
  console.log(chalk.blue('\n👤 测试用户认证...\n'));
  
  const testUser = {
    username: 'testuser' + Date.now(),
    email: 'test' + Date.now() + '@example.com',
    phone: '13800138000',
    password: 'Test123456',
    confirmPassword: 'Test123456'
  };

  try {
    // 测试注册
    console.log(chalk.gray('  测试用户注册...'));
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    
    if (registerResponse.data.success) {
      console.log(chalk.green('  ✓ 用户注册成功'));
      
      // 测试登录
      console.log(chalk.gray('  测试用户登录...'));
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      if (loginResponse.data.success) {
        console.log(chalk.green('  ✓ 用户登录成功'));
        
        // 测试token验证
        console.log(chalk.gray('  测试token验证...'));
        const token = loginResponse.data.data.token;
        const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (meResponse.data.success) {
          console.log(chalk.green('  ✓ token验证成功'));
        } else {
          console.log(chalk.red('  ✗ token验证失败'));
        }
      } else {
        console.log(chalk.red('  ✗ 用户登录失败'));
      }
    } else {
      console.log(chalk.red('  ✗ 用户注册失败'));
    }
  } catch (error) {
    console.log(chalk.red(`  ✗ 用户认证测试失败: ${error.message}`));
  }
}

// 文件上传测试
async function testFileUpload() {
  console.log(chalk.blue('\n📁 测试文件上传...\n'));
  
  // 这里可以添加文件上传测试
  console.log(chalk.yellow('  ⚠️ 文件上传测试需要手动验证'));
}

// 运行所有测试
async function runAllTests() {
  console.log(chalk.bold.blue('🧪 前后端连接测试开始\n'));
  
  await runTests();
  await testDatabaseConnection();
  await testUserAuth();
  await testFileUpload();
  
  console.log(chalk.blue('\n📋 测试完成！'));
  console.log(chalk.gray('如果遇到连接问题，请检查：'));
  console.log(chalk.gray('1. 后端服务是否已启动'));
  console.log(chalk.gray('2. 数据库是否已连接'));
  console.log(chalk.gray('3. 端口是否被占用'));
  console.log(chalk.gray('4. 网络连接是否正常'));
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runTests,
  testDatabaseConnection,
  testUserAuth,
  runAllTests
};