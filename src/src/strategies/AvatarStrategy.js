/**
 * @typedef {import('../ProfilePictureFetcher').default} ProfilePictureFetcher
 */

/** @enum {string} */
export const Status = {
  NO_RESULT: "noResult",
  NOT_FOUND: "notFound",
};
Object.freeze(Status);

/**
 * Abstract class representing an avatar fetching strategy.
 */
export class AvatarStrategy {
  /**
   * Creates an instance of AvatarStrategy.
   * @param {Object} fetcher - The fetcher object used to retrieve avatars.
   */
  constructor(fetcher) {
    /** @type {ProfilePictureFetcher} */
    this.fetcher;
    this.fetcher = fetcher;
  }

  /**
   * Fetches the avatar.
   * @returns {Promise<Blob|Status>} - The avatar URL.
   * @throws {Error} - If the method is not implemented by a subclass.
   */
  async fetchAvatar() {
    throw new Error("fetchAvatar method must be implemented by subclasses");
  }
}
