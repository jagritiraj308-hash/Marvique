# Firebase + Cloudinary Setup

This project now uses:

- **Firebase Authentication** — email/password login and signup.
- **Firebase Realtime Database** — products shared with every visitor.
- **Cloudinary** — product image uploads from the admin panel.
- **localStorage fallback** — the site still works if the database is unreachable.

Everything below has to be done once in the Firebase and Cloudinary consoles.

---

## 1. Firebase Authentication

1. Open <https://console.firebase.google.com/project/marvique-8c867/authentication/providers>
2. Enable **Email/Password**.
3. Go to **Users → Add user** and create your admin account
   (email + password). This is the account you will use in the admin panel.
4. Put that email in **two** places:
   - `firebase-config.js` → `ADMIN_EMAILS` array
   - `database.rules.json` → the `auth.token.email === '...'` check

Only emails in that list can open the admin panel or write products.

> The admin panel checks the real Firebase session (`onAuthStateChanged`),
> not `localStorage`, so it cannot be unlocked from DevTools.

---

## 2. Firebase Realtime Database

1. Open <https://console.firebase.google.com/project/marvique-8c867/database>
2. **Create Database** → choose **asia-southeast1** → start in **locked mode**.
3. The database URL is already set in `firebase-config.js`:

   ```
   https://marvique-8c867-default-rtdb.asia-southeast1.firebasedatabase.app
   ```

   If your console shows a different URL, replace `databaseURL` with it.

4. Deploy the rules in `database.rules.json` (after editing the admin email):

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only database
   ```

   Or paste the file contents manually in the console under the **Rules** tab.

5. Log in to the admin panel once. If the database is empty, the default
   products are copied into it automatically.

### Data shape

```
products/
  k6201/
    id, name, description, category, finish, size,
    quantity, boxes, price, image
  product-1712345678901/
    id, name, description, category, price, image, createdAt
```

---

## 3. Cloudinary

Your cloud name is already configured in `cloudinary-config.js`:

```
cloudName: "a37efpcg"
```

### Create the unsigned upload preset

1. Open <https://console.cloudinary.com/settings/upload>
2. **Upload presets → Add upload preset**
3. Set:
   - **Preset name:** `marvique_products`
   - **Signing mode:** **Unsigned**
   - **Folder:** `marvique/products`
   - **Max file size:** 8 MB
   - **Allowed formats:** jpg, png, webp, avif
4. Save.

If you choose a different preset name, update `uploadPreset` in
`cloudinary-config.js` to match.

### How uploads work

`js/cloudinary.js` posts the file to:

```
https://api.cloudinary.com/v1_1/a37efpcg/image/upload
```

using the preset name. No API key or API secret is sent from the browser.
The returned `secure_url` is stored with the product and shown on the site.

---

## 4. Security — action required

The Cloudinary URL you shared contains your **API key and API secret**.
It was **not** added to any file, but treat it as exposed:

1. Open <https://console.cloudinary.com/settings/api-keys>
2. **Generate a new API key** and **revoke the old one**.
3. Never put `CLOUDINARY_URL`, the API key, or the API secret in HTML/JS.
   They belong in server-side environment variables only.
4. If you ever add a backend, switch from unsigned uploads to signed uploads.

The Firebase `apiKey` in `firebase-config.js` is public by design and is safe
to ship. Security comes from Firebase Auth + database rules.

---

## 5. Run locally

ES modules and `fetch()` do not work from `file://`.

```bash
# from the project folder, any static server works
npx serve .
```

or use VS Code **Live Server** → open `index.html`.

Then:

1. Scroll to the **Admin Panel** section.
2. Log in with the admin account from step 1.
3. The status line should say **Connected to Firebase Realtime Database**.
4. Add a product, choose an image, and press **Add Product**.
5. Open the site in another browser — the product appears for everyone.

---

## 6. Razorpay online payments (Buy Now)

Products with a price now show a **Buy Now** button. Products without a price
show **Price on Request** and no Buy button.

Until Razorpay is configured, Buy Now falls back to a pre-filled WhatsApp
order, so customers can still order.

### a. Get API keys

1. Open <https://dashboard.razorpay.com/app/keys>
2. Generate a key (start with **Test mode**).
3. Paste the **Key Id** (`rzp_test_...` or `rzp_live_...`) into
   `razorpay-config.js` → `keyId`.

### b. Server keys (never in the browser)

Create `functions/.env` from the example:

```bash
copy functions\.env.example functions\.env
```

Fill in:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`functions/.env` is git-ignored. The Key Secret must never appear in HTML/JS.

### c. Deploy the payment functions

Cloud Functions require the Firebase **Blaze** (pay-as-you-go) plan. The free
tier is enough for a small shop.

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

Functions are deployed to `asia-south1`. The client and server use the same
region (`razorpay-config.js` → `functionsRegion`).

### d. How an order flows

1. Customer enters quantity + contact details.
2. `createRazorpayOrder` reads the price from the Realtime Database
   (never trusts the browser), creates the Razorpay order and stores a
   `created` order.
3. Razorpay Checkout collects the payment.
4. `verifyRazorpayPayment` verifies the HMAC signature, re-checks the amount
   with Razorpay, and marks the order `paid`.
5. The order appears in **Admin Panel → Orders** (admin-only read).

Orders can only be written by the Admin SDK; the database rules deny client
writes to `orders`.

---

## 7. Deploy (optional)

```bash
firebase deploy --only database,hosting
```

`firebase.json` publishes the project root. After deploying, add the hosting
domain under **Authentication → Settings → Authorized domains** if needed.

---

## Files added / changed

| File | Purpose |
| --- | --- |
| `firebase-config.js` | Firebase app, auth, database, `ADMIN_EMAILS` |
| `cloudinary-config.js` | Public Cloudinary cloud name + unsigned preset |
| `js/cloudinary.js` | Upload, validation, progress, image URL helper |
| `js/products.js` | Realtime Database sync + localStorage fallback |
| `js/featured.js` | Renders products, live updates |
| `js/admin.js` | Admin auth, Cloudinary upload, add product |
| `js/buy.js` | Buy Now modal, Razorpay checkout, WhatsApp fallback |
| `js/orders.js` | Admin-only live order list |
| `razorpay-config.js` | Public Razorpay Key Id + checkout settings |
| `functions/index.js` | Order creation + signature verification |
| `admin.html` | Image picker + preview + orders list |
| `css/admin.css` | Admin form styles |
| `database.rules.json` | Public read, admin-only write |
| `firebase.json`, `.firebaserc` | Firebase CLI / hosting config |

---

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| "Firebase Realtime Database unavailable" | Database not created, wrong `databaseURL`, or rules block reads. |
| "PERMISSION_DENIED" when adding a product | Admin email in `firebase-config.js` and `database.rules.json` do not match, or rules were not deployed. |
| "This account is not an admin" | Email missing from `ADMIN_EMAILS`. |
| "Upload preset not found" | Preset name does not match, or it is not set to **Unsigned**. |
| "Cloudinary is not configured" | `cloudName` / `uploadPreset` still hold placeholder values. |
| Products show only on one device | Firebase sync failed; check the status line and console. |
| CORS error on upload | In the preset settings, allow unsigned uploads and check the allowed referrers / formats. |
