module.exports = {
  apps: [{
    name: 'linkhub-manager',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/user/webapp',
    watch: false,
    env: {
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: '3000'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    out_file: '/home/user/webapp/logs/out.log',
    error_file: '/home/user/webapp/logs/error.log',
    log_file: '/home/user/webapp/logs/combined.log',
    time: true
  }]
};