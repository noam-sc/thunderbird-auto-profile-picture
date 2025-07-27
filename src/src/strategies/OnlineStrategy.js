import { AvatarStrategy } from "./AvatarStrategy.js";
import Provider, { Scope } from "../../providers/Provider.js";
import Author from "../Author.js";
import ProfilePictureFetcher from "../ProfilePictureFetcher.js";
import defaultSettings from "../../settings/defaultSettings.js";

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
            // Set a timeout for the entire strategy execution
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Strategy timeout')),
                    (defaultSettings.FETCH_TIMEOUT_MS || 2000) + 500);
            });

            const fetchPromise = (async () => {
                this.urlPromise = this.provider.getUrl(this.author);
                const url = await this.urlPromise;
                if (url) {
                    return await this.fetcher.downloadImage(
                        url,
                        this.domain,
                        this.strategyName
                    );
                }
                return null;
            })();

            return await Promise.race([fetchPromise, timeoutPromise]);
        } catch (error) {
            if (error.message === 'Strategy timeout') {
                console.warn(`Timeout for ${this.strategyName} strategy`);
            } else {
                console.warn(`Error while downloading ${this.strategyName}`, error);
            }
        }
        return null;
    }
}
