import Mail from "./Mail.js";
import ProfilePictureFetcher from "./ProfilePictureFetcher.js";
import ImageConverter from "./ImageConverter.js";

/**
 * Service for handling contacts and their profile pictures.
 */
class ContactsService {
  constructor(mailService, avatarService) {
    this.mailService = mailService;
    this.avatarService = avatarService;
  }

  /**
   * Handles the creation of a new contact.
   * @param {Object} contactNode - The contact node.
   * @returns {Promise<void>}
   */
  async handleContactCreated(contactNode) {
    if (contactNode.readOnly || await messenger.contacts.getPhoto(contactNode.id)) return;

    const mail = this.mailService.getPrimaryEmail(contactNode);
    if (!mail) return;

    const file = await new ProfilePictureFetcher(window, new Mail(mail)).getAvatar("file");
    if (!file) return;

    const pngFile = await new ImageConverter(file).convertToPng();
    messenger.contacts.setPhoto(contactNode.id, pngFile);
  }
}

export default ContactsService;
