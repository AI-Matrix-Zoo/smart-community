const fetch = require('node-fetch');

async function testRegister() {
  const testData = new FormData();
  testData.append('name', '测试用户');
  testData.append('password', 'test123');
  testData.append('building', '3');  // 测试不带"栋"的格式
  testData.append('unit', '2');      // 测试不带"单元"的格式
  testData.append('room', '301');
  testData.append('email', 'test@example.com');

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: testData,
    });

    const result = await response.json();
    console.log('注册结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testRegister(); 