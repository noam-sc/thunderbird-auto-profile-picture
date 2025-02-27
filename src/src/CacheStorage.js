export default class CacheStorage {
  /**
   * Retrieves an icon from the cache.
   * @param {string} key - The key for the icon.
   * @param {string} [type=""] - The MIME type of the icon.
   * @returns {Promise<Blob>} - The icon as a Blob.
   * @throws {Error} - If the icon is not found in the cache.
   */
  async getIcon(key, type = "") {
    const fileKey = "FILE_" + key;
    const fileStorage = await browser.storage.local.get(fileKey);
    if (!fileStorage[fileKey]) {
      throw new Error("File not found in cache");
    }
    const fileBuffer = fileStorage[fileKey];
    let blob = new Blob([fileBuffer], { type: type });
    return blob;
  }

  /**
   * Saves an icon to the cache.
   * @param {string} key - The key for the icon.
   * @param {Blob} blob - The icon as a Blob.
   * @returns {Promise<void>}
   */
  async saveIcon(key, blob) {
    const fileKey = "FILE_" + key;
    const buffer = await blob.arrayBuffer();
    await browser.storage.local.set({ [fileKey]: buffer });
  }

  /**
   * Retrieves a property from the cache.
   * @param {string} key - The key for the property.
   * @returns {Promise<any>} - The property value.
   */
  async getProperty(key) {
    const storage = await browser.storage.local.get(key);
    if (storage[key] === undefined) {
      return null;
    }
    try {
      const json = JSON.parse(storage[key]);
      return json;
    } catch (error) {
      return storage[key];
    }
  }

  /**
   * Sets a property in the cache.
   * @param {string} key - The key for the property.
   * @param {any} value - The value of the property.
   * @returns {Promise<void>}
   */
  async setProperty(key, value) {
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }
    await browser.storage.local.set({ [key]: value });
  }

  /**
   * Removes a property from the cache.
   * @param {string} key - The key for the property.
   * @returns {Promise<void>}
   */
  async removeProperty(key) {
    await browser.storage.local.remove(key);
  }

  /**
   * Calculates the size of the cache.
   * @returns {Promise<{bytes: number, iconsCount: number}>} - The size of the cache in bytes and the number of icons.
   */
  async size() {
    // return browser.storage.local.getBytesInUse();
    // can't use : see https://bugzilla.mozilla.org/show_bug.cgi?id=1385832

    const storage = await browser.storage.local.get();
    let bytes = 0;
    let iconsCount = 0;
    for (let key in storage) {
      if (key.startsWith("SETTINGS_")) {
        continue;
      }
      bytes += key.length;
      let value = storage[key];
      if (value instanceof ArrayBuffer) {
        bytes += value.byteLength;
        iconsCount++;
      } else if (typeof value === "string") {
        bytes += value.length;
      }
    }
    return {
      bytes: bytes,
      iconsCount: iconsCount,
    };
  }

  /**
   * Converts bytes to a human-readable size string.
   * @param {number} bytes - The size in bytes.
   * @returns {string} - The human-readable size string.
   */
  convertBytesToSize(bytes) {
    if (bytes === 0 || !bytes) {
      return "empty";
    }
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + " " + ["B", "KB", "MB", "GB", "TB"][i];
  }

  /**
   * Retrieves the formatted size of the cache.
   * @returns {Promise<{size: string, iconsCount: number}>} - The formatted size and the number of icons.
   */
  async formattedSize() {
    const sizes = await this.size();
    return {
      size: this.convertBytesToSize(sizes.bytes),
      iconsCount: sizes.iconsCount,
    };
  }

  /**
   * Clears the cache.
   * @returns {Promise<void>}
   */
  async clearCache() {
    const storage = await browser.storage.local.get();
    for (let key in storage) {
      if (key.startsWith("FILE_") || key.startsWith("ICON_")) {
        await browser.storage.local.remove(key);
      }
    }
  }
}
