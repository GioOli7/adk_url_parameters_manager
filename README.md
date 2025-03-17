# ADK URL Parameters Manager

## Panoramica Generale

ADK URL Parameters Manager è un'estensione Chrome che permette di gestire e manipolare dinamicamente i parametri URL durante la navigazione web. L'estensione offre un'interfaccia intuitiva per aggiungere, attivare/disattivare e rimuovere parametri URL in modo persistente.

### Funzionalità Principali
- Aggiunta dinamica di parametri URL
- Attivazione/disattivazione globale dell'estensione
- Gestione individuale dei parametri
- Persistenza delle configurazioni
- Modifica automatica degli URL durante la navigazione

### Permessi Richiesti
- `storage`: Per la persistenza delle configurazioni
- `webNavigation`: Per intercettare e modificare la navigazione
- `activeTab`: Per interagire con il tab attivo

### Struttura del Progetto
```
├── manifest.json       # Configurazione dell'estensione
├── background.js      # Service worker background
├── popup/
│   ├── popup.html    # UI dell'estensione
│   ├── popup.js      # Logica del popup
│   └── popup.css     # Stili dell'interfaccia
```

## Architettura

### Service Worker (background.js)
Il service worker gestisce:
- Mantenimento dello stato globale dell'estensione
- Intercettazione della navigazione web
- Modifica degli URL in base ai parametri configurati
- Comunicazione con il popup

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
- Il popup comunica con il background script tramite `chrome.runtime.sendMessage`
- Il background script mantiene lo stato aggiornato e gestisce la logica di modifica URL
- Lo stato viene sincronizzato tra popup e background script ad ogni modifica

## Funzionalità Core

### Gestione dei Parametri URL
```javascript
async function modifyUrl(url, parameters) {
  const urlObj = new URL(url);
  parameters.forEach(param => {
    if (!urlObj.searchParams.has(param.name)) {
      urlObj.searchParams.set(param.name, param.value);
    }
  });
  return urlObj.toString();
}
```

### Persistenza dei Dati
- Utilizzo di `chrome.storage.local` per la persistenza
- Sincronizzazione automatica tra componenti
- Caricamento dello stato all'avvio dell'estensione

### Sistema di Attivazione/Disattivazione
- Toggle globale per l'intera estensione
- Toggle individuali per ogni parametro
- Persistenza dello stato di attivazione

### Gestione della Navigazione
- Intercettazione degli eventi di navigazione
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
- `chrome.webNavigation`
- `chrome.tabs`
- `chrome.runtime`

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

## Best Practices & Pattern

### Gestione degli Errori
- Validazione degli input
- Gestione dei casi edge
- Logging degli errori
- Feedback utente appropriato

### Pattern di Comunicazione
- Utilizzo di eventi per la comunicazione asincrona
- Sincronizzazione dello stato tra componenti
- Pattern pub/sub per gli aggiornamenti

### Convenzioni di Codice
- Funzioni asincrone per operazioni I/O
- Separazione della logica UI dalla business logic
- Gestione centralizzata dello stato
- Naming consistente e descrittivo

## Sviluppi Futuri
- Importazione/esportazione delle configurazioni
- Gruppi di parametri
- Template predefiniti
- Supporto per regex nei valori dei parametri
