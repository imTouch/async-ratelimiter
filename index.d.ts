declare module 'async-ratelimiter' {
  import Redis from 'ioredis';

  namespace RateLimiter {
    interface ConstructorOptions {
      db: Redis.Redis;
      max?: number;
      duration?: number;
      namespace?: string;
      id?: string;
    }

    interface GetOptions {
      id?: string;
      max?: number;
      duration?: number;
    }

    interface Status {
      total: number;
      remaining: number;
      reset: number;
    }
  }

  class RateLimiter {
    constructor(options: RateLimiter.ConstructorOptions);
    get(options: RateLimiter.GetOptions): Promise<RateLimiter.Status>;
    try(options: RateLimiter.GetOptions): Promise<RateLimiter.Status>;
    zremrangeToday(options: RateLimiter.GetOptions): Promise<RateLimiter.Status>;
  }

  export = RateLimiter;
}
