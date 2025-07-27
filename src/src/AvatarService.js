import Author from "./Author.js";
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
   *    c. Fetch and store the avatar URL in the cache asynchronously
   * 3. Return immediately with cached result or null for new requests
   * 4. For waiting requests, use non-blocking timeout with reasonable limit
   * 
   * @param {Author} author - The author for whom to fetch the avatar URL.
   * @returns {Promise<string|null>} - The avatar URL or null if request limit exceeded or not found.
   */
  async getAvatar(author) {
    let lcAuthor = author.getAuthor().toLowerCase();
    if (!this.sessionCacheAvatarUrls[lcAuthor]) {
      if (this.countWaitingAvatars() > defaultSettings.MAX_REQUEST_SIZE) {
        console.warn("Too many requests in progress, skipping avatar fetch for " + author.getAuthor());
        return null;
      }
      this.sessionCacheAvatarUrls[lcAuthor] = Status.WAITING;

      // Start fetching asynchronously without blocking
      this.fetchAvatarAsync(author, lcAuthor);

      // Return null immediately for new requests to avoid blocking
      return null;
    }

    // If already waiting, check with timeout to avoid infinite blocking
    if (this.sessionCacheAvatarUrls[lcAuthor] === Status.WAITING) {
      const startTime = Date.now();
      const maxWaitTime = defaultSettings.AVATAR_FETCH_TIMEOUT_MS || 5000;

      while (this.sessionCacheAvatarUrls[lcAuthor] === Status.WAITING) {
        if (Date.now() - startTime > maxWaitTime) {
          console.warn("Avatar fetch timeout for " + author.getAuthor());
          this.sessionCacheAvatarUrls[lcAuthor] = null;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50)); // Reduced polling interval
      }
    }

    return this.sessionCacheAvatarUrls[lcAuthor];
  }

  /**
   * Fetches avatar asynchronously without blocking the caller
   * @param {Author} author - The author for whom to fetch the avatar
   * @param {string} lcAuthor - Lowercase author key for caching
   */
  async fetchAvatarAsync(author, lcAuthor) {
    try {
      const profilePictureFetcher = new ProfilePictureFetcher(window, author);
      const result = await profilePictureFetcher.getAvatar();
      this.sessionCacheAvatarUrls[lcAuthor] = result;
    } catch (error) {
      console.error("Error fetching avatar for " + author.getAuthor(), error);
      this.sessionCacheAvatarUrls[lcAuthor] = null;
    }
  }
}
