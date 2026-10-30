// utils/gracefulShutdown.js
//
// Render sends SIGTERM on every deploy/restart and force-kills ~30 s later.
// Stop accepting new requests, let in-flight ones finish, then close the
// databases. Closing the databases first (the old behaviour) failed any
// request still running, e.g. a lead being saved mid-deploy.
//
// getServer, closeResources and exit are passed in so a test can drive it.
// getServer is a function because a signal can arrive before app.listen has
// run (while the databases are still connecting).
import logger from './logger.js';

const DEFAULT_TIMEOUT_MS = 10_000; // well inside Render's 30 s kill window
 
export function createShutdown({ getServer, closeResources, timeoutMs = DEFAULT_TIMEOUT_MS, exit = process.exit }) {
  let shuttingDown = false;
  let finalExitCode = 0;

  return async function shutdown(reason, exitCode = 0) {
    // A crash during a SIGTERM shutdown must still exit non-zero.
    finalExitCode = Math.max(finalExitCode, exitCode);
    if (shuttingDown) return; // otherwise a second signal mid-shutdown changes nothing
    shuttingDown = true;
    logger.info(`${reason} received, shutting down gracefully`);

    // If requests or connections hang, exit anyway rather than wait for SIGKILL.
    const forceExit = setTimeout(() => {
      logger.error(`Shutdown took longer than ${timeoutMs} ms, forcing exit`);
      exit(1);
    }, timeoutMs);
    forceExit.unref();

    try {
      const server = getServer?.();
      if (server) {
        await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
        logger.info('HTTP server closed');
      }
      await closeResources();
      logger.info('All database connections closed, exiting');
      clearTimeout(forceExit);
      exit(finalExitCode);
    } catch (error) {
      logger.error('Error during shutdown ❌', { message: error.message, stack: error.stack });
      clearTimeout(forceExit);
      exit(1);
    }
  };
}
