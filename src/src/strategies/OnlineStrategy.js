import { AvatarStrategy } from "./AvatarStrategy.js";
import Provider, { Scope } from "../../providers/Provider.js";
import Mail from "../Mail.js";
import ProfilePictureFetcher from "../ProfilePictureFetcher.js";

export class OnlineStrategy extends AvatarStrategy {
    /**
     * Creates an instance of OnlineStrategy.
     *
     * @param {ProfilePictureFetcher} fetcher - The fetcher object responsible for downloading images.
     * @param {Provider} provider - The provider object that supplies the URL and scope.
     * @param {Mail} mail - The mail object containing email information.
     */
    constructor(fetcher, provider, mail) {
        super(fetcher);
        this.strategyName = provider.name;
        this.provider = provider;
        this.mail = mail;
        this.domain =
            provider.scope === Scope.Domain ? mail.getDomain() : mail.getEmail();
    }

    async fetchAvatar() {
        try {
            this.urlPromise = this.provider.getUrl(this.mail);
            const url = await this.urlPromise;
            if (url) {
                return await this.fetcher.downloadImage(
                    url,
                    this.domain,
                    this.strategyName
                );
            }
        } catch (error) {
            console.warn(`Error while downloading ${this.strategyName}`, error, this.urlPromise);
        }
        return null;
    }
}
