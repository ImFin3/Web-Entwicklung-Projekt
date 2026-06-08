const users = {
  admin: "adminp",
  marian: "marianp",
  lenny: "lennyp",
  jakob: "jakobp",
  jean: "jeanp"
};

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

function logout() {
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

function checkLogin() {
  const user = localStorage.getItem("user");
  if (!user) {
    window.location.href = "../index.html";
  }
}

function getTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || {};
}

function saveTasks(data) {
  localStorage.setItem("tasks", JSON.stringify(data));
}

function canEdit(owner) {
  const user = localStorage.getItem("user");
  return user === owner || user === "admin";
}

function updateProgressValue() {
  const slider = document.getElementById("taskProgress");
  const output = document.getElementById("progressValue");

  if (slider && output) {
    output.innerText = slider.value + "%";
  }
}


function updateEditProgressValue() {
  const slider = document.getElementById("editTaskProgress");
  const output = document.getElementById("editProgressValue");

  if (slider && output) {
    output.innerText = slider.value + "%";
  }
}

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

  const editSlider = document.getElementById("editTaskProgress");
  if (editSlider) {
    editSlider.addEventListener("input", updateEditProgressValue);
  }

  const cancelBtn = document.getElementById("editCancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeEditModal);
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeEditModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEditModal();
  });

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


    saveTasks(tasks);
    closeEditModal();
    renderTasks(owner);
  });
}

function openEditModal(owner, index) {
  ensureEditModalExists();

  const overlay = document.getElementById("modalOverlay");
  const form = document.getElementById("editForm");
  const inputText = document.getElementById("editTaskText");
  const inputProgress = document.getElementById("editTaskProgress");

  let tasks = getTasks();
  const task = tasks[owner]?.[index];
  if (!task) return;

  form.dataset.owner = owner;
  form.dataset.index = String(index);

  inputText.value = task.text;
  inputProgress.value = task.progress;
  updateEditProgressValue();

  overlay.classList.remove("hidden");
  document.body.classList.add("modal-open");

  inputText.focus();
  inputText.select();
}

function closeEditModal() {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;

  overlay.classList.add("hidden");
  document.body.classList.remove("modal-open");
}


function addTask(owner) {
  if (!canEdit(owner)) return;

  const taskInput = document.getElementById("taskText");
  const progressInput = document.getElementById("taskProgress");

  const text = taskInput.value.trim();
  const progress = Number(progressInput.value);

  if (text === "") {
    alert("Bitte benenne die Aufgabe.");
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

function toggleTask(owner, index) {
  if (!canEdit(owner)) return;

  let tasks = getTasks();

  tasks[owner][index].done = !tasks[owner][index].done;

  if (tasks[owner][index].done) {
    tasks[owner][index].progress = 100;
  }

  saveTasks(tasks);
  renderTasks(owner);
}

function deleteTask(owner, index) {
  if (!canEdit(owner)) return;

  let tasks = getTasks();

  tasks[owner].splice(index, 1);

  saveTasks(tasks);
  renderTasks(owner);
}

function renderTasks(owner) {
  const openContainer = document.getElementById("openTasks");
  const doneContainer = document.getElementById("doneTasks");

  if (!openContainer || !doneContainer) return;

  openContainer.innerHTML = "";
  doneContainer.innerHTML = "";

  const editable = canEdit(owner);

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

    const actions = editable
      ? `
        <button onclick="toggleTask('${owner}', ${index})">
          ${task.done ? "Wieder öffnen" : "Erledigt"}
        </button>
        <button onclick="editTask('${owner}', ${index})">Bearbeiten</button>
        <button onclick="deleteTask('${owner}', ${index})">Löschen</button>
      `
      : "";

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

function editTask(owner, index) {
  if (!canEdit(owner)) return;
  openEditModal(owner, index);
}

function getAverageProgress(owner) {
  const list = getTasks()[owner] || [];
  if (list.length === 0) return 0;

  const sum = list.reduce((acc, t) => acc + Number(t.progress || 0), 0);
  return Math.round(sum / list.length);
}

function updateDashboardCard(cardId, owner) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const avg = getAverageProgress(owner);

  const progressSpan = card.querySelector(".dash-progress");
  const barFill = card.querySelector(".dash-bar-fill");

  if (progressSpan) progressSpan.innerText = avg + "%";
  if (barFill) card.style.setProperty("--p", avg + "%");

  const hue = Math.round((avg / 100) * 120);
  card.style.setProperty("--hue", String(hue));
}

function initDashboard() {
  updateDashboardCard("card-marian", "marian");
  updateDashboardCard("card-lenny", "lenny");
  updateDashboardCard("card-jakob", "jakob");
  updateDashboardCard("card-jean", "jean");
}

function initDarkMode() {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

initDarkMode();