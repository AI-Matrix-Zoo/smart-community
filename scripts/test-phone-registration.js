#!/usr/bin/env node

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试手机号注册流程
async function testPhoneRegistration() {
  console.log('🧪 开始测试手机号注册功能...\n');

  const testPhone = '13912345678';
  const testData = {
    identifier: testPhone,
    password: 'test123456',
    name: '测试用户',
    building: '2栋',
    unit: '2单元',
    room: '202',
    verificationCode: '123456',
    verificationType: 'sms'
  };

  try {
    // 1. 测试发送验证码
    console.log('📱 步骤1: 发送短信验证码...');
    const codeResponse = await fetch(`${API_BASE_URL}/auth/send-verification-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: testPhone,
        type: 'sms'
      }),
    });

    const codeResult = await codeResponse.json();
    console.log('验证码发送结果:', codeResult);

    if (!codeResult.success) {
      console.log('❌ 验证码发送失败:', codeResult.message);
      return;
    }

    console.log('✅ 验证码发送成功');
    
    // 如果是开发环境，使用返回的验证码
    if (codeResult.data && codeResult.data.code) {
      testData.verificationCode = codeResult.data.code;
      console.log('🔑 使用开发环境验证码:', testData.verificationCode);
    } else {
      // 如果没有返回验证码，使用固定的测试验证码
      testData.verificationCode = '111943'; // 使用从日志中看到的验证码
      console.log('🔑 使用固定验证码:', testData.verificationCode);
    }

    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. 测试注册
    console.log('\n📝 步骤2: 使用手机号注册...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const registerResult = await registerResponse.json();
    console.log('注册结果:', registerResult);

    if (registerResult.success) {
      console.log('✅ 手机号注册成功!');
      console.log('用户信息:', registerResult.data.user);
      
      // 3. 测试登录
      console.log('\n🔐 步骤3: 使用手机号登录...');
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: testPhone,
          password: testData.password
        }),
      });

      const loginResult = await loginResponse.json();
      console.log('登录结果:', loginResult);

      if (loginResult.success) {
        console.log('✅ 手机号登录成功!');
        console.log('🎉 手机号注册功能测试完全通过!');
      } else {
        console.log('❌ 手机号登录失败:', loginResult.message);
      }
    } else {
      console.log('❌ 手机号注册失败:', registerResult.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testPhoneRegistration(); 