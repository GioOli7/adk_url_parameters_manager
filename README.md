# ADK URL Parameters Manager

## Panoramica Generale

ADK URL Parameters Manager è un'estensione Chrome che permette di gestire e manipolare dinamicamente i parametri URL durante la navigazione web. L'estensione offre un'interfaccia intuitiva per aggiungere, attivare/disattivare e rimuovere parametri URL in modo persistente.

### Funzionalità Principali
- Aggiunta dinamica di parametri URL
- Attivazione/disattivazione globale dell'estensione
- Gestione individuale dei parametri
- Persistenza delle configurazioni
- Modifica automatica degli URL durante la navigazione
- Compatibilità completa con la modalità incognito

### Permessi Richiesti
- `storage`: Per la persistenza delle configurazioni
- `tabs`: Per interagire con le schede
- `host_permissions` per `<all_urls>`: Per accedere al contenuto di tutte le pagine web

### Struttura del Progetto
```
├── manifest.json      # Configurazione dell'estensione
├── content.js         # Content script per la gestione degli URL
├── popup/
│   ├── popup.html     # UI dell'estensione
│   ├── popup.js       # Logica del popup
│   └── popup.css      # Stili dell'interfaccia
```

## Architettura

### Content Script (content.js)
Il content script gestisce:
- Modifica degli URL in base ai parametri configurati
- Ascolto dei cambiamenti nello storage
- Supporto per le applicazioni a pagina singola (SPA)
- Aggiunta non intrusiva dei parametri tramite history.replaceState

### Popup UI
L'interfaccia utente è composta da:
- Toggle globale per l'attivazione/disattivazione
- Lista dei parametri configurati
- Form per l'aggiunta di nuovi parametri
- Controlli per la gestione dei parametri esistenti

### Sistema di Gestione dello Stato
Lo stato dell'estensione è strutturato come:
```javascript
{
  isActive: boolean,    // Stato globale di attivazione
  parameters: [         // Array dei parametri configurati
    {
      name: string,     // Nome del parametro
      value: string,    // Valore del parametro
      active: boolean   // Stato di attivazione del singolo parametro
    }
  ]
}
```

### Comunicazione tra Componenti
- Il popup gestisce direttamente le modifiche dello stato tramite chrome.storage.local
- Il content script reagisce ai cambiamenti nello storage tramite chrome.storage.onChanged
- Entrambi i componenti operano in modo indipendente ma sincronizzato tramite lo storage condiviso

## Funzionalità Core

### Gestione dei Parametri URL
```javascript
function checkAndModifyUrl() {
  chrome.storage.local.get(['isActive', 'parameters'], (result) => {
    if (!result.isActive) return;
    
    const activeParams = (result.parameters || []).filter(p => p.active);
    if (activeParams.length === 0) return;
    
    const url = new URL(window.location.href);
    let modified = false;
    
    activeParams.forEach(param => {
      if (!url.searchParams.has(param.name)) {
        url.searchParams.set(param.name, param.value);
        modified = true;
      }
    });
    
    if (modified) {
      window.history.replaceState({}, document.title, url.toString());
    }
  });
}
```

### Persistenza dei Dati
- Utilizzo di `chrome.storage.local` per la persistenza
- Sincronizzazione automatica tra componenti tramite `chrome.storage.onChanged`
- Caricamento dello stato all'avvio dell'estensione

### Sistema di Attivazione/Disattivazione
- Toggle globale per l'intera estensione
- Toggle individuali per ogni parametro
- Persistenza dello stato di attivazione

### Gestione della Navigazione
- Monitoraggio dei cambiamenti di URL
- Supporto nativo per le applicazioni a pagina singola (SPA)
- Applicazione automatica dei parametri attivi
- Gestione degli errori e casi edge

## Interfaccia Utente

### Componenti UI
- Header con titolo e toggle principale
- Lista scrollabile dei parametri
- Form di input per nuovi parametri
- Pulsanti di controllo e azioni

### Stili e Tema
- Design moderno e minimalista
- Feedback visivo per le azioni
- Palette colori professionale
- Layout responsive

### Interazioni Utente
- Aggiunta parametri tramite form
- Gestione parametri esistenti
- Toggle di attivazione
- Eliminazione parametri

## Guida Tecnica

### Setup e Installazione
1. Clona il repository
2. Apri Chrome e vai a `chrome://extensions/`
3. Attiva la "Modalità sviluppatore"
4. Clicca "Carica estensione non pacchettizzata"
5. Seleziona la directory del progetto

### API Chrome Utilizzate
- `chrome.storage.local`
- `chrome.storage.onChanged`
- `chrome.tabs`
- `window.history.replaceState`

### Gestione dello Storage
```javascript
// Salvataggio dello stato
async function saveState() {
  await chrome.storage.local.set({
    isActive: state.isActive,
    parameters: state.parameters
  });
}

// Caricamento dello stato
async function loadState() {
  const result = await chrome.storage.local.get(['isActive', 'parameters']);
  return {
    isActive: result.isActive || false,
    parameters: result.parameters || []
  };
}
```

## Compatibilità con Modalità Incognito

L'estensione è stata progettata per funzionare in modo affidabile sia in modalità normale che in modalità incognito:

- Utilizzo di content script invece di background script
- Accesso minimo alle API sensibili
- Gestione robusta degli errori
- Supporto per `"incognito": "spanning"` nel manifest

## Best Practices & Pattern

### Gestione degli Errori
- Validazione degli input
- Gestione dei casi edge
- Logging degli errori
- Feedback utente appropriato

### Pattern di Reattività
- Ascolto dei cambiamenti nello storage
- Reazione automatica alle modifiche dello stato
- Modifica non intrusiva dell'URL tramite l'API History

### Convenzioni di Codice
- Funzioni asincrone per operazioni I/O
- Separazione della logica UI dalla business logic
- Gestione centralizzata dello stato
- Naming consistente e descrittivo
