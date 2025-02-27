import Provider from './Provider.js';

export default class FaviconWebpageProvider extends Provider {
  constructor(wdow) {
    super("favicon_webpage");
    this.wdow = wdow;
  }

  async getUrl(mail) {
    const domain = mail.getDomain();
    const response = await this.wdow.fetch(
      `https://${domain}`,
        { signal: AbortSignal.timeout(5000) }
    );
    const html = await response.text();
    let favicon = html.match(/<link[^>]*rel="icon"[^>]*>/);
    if (!favicon) {
        favicon = html.match(/<link[^>]*rel="shortcut icon"[^>]*>/);
    }
    if (!favicon) {
        favicon = html.match(/<link[^>]*rel="apple-touch-icon"[^>]*>/);
    }
    if (!favicon) {
        favicon = html.match(/<link[^>]*rel="apple-touch-icon-precomposed"[^>]*>/);
    }
    if (!favicon) {
        favicon = html.match(/<link[^>]*rel="mask-icon"[^>]*>/);
    }
    if (!favicon) {
        return false;
    }
    
    const faviconUrl = favicon[0].match(/href="([^"]*)"/)[1];
    
    if (!faviconUrl) return false;

    if (faviconUrl.startsWith("http")) {
      return faviconUrl;
    } else {
        return `https://${domain}${faviconUrl}`;
    }
  }
}
