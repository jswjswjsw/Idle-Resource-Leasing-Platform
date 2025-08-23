#!/usr/bin/env node

/**
 * 支付宝RSA密钥对生成工具
 * 用于生成支付宝沙箱环境所需的RSA2密钥对
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 支付宝RSA2密钥对生成工具');
console.log('=====================================');

try {
  // 生成RSA密钥对 (2048位)
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // 创建密钥目录
  const keysDir = path.join(__dirname, '../keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  // 保存私钥
  const privateKeyPath = path.join(keysDir, 'alipay_private_key.pem');
  fs.writeFileSync(privateKeyPath, privateKey);

  // 保存公钥
  const publicKeyPath = path.join(keysDir, 'alipay_public_key.pem');
  fs.writeFileSync(publicKeyPath, publicKey);

  // 格式化公钥用于支付宝平台配置
  const publicKeyForAlipay = publicKey
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\n/g, '');

  // 格式化私钥用于应用配置
  const privateKeyForApp = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\n/g, '');

  console.log('✅ RSA密钥对生成成功！');
  console.log('\n📁 密钥文件位置:');
  console.log(`   私钥: ${privateKeyPath}`);
  console.log(`   公钥: ${publicKeyPath}`);

  console.log('\n🔧 配置说明:');
  console.log('1. 应用私钥 (配置到环境变量):');
  console.log('-----------------------------------');
  console.log(privateKeyForApp);

  console.log('\n2. 应用公钥 (配置到支付宝开放平台):');
  console.log('-----------------------------------');
  console.log(publicKeyForAlipay);

  console.log('\n📋 配置步骤:');
  console.log('1. 复制上面的"应用公钥"到支付宝开放平台');
  console.log('2. 在支付宝平台保存后，获取"支付宝公钥"');
  console.log('3. 将密钥配置到阿里云环境变量');

  // 生成环境变量配置示例
  console.log('\n⚙️  环境变量配置示例:');
  console.log('-----------------------------------');
  console.log(`ALIPAY_SANDBOX_APP_ID=2021000000000001`);
  console.log(`ALIPAY_SANDBOX_PRIVATE_KEY=${privateKeyForApp}`);
  console.log(`ALIPAY_SANDBOX_PUBLIC_KEY=在支付宝平台获取`);

} catch (error) {
  console.error('❌ 生成密钥失败:', error.message);
  process.exit(1);
}