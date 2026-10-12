export function createPngFilename(date = new Date()) {
  const timestamp = date.toISOString()
    .replace(/\.\d{3}Z$/, "Z")
    .replaceAll(":", "-");

  return `repaint-${timestamp}.png`;
}

export function downloadPng(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
