import CacheStorage from "./CacheStorage.js";
import ProviderFactory from "../providers/ProviderFactory.js";
import { CacheStrategy } from "./strategies/CacheStrategy.js";
import { OnlineStrategy } from "./strategies/OnlineStrategy.js";
import { ContactsStrategy } from "./strategies/ContactsStrategy.js";
import { VoidStrategy } from "./strategies/VoidStrategy.js";
import { AvatarStrategy } from "./strategies/AvatarStrategy.js";
import Mail from "./Mail.js";
import { Status } from "./strategies/AvatarStrategy.js";


export default class ProfilePictureFetcher {
    /**
     *
     * @param {Window} wdow Window object
     * @param {Mail} mailObject Mail object to fetch the avatar for
     * @param {string} providerName Provider name to use for fetching the avatar
     * @param {boolean} disableCache Disable cache
     */
    constructor(
        wdow,
        mailObject,
        providerName = "duckduckgo",
        disableCache = false
    ) {
        this.wdow = wdow;
        this.mail = mailObject;
        this.provider = ProviderFactory.createProvider(providerName, wdow);
        this.gravatarProvider = ProviderFactory.createProvider(
            "gravatar",
            wdow
        );
        this.bimiProvider = ProviderFactory.createProvider("bimi", wdow);
        this.webProvider = ProviderFactory.createProvider(
            "favicon_webpage",
            wdow
        );
        this.providerName = providerName;
        this.domain = mailObject.getDomain();
        this.cache = new CacheStorage();
        this.disableCache = disableCache;
    }

    /**
     * Converts a blob to a URL
     * @param {Blob} blob blob to convert to URL
     * @returns {string} URL of the blob
     */
    blobToUrl(blob) {
        return URL.createObjectURL(blob);
    }

    /**
     * Converts a blob to a file
     * @param {Blob} blob blob to convert to file
     * @returns {File} File object
     */
    blobToFile(blob) {
        let file = new File([blob], "avatar", { type: blob.type });
        return file;
    }

    /**
     * Saves a blob to the cache
     * @param {Blob} blob Blob to save
     * @param {string} iconDomain Domain associated with the icon
     * @param {string} source Source of the icon
     */
    async saveBlobToCache(blob, iconDomain, source) {
        const iconPath = "ICON_" + iconDomain + ".ico";

        await this.cache.saveIcon(iconPath, blob);

        const fileInfos = {
            path: iconPath,
            type: blob.type,
            ts: Date.now(),
            source: source,
        };

        this.cache.setProperty("ICON_" + iconDomain, fileInfos);
        if (source == "gravatar" || this.mail.isPublic()) {
            this.cache.setProperty("ICON_" + this.mail.getEmail(), fileInfos);
        } else {
            this.cache.setProperty("ICON_" + this.domain, fileInfos);
        }
    }

    /**
     * Saves a "not found" status to the cache
     * @param {string} iconDomain Domain associated with the icon
     */
    async saveNotFoundToCache(iconDomain) {
        const notFoundObject = {
            type: Status.NOT_FOUND,
            ts: Date.now(),
        };

        this.cache.setProperty("ICON_" + iconDomain, notFoundObject);
        if (this.mail.isPublic()) {
            this.cache.setProperty(
                "ICON_" + this.mail.getEmail(),
                notFoundObject
            );
        } else {
            this.cache.setProperty("ICON_" + this.domain, notFoundObject);
        }
    }

    /**
     * Downloads an image from a URL
     * @param {string} url URL to download the image from
     * @param {string} iconDomain Domain associated with the icon
     * @param {string} source Source of the icon
     * @returns {Promise<Blob|null>} Blob of the downloaded image or null if not found
     */
    async downloadImage(url, iconDomain, source = this.providerName) {
        return await this.wdow.fetch(url).then(async (response) => {
            if (
                (response.status == 404 && source == "gravatar") ||
                !response.ok
            ) {
                return null;
            }
            let blob = await response.blob();

            if (blob.type.includes("text/plain")) {
                const string = await blob.text();
                if (string.includes("svg")) {
                    // wrong header returned by the server : text/plain instead of image/svg+xml
                    // happens with noreply@recruiting.facebook.com for instance
                    blob = new Blob([string], { type: "image/svg+xml" });
                } else {
                    throw new Error("Invalid image type: " + blob.type);
                }
            }

            this.saveBlobToCache(blob, iconDomain, source);

            return blob;
        });
    }

