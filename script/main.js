// ---------------------------
// LOGIN DATEN
// ---------------------------
const users = {
  admin: "adminp",
  marian: "marianp",
  lenny: "lennyp",
  jakob: "jakobp",
  jean: "jeanp"
};

// ---------------------------
// LOGIN
// ---------------------------
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const user = document.getElementById("username").value.trim().toLowerCase();
    const pass = document.getElementById("password").value.trim();

    if (users[user] && users[user] === pass) {
      localStorage.setItem("user", user);
      window.location.href = "sites/dashboard.html";
    } else {
      document.getElementById("error").innerText = "Falsche Login-Daten!";
    }
  });
}

// ---------------------------
// LOGOUT
// ---------------------------
function logout() {
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

// ---------------------------
// LOGIN PRÜFEN
// ---------------------------
function checkLogin() {
  const user = localStorage.getItem("user");
  if (!user) {
    window.location.href = "../index.html";
  }
}

// ---------------------------
// TASKS LADEN / SPEICHERN
// ---------------------------
function getTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || {};
}

function saveTasks(data) {
  localStorage.setItem("tasks", JSON.stringify(data));
}

// ---------------------------
// RECHTE PRÜFEN
// ---------------------------
function canEdit(owner) {
  const user = localStorage.getItem("user");
  return user === owner || user === "admin";
}

// ---------------------------
// SLIDER TEXT AKTUALISIEREN
// ---------------------------
function updateProgressValue() {
  const slider = document.getElementById("taskProgress");
  const output = document.getElementById("progressValue");

  if (slider && output) {
    output.innerText = slider.value + "%";
  }
}


// ---------------------------
// EDIT-MODAL: Progress-Anzeige aktualisieren
// ---------------------------
function updateEditProgressValue() {
  const slider = document.getElementById("editTaskProgress");
  const output = document.getElementById("editProgressValue");

  if (slider && output) {
    output.innerText = slider.value + "%";
  }
}

