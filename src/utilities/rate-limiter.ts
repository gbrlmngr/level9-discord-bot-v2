import { Interval, RateLimiter as Limiter } from 'limiter';
import { default as LRUCache } from 'lru-cache';

export enum RateLimitType {
  Global,
  Local,
}

const DEFAULT_GLOBAL_TOKENS_PER_TIME_UNIT = 1000;
const MAX_CACHE_SIZE = 512;

export class RateLimiter<RLType extends RateLimitType> {
  public type: RLType;
  public tokens: number;
  public interval: Interval;
  public globalInstance: Limiter;
  public localInstances: LRUCache<string | symbol, Limiter> = new LRUCache({
    max: MAX_CACHE_SIZE,
  });

  private defaultLimiterInstance = (tokens: number, interval: Interval) =>
    new Limiter({
      tokensPerInterval: tokens,
      interval,
      fireImmediately: true,
    });

  public constructor(type: RLType, tokens: number) {
    this.type = type;
    this.tokens = tokens;
    this.interval = 'second';

    this.globalInstance = this.defaultLimiterInstance(
      type === RateLimitType.Global
        ? this.tokens
        : DEFAULT_GLOBAL_TOKENS_PER_TIME_UNIT,
      this.interval
    );
  }

  public addConsumer(key: string): void {
    if (this.type === RateLimitType.Global) {
      throw new Error(
        'Rate limiter: cannot add a consumer on a Global-type rate limiter'
      );
    }

    if (this.localInstances.has(key)) return;

    const limiterInstance = this.defaultLimiterInstance(
      this.tokens,
      this.interval
    );
    this.localInstances.set(key, limiterInstance);
  }

  public async consume(key?: string): Promise<void> {
    const limiterInstance = key
      ? this.localInstances.get(key)
      : this.globalInstance;

    if (limiterInstance) {
      try {
        const tokensLeft = await limiterInstance.removeTokens(1);

        if (tokensLeft < 0) {
          throw new RateLimitedException(this.type);
        }
      } catch {
        throw new RateLimitedException(this.type);
      }
    }
  }
}

export class RateLimitedException extends Error {
  public constructor(type: RateLimitType, message?: string) {
    super(
      message ?? type === RateLimitType.Global
        ? `:face_with_peeking_eye: There's currently too much pressure on the bot, so we'll have to skip your request. Try again later!`
        : ':face_with_peeking_eye: You might want to slow down a bit with these commands. Try again later!'
    );
  }
}
