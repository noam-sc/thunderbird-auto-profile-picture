import ICAL from "../libs/ical.js";
import Author from "./Author.js";
import RecipientInitial from "./RecipientInitial.js";

/**
 * Service for handling mail-related operations.
 */
class MailService {
  constructor(avatarService) {
    this.avatarService = avatarService;
  }

  /**
   * Retrieves the avatar URL for the given message.
   * @param {Object} message - The message object.
   * @param {string} [context="inboxList"] - The context of the request. (inboxList or messageHeader)
   * @returns {Promise<Object>} - The avatar URL.
   */
  async getUrl(message, context = "inboxList") {
    const author = await this.getCorrespondent(message, context);
    let url = await this.avatarService.getAvatar(author);
    if (context === "messageHeader" && !url) {
      url = RecipientInitial.buildInitials(author);
    }
    return { [author.getEmail()]: url };
  }

  /**
   * Retrieves the correspondent for the given message.
   * @param {Object} message - The message object.
   * @param {string} [context="inboxList"] - The context of the request. (inboxList or messageHeader)
   * @returns {Promise<Author>} - The correspondent's email address.
   */
  async getCorrespondent(message, context = "inboxList") {
    if (message.folder?.type === "sent" && message.recipients.length > 0 && context === "inboxList") {
      return await Author.fromAuthor(message.recipients[0]);
    }
    if (message.author.includes("drive-shares-noreply@google.com") || message.author.includes("drive-shares-dm-noreply@google.com")) { // proxy emails
      const fullMessage = await browser.messages.getFull(message.id);
      if (fullMessage.headers["reply-to"]) {
        return await Author.fromAuthor(fullMessage.headers["reply-to"][0]);
      }
      return await Author.fromAuthor(message.author);
    }

    const mail = await Author.fromAuthor(message.author);
    if (mail && mail.getEmail().match(/@duck\.com$/)) {
      const match = mail.getEmail().match(/^(.+)_at_(.+?)_.+@duck\.com$/);
      if (match) {
        return await Author.fromAuthor(`${match[1]}@${match[2]}`);
      }
    }
    return mail;
  }

  /**
   * Retrieves the primary email address from the contact node.
   * @param {Object} contactNode - The contact node.
   * @returns {string|null} - The primary email address or null if not found.
   */
  getPrimaryEmail(contactNode) {
    const [component, jCard] = ICAL.parse(contactNode.properties.vCard);
    if (component !== "vcard") {
      return null;
    }

    const emailEntry = jCard.find((data) => data[0] === "email");
    if (!emailEntry) {
      return null;
    }

    return emailEntry[3];
  }
}

export default MailService;
