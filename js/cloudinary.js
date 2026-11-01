/* =========================
   CLOUDINARY IMAGE UPLOAD
   Unsigned browser uploads (no API secret in the client).
========================= */

import {
  CLOUDINARY_CONFIG,
  isCloudinaryConfigured
} from "../cloudinary-config.js";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
];

export class CloudinaryError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "CloudinaryError";
    this.code = code || "cloudinary/error";
  }
}

export function validateImageFile(file) {
  if (!file) {
    throw new CloudinaryError("Please choose an image file.", "cloudinary/no-file");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new CloudinaryError(
      "Unsupported image type. Use JPG, PNG, WebP or AVIF.",
      "cloudinary/bad-type"
    );
  }

  const maxBytes = CLOUDINARY_CONFIG.maxFileSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new CloudinaryError(
      "Image is too large. Maximum size is " +
        CLOUDINARY_CONFIG.maxFileSizeMB +
        " MB.",
      "cloudinary/too-large"
    );
  }
}

/**
 * Uploads an image to Cloudinary and returns its details.
 *
 * @param {File} file
 * @param {{ onProgress?: (percent: number) => void }} [options]
 * @returns {Promise<{ url: string, publicId: string, width: number, height: number }>}
 */
export function uploadImage(file, options) {
  const settings = options || {};

  if (!isCloudinaryConfigured()) {
    return Promise.reject(
      new CloudinaryError(
        "Cloudinary is not configured. Set cloudName and uploadPreset in cloudinary-config.js.",
        "cloudinary/not-configured"
      )
    );
  }

  try {
    validateImageFile(file);
  } catch (error) {
    return Promise.reject(error);
  }

  const endpoint =
    "https://api.cloudinary.com/v1_1/" +
    CLOUDINARY_CONFIG.cloudName +
    "/image/upload";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

  if (CLOUDINARY_CONFIG.folder) {
    formData.append("folder", CLOUDINARY_CONFIG.folder);
  }

  return new Promise(function (resolve, reject) {
    const request = new XMLHttpRequest();

    request.open("POST", endpoint);

    if (request.upload && typeof settings.onProgress === "function") {
      request.upload.addEventListener("progress", function (event) {
        if (!event.lengthComputable) return;

        const percent = Math.round((event.loaded / event.total) * 100);
        settings.onProgress(percent);
      });
    }

    request.addEventListener("load", function () {
      let payload = null;

      try {
        payload = JSON.parse(request.responseText);
      } catch (error) {
        payload = null;
      }

      if (request.status >= 200 && request.status < 300 && payload) {
        resolve({
          url: payload.secure_url,
          publicId: payload.public_id,
          width: payload.width,
          height: payload.height
        });
        return;
      }

      const apiMessage =
        payload && payload.error && payload.error.message
          ? payload.error.message
          : "Upload failed with status " + request.status + ".";

      reject(new CloudinaryError(apiMessage, "cloudinary/upload-failed"));
    });

    request.addEventListener("error", function () {
      reject(
        new CloudinaryError(
          "Could not reach Cloudinary. Check your internet connection.",
          "cloudinary/network"
        )
      );
    });

    request.addEventListener("abort", function () {
      reject(new CloudinaryError("Upload cancelled.", "cloudinary/aborted"));
    });

    request.send(formData);
  });
}

/**
 * Builds an optimized Cloudinary URL with width/quality transformations.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function cloudinaryImageUrl(url, width) {
  if (!url || !String(url).includes("res.cloudinary.com")) {
    return url;
  }

  const transform = [
    "f_auto",
    "q_auto",
    width ? "w_" + width : "",
    "c_limit"
  ]
    .filter(Boolean)
    .join(",");

  return String(url).replace("/upload/", "/upload/" + transform + "/");
}
