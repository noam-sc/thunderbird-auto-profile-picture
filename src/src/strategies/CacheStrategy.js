import { AvatarStrategy } from "./AvatarStrategy.js";
/**
 * @typedef {import('../ProfilePictureFetcher').default} ProfilePictureFetcher
 */

export class CacheStrategy extends AvatarStrategy {
  /**
   * @param {ProfilePictureFetcher} fetcher
   * @param {string} cacheKey
   */
  constructor(fetcher, cacheKey) {
    super(fetcher);
    /** @type {ProfilePictureFetcher} */
    this.fetcher;
    this.cacheKey = cacheKey;
  }

  async fetchAvatar() {
    return await this.fetcher.getFromCache(this.cacheKey);
  }
}