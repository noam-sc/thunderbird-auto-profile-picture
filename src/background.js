import CacheStorage from "./src/CacheStorage.js";
import AvatarService from "./src/AvatarService.js";
import MailService from "./src/MailService.js";
import SettingsManager from "./settings/SettingsManager.js";
import ContactsService from "./src/ContactsService.js";
import MessagesService from "./src/MessagesService.js";
import Author from "./src/Author.js";

let cache = new CacheStorage();
let settingsManager = new SettingsManager(cache);

let inboxListEnabled, contactsIntegrationEnabled;

/**
 * Refreshes the settings from the SettingsManager
 */
async function refreshSettings() {
  inboxListEnabled = await settingsManager.getInboxListEnabled();
  contactsIntegrationEnabled = await settingsManager.getContactsIntegrationEnabled();
}
await refreshSettings();

const avatarService = new AvatarService();
const mailService = new MailService(avatarService);
const contactsService = new ContactsService(mailService, avatarService);
const messagesService = new MessagesService(mailService, avatarService);

/**
 * Handles the need for additional data in a tab
 * @param {Object} tab Tab object
 * @param {Object} result Result object containing data
 */
async function handleNeedData(tab, result) {
  try {
    let dataPopups = result.data.popupValues;
    let urlsDict = {};

    // Process popups in parallel to avoid sequential blocking
    const popupPromises = dataPopups.map(async (popup) => {
      try {
        let mail = popup.mail;
        const author = await Author.fromAuthor(mail);
        let url = await avatarService.getAvatar(author);
        return { mail, url };
      } catch (error) {
        console.warn("Error processing popup:", error);
        return { mail: popup.mail, url: null };
      }
    });

    // Wait for all popup processing to complete
    const popupResults = await Promise.allSettled(popupPromises);

    // Combine results
    popupResults.forEach(result => {
      if (result.status === 'fulfilled') {
        urlsDict[result.value.mail] = result.value.url;
      }
    });

    let payload = {
      urls: urlsDict,
      data: result.data,
    };

    browser.headerApi.pictureHeadersConversation(tab.id, JSON.stringify(payload));
  } catch (error) {
    console.warn("Error in handleNeedData:", error);
  }
}

/**
 * Displays avatars in a tab
 * @param {Object} tab Tab object
 * @param {Array} messages Array of message objects
 */
async function displayInTab(tab, messages) {
  try {
    let urlsDict = {};

    // Process messages in parallel with timeout protection
    const messagePromises = messages.map(async (message) => {
      try {
        let urls = await mailService.getUrl(message, "messageHeader");
        return urls;
      } catch (error) {
        console.warn("Error processing message:", error);
        return {};
      }
    });

    // Use Promise.allSettled to avoid blocking on slow individual requests
    const results = await Promise.allSettled(messagePromises);

    // Combine all successful results
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        urlsDict = { ...urlsDict, ...result.value };
      }
    });

    let urlDictJSON = JSON.stringify(urlsDict);
    let result = await browser.headerApi.pictureHeaders(tab.id, urlDictJSON);

    if (result.status === "needData") {
      handleNeedData(tab, result);
    }
  } catch (error) {
    console.warn("Error in displayInTab:", error);
  }
}

/**
 * Handles the creation of a new contact
 * @param {Object} contactNode Contact node object
 */
async function onContactCreated(contactNode) {
  if (!contactsIntegrationEnabled) return;
  await contactsService.handleContactCreated(contactNode);
}

/**
 * Displays the inbox list in a tab
 * @param {Object} tab Tab object
 */
async function displayInboxList(tab) {
  if (!inboxListEnabled) return;
  try {
    await messagesService.displayInboxList(tab);
  } catch (error) {
    console.warn("Error in displayInboxList:", error);
  }
}

/**
 * Initializes event listeners
 */
function initListeners() {
  browser.messageDisplay.onMessageDisplayed.addListener(async (tab, message) => {
    // Don't await these calls to avoid blocking message display
    displayInTab(tab, [message]).catch(error =>
      console.warn("Error displaying avatars:", error)
    );
    displayInboxList(tab).catch(error =>
      console.warn("Error displaying inbox list:", error)
    );
  });

  browser.messageDisplay.onMessagesDisplayed.addListener(
    async (tab, messages) => {
      // Don't await to avoid blocking message display
      displayInTab(tab, messages).catch(error =>
        console.warn("Error displaying avatars:", error)
      );
    }
  );

  browser.mailTabs.onDisplayedFolderChanged.addListener((tab) => {
    // Don't await to avoid blocking folder change
    displayInboxList(tab).catch(error =>
      console.warn("Error displaying inbox list on folder change:", error)
    );
  });

  browser.messages.onNewMailReceived.addListener(async (folder, messages) => {
    setTimeout(async () => {
      try {
        const currentTab = await browser.tabs.getCurrent();
        displayInboxList(currentTab).catch(error =>
          console.warn("Error displaying inbox list on new mail:", error)
        );
      } catch (error) {
        console.warn("Error getting current tab:", error);
      }
    }, 1000);
  });

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.type !== "mail") {
      return;
    }
    // Don't await to avoid blocking tab updates
    displayInboxList(tab).catch(error =>
      console.warn("Error displaying inbox list on tab update:", error)
    );
  });

  browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.action === "displayInboxList") {
      displayInboxList().catch(error =>
        console.warn("Error displaying inbox list from message:", error)
      );
    } else if (message.action === "refreshSettings") {
      refreshSettings().catch(error =>
        console.warn("Error refreshing settings:", error)
      );
    }
  });

  messenger.contacts.onCreated.addListener(onContactCreated);

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.status === "complete" && tab.type === "special") { // Thunderbird Conversations tab
      try {
        let result = await browser.headerApi.pictureHeaders(tabId, "{}");
        if (result.status === "needData") {
          handleNeedData(tab, result).catch(error =>
            console.warn("Error handling need data:", error)
          );
        }
      } catch (error) {
        console.warn("Error with conversations tab:", error);
      }
    }
  });
}

initListeners();
if (inboxListEnabled) {
  // Don't await this to avoid blocking extension startup
  displayInboxList().catch(error =>
    console.warn("Error displaying initial inbox list:", error)
  );
}
