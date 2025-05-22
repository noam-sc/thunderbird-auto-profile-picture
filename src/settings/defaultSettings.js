/**
 * Default settings for the application.
 * @type {Object}
 * @property {boolean} inboxListEnabled - Whether the inbox list feature is enabled. MUTABLE.
 * @property {boolean} contactsIntegrationEnabled - Whether the contacts integration feature is enabled. MUTABLE.
 * @property {Array<string>} publicMails - List of public mail domains.
 * @property {number} notFoundRefreshIntervalMs - Interval in milliseconds to refresh not found avatars.
 * @property {number} WAIT_TIME_MS - Wait time in milliseconds for displaying the inbox list.
 * @property {number} SUBBATCH_SIZE - Size of the subbatch for processing messages.
 */
const defaultSettings = {
    inboxListEnabled: true,
    contactsIntegrationEnabled: true,
    publicMails: new Set([
        "gmail",
        "yahoo",
        "hotmail",
        "outlook",
        "aol",
        "protonmail",
        "yandex",
        "icloud",
        "gmx",
        "laposte",
        "sfr",
        "free",
        "bbox",
        "wanadoo",
        "orange.fr",
        "live",
        "msn",
        "yandex"
    ]),
    notFoundRefreshIntervalMs: 1000 * 3600 * 24 * 30,
    WAIT_TIME_MS: 500,
    SUBBATCH_SIZE: 15,
    MAX_REQUEST_SIZE: 100,
};

export default defaultSettings;