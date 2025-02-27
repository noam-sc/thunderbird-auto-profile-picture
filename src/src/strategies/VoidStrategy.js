import { AvatarStrategy } from "./AvatarStrategy.js";

export class VoidStrategy extends AvatarStrategy {
  constructor() {
    super(null);
  }

  async fetchAvatar() {
    return null;
  }
}