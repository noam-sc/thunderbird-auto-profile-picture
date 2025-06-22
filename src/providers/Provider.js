import Author from "../src/Author.js";

export const Scope = {
  DOMAIN: "domain",
  EMAIL: "email",
};

/**
 * Represents a provider.
 */
export default class Provider {
  /**
   * Creates an instance of Provider.
   * @param {string} name - The name of the provider
   * @param {Scope} [scope=Scope.DOMAIN] - The scope of the provider
   */
  constructor(name, scope = Scope.DOMAIN) {
    this.name = name.toLowerCase();
    this.scope = scope;
  }

  /**
   * Gets the profile picture URL for the given author.
   * This method must be implemented by subclasses.
   * @param {Author} author - The author to get the URL for.
   * @returns {Promise<string>} The profile picture URL for the author.
   * @throws {Error} If the method is not implemented.
   */
  async getUrl(author) {
    throw new Error("Method 'getUrl(author)' must be implemented.");
  }
}