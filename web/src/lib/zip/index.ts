import JSZip from "jszip";

export class ZipLibs {
  static download(blobs: string[]) {
    const filename = "use-capture.zip";
    const zip = new JSZip();
    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i];
      const name = `${Math.random().toString(36).split(".")[1]}.png`;
      zip.file(name, blob, { base64: true });
    }
    zip.generateAsync({ type: "blob" }).then((file) => {
      const a = document.createElement("a");
      const href = URL.createObjectURL(file);

      a.download = filename;
      a.href = href;
      a.click();

      URL.revokeObjectURL(href);
      a.remove();
    });
  }
}
