/*
  RAZORPAY CONFIG
  ---------------
  keyId is PUBLIC and safe to ship in the browser (it starts with rzp_).

  NEVER put the Razorpay Key Secret in this file or anywhere in the browser.
  The secret lives only in functions/.env on the server.

  Setup:
  1. Razorpay Dashboard -> Account & Settings -> API Keys -> Generate Key
  2. Paste the Key Id below.
  3. Put the Key Secret in functions/.env (see functions/.env.example).
  4. Deploy the functions (Firebase Blaze plan required).
*/
export const RAZORPAY_CONFIG = {
  keyId: "YOUR_RAZORPAY_KEY_ID",

  currency: "INR",
  companyName: "Marvique Tiles & Marble",
  companyLogo: "",

  // Firebase Functions region used by functions/index.js
  functionsRegion: "asia-south1",

  // Used when online payment is unavailable (no keys / functions not deployed)
  whatsappNumber: "919931614860",

  themeColor: "#c8a96b"
};

export function isRazorpayConfigured() {
  const keyId = RAZORPAY_CONFIG.keyId || "";

  return /^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId);
}
