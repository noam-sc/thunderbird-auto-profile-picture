/**
 * Abstract class representing an avatar fetching strategy.
 */
export class AvatarStrategy {
  /**
   * Creates an instance of AvatarStrategy.
   * @param {Object} fetcher - The fetcher object used to retrieve avatars.
   */
  constructor(fetcher) {
    this.fetcher = fetcher;
  }

  /**
   * Fetches the avatar.
   * @returns {Promise<string>} - The avatar URL.
   * @throws {Error} - If the method is not implemented by a subclass.
   */
  async fetchAvatar() {
    throw new Error("fetchAvatar method must be implemented by subclasses");
  }
}
