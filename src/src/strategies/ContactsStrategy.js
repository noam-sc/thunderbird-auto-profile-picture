import { AvatarStrategy, Status } from "./AvatarStrategy.js";

export class ContactsStrategy extends AvatarStrategy {
  constructor(fetcher, mail) {
    super(fetcher);
    this.mail = mail;
  }

  async fetchAvatar() {
    try {
      const contacts = await messenger.contacts.quickSearch(this.mail.getEmail());
      if (contacts.length > 0) {
        const contact = contacts[0];
        /** @type {Blob} */
        const photo = await messenger.contacts.getPhoto(contact.id);
        if (photo) {
          return photo;
        }
      }
    } catch (error) {
      console.error("Error fetching avatar from contacts", error);
    }
    return Status.NO_RESULT;
  }
}