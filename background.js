// Stato dell'estensione
let state = {
  isActive: false,
  parameters: []
};

// Carica lo stato iniziale
chrome.storage.local.get(['isActive', 'parameters'], (result) => {
  state = {
    isActive: result.isActive || false,
    parameters: result.parameters || []
  };
});

// Ascolta i messaggi dal popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'stateChanged') {
    state = message.state;
  } else if (message.type === 'reloadPage') {
    handleReload();
  }
});

// Gestisce il reload della pagina
async function handleReload() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (state.isActive) {
      const activeParams = state.parameters.filter(p => p.active);
      const url = new URL(tab.url);
      
      // Rimuovi tutti i parametri gestiti dall'estensione
      state.parameters.forEach(param => {
        url.searchParams.delete(param.name);
      });

      // Aggiungi solo i parametri attivi
      activeParams.forEach(param => {
        url.searchParams.set(param.name, param.value);
      });

      await chrome.tabs.update(tab.id, { url: url.toString() });
    } else {
      // Se l'estensione non è attiva, rimuovi tutti i parametri gestiti
      const url = new URL(tab.url);
      state.parameters.forEach(param => {
        url.searchParams.delete(param.name);
      });
      await chrome.tabs.update(tab.id, { url: url.toString() });
    }
  } catch (error) {
    console.error('Error handling reload:', error);
  }
}

// Gestisce la navigazione
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Ignora i frame secondari
  if (details.frameId !== 0) return;
  
  if (state.isActive) {
    const activeParams = state.parameters.filter(p => p.active);
    console.log("🚀 adk gg  ~ activeParams:", activeParams)
    if (activeParams.length > 0) {
      modifyUrl(details.url, activeParams);
    }
  }
});

// Modifica l'URL aggiungendo i parametri
async function modifyUrl(url, parameters) {
  try {
    const urlObj = new URL(url);
    let modified = false;

    parameters.forEach(param => {
      if (!urlObj.searchParams.has(param.name)) {
        urlObj.searchParams.set(param.name, param.value);
        modified = true;
      }
    });

    if (modified) {
      const tabId = (await chrome.tabs.query({ currentWindow: true, active: true }))[0].id;
      chrome.tabs.update(tabId, { url: urlObj.toString() });
    }
  } catch (error) {
    console.error('Error modifying URL:', error);
  }
}
