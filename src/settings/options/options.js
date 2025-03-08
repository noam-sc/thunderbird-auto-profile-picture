import CacheStorage from "../../src/CacheStorage.js";
import ProfilePictureFetcher from "../../src/ProfilePictureFetcher.js";
import Mail from "../../src/Mail.js";
import SettingsManager from "../SettingsManager.js";

const cacheSizeElement = document.getElementById("cacheSize");
const clearCacheButton = document.getElementById("clearCache");
const inboxListCheckbox = document.getElementById("inboxList");
const contactsIntegrationCheckbox = document.getElementById(
  "contactsIntegration"
);
const emailInput = document.getElementById("email");
const fetchButton = document.getElementById("fetchButton");
const profilePictureDiv = document.getElementById("profilePicture");
const cache = new CacheStorage();
const settingsManager = new SettingsManager(cache);

async function printCacheSize(domElement) {
  const detailedSize = await cache.formattedSize();
  const iconsCount = detailedSize.iconsCount;
  const size = detailedSize.size;
  let iconsText;
  if (iconsCount === 0) {
    iconsText = " (" + browser.i18n.getMessage("noIcons") + ")";
  } else if (iconsCount === 1) {
    iconsText = " (" + browser.i18n.getMessage("oneIcon") + ")";
  } else {
    iconsText = " (" + browser.i18n.getMessage("multipleIcons", iconsCount) + ")";
  }
  domElement.innerHTML = size + iconsText;
}

async function clearCache() {
  await cache.clearCache();
  printCacheSize(cacheSizeElement);
  clearCacheButton.disabled = true;
  clearCacheButton.innerHTML = browser.i18n.getMessage("cacheCleared");
}

function initOptions() {
  settingsManager.getInboxListEnabled().then((inboxListEnabled) => {
    inboxListCheckbox.checked = inboxListEnabled;
  });

  settingsManager.getContactsIntegrationEnabled().then((contactsIntegrationEnabled) => {
    contactsIntegrationCheckbox.checked = contactsIntegrationEnabled;
  });
}

function setInboxList() {
  settingsManager.setInboxListEnabled(inboxListCheckbox.checked);
  browser.runtime.sendMessage({ action: "refreshSettings" });
}

function setContactsIntegration() {
  settingsManager.setContactsIntegrationEnabled(contactsIntegrationCheckbox.checked);
  browser.runtime.sendMessage({ action: "refreshSettings" });
}

async function fetchProfilePicture() {
  fetchButton.disabled = true;
  profilePictureDiv.setAttribute("aria-busy", "true");
  profilePictureDiv.style.display = "flex";
  profilePictureDiv.innerHTML = "";

  const mail = await Mail.fromAuthor(emailInput.value);
  const fetcher = new ProfilePictureFetcher(window, mail, "duckduckgo", true);
  const url = await fetcher.getAvatar();

  if (!url) {
    profilePictureDiv.innerHTML = browser.i18n.getMessage("profilePictureNotFound");
  } else {
    profilePictureDiv.innerHTML = `<img src="${url}" width="100" height="100">`;
  }
  fetchButton.disabled = false;
  profilePictureDiv.removeAttribute("aria-busy");
}

function setupLocalization() {
  for (let node of document.querySelectorAll("[data-l10n-id]")) {
    let l10nId = node.getAttribute("data-l10n-id");
    node.textContent = browser.i18n.getMessage(l10nId);
  }
  for (let node of document.querySelectorAll("[data-l10n-attr-placeholder]")) {
    let l10nId = node.getAttribute("data-l10n-attr-placeholder");
    node.setAttribute("placeholder", browser.i18n.getMessage(l10nId));
  }
  for (let node of document.querySelectorAll("[data-l10n-attr-title]")) {
    let l10nId = node.getAttribute("data-l10n-attr-title");
    node.setAttribute("title", browser.i18n.getMessage(l10nId));
  }
}

printCacheSize(cacheSizeElement);
initOptions();
clearCacheButton.addEventListener("click", clearCache);
inboxListCheckbox.addEventListener("change", setInboxList);
contactsIntegrationCheckbox.addEventListener("change", setContactsIntegration);
fetchButton.addEventListener("click", fetchProfilePicture);
setupLocalization();
