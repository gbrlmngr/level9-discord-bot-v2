import { RateLimiter as Limiter } from 'limiter';

export enum RateLimitType {
  Server,
  User,
}

const DEFAULT_TOKENS = 60;
const ServerLevelConsumerSymbol = Symbol('ServerLevelConsumer');

export class RateLimiter<RLType extends RateLimitType> {
  public type: RLType;
  public tokens: number;
  public instances: Map<string | symbol, Limiter> = new Map();

  private defaultLimiterInstance = (tokens: number) =>
    new Limiter({
      tokensPerInterval: tokens,
      interval: 'second',
      fireImmediately: true,
    });

  public constructor(type: RLType, tokens: number) {
    this.type = type;
    this.tokens = tokens ?? DEFAULT_TOKENS;
    this.instances.set(
      ServerLevelConsumerSymbol,
      this.defaultLimiterInstance(this.tokens)
    );
  }

  public addConsumer(key: string): void {
    if (this.type === RateLimitType.Server) {
      throw new Error(
        'Rate limiter: cannot add a consumer on a Server-type rate limiter'
      );
    }

    if (this.instances.has(key)) return;

    const limiterInstance = this.defaultLimiterInstance(this.tokens);
    this.instances.set(key, limiterInstance);
  }

  public async consume(key?: string): Promise<void> {
    const limiterInstance = key
      ? this.instances.get(key)
      : this.instances.get(ServerLevelConsumerSymbol);

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
      message ?? type === RateLimitType.Server
        ? `:face_with_peeking_eye: There's currently too much pressure on the bot, so we'll have to skip your request. Try again later!`
        : ':face_with_peeking_eye: You might want to slow down a bit with these commands. Try again later!'
    );
  }
}
