import './config/load-dotenv'
import { serve } from '@hono/node-server'
import { createApp } from './app'
import { closeAllConnections } from './db/connection'

const { app, env, logger } = createApp()

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info('API listening', {
    port: info.port,
    environment: env.NODE_ENV,
    allowedOrigins: env.ALLOWED_ORIGINS,
  })
})

/**
 * Render sends SIGTERM before replacing a container. Finishing in-flight
 * requests and closing pools cleanly is what makes a deploy invisible to
 * someone who happens to be submitting a form at that moment.
 */
let shuttingDown = false

async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info('Shutting down', { signal })

  const forceExit = setTimeout(() => {
    logger.error('Shutdown timed out, exiting immediately')
    process.exit(1)
  }, 15_000)
  forceExit.unref()

  server.close(async () => {
    await closeAllConnections()
    clearTimeout(forceExit)
    logger.info('Shutdown complete')
    process.exit(0)
  })
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { error: reason })
})
