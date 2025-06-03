const nodemailer = require('nodemailer');

// SMTP配置
const transporter = nodemailer.createTransporter({
    host: 'smtp.qq.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'your-qq-email@qq.com',
        pass: 'your-qq-smtp-password'
    }
});

// 发送测试邮件
async function sendTestEmail() {
    try {
        console.log('开始发送测试邮件...');

        const info = await transporter.sendMail({
            from: 'your-qq-email@qq.com',
            to: 'your-qq-email@qq.com',
            subject: '智慧小区生活平台 - SMTP测试',
            text: '这是一个SMTP连接测试邮件，如果您收到此邮件，说明邮件服务配置正确。',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">智慧小区生活平台</h2>
          <p>这是一个SMTP连接测试邮件。</p>
          <p>如果您收到此邮件，说明邮件服务配置正确。</p>
          <hr>
          <p style="color: #666; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `
        });

        console.log('邮件发送成功!');
        console.log('Message ID:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

    } catch (error) {
        console.error('邮件发送失败:', error);
    }
}

// 运行测试
sendTestEmail();