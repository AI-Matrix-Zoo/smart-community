// 调试认证标识功能的脚本
console.log('开始测试认证标识功能...');

// 测试建议API
fetch('http://localhost:3000/api/suggestions')
  .then(response => response.json())
  .then(data => {
    console.log('=== 建议API数据 ===');
    if (data.success && data.data) {
      data.data.forEach((suggestion, index) => {
        console.log(`建议 ${index + 1}:`);
        console.log(`  标题: ${suggestion.title}`);
        console.log(`  提交者: ${suggestion.submittedBy}`);
        console.log(`  认证状态: ${suggestion.submittedByUserVerified}`);
        console.log(`  用户ID: ${suggestion.submittedByUserId}`);
        console.log('---');
      });
    }
  })
  .catch(error => {
    console.error('获取建议数据失败:', error);
  });

// 测试市场API
fetch('http://localhost:3000/api/market')
  .then(response => response.json())
  .then(data => {
    console.log('=== 市场API数据 ===');
    if (data.success && data.data) {
      data.data.forEach((item, index) => {
        console.log(`物品 ${index + 1}:`);
        console.log(`  标题: ${item.title}`);
        console.log(`  卖家: ${item.seller}`);
        console.log(`  认证状态: ${item.sellerVerified}`);
        console.log(`  用户ID: ${item.sellerUserId}`);
        console.log('---');
      });
    }
  })
  .catch(error => {
    console.error('获取市场数据失败:', error);
  });

// 测试用户数据
fetch('http://localhost:3000/api/admin/users')
  .then(response => response.json())
  .then(data => {
    console.log('=== 用户数据 ===');
    if (data.success && data.data) {
      data.data.forEach((user, index) => {
        console.log(`用户 ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  姓名: ${user.name}`);
        console.log(`  认证状态: ${user.is_verified}`);
        console.log('---');
      });
    }
  })
  .catch(error => {
    console.error('获取用户数据失败:', error);
  });

console.log('测试脚本已启动，请查看控制台输出...'); 