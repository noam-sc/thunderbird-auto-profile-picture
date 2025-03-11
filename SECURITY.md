## About required permissions

This extension requires the following permissions from Thunderbird:

- **messagesRead**:
  - ``mailTabs.getListedMessages`` is used to retrieve the list of messages displayed in the current tab
  - ``messages.continueList`` is used to retrieve the full list of messages displayed
  - *event* ``messages.onNewMailReceived`` is used to trigger avatars fetch and display when a new mail is received (listener in background.js)
  - ``messages.getFull`` is used to retrieve reply-to field of a message when its sender is a proxy address
- **accountsRead**:
  - *event* ``mailTabs.onDisplayedFolderChanged`` is used to trigger avatars display when the displayed folder is changed (listener in background.js)
  - *event* ``messages.onNewMailReceived`` is used to trigger avatars fetch and display when a new mail is received (listener in background.js)
- **tabs** and **activeTab**:
  - *event* ``tabs.onUpdate`` used to trigger avatars display when any tab is updated (listener in background.js)
  - *event* ``tabs.onUpdate`` used to trigger avatars display when a special tab associated with Thunderbird Conversations is loaded (listener in background.js)
  - ``tabs.getCurrent`` and ``tabs.query`` functions are used to retrieve the tab id so as to fetch the listed messages in this tab
- **storage**: ``storage.local`` is used to store the user's settings and avatars fetched
- **addressBooks**:
  - *event* ``contacts.onCreated`` is used to trigger avatar fetch and save when a new contact is created (listener in background.js)
  - ``contacts.quickSearch`` and ``contacts.getPhoto`` are used to retrieve the avatar of a contact (first strategy) in order to display it
  - ``contacts.getPhoto`` is also used to determine if a newly created contact has an avatar, in which case, ``contacts.setPhoto`` is called to save the automatically fetched avatar
- **\<all_urls\>**: used to fetch avatars (full list in /src/providers/)
- **Experimental API**: 
  - used to display avatars in the inbox list, in message header and in Thunderbird Conversations
  - used to listen to events in the inbox list

## Auto Profile Picture Privacy Policy

This extension uses several external services to provide the functionality. The privacy policy of these services is as follows:

### CloudFlare DNS

Cloudflare DNS is used to resolve BIMI records associated with email addresses.

Their privacy policy can be found [here](https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/).

In short, Cloudflare's 1.1.1.1 public DNS resolver, developed with APNIC, is designed for privacy by encrypting DNS requests to prevent spying, not selling or using personal data for advertising, anonymizing IP addresses, retaining data only for operational purposes and limited time, and allowing APNIC access to anonymized logs for research.

### DuckDuckGo

DuckDuckGo is used to retrieve website icons.

Their privacy policy can be found [here](https://duckduckgo.com/privacy) and specifically for the icons [here](https://duckduckgo.com/duckduckgo-help-pages/privacy/favicons/).

### Gravatar

Gravatar is used to retrieve user avatars.

Their privacy policy can be found [here](https://support.gravatar.com/account/data-privacy/).