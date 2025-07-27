import Provider from './Provider.js';
import defaultSettings from '../settings/defaultSettings.js';

export default class BimiProvider extends Provider {
  constructor(wdow) {
    super("BIMI");
    this.wdow = wdow;
  }

  async getUrl(mail) {
    const domain = mail.getDomain();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), defaultSettings.FETCH_TIMEOUT_MS || 2000);

    try {
      const response = await this.wdow.fetch(
        `https://cloudflare-dns.com/dns-query?name=default._bimi.${domain}&type=TXT`,
        {
          headers: { Accept: "application/dns-json" },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const json = await response.json();
      const records = json.Answer;
      if (!records) return false;

      const bimiRecord = records
        .filter((record) => record.type === 16 && record.data.includes("BIMI"))
        .map((record) => record.data)
        .find(Boolean);

      if (!bimiRecord) return false;

      const bimiUrl = bimiRecord
        .replace(/"/g, "")
        .split(";")
        .find((param) => param.includes("l="))
        ?.split("=")[1];

      return bimiUrl || false;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn(`Timeout fetching BIMI for ${domain}`);
      } else {
        console.warn(`Error fetching BIMI for ${domain}:`, error);
      }
      return false;
    }
  }
}
