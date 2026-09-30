// Siti su cui l'estensione non deve mai aggiungere parametri (vale anche per i sottodomini)
const EXCLUDED_HOSTS = [
  'zucchetti.com' // portale HR (es. popup acnbps.zucchetti.com/.../ushp_bexecdoc)
];

const isExcluded = EXCLUDED_HOSTS.some(host =>
  location.hostname === host || location.hostname.endsWith('.' + host)
);

// Configurazione tenuta in memoria, così i parametri si riapplicano senza attendere lo storage
let config = { isActive: false, parameters: [] };

function activeParams() {
  return config.isActive ? config.parameters.filter(p => p.active) : [];
}

// Allinea l'URL alla configurazione: toglie i parametri appena disattivati e imposta quelli attivi
function applyParams(removedNames = []) {
  const url = new URL(location.href);

  removedNames.forEach(name => url.searchParams.delete(name));

  activeParams().forEach(param => {
    if (url.searchParams.get(param.name) !== param.value) {
      url.searchParams.set(param.name, param.value);
    }
  });

  if (url.href !== location.href) {
    // Conserva history.state: i router SPA (es. Next.js) ci salvano i propri dati
    history.replaceState(history.state, '', url.href);
  }
}

if (!isExcluded) {
  chrome.storage.local.get(['isActive', 'parameters'], (result) => {
    config = { isActive: !!result.isActive, parameters: result.parameters || [] };
    applyParams();
  });

  // Riapplica i parametri quando cambia la configurazione, togliendo quelli spenti
  chrome.storage.onChanged.addListener((changes) => {
    if (!changes.isActive && !changes.parameters) return;

    const before = activeParams().map(p => p.name);
    if (changes.isActive) config.isActive = !!changes.isActive.newValue;
    if (changes.parameters) config.parameters = changes.parameters.newValue || [];
    const after = new Set(activeParams().map(p => p.name));

    applyParams(before.filter(name => !after.has(name)));
  });

  // Navigazione interna delle SPA: la Navigation API notifica il cambio di URL nel momento stesso del pushState
  if (window.navigation) {
    navigation.addEventListener('currententrychange', () => applyParams());
  } else {
    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        applyParams();
        lastUrl = location.href;
      }
    }).observe(document, { subtree: true, childList: true });
  }
}
