import "dotenv/config";
import {
  closeConnection,
  initializeDatabase,
  db,
} from "infrastructure/database/connection.js";
import { runMigrations } from "infrastructure/database/migrate.js";
import { buildApp } from "app.js";

const app = buildApp(db);
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";
const runMigrationsOnStartup = process.env.RUN_MIGRATIONS !== "false";

initializeDatabase()
  .then(async () => {
    if (runMigrationsOnStartup) {
      try {
        await runMigrations(db);
      } catch (error) {
        console.error("Migration failed:", error);
        throw error;
      }
    }

    const server = app.listen(port, host, () => {
      console.log(`Server listening on ${host}:${String(port)}`);
    });

    const onSignal = (): void => {
      console.log("Shutting down gracefully...");
      void (async (): Promise<void> => {
        await closeConnection();
        server.close(() => {
          console.log("Server closed");
        });
      })();
    };

    process.on("SIGTERM", onSignal);
    process.on("SIGINT", onSignal);
  })
  .catch((error: unknown) => {
    console.error("Failed to start server:", error);
    throw error;
  });
