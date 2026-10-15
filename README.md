# Rosy Routine

Rosy Routine has an installable offline edition at the project root and a Tailwind-styled online edition in `online/`. Both use plain JavaScript.

## Run it in VS Code

1. Open the `rosy-routine` folder.
2. Use the VS Code Live Server extension, or run any local static server from this folder.
3. Open the local URL in Chrome or Edge.
4. Use the Install app button or the browser menu to install it on desktop or mobile.

## Enable Study Buddy

Study Buddy uses the local Python API in this folder. From the `rosy-routine` folder, start it in a terminal and leave that terminal running:

```powershell
py -3 ai_server.py
```

Make sure this folder's `.env` contains a valid `GEMINI_API_KEY`. Then open Rosy Routine through Live Server. The browser sends requests to the local API at `http://127.0.0.1:5001/api/study-chat`; the API key never belongs in the frontend. Check `http://127.0.0.1:5001/health` to confirm the API is running and the key was loaded.

Study Buddy can use the notes you explicitly save in the “What I am learning” box and the recent conversation. Those notes are stored locally in your browser and are not model training data.

Do not open `index.html` directly with a `file://` URL: service workers and PWA installation require a local server or HTTPS.

## Deploy Google sign-in

The Firebase config works on localhost and on a deployed site. Before deploying:

1. Host the folder from an HTTPS site, such as GitHub Pages, Netlify, Vercel, or Firebase Hosting.
2. In Firebase Console, open **Authentication > Settings > Authorized domains**.
3. Add the exact hostname of the deployed site, for example `your-name.github.io` or `rosy-routine.netlify.app`. Add `localhost` separately for local testing.
4. In **Authentication > Sign-in method**, enable **Google** and choose a support email.
5. Open the deployed `auth.html` page and test Google sign-in there.

Firebase handles the Google callback through the configured `authDomain`; no production URL needs to be hardcoded in the JavaScript. Use HTTPS in production because browsers restrict Firebase Auth and service workers on insecure origins.

## Set up the online edition

1. In Firebase Console, create a **Cloud Firestore** database for the same project used in `firebase-config.js`.
2. In **Firestore > Rules**, publish the rules from `firestore.rules`. Each signed-in user can read and update only their own `users/{uid}` document.
3. Enable Google in **Authentication > Sign-in method** and add your deployed hostname to **Authorized domains**.
4. Install the CSS build dependency and compile the online styles:

	```powershell
	npm.cmd install
	npm.cmd run build:online
	```

5. Deploy the project root to Vercel over HTTPS. The online edition is at `/online/`; the existing installable offline edition remains at `/`.
6. In Vercel project settings, add `GEMINI_API_KEY` and `FIREBASE_API_KEY` as server-side environment variables. The first is your Gemini API key; the second is the Firebase web API key from the same Firebase project. Never put the Gemini key in `firebase-config.js` or frontend JavaScript.

The online dashboard stores study progress in Firestore at `users/{uid}` and keeps a browser-local cached copy for temporary connectivity loss. The `/api/study-chat` function verifies the signed-in Firebase ID token before calling Gemini. Study Buddy requires the Vercel deployment and both environment variables; the local Python API described above remains available for the offline edition.

Google sign-in and cloud sync require the Firebase services above to be enabled. They cannot be activated just by deploying the static files.

## Main files

- `index.html` contains the app structure.
- `styles.css` contains the responsive pink design.
- `pages.css` contains the navigation and Study Buddy page styles.
- `app.js` contains the timer, garden, streak, task list, shop, and localStorage logic.
- `manifest.json` and `sw.js` make the app installable and available offline.

Progress is stored in the browser under `rosy-routine-state`.