    /**
     * Retrieves an icon from the cache
     * @param {string} domain Domain associated with the icon
     * @param {string|null} originalDomain Original domain associated with the icon
     * @returns {Promise<Blob|Status>} Blob of the icon, false if not in cache
     */
    async getFromCache(domain, originalDomain = null) {
        if (this.disableCache) {
            return Status.NO_RESULT;
        }
        if (this.mail.isPublic() && domain !== this.mail.getEmail()) {
            originalDomain = this.mail.getEmail();
        }
        const key = "ICON_" + domain;

        const fileInfos = await this.cache.getProperty(key);
        if (!fileInfos) {
            return Status.NO_RESULT;
        }

        try {
            if (fileInfos.type == Status.NOT_FOUND) {
                return Status.NOT_FOUND;
            }
            let blob = await this.cache.getIcon(fileInfos.path, fileInfos.type);
            if (originalDomain) {
                this.cache.setProperty("ICON_" + originalDomain, fileInfos);
            }
            return blob;
        } catch (error) {
            // corrupted entry
            this.cache.removeProperty(key);
            return Status.NO_RESULT;
        }
    }

    /**
     * Executes a series of strategies to fetch an avatar
     * @param {Array<AvatarStrategy>} strategies Array of strategies to execute
     * @returns {Promise<Blob|Status>} Blob of the avatar or NOT_FOUND if not found
     */
    async executeStrategies(strategies) {
        for (const strategy of strategies) {
            const avatar = await strategy.fetchAvatar();
            if (avatar instanceof Blob) return avatar;
        }
        return Status.NOT_FOUND;
    }

    /**
     * Fetches the domain avatar using various strategies
     * @returns {Promise<Blob|Status>} Blob of the avatar or NOT_FOUND if not found
     */
    async getDomainAvatar() {
        const topDomain = this.mail.getTopDomain();
        const hasSubDomain = this.mail.hasSubDomain();
        const strategies = [
            new ContactsStrategy(this, this.mail),
            new CacheStrategy(this, this.mail.getEmail()),
            new CacheStrategy(this, this.domain),
            new OnlineStrategy(this, this.bimiProvider, this.mail), // company first
            hasSubDomain
                ? new CacheStrategy(this, topDomain)
                : new VoidStrategy(),
            hasSubDomain
                ? new OnlineStrategy(
                      this,
                      this.bimiProvider,
                      this.mail.removeSubDomain()
                  )
                : new VoidStrategy(),
            new OnlineStrategy(this, this.gravatarProvider, this.mail),
            new OnlineStrategy(this, this.provider, this.mail),
            new OnlineStrategy(this, this.webProvider, this.mail),
            hasSubDomain
                ? new OnlineStrategy(
                      this,
                      this.provider,
                      this.mail.removeSubDomain()
                  )
                : new VoidStrategy(),
            hasSubDomain
                ? new OnlineStrategy(
                      this,
                      this.webProvider,
                      this.mail.removeSubDomain()
                  )
                : new VoidStrategy(),
        ];
        return await this.executeStrategies(strategies);
    }

    /**
     * Fetches the public avatar using various strategies
     * @returns {Promise<Blob|Status>} Blob of the avatar or NOT_FOUND if not found
     */
    async getPublicAvatar() {
        const strategies = [
            new ContactsStrategy(this, this.mail),
            new CacheStrategy(this, this.mail.getEmail()),
            new OnlineStrategy(this, this.gravatarProvider, this.mail),
        ];
        return await this.executeStrategies(strategies);
    }

    /**
     * Fetches the avatar blob
     * @returns {Promise<Blob|null>} Blob of the avatar or null if not found
     */
    async getAvatarBlob() {
        try {
            const reponse = this.mail.isPublic()
                ? await this.getPublicAvatar()
                : await this.getDomainAvatar();
            if (reponse === Status.NOT_FOUND) {
                this.saveNotFoundToCache(this.domain);
                return null;
            }
            if (reponse instanceof Blob) {
                return reponse;
            }
            return null;
        } catch (error) {
            console.error("Error fetching avatar", error);
            return null;
        }
    }

    /**
     * Fetches the avatar as a URL
     * @returns {Promise<string|null>} URL of the avatar or null if not found
     */
    async getAvatarAsURL() {
        let blob = await this.getAvatarBlob();
        if (blob) {
            return this.blobToUrl(blob);
        }
        return null;
    }

    /**
     * Fetches the avatar as a File
     * @returns {Promise<File|null>} File object of the avatar or null if not found
     */
    async getAvatarAsFile() {
        let blob = await this.getAvatarBlob();
        if (blob) {
            return this.blobToFile(blob);
        }
        return null;
    }
}