// Controlla e modifica l'URL se necessario
function checkAndModifyUrl() {
  chrome.storage.local.get(['isActive', 'parameters'], (result) => {
    if (!result.isActive) return;
    
    const activeParams = (result.parameters || []).filter(p => p.active);
    if (activeParams.length === 0) return;
    
    const url = new URL(window.location.href);
    let modified = false;
    
    // Aggiungi i parametri solo se non sono già presenti
    activeParams.forEach(param => {
      if (!url.searchParams.has(param.name)) {
        url.searchParams.set(param.name, param.value);
        modified = true;
      }
    });
    
    // Reindirizza solo se l'URL è stato modificato
    if (modified) {
      // Usa history.replaceState per una navigazione più delicata
      window.history.replaceState({}, document.title, url.toString());
      
      // Se abbiamo bisogno che la pagina si ricarichi davvero con i nuovi parametri
      // possiamo usare un vero redirect, ma solo in casi specifici
      // window.location.href = url.toString();
    }
  });
}

// Ascolta i cambiamenti nello storage per applicare le modifiche in tempo reale
chrome.storage.onChanged.addListener((changes) => {
  // Riapplica i parametri quando lo stato dell'estensione o i parametri cambiano
  if (changes.isActive || changes.parameters) {
    checkAndModifyUrl();
  }
});

// Esegui all'inizio e dopo il caricamento completo della pagina
checkAndModifyUrl();
window.addEventListener('load', checkAndModifyUrl);

// Aggiungi un listener di eventi per la navigazione interna a singola pagina
// Questo permette di gestire le app SPA che cambiano URL senza ricaricare la pagina
let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    checkAndModifyUrl();
  }
}).observe(document, {subtree: true, childList: true});
