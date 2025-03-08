import Mail from "./Mail.js";
import ProfilePictureFetcher from "./ProfilePictureFetcher.js";

const Status = {
  WAITING: "[WAITING]",
};

/**
 * Service for managing avatar URLs.
 */
export default class AvatarService {
  constructor() {
    /**
     * Cache for storing avatar URLs for the session.
     * @type {Object.<string, string>}
     */
    this.sessionCacheAvatarUrls = {};
  }

  /**
   * Retrieves the avatar URL for the given author.
   * @param {string} author - The email address of the author.
   * @returns {string} - The avatar URL.
   */
  async getAvatar(author) {
    if (!this.sessionCacheAvatarUrls[author]) {
      const mailObject = await Mail.fromAuthor(author);
      this.sessionCacheAvatarUrls[author] = Status.WAITING;
      const profilePictureFetcher = new ProfilePictureFetcher(window, mailObject);
      this.sessionCacheAvatarUrls[author] = await profilePictureFetcher.getAvatar();
    }
    while (this.sessionCacheAvatarUrls[author] === Status.WAITING) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return this.sessionCacheAvatarUrls[author];
  }
}
