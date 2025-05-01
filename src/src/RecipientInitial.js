export default class RecipientInitial {
  /**
   * Generate a pastel oklch color string for a given identifier (e.g., email or name)
   * Supports light-dark CSS property for color scheme adaptation.
   * @param {string} identifier - Unique string for the recipient
   * @returns {string} - oklch color string or light-dark() CSS function
   */
  static getColor(identifier) {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = ((hash << 5) - hash) + identifier.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    const hue = (Math.abs(hash) % 36000) / 100; // 0.00 - 359.99
    
    const lightnessLight = 0.80 + ((Math.abs(hash) % 10) / 100); // 0.80 - 0.89
    const chromaLight = 0.050 + ((Math.abs(hash) % 5) / 1000);   // 0.050 - 0.054
    const lightnessDark = 0.40 + ((Math.abs(hash) % 10) / 100);  // 0.40 - 0.49
    const chromaDark = 0.050 + ((Math.abs(hash) % 5) / 1000);    // 0.050 - 0.054

    const light = `oklch(${lightnessLight.toFixed(2)} ${chromaLight.toFixed(3)} ${hue.toFixed(2)})`;
    const dark = `oklch(${lightnessDark.toFixed(2)} ${chromaDark.toFixed(3)} ${hue.toFixed(2)})`;
    
    return `light-dark(${light}, ${dark})`;
  }

  /**
   * Builds initials for the given mail and author.
   * @param {Object} mail - The mail object.
   * @param {string} author - The author string.
   * @returns {Object} - The initials object.
   */
  static buildInitials(mail, author) {
    return {
      value: "//INITIAL:" + mail.getInitial(),
      color: RecipientInitial.getColor(mail.mail || author),
    };
  }
}
