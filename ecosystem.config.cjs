module.exports = {
  apps: [{
    name: 'shortcut-manager-dev',
    script: 'npm',
    args: 'run dev',
    env: {
      NODE_ENV: 'development'
    }
  }]
};
