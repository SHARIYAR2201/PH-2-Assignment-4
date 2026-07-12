import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

async function main() {
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('✅ Database connected successfully');

    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 GearUp API is running on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

main();

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
