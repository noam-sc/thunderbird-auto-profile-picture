import Provider from './Provider.js';

export default class SplitbeeProvider extends Provider {
    constructor() {
        super("Splitbee");
    }

    async getUrl(mail) {
        const domain = mail.getDomain();
        return `https://favicon.splitbee.io/?url=${domain}`;
    }
}