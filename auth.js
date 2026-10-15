const authState = initRosyShell('account');
const config = window.ROSY_FIREBASE_CONFIG || {};
const googleButton = document.getElementById('googleLogin');
const authMessage = document.getElementById('authMessage');
const authConfigNote = document.getElementById('authConfigNote');
const configured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
const currentOrigin = location.origin;
const backLink = document.querySelector('.text-link');
if (backLink) { backLink.href = 'journey.html'; backLink.textContent = 'Explore the Rosy journey'; }
const authBrand = document.querySelector('.brand');
if (authBrand) authBrand.href = 'about.html';

function continueAsGuest() {
  localStorage.setItem('rosy-routine-profile', JSON.stringify({ mode: 'guest', name: 'Guest gardener' }));
  window.location.href = 'index.html';
}

document.getElementById('guestLogin').addEventListener('click', continueAsGuest);
function saveGoogleProfile(user) {
  localStorage.setItem('rosy-routine-profile', JSON.stringify({ mode: 'google', name: user.displayName || 'Rosy gardener', email: user.email || '', uid: user.uid || '' }));
  window.location.href = 'index.html';
}
function continueOfflineFromAuth() {
  localStorage.setItem('rosy-routine-profile', JSON.stringify({ mode: 'guest', name: 'Guest gardener' }));
  authMessage.textContent = 'Google sign-in is not available in this browser. You are continuing in offline mode.';
  setTimeout(() => window.location.href = 'index.html', 600);
}

function showAuthError(error) {
  const messages = { 'auth/popup-closed-by-user': 'The Google sign-in window was closed. Try again when you are ready.', 'auth/popup-blocked': 'Your browser blocked the sign-in window. We will try a full-page sign-in instead.', 'auth/unauthorized-domain': `Firebase does not allow ${location.hostname} yet. Add this hostname under Authentication > Settings > Authorized domains.`, 'auth/operation-not-supported-in-this-environment': 'This browser needs the full-page Google sign-in. Try again.', 'auth/configuration-not-found': 'Firebase Authentication is not enabled for this project yet. Open Firebase Console > Authentication > Get started, then enable Google.' };
  authMessage.textContent = messages[error.code] || 'Google sign-in could not be completed. Check your Firebase settings and try again.';
  if (authConfigNote && error.code === 'auth/unauthorized-domain') authConfigNote.textContent = `Current app origin: ${currentOrigin}`;
  console.warn('Rosy Google login:', error);
}

async function signInWithGoogle() {
  if (!configured || !window.firebase) {
    authMessage.textContent = 'Google sign-in is not connected yet. Add your Firebase web config to firebase-config.js.';
    if (authConfigNote) authConfigNote.textContent = 'Firebase Console: enable Authentication > Sign-in method > Google, then add this site to Authorized domains.';
    return;
  }
  googleButton.disabled = true;
  authMessage.textContent = 'Opening Google sign-in...';
  try {
    if (location.protocol === 'file:') {
      continueOfflineFromAuth();
      return;
    }
    if (!firebase.apps.length) firebase.initializeApp(config);
    const auth = firebase.auth();
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    saveGoogleProfile(result.user);
  } catch (error) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-supported-in-this-environment') {
      try {
        if (location.protocol === 'file:') {
          continueOfflineFromAuth();
          return;
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().signInWithRedirect(provider);
        return;
      } catch (redirectError) {
        googleButton.disabled = false;
        if (redirectError?.code === 'auth/operation-not-supported-in-this-environment' || location.protocol === 'file:') {
          continueOfflineFromAuth();
          return;
        }
        showAuthError(redirectError);
        return;
      }
    }
    googleButton.disabled = false;
    if (error.code === 'auth/operation-not-supported-in-this-environment' || location.protocol === 'file:') {
      continueOfflineFromAuth();
      return;
    }
    showAuthError(error);
  }
}

googleButton.addEventListener('click', signInWithGoogle);
if (!configured) {
  googleButton.classList.add('is-unconfigured');
  authMessage.textContent = 'Google sign-in needs your Firebase web config. Guest mode is ready offline.';
  if (authConfigNote) authConfigNote.textContent = 'Add the values in firebase-config.js to activate Google sign-in.';
} else if (location.protocol === 'file:') {
  googleButton.disabled = true;
  authMessage.textContent = 'Google sign-in is unavailable in local file mode. Continuing in offline guest mode.';
  if (authConfigNote) authConfigNote.textContent = 'Open the app through a local web server for Google sign-in, or continue offline.';
  setTimeout(() => continueAsGuest(), 600);
} else if (window.firebase) {
  firebase.initializeApp(config);
  firebase.auth().getRedirectResult().then((result) => { if (result.user) saveGoogleProfile(result.user); }).catch(showAuthError);
} else {
  authMessage.textContent = 'The Google sign-in library could not load. Check your internet connection and try again.';
}
