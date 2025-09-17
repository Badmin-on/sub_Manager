module.exports = {
  apps: [{
    name: 'subscription-manager-dev',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/user/webapp',
    watch: false,
    env: {
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: '5173'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_file: './logs/combined.log',
    time: true,
    restart_delay: 1000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};