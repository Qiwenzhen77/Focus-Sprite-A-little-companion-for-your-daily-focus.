
const STORAGE_KEY = "focusSpriteData";
const TUTORIAL_KEY = "focusSpriteTutorialDone";

// Load saved data
function loadSavedData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const data = JSON.parse(raw);

      return {
        tasks: Array.isArray(data.tasks) ? data.tasks : [],
        stars:
          Number.isFinite(data.stars) && data.stars >= 0
            ? data.stars
            : 0
      };
    }
  } catch (error) {
    console.error("Could not load saved data:", error);
  }

  return { tasks: [], stars: 0 };
}

const savedData = loadSavedData();

let tasks = savedData.tasks;
let stars = savedData.stars;
let spriteState = "idle";
let dockPinnedOpen = false;
let closeTimer = null;
let toastTimer = null;
let tutorialStep = 0;

const sprite = document.getElementById("sprite");
const taskbar = document.getElementById("taskbar");
const closeDock = document.getElementById("closeDock");
const taskSummary = document.getElementById("taskSummary");
const taskList = document.getElementById("taskList");
const addTaskButton = document.getElementById("addTask");
const starCount = document.getElementById("starCount");

const plannerOverlay = document.getElementById("plannerOverlay");
const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");
const taskTimeInput = document.getElementById("taskTime");
const taskDurationInput = document.getElementById("taskDuration");
const cancelPlannerButton = document.getElementById("cancelPlanner");
const formError = document.getElementById("formError");

const openPlannerButton = document.getElementById("openPlanner");
const welcome = document.getElementById("welcome");
const toast = document.getElementById("toast");
const clock = document.getElementById("clock");

const tutorialBubble = document.getElementById("tutorialBubble");
const tutorialText = document.getElementById("tutorialText");
const tutorialNext = document.getElementById("tutorialNext");

// Save tasks and stars
function saveData() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tasks, stars })
    );
  } catch (error) {
    console.error("Could not save data:", error);
    showToast("Unable to save your progress.");
  }
}

// Tutorial completion state
function isTutorialDone() {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "yes";
  } catch (error) {
    return true;
  }
}

function finishTutorial() {
  try {
    localStorage.setItem(TUTORIAL_KEY, "yes");
  } catch (error) {
    console.error("Could not save tutorial state:", error);
  }

  tutorialBubble.classList.add("hidden");
  tutorialStep = 0;
}

function showTutorialStep(step) {
  tutorialStep = step;
  tutorialBubble.classList.remove("hidden");

  if (step === 0) {
    tutorialText.textContent =
      "Hi! I'm your little focus buddy. Let's make space for one small goal.";

    tutorialNext.textContent = "Let's get started";
  } else if (step === 1) {
    tutorialText.textContent =
      "Whenever you need a hand, move your mouse over me. I'll come over to help!";

    tutorialNext.textContent = "Sounds good";
  } else if (step === 2) {
    tutorialText.textContent =
      "Ready? Let's plan your first little goal. You can start small.";

    tutorialNext.textContent = "Create my first task";
  }
}

function startTutorialIfNeeded() {
  if (isTutorialDone() || tasks.length > 0) {
    finishTutorial();
    return;
  }

  showTutorialStep(0);
}

function positionTutorialBubble() {
  if (!sprite || !tutorialBubble) return;
  if (tutorialBubble.classList.contains("hidden")) return;
  requestAnimationFrame(positionTutorialBubble);

  const rect = sprite.getBoundingClientRect();
  const bubbleWidth = Math.min(280, window.innerWidth - 40);
  const gap = 24;

  // Place the bubble to the left of the sprite when possible.
  let left = rect.left - bubbleWidth - gap;

  // If there is not enough space, place it to the right.
  if (left < 20) {
    left = rect.right + gap;
  }

  // Keep the bubble inside the viewport.
  left = Math.max(
    20,
    Math.min(left, window.innerWidth - bubbleWidth - 20)
  );

  // Align the bubble around the sprite's vertical center.
  const bubbleHeight = tutorialBubble.offsetHeight || 150;
  let top = rect.top + rect.height / 2 - bubbleHeight / 2;

  top = Math.max(
    20,
    Math.min(top, window.innerHeight - bubbleHeight - 20)
  );

  tutorialBubble.style.left = `${left}px`;
  tutorialBubble.style.top = `${top}px`;
  tutorialBubble.style.right = "auto";
}


tutorialNext.addEventListener("click", () => {
  if (tutorialStep < 2) {
    showTutorialStep(tutorialStep + 1);
    return;
  }

  finishTutorial();
  openPlanner();
});

function moveSpriteToDock() {
  clearTimeout(closeTimer);

  spriteState = "dock";
  sprite.classList.add("moving");
  sprite.classList.remove("celebrating");

  document.body.classList.add("sprite-hover");

  sprite.style.left = "auto";
  sprite.style.right = "7%";
  sprite.style.top = "calc(100% - 300px)";

  taskbar.classList.add("open");
  positionTutorialBubble();
}

