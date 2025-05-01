import Mail from "./Mail.js";
import defaultSettings from "../settings/defaultSettings.js";
import RecipientInitial from "./RecipientInitial.js";

/**
 * Service for handling messages and their associated avatars.
 */
class MessagesService {
  constructor(mailService, avatarService) {
    this.mailService = mailService;
    this.avatarService = avatarService;
    this.WAIT_TIME_MS = defaultSettings.WAIT_TIME_MS;
    this.SUBBATCH_SIZE = defaultSettings.SUBBATCH_SIZE;
    /**
     * Timestamp of the last display inbox list call.
     */
    this.lastDisplayInboxListCall = 0;
  }

  /**
   * Checks if the inbox list can be displayed.
   * @returns {boolean} - True if the inbox list can be displayed, false otherwise.
   */
  canDisplayInboxList() {
    return Date.now() - this.lastDisplayInboxListCall >= this.WAIT_TIME_MS;
  }

  /**
   * Updates the timestamp of the last inbox list display call.
   */
  updateLastDisplayInboxListCall() {
    this.lastDisplayInboxListCall = Date.now();
  }

  /**
   * Maps messages to their correspondents.
   * @param {Array} messages - The list of messages.
   * @returns {Promise<Array>} - The list of correspondents.
   */
  async mapMessagesToCorrespondents(messages) {
    const correspondents = await Promise.all(messages.map(async (message) => {
      return await this.mailService.getCorrespondent(message);
    }));
    return correspondents;
  }

  /**
   * Fetches avatars for the given messages.
   * @param {Array} messages - The list of messages.
   * @returns {Promise<Array>} - The list of avatar URLs.
   */
  async fetchAvatarsFromMessages(messages) {
    let messagesAuthorsSet = await this.getMessagesAuthorsSet(messages);
    let urls = {};

    let avatarPromises = Array.from(messagesAuthorsSet).map(async (author) => {
      let url = await this.avatarService.getAvatar(author);
      const mail = await Mail.fromAuthor(author);
      urls[author] = url || RecipientInitial.buildInitials(mail, author);
    });

    await Promise.all(avatarPromises);

    return await this.mapMessagesToCorrespondents(messages).then((correspondents) => {
      return correspondents.map((correspondent) => urls[correspondent]);
    });
  }

  /**
   * Retrieves initials for the given messages.
   * @param {Array} messages - The list of messages.
   * @returns {Promise<Array>} - The list of initials.
   */
  async getInitialsFromMessages(messages) {
    let messagesAuthorsSet = await this.getMessagesAuthorsSet(messages);
    let initials = {};

    await Promise.all(Array.from(messagesAuthorsSet).map(async (author) => {
      const mail = await Mail.fromAuthor(author);
      initials[author] = RecipientInitial.buildInitials(mail, author);
    }));

    return await this.mapMessagesToCorrespondents(messages).then((correspondents) => {
      return correspondents.map((correspondent) => initials[correspondent]);
    });
  }

  /**
   * Retrieves a set of authors from the given messages.
   * @param {Array} messages - The list of messages.
   * @returns {Promise<Set>} - The set of authors.
   */
  async getMessagesAuthorsSet(messages) {
    return new Set(
      await this.mapMessagesToCorrespondents(messages).then((correspondents) => { return correspondents; })
    );
  }

  /**
   * Displays initials for the given messages.
   * @param {Array} messages - The list of messages.
   * @param {number} tabId - The tab ID.
   * @param {number} offset - The offset.
   */
  async displayInitials(messages, tabId, offset) {
    const initials = await this.getInitialsFromMessages(messages);
    browser.headerApi.pictureInboxList(tabId, JSON.stringify(initials), offset, true);
  }

  /**
   * Displays avatars for the given messages.
   * @param {Array} messages - The list of messages.
   * @param {number} tabId - The tab ID.
   * @param {number} offset - The offset.
   * @param {Function} resolve - The resolve function for the promise.
   */
  async displayAvatars(messages, tabId, offset, resolve) {
    const urls = await this.fetchAvatarsFromMessages(messages);
    resolve();

    const result = await browser.headerApi.pictureInboxList(tabId, JSON.stringify(urls), offset, false);
    if (result.status === "needReprint") {
      if (result.eventType === "scroll") {
        this.lastDisplayInboxListCall -= this.WAIT_TIME_MS / 2;
      }
      await this.displayInboxList(null, true);
    }
  }

  /**
   * Retrieves the next set of messages.
   * @param {Object} currentMessages - The current set of messages.
   * @returns {Promise<Object>} - The next set of messages.
   */
  async getNextMessages(currentMessages) {
    return await browser.messages.continueList(currentMessages.id);
  }

  /**
   * Processes the next set of messages.
   * @param {Object} currentMessages - The current set of messages.
   * @param {number} tabId - The tab ID.
   * @param {number} offset - The offset.
   */
  async processNextMessages(currentMessages, tabId, offset) {
    let page = await this.getNextMessages(currentMessages);
    const newOffset = offset + currentMessages.messages.length;
    this.processMessagesInboxList(page, tabId, newOffset, await browser.headerApi.getFirstDisplayedMessageId(tabId));
  }

