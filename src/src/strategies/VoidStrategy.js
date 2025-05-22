import { AvatarStrategy, Status } from "./AvatarStrategy.js";

export class VoidStrategy extends AvatarStrategy {
  constructor() {
    super(null);
  }

  async fetchAvatar() {
    return Status.NO_RESULT;
  }
}