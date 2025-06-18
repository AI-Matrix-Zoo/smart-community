import React from 'react';

const TestVerificationBadge: React.FC = () => {
  // 模拟数据
  const testUsers = [
    { name: '张三 (1栋-1单元-101)', verified: true },
    { name: '李四 (2栋-2单元-202)', verified: false },
    { name: '王五 (3栋-3单元-303)', verified: true },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">认证标识测试</h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-2">用户列表测试</h4>
          <div className="space-y-2">
            {testUsers.map((user, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <span>{user.name}</span>
                {user.verified && (
                  <span className="inline-flex items-center ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded" title="已认证用户">
                    ✓
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  - {user.verified ? '已认证用户' : '未认证用户'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">建议页面样式测试</h4>
          <div className="bg-white shadow-lg rounded-xl p-4 border">
            <p className="text-sm text-slate-500">
              由 张三 (1栋-1单元-101)
              <span className="inline-flex items-center ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded" title="已认证用户">
                ✓
              </span>
              于 2025/6/3 提交
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">市场页面样式测试</h4>
          <div className="bg-white shadow-lg rounded-xl p-4 border">
            <p className="text-sm text-slate-500">
              由 张三 (1栋-1单元-101)
              <span className="inline-flex items-center ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded" title="已认证用户">
                ✓
              </span>
              于 2025/6/3 发布
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-800 font-medium">认证标识说明：</p>
          <ul className="text-sm text-blue-700 mt-1 space-y-1">
            <li>• 蓝色 ✓ 标识表示该用户已通过身份认证</li>
            <li>• 在所有用户名显示的地方都会统一显示此标识</li>
            <li>• 鼠标悬停可查看"已认证用户"提示</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestVerificationBadge; 