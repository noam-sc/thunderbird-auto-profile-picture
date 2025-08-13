import defaultSettings from "../settings/defaultSettings.js";

/**
 * Class representing a mail object.
 */
export default class Author {
  /**
   * Creates an instance of Author.
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
    } catch (error) { }
    const email = author.match(/<(.+)>/);
    if (email) {
      return email[1].toLowerCase().trim();
    }
    return author.toLowerCase().trim();
  }

  /**
   * Static factory method that creates an Author instance from an author string.
   * @param {string} author - The author of the message.
   * @returns {Author} - The Author instance.
   */
  static async fromAuthor(author) {
    const mail = await Author.parse(author);
    return new Author(author, mail);
  }

  /**
   * Retrieves the email address.
   * @returns {string} - The email address.
   */
  getEmail() {
    return this.mail;
  }

  /**
   * Retrieves the author
   * @returns {string} - The author
   */
  getAuthor() {
    return this.author;
  }

  /**
   * Overrides the toString method to return the author string.
   * @returns {string} - The author string.
   */
  toString() {
    return this.author;
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
   * @returns {Author} - A new Author instance with the subdomain removed.
   */
  removeSubDomain() {
    return new Author(this.author, this.mail.split("@")[0] + "@" + this.getTopDomain());
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
    } else if (this.isPublic()) {
      return this.author[0].toUpperCase();
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

  /**
   * Retrieves one or two initials for the author according to the following rules:
   * - If the author string contains a display name with at least two words, use the first letter of the first two words
   * - Otherwise, if it's an email address, use the local-part and treat '.' as a word separator
   * - If two letters are not possible, return a single letter (fallbacks to getInitial())
   * @returns {string} - One or two uppercase initials
   */
  getInitials() {
    // Case 1: Display name present → take first two words' initials
    if (this.hasName) {
      const displayName = this.author.split("<")[0].trim();
      const words = displayName.match(/[A-Za-z]+/g) || [];
      if (words.length >= 1) {
        const first = words[0][0];
        const second = words.length >= 2 ? words[1][0] : null;
        const initials = second ? first + second : first;
        return initials.toUpperCase();
      }
      // If display name contains no letters, fall through to other strategies
    }

    // Case 2: Email address available → use local-part with '.' as separator
    const email = this.mail || this.author || "";
    const atIndex = email.indexOf("@");
    if (atIndex !== -1) {
      const localPart = email.slice(0, atIndex);
      const segments = localPart.split(".");

      const letters = [];
      for (const segment of segments) {
        const match = segment.match(/[A-Za-z]/);
        if (match) {
          letters.push(match[0]);
        }
        if (letters.length === 2) {
          break;
        }
      }

      if (letters.length >= 1) {
        return letters.join("").toUpperCase();
      }

      // If no letters found at all but we do have characters, use the first character
      if (localPart.length > 0) {
        return localPart[0].toUpperCase();
      }
    }

    // Final fallback: use existing single initial logic (may return '?')
    return this.getInitial();
  }
}
