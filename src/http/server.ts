import { Client } from 'discord.js';
import EventEmitter from 'eventemitter3';
import { default as express, Application } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import * as signale from 'signale';
import helmet from 'helmet';

import { EXPRESS_PORT } from '../configuration/express';
import { middleware as rateLimiterMiddleware } from './middlewares/rate-limiter';
import { router as healthcheckRouter } from './routes/healthcheck';
import { router as ambassadorsRouter } from './routes/ambassadors';

const rateLimiter = new RateLimiterMemory({
  duration: 1,
  points: 12,
});

function registerRoutes(appInstance: Application): void {
  appInstance.use('/', healthcheckRouter);
  appInstance.use('/healthcheck', healthcheckRouter);
  appInstance.use('/ambassadors', ambassadorsRouter);
}

export function start(
  discordClientInstance: Client,
  eventEmitterInstance: EventEmitter
) {
  try {
    const appInstance = express();
    appInstance.locals.discordClient = discordClientInstance;
    appInstance.locals.eventEmitter = eventEmitterInstance;

    appInstance.use(helmet());
    appInstance.use(rateLimiterMiddleware(rateLimiter));

    registerRoutes(appInstance);

    appInstance.listen(EXPRESS_PORT, () => {
      signale.success(`Express server started on port ${EXPRESS_PORT}`);
    });
  } catch (error: unknown) {
    signale.fatal(
      `Unable to start the Express server due to: ${(error as Error).message}`
    );
  }
}
