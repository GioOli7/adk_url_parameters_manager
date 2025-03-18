// Stato dell'estensione
let state = {
  isActive: false,
  parameters: []
};

// Elementi DOM
const extensionToggle = document.getElementById('extensionToggle');
const parametersList = document.getElementById('parametersList');
const addParamBtn = document.getElementById('addParam');
const paramNameInput = document.getElementById('paramName');
const paramValueInput = document.getElementById('paramValue');
const reloadBtn = document.getElementById('reloadBtn');

// Inizializzazione
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  renderParameters();
  setupEventListeners();
});

// Carica lo stato salvato
async function loadState() {
  const result = await chrome.storage.local.get(['isActive', 'parameters']);
  state.isActive = result.isActive || false;
  state.parameters = result.parameters || [];
  extensionToggle.checked = state.isActive;
}

// Salva lo stato corrente
async function saveState() {
  await chrome.storage.local.set({
    isActive: state.isActive,
    parameters: state.parameters
  });
}

// Rendering dei parametri
function renderParameters() {
  parametersList.innerHTML = '';
  
  state.parameters.forEach((param, index) => {
    const paramElement = document.createElement('div');
    paramElement.className = 'parameter-item';
    
    paramElement.innerHTML = `
      <div class="parameter-info">
        <span class="parameter-name">${param.name}</span>
        <span class="parameter-value">${param.value}</span>
      </div>
      <div class="parameter-controls">
        <label class="checkbox-wrapper">
          <input type="checkbox" ${param.active ? 'checked' : ''}>
        </label>
        <button class="delete-btn">×</button>
      </div>
    `;
    
    // Event listeners per i controlli del parametro
    const checkbox = paramElement.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => toggleParameter(index));
    
    const deleteBtn = paramElement.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteParameter(index));
    
    parametersList.appendChild(paramElement);
  });
}

// Setup degli event listeners
function setupEventListeners() {
  extensionToggle.addEventListener('change', async () => {
    state.isActive = extensionToggle.checked;
    await saveState();
  });
  
  addParamBtn.addEventListener('click', addParameter);
  reloadBtn.addEventListener('click', reloadWebpage);
  
  // Gestione tasto Invio nei campi di input
  paramValueInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addParameter();
    }
  });
}

// Aggiunge un nuovo parametro
async function addParameter() {
  const name = paramNameInput.value.trim();
  const value = paramValueInput.value.trim();
  
  if (!name) return;
  
  state.parameters.push({
    name,
    value,
    active: true
  });
  
  paramNameInput.value = '';
  paramValueInput.value = '';
  
  await saveState();
  renderParameters();
}

// Ricarica la pagina con i parametri attivi
async function reloadWebpage() {
  try {
    await saveState();
    
    // Ottieni la scheda corrente
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) return;
    
    const tab = tabs[0];
    let url;
    
    try {
      url = new URL(tab.url);
    } catch (e) {
      console.error('Invalid URL:', tab.url);
      return;
    }

    if (state.isActive) {
      const activeParams = state.parameters.filter(p => p.active);
      
      // Rimuovi tutti i parametri gestiti dall'estensione
      state.parameters.forEach(param => {
        url.searchParams.delete(param.name);
      });

      // Aggiungi solo i parametri attivi
      activeParams.forEach(param => {
        url.searchParams.set(param.name, param.value);
      });
    } else {
      // Se l'estensione non è attiva, rimuovi tutti i parametri gestiti
      state.parameters.forEach(param => {
        url.searchParams.delete(param.name);
      });
    }

    // Aggiorna l'URL della scheda
    await chrome.tabs.update(tab.id, { url: url.toString() });
  } catch (error) {
    console.error('Error reloading page:', error);
  }
}

// Toggle dello stato attivo di un parametro
async function toggleParameter(index) {
  state.parameters[index].active = !state.parameters[index].active;
  await saveState();
  renderParameters();
}

// Elimina un parametro
async function deleteParameter(index) {
  state.parameters.splice(index, 1);
  await saveState();
  renderParameters();
}
