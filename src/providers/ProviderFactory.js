import GoogleProvider from './Google.js';
import DuckDuckGoProvider from './DuckDuckGo.js';
import GravatarProvider from './Gravatar.js';
import LibravatarProvider from './Libravatar.js';
import BimiProvider from './Bimi.js';
import IconHorseProvider from './IconHorse.js';
import SplitbeeProvider from './Splitbee.js';
import FaviconWebpageProvider from './FaviconWebpage.js';
import Provider from './Provider.js';

export default class ProviderFactory {

  /**
   * Creates an instance of a provider based on the given name.
   * 
   * @param {string} name - The name of the provider to create.
   * @param {Window} wdow - The window object, required for some providers.
   * @returns {Provider} An instance of the requested provider.
   * @throws {Error} If the provider with the given name is not found.
   */
  static createProvider(name, wdow) {
    name = name.toLowerCase();
    switch (name) {
      case "google":
        return new GoogleProvider();
      case "duckduckgo":
        return new DuckDuckGoProvider();
      case "gravatar":
        return new GravatarProvider();
      case "libravatar":
        return new LibravatarProvider();
      case "bimi":
        return new BimiProvider(wdow);
      case "iconhorse":
        return new IconHorseProvider();
      case "splitbee":
        return new SplitbeeProvider();
      case "favicon_webpage":
        return new FaviconWebpageProvider(wdow);
      default:
        throw new Error(`Provider with name ${name} not found.`);
    }
  }
}