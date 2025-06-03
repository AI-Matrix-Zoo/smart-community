const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConnection() {
  console.log('🔍 测试邮箱连接...');
  console.log('配置信息:');
  console.log('  EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('  EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('  EMAIL_SECURE:', process.env.EMAIL_SECURE);
  console.log('  EMAIL_USER:', process.env.EMAIL_USER);
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('  EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    console.log('🔗 正在测试SMTP连接...');
    await transporter.verify();
    console.log('✅ 邮箱连接测试成功！');
    
    console.log('📧 尝试发送测试邮件...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '智慧小区 - 邮箱服务测试',
      html: `
        <h2>邮箱服务测试</h2>
        <p>这是一封测试邮件，用于验证邮箱服务是否正常工作。</p>
        <p>发送时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
      `
    });
    
    console.log('✅ 测试邮件发送成功！');
    console.log('📋 邮件信息:', info.messageId);
    
  } catch (error) {
    console.error('❌ 邮箱连接测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testEmailConnection(); 