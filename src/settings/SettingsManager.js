import defaultSettings from "./defaultSettings.js";

class SettingsManager {
  constructor(cache) {
    this.cache = cache;
  }

  async getSetting(settingName) {
    let value = await this.cache.getProperty(`SETTINGS_${settingName}`);
    if (value === null) {
      value = defaultSettings[settingName];
      await this.setSetting(settingName, value);
    }
    return value;
  }

  async setSetting(settingName, value) {
    await this.cache.setProperty(`SETTINGS_${settingName}`, value);
  }

  async getInboxListEnabled() {
    return this.getSetting("inboxListEnabled");
  }

  async setInboxListEnabled(value) {
    await this.setSetting("inboxListEnabled", value);
  }

  async getContactsIntegrationEnabled() {
    return this.getSetting("contactsIntegrationEnabled");
  }

  async setContactsIntegrationEnabled(value) {
    await this.setSetting("contactsIntegrationEnabled", value);
  }
}

export default SettingsManager;
