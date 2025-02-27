import { AvatarStrategy } from "./AvatarStrategy.js";

export class CacheStrategy extends AvatarStrategy {
  constructor(fetcher, cacheKey) {
    super(fetcher);
    this.cacheKey = cacheKey;
  }

  async fetchAvatar() {
    return await this.fetcher.getFromCache(this.cacheKey);
  }
}