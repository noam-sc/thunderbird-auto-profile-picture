import Provider from './Provider.js';

export default class GoogleProvider extends Provider {
  constructor() {
    super("Google");
  }

  async getUrl(mail) {
    const domain = mail.getDomain();
    return `https://www.google.com/s2/favicons?domain=${domain}`;
  }
}