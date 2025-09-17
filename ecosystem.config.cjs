module.exports = {
  apps: [{
    name: 'subscription-manager',
    script: 'npm',
    args: 'run dev',
    cwd: 'C:\\Users\\nebad\\Desktop\\quicklink\\sub_Manager',
    watch: false,
    env: {
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: '5173'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_file: 'logs/combined.log',
    time: true
  }]
};