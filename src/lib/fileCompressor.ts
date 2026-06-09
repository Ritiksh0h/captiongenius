import imageCompression from "browser-image-compression";
const defaultOptions = {
  maxSizeMB: 1,
};
export async function compressFile(imageFile: File, options = defaultOptions) {
  return await imageCompression(imageFile, options);
}

export function readFileAsBase64(file: File) {
  return imageCompression.getDataUrlFromFile(file);
}
