const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, '../data/community.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 开始标准化用户数据...');

// 标准化用户数据
function normalizeUserData() {
  return new Promise((resolve, reject) => {
    // 获取所有用户数据
    db.all('SELECT * FROM users', [], (err, users) => {
      if (err) {
        reject(err);
        return;
      }

      console.log(`📊 找到 ${users.length} 个用户需要处理`);

      let processedCount = 0;
      const totalUsers = users.length;

      users.forEach((user, index) => {
        // 解析姓名中的地址信息
        let cleanName = user.name;
        let building = user.building;
        let unit = user.unit;
        let room = user.room;

        // 如果姓名包含地址信息，提取出来
        const addressMatch = user.name.match(/^(.+?)\s*\((.+?)-(.+?)-(.+?)\)$/);
        if (addressMatch) {
          cleanName = addressMatch[1].trim();
          const extractedBuilding = addressMatch[2].trim();
          const extractedUnit = addressMatch[3].trim();
          const extractedRoom = addressMatch[4].trim();

          // 如果数据库字段为空，使用提取的信息
          if (!building) building = extractedBuilding;
          if (!unit) unit = extractedUnit;
          if (!room) room = extractedRoom;
        }

        // 标准化楼栋格式
        if (building && !building.includes('栋') && !building.includes('座')) {
          building = building + '栋';
        }

        // 标准化单元格式
        if (unit && !unit.includes('单元')) {
          unit = unit + '单元';
        }

        // 更新数据库
        const updateSql = `
          UPDATE users 
          SET name = ?, building = ?, unit = ?, room = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;

        db.run(updateSql, [cleanName, building, unit, room, user.id], function(updateErr) {
          if (updateErr) {
            console.error(`❌ 更新用户 ${user.id} 失败:`, updateErr);
          } else {
            console.log(`✅ 已标准化用户: ${cleanName} (${building}-${unit}-${room})`);
          }

          processedCount++;
          if (processedCount === totalUsers) {
            resolve();
          }
        });
      });

      if (totalUsers === 0) {
        resolve();
      }
    });
  });
}

// 执行标准化
normalizeUserData()
  .then(() => {
    console.log('🎉 用户数据标准化完成！');
    
    // 验证结果
    db.all('SELECT id, name, building, unit, room FROM users WHERE role = "USER"', [], (err, users) => {
      if (err) {
        console.error('验证失败:', err);
      } else {
        console.log('\n📋 标准化后的用户数据:');
        users.forEach(user => {
          console.log(`${user.id}: ${user.name} (${user.building}-${user.unit}-${user.room})`);
        });
      }
      
      db.close();
    });
  })
  .catch(err => {
    console.error('❌ 标准化失败:', err);
    db.close();
  }); 