// ---------------------------
// EDIT-MODAL: einmalig ins DOM einfügen
// ---------------------------
function ensureEditModalExists() {
  if (document.getElementById("modalOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "modalOverlay";
  overlay.className = "modal-overlay hidden";

  overlay.innerHTML = `
    <div class="card modal-card">
      <h2>Aufgabe bearbeiten</h2>

      <form id="editForm">
        <input id="editTaskText" type="text" placeholder="Aufgabe" required>

        <label for="editTaskProgress">
          Fortschritt: <span id="editProgressValue">0%</span>
        </label>
        <input
          id="editTaskProgress"
          type="range"
          min="0"
          max="100"
          value="0"
        >

        <div class="modal-actions">
          <button type="button" id="editCancel">Abbrechen</button>
          <button type="submit">Speichern</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // Slider live aktualisieren
  const editSlider = document.getElementById("editTaskProgress");
  if (editSlider) {
    editSlider.addEventListener("input", updateEditProgressValue);
  }

  // Abbrechen-Button
  const cancelBtn = document.getElementById("editCancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeEditModal);
  }

  // Klick auf grauen Hintergrund schließt (aber nicht Klick in die Card)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeEditModal();
  });

  // ESC schließt
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEditModal();
  });

  // Submit-Handler
  const form = document.getElementById("editForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const owner = form.dataset.owner;
    const index = Number(form.dataset.index);

    if (!canEdit(owner)) return;

    const text = document.getElementById("editTaskText").value.trim();
    const progress = Number(document.getElementById("editTaskProgress").value);

    if (text === "") {
      alert("Text darf nicht leer sein.");
      return;
    }

    let tasks = getTasks();
    if (!tasks[owner] || !tasks[owner][index]) return;

    tasks[owner][index].text = text;
    tasks[owner][index].progress = progress;

    // optional: wenn done true ist, willst du progress ggf. auf 100 lassen
    // oder umgekehrt: wenn progress < 100, done auf false setzen
    // -> aktuell lassen wir done unverändert.

    saveTasks(tasks);
    closeEditModal();
    renderTasks(owner);
  });
}

// ---------------------------
// EDIT-MODAL öffnen/schließen
// ---------------------------
function openEditModal(owner, index) {
  ensureEditModalExists();

  const overlay = document.getElementById("modalOverlay");
  const form = document.getElementById("editForm");
  const inputText = document.getElementById("editTaskText");
  const inputProgress = document.getElementById("editTaskProgress");

  let tasks = getTasks();
  const task = tasks[owner]?.[index];
  if (!task) return;

  // Daten merken, damit submit weiß, was bearbeitet wird
  form.dataset.owner = owner;
  form.dataset.index = String(index);

  // Werte vorbefüllen
  inputText.value = task.text;
  inputProgress.value = task.progress;
  updateEditProgressValue();

  // anzeigen
  overlay.classList.remove("hidden");
  document.body.classList.add("modal-open");

  // Fokus auf Textfeld
  inputText.focus();
  inputText.select();
}

function closeEditModal() {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;

  overlay.classList.add("hidden");
  document.body.classList.remove("modal-open");
}


// ---------------------------
// TASK HINZUFÜGEN
// ---------------------------
function addTask(owner) {
  if (!canEdit(owner)) return;

  const taskInput = document.getElementById("taskText");
  const progressInput = document.getElementById("taskProgress");

  const text = taskInput.value.trim();
  const progress = Number(progressInput.value);

  if (text === "") {
    alert("Bitte gib eine Aufgabe ein.");
    return;
  }

  let tasks = getTasks();

  if (!tasks[owner]) {
    tasks[owner] = [];
  }

  tasks[owner].push({
    text: text,
    progress: progress,
    done: false
  });

  saveTasks(tasks);

  taskInput.value = "";
  progressInput.value = 0;
  updateProgressValue();

  renderTasks(owner);
}

// ---------------------------
// TASK ALS FERTIG / OFFEN MARKIEREN
// ---------------------------
function toggleTask(owner, index) {
  if (!canEdit(owner)) return;

  let tasks = getTasks();

  tasks[owner][index].done = !tasks[owner][index].done;

  // Wenn Aufgabe erledigt ist, setze Fortschritt auf 100%
  if (tasks[owner][index].done) {
    tasks[owner][index].progress = 100;
  }

  saveTasks(tasks);
  renderTasks(owner);
}

// ---------------------------
// TASK LÖSCHEN
// ---------------------------
function deleteTask(owner, index) {
  if (!canEdit(owner)) return;

  let tasks = getTasks();

  tasks[owner].splice(index, 1);

  saveTasks(tasks);
  renderTasks(owner);
}

// ---------------------------
// TASKS ANZEIGEN
// ---------------------------
function renderTasks(owner) {
  const openContainer = document.getElementById("openTasks");
  const doneContainer = document.getElementById("doneTasks");

  if (!openContainer || !doneContainer) return;

  openContainer.innerHTML = "";
  doneContainer.innerHTML = "";

  const editable = canEdit(owner); // <- NEU: einmal berechnen

  let tasks = getTasks()[owner] || [];

  if (tasks.length === 0) {
    openContainer.innerHTML = "<p>Keine offenen Aufgaben.</p>";
    doneContainer.innerHTML = "<p>Keine erledigten Aufgaben.</p>";
    return;
  }

  let hasOpenTasks = false;
  let hasDoneTasks = false;

  tasks.forEach((task, index) => {
    const taskDiv = document.createElement("div");
    taskDiv.className = "task";

    // Buttons nur wenn owner/admin:
    const actions = editable
      ? `
        <button onclick="toggleTask('${owner}', ${index})">
          ${task.done ? "Wieder öffnen" : "Erledigt"}
        </button>
        <button onclick="editTask('${owner}', ${index})">Bearbeiten</button>
        <button onclick="deleteTask('${owner}', ${index})">Löschen</button>
      `
      : ""; // <- Nicht-Besitzer: keine Aktionen

    taskDiv.innerHTML = `
      <p><strong>Aufgabe:</strong> ${task.text}</p>
      <p><strong>Fortschritt:</strong> ${task.progress}%</p>
      ${actions}
    `;

    if (task.done) {
      doneContainer.appendChild(taskDiv);
      hasDoneTasks = true;
    } else {
      openContainer.appendChild(taskDiv);
      hasOpenTasks = true;
    }
  });

  if (!hasOpenTasks) openContainer.innerHTML = "<p>Keine offenen Aufgaben.</p>";
  if (!hasDoneTasks) doneContainer.innerHTML = "<p>Keine erledigten Aufgaben.</p>";
}

// ---------------------------
// TASK BEARBEITEN (öffnet Modal)
// ---------------------------
function editTask(owner, index) {
  if (!canEdit(owner)) return;   // Rechtecheck
  openEditModal(owner, index);   // Modal öffnen statt prompt
}
