const http = require('http');

// 测试配置
const HOST = 'localhost';
const PORT = 3001;
const BASE_URL = `http://${HOST}:${PORT}`;

// 测试用例
const tests = [{
        name: '健康检查',
        path: '/health',
        method: 'GET',
        expectedStatus: 200
    },
    {
        name: '获取公告列表',
        path: '/api/announcements',
        method: 'GET',
        expectedStatus: 200
    },
    {
        name: '获取市场物品',
        path: '/api/market',
        method: 'GET',
        expectedStatus: 200
    },
    {
        name: '登录测试（无数据）',
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: '{}',
        expectedStatus: 400
    }
];

// 颜色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 执行HTTP请求
function makeRequest(test) {
    return new Promise((resolve) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: test.path,
            method: test.method,
            headers: test.headers || {}
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: data,
                    headers: res.headers
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                error: err.message,
                statusCode: 0
            });
        });

        if (test.data) {
            req.write(test.data);
        }

        req.end();
    });
}

// 运行测试
async function runTests() {
    log('blue', '🚀 开始API测试...\n');

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        process.stdout.write(`测试: ${test.name} ... `);

        const result = await makeRequest(test);

        if (result.error) {
            log('red', `❌ 错误: ${result.error}`);
            failed++;
        } else if (result.statusCode === test.expectedStatus) {
            log('green', `✅ 通过 (${result.statusCode})`);
            passed++;
        } else {
            log('red', `❌ 失败 (期望: ${test.expectedStatus}, 实际: ${result.statusCode})`);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(50));
    log('blue', `测试结果: ${passed} 通过, ${failed} 失败`);

    if (failed === 0) {
        log('green', '🎉 所有测试通过！');
        process.exit(0);
    } else {
        log('red', '❌ 部分测试失败');
        process.exit(1);
    }
}

// 检查服务是否运行
function checkServer() {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: HOST,
            port: PORT,
            path: '/health',
            method: 'GET',
            timeout: 2000
        }, (res) => {
            resolve(true);
        });

        req.on('error', () => {
            resolve(false);
        });

        req.on('timeout', () => {
            resolve(false);
        });

        req.end();
    });
}

// 主函数
async function main() {
    log('blue', '检查服务器状态...');

    const isRunning = await checkServer();

    if (!isRunning) {
        log('red', `❌ 服务器未运行在 ${BASE_URL}`);
        log('yellow', '请先启动服务器: npm run dev');
        process.exit(1);
    }

    log('green', `✅ 服务器运行正常在 ${BASE_URL}`);
    console.log('');

    await runTests();
}

main().catch(console.error);