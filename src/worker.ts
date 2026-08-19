import 'dotenv/config';
import './config/storage'; // inicializa directorios
import { createJobsWorker } from './modules/jobs/workers/jobs.worker';
import { connectDatabase } from './config/database';
import { logger } from './shared/utils/logger.util';

async function startWorker() {
  try {
    await connectDatabase();
    logger.info('✅ Database connected (worker)');

    const worker = createJobsWorker();
    logger.info(`🔧 DataForge Worker started — queue: ${worker.name}`);

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, closing worker...`);
      await worker.close();
      const { disconnectDatabase } = await import('./config/database');
      await disconnectDatabase();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Worker failed to start', { error });
    process.exit(1);
  }
}

startWorker();
