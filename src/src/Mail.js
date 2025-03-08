import defaultSettings from "../settings/defaultSettings.js";

/**
 * Class representing a mail object.
 */
export default class Mail {
  /**
   * Creates an instance of Mail.
   * @param {string} author - The author of the message.
   * @param {string} mail - The email address of the author.
   */
  constructor(author, mail) {
    this.author = author;
    this.mail = mail;
    this.hasName = author.includes("<");
    this.publicMails = defaultSettings.publicMails;
  }

  /**
   * Parses the email address from the author string.
   * @param {string} author - The author string.
   * @returns {string} - The parsed email address.
   */
  static async parse(author) {
    try { // only for Thunderbird 128+
      const parsed = await browser.messengerUtilities.parseMailboxString(author);
      if (parsed) {
        return parsed[0].email;
      }
    } catch (error) {}
    const email = author.match(/<(.+)>/);
    if (email) {
      return email[1].toLowerCase().trim();
    }
    return author.toLowerCase().trim();
  }

  /**
   * Static factory method that creates a Mail instance from an author string.
   * @param {string} author - The author of the message.
   * @returns {Mail} - The Mail instance.
   */
  static async fromAuthor(author) {
    const mail = await Mail.parse(author);
    return new Mail(author, mail);
  }

  /**
   * Retrieves the email address.
   * @returns {string} - The email address.
   */
  getEmail() {
    return this.mail;
  }

  /**
   * Checks if the author has a name.
   * @returns {boolean} - True if the author has a name, false otherwise.
   */
  hasAName() {
    return this.hasName;
  }

  /**
   * Retrieves the domain of the email address.
   * @returns {string} - The domain of the email address.
   */
  getDomain() {
    const split = this.mail.split("@");
    if (split.length < 2) {
      console.warn("Invalid email", this.mail, this.author);
      // Ghost mails https://bugzilla.mozilla.org/show_bug.cgi?id=752237
      return "";
    }
    return this.mail.split("@")[1];
  }

  /**
   * Removes the subdomain from the email address.
   * @returns {Mail} - A new Mail instance with the subdomain removed.
   */
  removeSubDomain() {
    return new Mail(this.author, this.mail.split("@")[0] + "@" + this.getTopDomain());
  }

  /**
   * Retrieves the domain without the top-level domain (TLD).
   * @returns {string} - The domain without the TLD.
   */
  getDomainWithoutTld() {
    const domain = this.getDomain();
    if (domain.split(".").length < 2) {
      return domain;
    }
    return domain.split(".").slice(0, -1).join(".");
  }

  /**
   * Checks if the email address is public.
   * @returns {boolean} - True if the email address is public, false otherwise.
   */
  isPublic() {
    return this.publicMails.includes(this.getDomainWithoutTld()) || this.publicMails.includes(this.getTopDomain());
  }

  /**
   * Retrieves the top-level domain (TLD) of the email address.
   * @returns {string} - The TLD of the email address.
   */
  getTopDomain() {
    return this.getDomain().split(".").slice(-2).join(".");
  }

  /**
   * Checks if the email address has a subdomain.
   * @returns {boolean} - True if the email address has a subdomain, false otherwise.
   */
  hasSubDomain() {
    return this.getDomain().split(".").length > 2;
  }

  /**
   * Retrieves the initial letter of the author's name or domain.
   * @returns {string} - The initial letter.
   */
  getInitial() {
    if (this.hasName) {
      const authorLetters = this.author.replace(/[^a-zA-Z]/g, "");
      return authorLetters[0].toUpperCase();
    } else {
      const domain = this.getDomain();
      if (domain === "") {
        // Ghost mails https://bugzilla.mozilla.org/show_bug.cgi?id=752237
        if (this.author.length > 0) {
          return this.author[0].toUpperCase();
        }
        return "?";
      }
      return this.getDomain()[0].toUpperCase();
    }
  }
}
