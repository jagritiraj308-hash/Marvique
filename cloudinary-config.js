/*
  CLOUDINARY CONFIG
  -----------------
  These values are PUBLIC and safe to ship in the browser.

  NEVER put your API key or API secret here.
  Browser uploads use an "unsigned upload preset", not the API secret.

  Setup:
  1. Cloudinary Console -> Settings -> Upload -> Upload presets
  2. "Add upload preset"
     - Signing mode: Unsigned
     - Preset name: marvique_products (or your own, update below)
     - Folder: marvique/products (optional)
  3. Paste your cloud name below (Cloudinary Console -> Dashboard).
*/
export const CLOUDINARY_CONFIG = {
  cloudName: "a37efpcg",
  uploadPreset: "marvique_products",
  folder: "marvique/products",
  maxFileSizeMB: 8
};

export function isCloudinaryConfigured() {
  const { cloudName, uploadPreset } = CLOUDINARY_CONFIG;

  return Boolean(
    cloudName &&
    uploadPreset &&
    cloudName !== "YOUR_CLOUD_NAME" &&
    uploadPreset !== "YOUR_UPLOAD_PRESET"
  );
}
