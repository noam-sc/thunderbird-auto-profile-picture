import Mail from "./Mail.js";
import ProfilePictureFetcher from "./ProfilePictureFetcher.js";
import defaultSettings from "../settings/defaultSettings.js";

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
   * Returns the number of avatars that are currently being fetched.
   * @returns {number} - The number of avatars being fetched.
   */
  countWaitingAvatars() {
    let waiting = 0;
    for (const key in this.sessionCacheAvatarUrls) {
      if (this.sessionCacheAvatarUrls[key] === Status.WAITING) {
        waiting++;
      }
    }
    return waiting;
  }

  /**
   * Retrieves the avatar URL for the given author.
   * 
   * Steps:
   * 1. Check if the avatar URL is already in the session cache
   * 2. If not in cache:
   *    a. Check if we're already processing too many requests
   *    b. Store as waiting in the cache
   *    c. Fetch and store the avatar URL in the cache
   * 3. If the avatar is marked as waiting, poll until it's ready
   * 4. Return the cached avatar URL
   * 
   * @param {string} author - The email address of the author.
   * @returns {Promise<string|null>} - The avatar URL or null if request limit exceeded or not found.
   */
  async getAvatar(author) {
    let lcAuthor = author.toLowerCase();
    if (!this.sessionCacheAvatarUrls[lcAuthor]) {
      if (this.countWaitingAvatars() > defaultSettings.MAX_REQUEST_SIZE) {
        console.warn("Too many requests in progress, skipping avatar fetch for " + author);
        return null;
      }
      this.sessionCacheAvatarUrls[lcAuthor] = Status.WAITING;
      const mailObject = await Mail.fromAuthor(author);
      const profilePictureFetcher = new ProfilePictureFetcher(window, mailObject);
      this.sessionCacheAvatarUrls[lcAuthor] = await profilePictureFetcher.getAvatar();
    }
    while (this.sessionCacheAvatarUrls[lcAuthor] === Status.WAITING) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return this.sessionCacheAvatarUrls[lcAuthor];
  }
}
