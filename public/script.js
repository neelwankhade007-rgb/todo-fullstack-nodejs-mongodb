const API = "http://localhost:3000/tasks";

async function loadTasks() {
    const list = document.getElementById("taskList");
    try {
        const res = await fetch(API);
        if (!res.ok) throw new Error("Failed to load tasks");
        const tasks = await res.json();
        list.innerHTML = "";

        tasks.forEach((task) => {
            const li = document.createElement("li");
            li.dataset.id = task._id;
            if (task.completed) li.classList.add("task-completed");

            const content = document.createElement("div");
            content.className = "task-content";

            const titleEl = document.createElement("span");
            titleEl.className = "task-title";
            titleEl.textContent = task.title || "";

            content.appendChild(titleEl);
            if (task.description && task.description.trim()) {
                const descEl = document.createElement("span");
                descEl.className = "task-description";
                descEl.textContent = task.description;
                content.appendChild(descEl);
            }

            const actions = document.createElement("div");
            actions.className = "task-actions";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;
            checkbox.setAttribute("aria-label", "Mark as complete");
            checkbox.addEventListener("change", () => toggleComplete(task._id));

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "btn-edit";
            editBtn.textContent = "Edit";
            editBtn.setAttribute("aria-label", "Edit task");
            editBtn.addEventListener("click", () => startEditTask(task._id, task.title, task.description || ""));

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.textContent = "Delete";
            deleteBtn.setAttribute("aria-label", "Delete task");
            deleteBtn.addEventListener("click", () => deleteTask(task._id));

            actions.appendChild(checkbox);
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            li.appendChild(content);
            li.appendChild(actions);
            list.appendChild(li);
        });
    } catch (err) {
        console.error(err);
        list.innerHTML = '<li style="color:#c0392b; background:#ffeaea;">Could not load tasks. Is the server running?</li>';
    }
}

async function addTask() {
    const titleInput = document.getElementById("taskInput");
    const descInput = document.getElementById("taskDescription");
    const title = titleInput.value.trim();
    const description = (descInput.value || "").trim();

    if (!title) return;

    try {
        const res = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                description: description || " ",
            }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Failed to add task");
        }

        titleInput.value = "";
        descInput.value = "";
        await loadTasks();
    } catch (err) {
        console.error(err);
        alert(err.message || "Could not add task.");
    }
}

async function toggleComplete(id) {
    try {
        const li = document.querySelector(`li[data-id="${id}"]`);
        if (!li) return;
        const checkbox = li.querySelector('input[type="checkbox"]');
        const completed = !!checkbox?.checked;

        const res = await fetch(`${API}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed }),
        });
        if (!res.ok) throw new Error("Failed to update");
        await loadTasks();
    } catch (err) {
        console.error(err);
        await loadTasks();
    }
}

function startEditTask(id, currentTitle, currentDescription) {
    const li = document.querySelector(`li[data-id="${id}"]`);
    if (!li || li.classList.contains("editing")) return;

    const content = li.querySelector(".task-content");
    const actions = li.querySelector(".task-actions");
    const titleEl = content.querySelector(".task-title");
    const descEl = content.querySelector(".task-description");

    const savedHtml = content.innerHTML;
    const savedActions = actions.innerHTML;

    content.innerHTML = "";
    const form = document.createElement("div");
    form.className = "task-edit-form";
    form.innerHTML = `
        <input type="text" class="edit-title" value="${escapeHtml(currentTitle)}" placeholder="Title" maxlength="200">
        <input type="text" class="edit-description" value="${escapeHtml(currentDescription)}" placeholder="Note (optional)" maxlength="500">
        <div class="edit-actions">
            <button type="button" class="btn-save">Save</button>
            <button type="button" class="btn-cancel">Cancel</button>
        </div>
    `;

    const titleInput = form.querySelector(".edit-title");
    const descInput = form.querySelector(".edit-description");

    form.querySelector(".btn-save").addEventListener("click", () => {
        const title = titleInput.value.trim();
        if (!title) return;
        updateTask(id, title, descInput.value.trim() || " ");
    });
    form.querySelector(".btn-cancel").addEventListener("click", () => {
        li.classList.remove("editing");
        actions.style.visibility = "";
        loadTasks();
    });

    content.appendChild(form);
    li.classList.add("editing");
    actions.style.visibility = "hidden";
    titleInput.focus();
}

function reattachTaskListeners(li, id, title, description) {
    const actions = li.querySelector(".task-actions");
    if (!actions) return;
    const editBtn = actions.querySelector(".btn-edit");
    const checkbox = actions.querySelector('input[type="checkbox"]');
    const deleteBtn = actions.querySelector("button:not(.btn-edit)");
    if (editBtn) editBtn.addEventListener("click", () => startEditTask(id, title, description));
    if (deleteBtn) deleteBtn.addEventListener("click", () => deleteTask(id));
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

async function updateTask(id, title, description) {
    try {
        const res = await fetch(`${API}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description: description || " " }),
        });
        if (!res.ok) throw new Error("Failed to update task");
        await loadTasks();
    } catch (err) {
        console.error(err);
        alert(err.message || "Could not update task.");
    }
}

async function deleteTask(id) {
    try {
        const res = await fetch(`${API}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete");
        await loadTasks();
    } catch (err) {
        console.error(err);
        await loadTasks();
    }
}

document.getElementById("taskInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
});
document.getElementById("taskDescription").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
});

loadTasks();