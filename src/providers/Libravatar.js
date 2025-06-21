import { Scope } from "./Provider.js";
import Provider from "./Provider.js";

export default class LibravatarProvider extends Provider {
    constructor() {
        super("Libravatar", Scope.EMAIL);
    }

    async getUrl(mail) {
        const email = mail.getEmail();
        const trimmedLowerEmail = email.trim().toLowerCase();
        const encoder = new TextEncoder();
        const data = encoder.encode(trimmedLowerEmail);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        return `https://seccdn.libravatar.org/avatar/${hashHex}?d=404`;
    }
} 