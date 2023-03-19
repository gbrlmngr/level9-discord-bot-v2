import { RateLimiterAbstract, RateLimiterMemory } from 'rate-limiter-flexible';

export const TimeUnitsInSeconds = {
  get Second() {
    return 1;
  },
  get Minute() {
    return this.Second * 60;
  },
  get Hour() {
    return this.Minute * 60;
  },
};

export class RateLimiter {
  private ratelimiterInstance: RateLimiterAbstract;
  private globalKey = '__GlobalRateLimit__';

  public constructor(points: number, duration: number) {
    this.ratelimiterInstance = new RateLimiterMemory({
      duration,
      points,
    });
  }

  public async consume(
    key: string = this.globalKey,
    points = 1
  ): Promise<void> {
    const isGlobal = key == null || key === this.globalKey;

    await this.ratelimiterInstance.consume(key, points).catch(() => {
      throw new RateLimitedException(isGlobal);
    });
  }
}

export class RateLimitedException extends Error {
  public constructor(isGlobal: boolean) {
    super(
      isGlobal
        ? `:face_with_peeking_eye: There's currently too much pressure on the bot, so we'll have to skip your request. Try again later!`
        : ':face_with_peeking_eye: You might want to slow down a bit with these commands. Try again later!'
    );
    this.name = 'RateLimitedException';
  }
}
