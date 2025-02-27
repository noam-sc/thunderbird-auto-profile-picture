import Provider from './Provider.js';

export default class IconHorseProvider extends Provider {
    constructor() {
        super("Icon Horse");
    }

    async getUrl(mail) {
        const domain = mail.getDomain();
        return `https://icon.horse/icon/${domain}`;
    }
}