function moveSpriteToIdle() {
  spriteState = "idle";
  sprite.classList.remove("moving");

  document.body.classList.remove("sprite-hover");

  sprite.style.left = "auto";
  sprite.style.right = "7%";
  sprite.style.top = "42%";

  positionTutorialBubble();
}

function scheduleDockClose() {
  if (dockPinnedOpen) return;

  clearTimeout(closeTimer);

  closeTimer = setTimeout(() => {
    taskbar.classList.remove("open");

    if (spriteState !== "celebrating") {
      moveSpriteToIdle();
    }
  }, 800);
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function openPlanner() {
  plannerOverlay.classList.add("open");
  formError.textContent = "";

  setTimeout(() => taskTitleInput.focus(), 100);
}

function closePlanner() {
  plannerOverlay.classList.remove("open");
  taskForm.reset();
  formError.textContent = "";
}

openPlannerButton.addEventListener("click", openPlanner);
addTaskButton.addEventListener("click", openPlanner);
cancelPlannerButton.addEventListener("click", closePlanner);

plannerOverlay.addEventListener("click", (event) => {
  if (event.target === plannerOverlay) {
    closePlanner();
  }
});

// Sprite interaction
sprite.addEventListener("mouseenter", moveSpriteToDock);
sprite.addEventListener("focus", moveSpriteToDock);

sprite.addEventListener("mouseleave", scheduleDockClose);

sprite.addEventListener("click", () => {
  dockPinnedOpen = !dockPinnedOpen;

  if (dockPinnedOpen) {
    moveSpriteToDock();
  } else {
    scheduleDockClose();
  }
});

sprite.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    moveSpriteToDock();
  }

  if (event.key === "Escape") {
    dockPinnedOpen = false;
    taskbar.classList.remove("open");
    moveSpriteToIdle();
    sprite.blur();
  }
});

// Taskbar interaction
taskbar.addEventListener("mouseenter", () => {
  clearTimeout(closeTimer);
});

taskbar.addEventListener("mouseleave", scheduleDockClose);

closeDock.addEventListener("click", () => {
  dockPinnedOpen = false;
  taskbar.classList.remove("open");
  moveSpriteToIdle();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (plannerOverlay.classList.contains("open")) {
      closePlanner();
    }

    dockPinnedOpen = false;
    taskbar.classList.remove("open");

    if (spriteState !== "celebrating") {
      moveSpriteToIdle();
    }
  }
});

// Create a task
function createTask(title, time, duration) {
  tasks.push({
    id: createId(),
    title,
    time,
    duration: Number(duration),
    completed: false
  });

  tasks.sort((a, b) => a.time.localeCompare(b.time));

  saveData();
  renderTasks();

  welcome.classList.add("hidden");
  closePlanner();

  dockPinnedOpen = true;
  moveSpriteToDock();

  showToast("A new little goal has been added!");
}

function createId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskTitleInput.value.trim();
  const time = taskTimeInput.value;
  const duration = Number(taskDurationInput.value);

  if (!title) {
    formError.textContent = "Give your task a name first.";
    return;
  }

  if (!time) {
    formError.textContent = "Choose a time for your task.";
    return;
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    formError.textContent = "Choose a valid duration.";
    return;
  }

  createTask(title, time, duration);
});

// Render task list
function renderTasks() {
  taskList.innerHTML = "";

  const remaining = tasks.filter(
    (task) => !task.completed
  ).length;

  taskSummary.textContent =
    remaining === 1
      ? "1 little goal waiting for you"
      : `${remaining} little goals waiting for you`;

  starCount.textContent = stars;

  if (tasks.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent =
      "Your journey starts with one little goal.";

    taskList.appendChild(emptyMessage);
    return;
  }

  tasks.forEach((task) => {
    const row = document.createElement("div");
    row.className = "task-row";

    if (task.completed) {
      row.classList.add("completed");
    }

    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;

    const details = document.createElement("div");
    details.className = "task-details";
    details.textContent = `${task.time} · ${task.duration} min`;

    info.append(title, details);

    const button = document.createElement("button");
    button.className = "complete-button";
    button.type = "button";
    button.textContent = task.completed
      ? "Completed ✦"
      : "Complete";

    button.disabled = task.completed;

    button.addEventListener("click", () => {
      completeTask(task.id);
    });

    row.append(info, button);
    taskList.appendChild(row);
  });
}

// Complete a task and earn one star
function completeTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task || task.completed) return;

  task.completed = true;
  stars += 1;

  saveData();
  renderTasks();

  sprite.classList.add("celebrating");
  showToast("Goal complete! You earned a star ✦");

  setTimeout(() => {
    sprite.classList.remove("celebrating");
  }, 1200);
}

function updateClock() {
  clock.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Initialize
renderTasks();
updateClock();
setInterval(updateClock, 30000);
moveSpriteToIdle();
startTutorialIfNeeded();