  /**
   * Processes the inbox list of messages.
   * @param {Object} currentMessages - The current set of messages.
   * @param {number} tabId - The tab ID.
   * @param {number} messagesOffset - The offset for the messages.
   * @param {number} firstDisplayedMessageId - The ID of the first displayed message.
   */
  async processMessagesInboxList(currentMessages, tabId, messagesOffset, firstDisplayedMessageId) {
    const hasNextMessages = (currentMessages) =>
      currentMessages.id !== null && currentMessages.id !== undefined;

    const fetchAllMessages = async (currentMessages, maxMessages, messagesOffset) => {
      let allMessages = [];
      while (hasNextMessages(currentMessages) && allMessages.length + messagesOffset < maxMessages) {
        allMessages = allMessages.concat(currentMessages.messages);
        currentMessages = await this.getNextMessages(currentMessages);
      }
      allMessages = allMessages.concat(currentMessages.messages);
      return { messages: allMessages, id: currentMessages.id };
    };

    if (currentMessages.messages.length === 0) {
      return;
    }
    if (
      firstDisplayedMessageId &&
      firstDisplayedMessageId > currentMessages.messages.length + messagesOffset
    ) {
      let messages = await fetchAllMessages(currentMessages, firstDisplayedMessageId, messagesOffset);
      currentMessages = messages;
      let priorityMessagesList = currentMessages.messages.slice(firstDisplayedMessageId);
      let priorityMessages = {
        messages: priorityMessagesList,
        id: currentMessages.id,
      };
      await this.processBatch(priorityMessages, tabId, messagesOffset + firstDisplayedMessageId);

      if (hasNextMessages(currentMessages)) {
        this.processNextMessages(
          currentMessages,
          tabId,
          messagesOffset + currentMessages.messages.length
        );
      }

      let index = firstDisplayedMessageId - this.SUBBATCH_SIZE;
      while (index >= 0) {
        let previousMessagesList = currentMessages.messages.slice(index, index + this.SUBBATCH_SIZE);
        let previousMessages = {
          messages: previousMessagesList,
          id: currentMessages.id,
        };
        await this.processBatch(previousMessages, tabId, messagesOffset + index);
        index -= this.SUBBATCH_SIZE;
      }
      return;
    }

    await this.processBatch(currentMessages, tabId, messagesOffset);

    if (hasNextMessages(currentMessages)) {
      this.processNextMessages(currentMessages, tabId, messagesOffset);
    }
  }

  /**
   * Processes a batch of messages.
   * @param {Object} currentMessages - The current set of messages.
   * @param {number} tabId - The tab ID.
   * @param {number} messagesOffset - The offset for the messages.
   * @returns {Promise<boolean>} - True when the batch is processed.
   */
  async processBatch(currentMessages, tabId, messagesOffset) {
    const subbatches = [];
    for (let i = 0; i < currentMessages.messages.length; i += this.SUBBATCH_SIZE) {
      const subbatch = currentMessages.messages.slice(i, i + this.SUBBATCH_SIZE);
      subbatches.push(this.processSubbatch(subbatch, tabId, messagesOffset + i));
    }
    await Promise.all(subbatches);
    return true;
  }

  /**
   * Processes a subbatch of messages.
   * @param {Array} subbatch - The subbatch of messages.
   * @param {number} tabId - The tab ID.
   * @param {number} subbatchOffset - The offset for the subbatch.
   * @returns {Promise<void>}
   */
  async processSubbatch(subbatch, tabId, subbatchOffset) {
    this.displayInitials(subbatch, tabId, subbatchOffset);
    let promiseFetchAvatars = new Promise((resolve) => {
      this.displayAvatars(subbatch, tabId, subbatchOffset, resolve);
    });
    return promiseFetchAvatars;
  }

  /**
   * Retrieves messages and the tab ID.
   * @param {Object} tab - The tab object.
   * @returns {Promise<{currentMessages: Object, tabId: number, firstDisplayedMessageId: number}>} - The messages and tab ID.
   */
  async getMessagesAndTabId(tab) {
    let tabId = await this.getMailTabId(tab);

    const currentMessages = await browser.mailTabs.getListedMessages(tabId);
    const firstDisplayedMessageId =
      await browser.headerApi.getFirstDisplayedMessageId(tabId);

    return { currentMessages, tabId, firstDisplayedMessageId };
  }

  /**
   * Retrieves the mail tab ID.
   * @param {Object} tab - The tab object.
   * @returns {Promise<number>} - The mail tab ID.
   * @throws {Error} - If the tab is not a mail tab.
   */
  async getMailTabId(tab) {
    let tabId = 1;
    if (!tab) {
      const mailTabs = await browser.tabs.query({ mailTab: true });
      if (mailTabs.length > 0) {
        tabId = mailTabs[0].id;
      }
    } else if (tab.type !== "mail") {
      throw new Error("Not a mail tab " + tab.type);
    } else {
      tabId = tab.id;
    }
    return tabId;
  }

  /**
   * Installs DOM listeners for the given tab ID.
   * @param {number} tabId - The tab ID.
   * @returns {Promise<void>}
   */
  async installDOMlistener(tabId) {
    const eventType = await browser.headerApi.installEventListeners(tabId);
    if (eventType === "scroll") {
      this.lastDisplayInboxListCall -= this.WAIT_TIME_MS / 2;
    }
    await this.displayInboxList(null, true);
  }

  /**
   * Displays avatars on the inbox list.
   * @param {Object} tab - The tab object.
   * @param {boolean} triggeredFromDOMEvent - Indicates if the call was triggered from a DOM event.
   */
  async displayInboxList(tab, triggeredFromDOMEvent = false) {
    if (!this.canDisplayInboxList()) {
      if (triggeredFromDOMEvent) {
        const tabId = await this.getMailTabId(tab);
        this.installDOMlistener(tabId);
      }
      return;
    }
    this.updateLastDisplayInboxListCall();
    const { currentMessages, tabId, firstDisplayedMessageId } =
      await this.getMessagesAndTabId(tab);
    await this.processMessagesInboxList(currentMessages, tabId, 0, firstDisplayedMessageId);
  }
}

export default MessagesService;
