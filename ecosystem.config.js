module.exports = {
  apps: [
    {
      name: 'smart-community-backend',
      script: './backend/dist/index.js',
      env: {
        NODE_ENV: 'production',
        JWT_SECRET: 'smart-community-secret',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'smart-community-frontend',
      script: 'serve',
      args: '-s ./frontend/dist -l 5173',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
}; 