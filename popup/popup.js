// Stato dell'estensione
let state = {
  isActive: false,
  parameters: []
};

// Indice del parametro in modifica (null se nessuno)
let editingIndex = null;

// Elementi DOM
const extensionToggle = document.getElementById('extensionToggle');
const parametersList = document.getElementById('parametersList');
const addParamBtn = document.getElementById('addParam');
const paramNameInput = document.getElementById('paramName');
const paramValueInput = document.getElementById('paramValue');
const reloadBtn = document.getElementById('reloadBtn');
const permissionBanner = document.getElementById('permissionBanner');
const grantAccessBtn = document.getElementById('grantAccessBtn');

// Origini richieste come permesso facoltativo (vedi optional_host_permissions nel manifest)
const SITE_ORIGINS = ['http://*/*', 'https://*/*'];

// Inizializzazione
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  renderParameters();
  setupEventListeners();
  await updatePermissionBanner();
});

// Mostra il banner finché l'accesso ai siti non è stato concesso
async function updatePermissionBanner() {
  const granted = await chrome.permissions.contains({ origins: SITE_ORIGINS });
  permissionBanner.hidden = granted;
}

// La richiesta deve partire direttamente dal click (gesto dell'utente)
function requestSiteAccess() {
  chrome.permissions.request({ origins: SITE_ORIGINS })
    .then(updatePermissionBanner)
    .catch(error => console.error('Error requesting site access:', error));
}

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

    if (index === editingIndex) {
      renderEditForm(paramElement, param, index);
      parametersList.appendChild(paramElement);
      return;
    }

    // Maniglia per il riordino tramite drag and drop
    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '⋮⋮';
    handle.title = 'Trascina per riordinare';
    setupDragAndDrop(paramElement, handle, index);
    paramElement.appendChild(handle);

    // Nome e valore inseriti come testo, non come HTML
    const info = document.createElement('div');
    info.className = 'parameter-info';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'parameter-name';
    nameSpan.textContent = param.name;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'parameter-value';
    valueSpan.textContent = param.value;

    info.append(nameSpan, ' ', valueSpan);

    const controls = document.createElement('div');
    controls.className = 'parameter-controls';

    const checkboxWrapper = document.createElement('label');
    checkboxWrapper.className = 'checkbox-wrapper';

    // Event listeners per i controlli del parametro
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = param.active;
    checkbox.addEventListener('change', () => toggleParameter(index));
    checkboxWrapper.appendChild(checkbox);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => deleteParameter(index));

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '✎';
    editBtn.title = 'Modifica';
    editBtn.addEventListener('click', () => startEditing(index));

    controls.append(checkboxWrapper, editBtn, deleteBtn);
    paramElement.append(info, controls);

    parametersList.appendChild(paramElement);
  });
}

// Drag and drop: la riga è trascinabile solo partendo dalla maniglia
let draggedIndex = null;

function setupDragAndDrop(paramElement, handle, index) {
  handle.addEventListener('mousedown', () => { paramElement.draggable = true; });
  handle.addEventListener('mouseup', () => { paramElement.draggable = false; });

  paramElement.addEventListener('dragstart', (e) => {
    draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    paramElement.classList.add('dragging');
  });

  paramElement.addEventListener('dragend', () => {
    draggedIndex = null;
    paramElement.draggable = false;
    parametersList.querySelectorAll('.parameter-item').forEach(el => {
      el.classList.remove('dragging', 'drop-before', 'drop-after');
    });
  });

  paramElement.addEventListener('dragover', (e) => {
    if (draggedIndex === null) return;
    e.preventDefault();
    const before = isInUpperHalf(e, paramElement);
    paramElement.classList.toggle('drop-before', before);
    paramElement.classList.toggle('drop-after', !before);
  });

  paramElement.addEventListener('dragleave', () => {
    paramElement.classList.remove('drop-before', 'drop-after');
  });

  paramElement.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    const target = isInUpperHalf(e, paramElement) ? index : index + 1;
    moveParameter(draggedIndex, target);
  });
}

function isInUpperHalf(e, element) {
  const rect = element.getBoundingClientRect();
  return e.clientY < rect.top + rect.height / 2;
}

// Sposta un parametro nella posizione indicata (indice calcolato prima della rimozione)
async function moveParameter(from, to) {
  const insertAt = from < to ? to - 1 : to;
  if (insertAt === from) return;

  const [param] = state.parameters.splice(from, 1);
  state.parameters.splice(insertAt, 0, param);
  editingIndex = null;

  await saveState();
  renderParameters();
}

// Form di modifica in linea di un parametro esistente
function renderEditForm(paramElement, param, index) {
  paramElement.classList.add('editing');

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'edit-name';
  nameInput.value = param.name;
  nameInput.placeholder = 'Nome parametro';

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'edit-value';
  valueInput.value = param.value;
  valueInput.placeholder = 'Valore';

  const save = () => updateParameter(index, nameInput.value, valueInput.value);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'save-btn';
  saveBtn.textContent = '✓';
  saveBtn.title = 'Salva';
  saveBtn.addEventListener('click', save);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel-btn';
  cancelBtn.textContent = '↺';
  cancelBtn.title = 'Annulla';
  cancelBtn.addEventListener('click', cancelEditing);

  // Invio salva, Esc annulla
  [nameInput, valueInput].forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') cancelEditing();
    });
  });

  const controls = document.createElement('div');
  controls.className = 'parameter-controls';
  controls.append(saveBtn, cancelBtn);

  paramElement.append(nameInput, valueInput, controls);
  setTimeout(() => valueInput.focus(), 0);
}

function startEditing(index) {
  editingIndex = index;
  renderParameters();
}

function cancelEditing() {
  editingIndex = null;
  renderParameters();
}

// Aggiorna nome e valore di un parametro mantenendone lo stato attivo
async function updateParameter(index, name, value) {
  name = name.trim();
  if (!name) return;

  state.parameters[index] = { ...state.parameters[index], name, value: value.trim() };
  editingIndex = null;

  await saveState();
  renderParameters();
}

// Setup degli event listeners
function setupEventListeners() {
  extensionToggle.addEventListener('change', async () => {
    state.isActive = extensionToggle.checked;
    await saveState();
  });
  
  addParamBtn.addEventListener('click', addParameter);
  reloadBtn.addEventListener('click', reloadWebpage);
  grantAccessBtn.addEventListener('click', requestSiteAccess);
  
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
  editingIndex = null;
  await saveState();
  renderParameters();
}
