import { Scope } from "./Provider.js";
import Provider from "./Provider.js";

export default class GravatarProvider extends Provider {
  constructor() {
    super("Gravatar", Scope.EMAIL);
  }

  async getUrl(mail) {
    const email = mail.getEmail();
    const trimmedLowerEmail = email.trim().toLowerCase();
    const encoder = new TextEncoder();
    const data = encoder.encode(trimmedLowerEmail);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `https://www.gravatar.com/avatar/${hashHex}?d=404`;
  }
}