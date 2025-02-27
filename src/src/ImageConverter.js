export default class ImageConverter {
  /**
   * Creates an instance of ImageConverter.
   * @param {File} file - The image file to be converted.
   */
  constructor(file) {
    this.file = file;
  }

  /**
   * Converts an SVG string to a PNG file.
   * @param {string} svgString - The SVG string to convert.
   * @returns {Promise<File>} - The converted PNG file.
   */
  async svgUrlToFile(svgString) {
    let fileName = "avatar.png";
    let width = 1000;
    let height = 1000;
    return new Promise((resolve, reject) => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
      const svgElement = svgDoc.documentElement;

      let viewBox = svgElement.getAttribute("viewBox");
      let viewBoxValues = viewBox ? viewBox.split(" ").map(Number) : null;

      if (viewBoxValues && viewBoxValues.length === 4) {
        const viewBoxWidth = viewBoxValues[2];
        const viewBoxHeight = viewBoxValues[3];
        const aspect = viewBoxWidth / viewBoxHeight;

        if (width && !height) {
          height = width / aspect;
        } else if (height && !width) {
          width = height * aspect;
        } else if (!width && !height) {
          width = viewBoxWidth;
          height = viewBoxHeight;
        }
      } else {
        width = width || 1000;
        height = height || 1000;
      }

      svgElement.removeAttribute("width");
      svgElement.removeAttribute("height");

      svgString = new XMLSerializer().serializeToString(svgElement);

      svgString = svgString.replace(
        "<svg",
        `<svg width="${width}" height="${height}"`
      );

      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((pngBlob) => {
          const pngFile = new File([pngBlob], fileName, { type: "image/png" });

          URL.revokeObjectURL(svgUrl);

          resolve(pngFile);
        }, "image/png");
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error("Failed to load SVG"));
      };

      img.src = svgUrl;
    });
  }

  /**
   * Converts the SVG file to a PNG file.
   * @returns {Promise<File>} - The converted PNG file.
   */
  async convertSvgToPng() {
    const svgBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(this.file);
    });

    return await this.svgUrlToFile(atob(svgBase64.split(",")[1]));
  }

  /**
   * Converts an image URL to a PNG file.
   * @param {string} objectUrl - The URL of the image.
   * @param {number} [width=null] - The width of the output image.
   * @param {number} [height=null] - The height of the output image.
   * @returns {Promise<File>} - The converted PNG file.
   */
  async imageUrlToFile(objectUrl, width = null, height = null) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const image = new Image();
    image.src = objectUrl;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    if (width && height) {
      canvas.width = width;
      canvas.height = height;
    } else {
      canvas.width = image.width;
      canvas.height = image.height;
    }

    ctx.drawImage(image, 0, 0);
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
    return new File([blob], "avatar.png", { type: "image/png" });
  }

  /**
   * Converts the file to a PNG file.
   * @returns {Promise<File>} - The converted PNG file.
   */
  async convertToPng() {
    if (this.file.type === "image/svg+xml") {
      return await this.convertSvgToPng();
    }

    return await this.imageUrlToFile(URL.createObjectURL(this.file));
  }
}
