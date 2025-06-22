import { AvatarStrategy } from "./AvatarStrategy.js";
import Provider, { Scope } from "../../providers/Provider.js";
import Author from "../Author.js";
import ProfilePictureFetcher from "../ProfilePictureFetcher.js";

export class OnlineStrategy extends AvatarStrategy {
    /**
     * Creates an instance of OnlineStrategy.
     *
     * @param {ProfilePictureFetcher} fetcher - The fetcher object responsible for downloading images.
     * @param {Provider} provider - The provider object that supplies the URL and scope.
     * @param {Author} author - The author object containing email information.
     */
    constructor(fetcher, provider, author) {
        super(fetcher);
        this.strategyName = provider.name;
        this.provider = provider;
        this.author = author;
        this.domain =
            provider.scope === Scope.Domain ? author.getDomain() : author.getEmail();
    }

    async fetchAvatar() {
        try {
            this.urlPromise = this.provider.getUrl(this.author);
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
