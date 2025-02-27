import Mail from "../src/Mail.js";

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
   * Gets the profile picture URL for the given email.
   * This method must be implemented by subclasses.
   * @param {Mail} mail - The email to get the URL for.
   * @returns {Promise<string>} The profile picture URL for the email.
   * @throws {Error} If the method is not implemented.
   */
  async getUrl(mail) {
    throw new Error("Method 'getUrl(mail)' must be implemented.");
  }
}