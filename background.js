// Il content script viene registrato solo dopo che l'utente ha concesso l'accesso ai siti dal popup
const SCRIPT_ID = 'url-params';
const SITE_ORIGINS = ['http://*/*', 'https://*/*'];

// Allinea la registrazione del content script al permesso concesso
async function syncContentScript() {
  const granted = await chrome.permissions.contains({ origins: SITE_ORIGINS });
  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });

  if (granted && registered.length === 0) {
    await chrome.scripting.registerContentScripts([{
      id: SCRIPT_ID,
      matches: SITE_ORIGINS,
      js: ['content.js'],
      runAt: 'document_start',
      persistAcrossSessions: true
    }]);
  } else if (!granted && registered.length > 0) {
    await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  }
}

// Gli eventi possono arrivare insieme (es. installazione e permesso): le sincronizzazioni vengono eseguite una alla volta
let queue = Promise.resolve();
function scheduleSync() {
  queue = queue
    .then(syncContentScript)
    .catch(error => console.error('Error syncing content script:', error));
}

chrome.runtime.onInstalled.addListener(scheduleSync);
chrome.runtime.onStartup.addListener(scheduleSync);
chrome.permissions.onAdded.addListener(scheduleSync);
chrome.permissions.onRemoved.addListener(scheduleSync);
