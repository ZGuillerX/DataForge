import "dotenv/config";
import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { logger } from "./shared/utils/logger.util";

async function bootstrap() {
  try {
    await connectDatabase();
    logger.info("✅ Database connected");

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(
        `🚀 DataForge API running on port ${env.PORT} [${env.NODE_ENV}]`,
      );
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        const { disconnectDatabase } = await import("./config/database");
        await disconnectDatabase();
        logger.info("Server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

bootstrap();
