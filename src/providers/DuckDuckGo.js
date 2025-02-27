import Provider from './Provider.js';

export default class DuckDuckGoProvider extends Provider {
  constructor() {
    super("DuckDuckGo");
  }

  async getUrl(mail) {
    const domain = mail.getDomain();
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  }
}