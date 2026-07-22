module.exports = {
  apps: [
    {
      name: "web-app",
      cwd: "./packages/web",
      script: "src/server.ts",
      interpreter: "bun",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      restart_delay: 1000,
      env: {
        PORT: process.env.PORT || 4200,
      },
    },
  ],
};
