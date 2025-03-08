import ICAL from "../libs/ical.js";
import Mail from "./Mail.js";

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
    const url = await this.avatarService.getAvatar(author);
    const mailObject = await Mail.fromAuthor(author);
    return { [mailObject.getEmail()]: url };
  }

  /**
   * Retrieves the correspondent for the given message.
   * @param {Object} message - The message object.
   * @param {string} [context="inboxList"] - The context of the request. (inboxList or messageHeader)
   * @returns {Promise<string>} - The correspondent's email address.
   */
  async getCorrespondent(message, context = "inboxList") {
    if (message.folder?.type === "sent" && message.recipients.length > 0 && context === "inboxList") {
      return message.recipients[0];
    }
    if (message.author.includes("drive-shares-noreply@google.com") || message.author.includes("drive-shares-dm-noreply@google.com")) { // proxy emails
      const fullMessage = await browser.messages.getFull(message.id);
      if (fullMessage.headers["reply-to"]) {
        return fullMessage.headers["reply-to"][0];
      }
      return message.author;
    }
    return message.author;
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
