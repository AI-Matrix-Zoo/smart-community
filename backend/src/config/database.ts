import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { UserRole, SuggestionStatus } from '../types';

// 根据环境确定数据库路径
const getDbPath = (): string => {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  
  // 在生产环境中使用绝对路径
  if (process.env.NODE_ENV === 'production') {
    const prodDbPath = path.join(process.cwd(), 'data', 'community.db');
    console.log('Production database path:', prodDbPath);
    return prodDbPath;
  }
  
  // 开发环境使用相对路径
  return './data/community.db';
};

const dbPath = getDbPath();
const dbDir = path.dirname(dbPath);

console.log('Database path:', dbPath);
console.log('Database directory:', dbDir);

// 确保数据目录存在
if (!fs.existsSync(dbDir)) {
  console.log('Creating database directory:', dbDir);
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

function initializeDatabase() {
  console.log('Initializing database tables...');
  
  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT,
      email TEXT,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      building TEXT,
      unit TEXT,
      room TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(phone),
      UNIQUE(email)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table created/verified successfully');
      // 检查是否需要添加email字段
      db.run(`ALTER TABLE users ADD COLUMN email TEXT`, (alterErr) => {
        if (alterErr && !alterErr.message.includes('duplicate column name')) {
          console.error('Error adding email column:', alterErr);
        } else if (!alterErr) {
          console.log('Email column added successfully');
        }
      });
      // 检查是否需要添加unit字段
      db.run(`ALTER TABLE users ADD COLUMN unit TEXT`, (alterErr) => {
        if (alterErr && !alterErr.message.includes('duplicate column name')) {
          console.error('Error adding unit column:', alterErr);
        } else if (!alterErr) {
          console.log('Unit column added successfully');
        }
      });
    }
  });

  // 创建建议表
  db.run(`
    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      submitted_by TEXT NOT NULL,
      submitted_by_user_id TEXT,
      submitted_date DATETIME NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submitted_by_user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating suggestions table:', err);
    } else {
      console.log('Suggestions table created/verified successfully');
    }
  });

  // 创建建议进度更新表
  db.run(`
    CREATE TABLE IF NOT EXISTS suggestion_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suggestion_id TEXT NOT NULL,
      update_text TEXT NOT NULL,
      date DATETIME NOT NULL,
      by_user TEXT NOT NULL,
      by_role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (suggestion_id) REFERENCES suggestions(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating suggestion_progress table:', err);
    } else {
      console.log('Suggestion_progress table created/verified successfully');
    }
  });

  // 创建二手市场表
  db.run(`
    CREATE TABLE IF NOT EXISTS market_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT,
      seller TEXT NOT NULL,
      seller_user_id TEXT,
      posted_date DATETIME NOT NULL,
      contact_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating market_items table:', err);
    } else {
      console.log('Market_items table created/verified successfully');
    }
  });

  // 创建公告表
  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      role_of_author TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating announcements table:', err);
    } else {
      console.log('Announcements table created/verified successfully');
    }
  });

  // 等待所有表创建完成后再插入初始数据
  setTimeout(() => {
    insertInitialData();
  }, 1000);
}

function insertInitialData() {
  console.log('Checking for existing user data...');
  
  // 检查是否已有用户数据
  db.get('SELECT COUNT(*) as count FROM users', (err, row: any) => {
    if (err) {
      console.error('Error checking users:', err);
      return;
    }

    console.log('Current user count:', row.count);

    if (row.count === 0) {
      console.log('No users found, inserting initial data...');
      
      // 插入初始用户
      const initialUsers = [
        {
          id: 'user1',
          email: 'resident@example.com',
          password: '$2a$10$8Dj9C.RwL7dLorzT/p8Q3e5vH83KQbcOB7FN1sW9zZiRKSgr0NCyy', // password123
          name: '张三 (1栋-1单元-101)',
          role: UserRole.USER,
          building: '1栋',
          unit: '1单元',
          room: '101'
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          password: '$2a$10$8Dj9C.RwL7dLorzT/p8Q3e5vH83KQbcOB7FN1sW9zZiRKSgr0NCyy', // password123
          name: '李四 (2栋-2单元-202)',
          role: UserRole.USER,
          building: '2栋',
          unit: '2单元',
          room: '202'
        },
        {
          id: 'prop1',
          email: 'property@example.com',
          password: '$2a$10$qoBKfGUObEwe1TWKJE3lJeKkHCsaJoO7ABQypvMNOfTTkYnCBL2ee', // property123
          name: '物业小王',
          role: UserRole.PROPERTY,
          building: null,
          unit: null,
          room: null
        },
        {
          id: 'admin1',
          email: 'admin@example.com',
          password: '$2a$10$vUBY/liNoH6F.zZnYqp7kO06QKGX22O8kSORkKv13bkRS2sRce95.', // admin123
          name: '管理员小赵',
          role: UserRole.ADMIN,
          building: null,
          unit: null,
          room: null
        },
        {
          id: 'admin2',
          email: 'superadmin@example.com',
          password: '$2a$10$5Yge6MXqtSAHvFuhIDnwGOYk/vjD366QbUByjit/4yL2HDHsiojnm', // admin
          name: '超级管理员',
          role: UserRole.ADMIN,
          building: null,
          unit: null,
          room: null
        }
      ];

      const userStmt = db.prepare(`
        INSERT INTO users (id, email, password, name, role, building, unit, room)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let insertedCount = 0;
      initialUsers.forEach((user, index) => {
        userStmt.run([user.id, user.email, user.password, user.name, user.role, user.building, user.unit, user.room], (err) => {
          if (err) {
            console.error(`Error inserting user ${user.email}:`, err);
          } else {
            insertedCount++;
            console.log(`Inserted user: ${user.email} (${user.name})`);
            
            // 当所有用户都插入完成后
            if (insertedCount === initialUsers.length) {
              console.log('All initial users inserted successfully');
            }
          }
        });
      });

      userStmt.finalize((err) => {
        if (err) {
          console.error('Error finalizing user statement:', err);
        } else {
          console.log('User insertion completed');
        }
      });

      // 插入初始建议
      const initialSuggestions = [
        {
          id: 's1',
          title: '修复1号楼电梯异响',
          description: '1号楼的电梯最近运行时有奇怪的响声，希望能尽快检查维修。',
          category: '公共维修',
          submittedBy: '张三 (1栋-101)',
          submittedByUserId: 'user1',
          submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: SuggestionStatus.Submitted
        },
        {
          id: 's2',
          title: '增加小区内宠物活动区域',
          description: '建议在小区花园旁开辟一小块区域供宠物活动，并设置相关设施。',
          category: '环境绿化',
          submittedBy: '李四 (2栋-202)',
          submittedByUserId: 'user2',
          submittedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: SuggestionStatus.InProgress
        }
      ];

      const suggestionStmt = db.prepare(`
        INSERT INTO suggestions (id, title, description, category, submitted_by, submitted_by_user_id, submitted_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      initialSuggestions.forEach(suggestion => {
        suggestionStmt.run([
          suggestion.id,
          suggestion.title,
          suggestion.description,
          suggestion.category,
          suggestion.submittedBy,
          suggestion.submittedByUserId,
          suggestion.submittedDate,
          suggestion.status
        ]);
      });

      suggestionStmt.finalize();

      // 插入建议进度更新
      db.run(`
        INSERT INTO suggestion_progress (suggestion_id, update_text, date, by_user, by_role)
        VALUES ('s2', '物业已收到建议，正在评估可行性。', ?, '物业系统', 'PROPERTY')
      `, [new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()]);

      // 插入初始市场物品
      db.run(`
        INSERT INTO market_items (id, title, description, price, category, image_url, seller, posted_date, contact_info)
        VALUES ('m1', '九成新婴儿床', '宝宝长大了用不上了，实木婴儿床，几乎全新，带床垫。', 300, '母婴用品', 'https://picsum.photos/seed/m1/400/300', '业主赵 (非特定用户)', ?, '微信: zhaoliu123')
      `, [new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()]);

      // 插入初始公告
      db.run(`
        INSERT INTO announcements (id, content, author_id, author_name, role_of_author)
        VALUES ('anno1', '近期将组织小区消防演练，请各位业主关注后续通知，积极参与。', 'admin1', '管理员小赵', 'ADMIN')
      `);

      console.log('Initial data inserted successfully');
    }
  });
}

export default db; 