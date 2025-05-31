const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('开始测试SMTP连接...');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 587,
    secure: false,
    auth: {
      user: '1217112842@qq.com',
      pass: 'tfxjopirvegaidih'
    }
  });

  try {
    // 测试连接
    console.log('测试SMTP连接...');
    await transporter.verify();
    console.log('✅ SMTP连接成功');

    // 发送测试邮件
    console.log('发送测试邮件...');
    const info = await transporter.sendMail({
      from: '1217112842@qq.com',
      to: '1217112842@qq.com',
      subject: '智慧小区 - 邮箱验证码测试',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">智慧小区邮箱验证测试</h2>
          <p>这是一封测试邮件，验证码是：<strong>123456</strong></p>
          <p>如果您收到此邮件，说明邮箱服务配置成功！</p>
        </div>
      `
    });

    console.log('✅ 邮件发送成功');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ SMTP测试失败:', error);
    console.error('错误详情:', error.message);
    if (error.code) {
      console.error('错误代码:', error.code);
    }
    if (error.response) {
      console.error('服务器响应:', error.response);
    }
  }
}

testSMTP(); 