import { NextFunction, Request, Response } from 'express';
import { TOO_MANY_REQUESTS } from 'http-status';
import { RateLimiterAbstract } from 'rate-limiter-flexible';

export const middleware =
  (rateLimiterInstance: RateLimiterAbstract) =>
  (req: Request, res: Response, next: NextFunction) => {
    const setHeaders = (
      remainingPoints: number,
      limit: number,
      remainingMs: number
    ) => ({
      'Retry-After': remainingMs / 1000,
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': remainingPoints,
      'X-RateLimit-Reset': new Date(Date.now() + remainingMs),
    });

    return rateLimiterInstance
      .consume(req.ip)
      .then(({ remainingPoints, msBeforeNext }) => {
        res.set(
          setHeaders(remainingPoints, rateLimiterInstance.points, msBeforeNext)
        );
        next();
      })
      .catch(({ remainingPoints, msBeforeNext }) => {
        res.set(
          setHeaders(remainingPoints, rateLimiterInstance.points, msBeforeNext)
        );
        res.sendStatus(TOO_MANY_REQUESTS);
      });
  };
