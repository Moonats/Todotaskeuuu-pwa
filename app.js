let tasks = JSON.parse(localStorage.getItem('orbit_tasks_v4')) || [];
let categories = JSON.parse(localStorage.getItem('orbit_cats_v4')) || [
    { id: '1', name: 'General', color: '#808080' },
    { id: '2', name: 'Work', color: '#0074D9' }
];

// Minimalist Icons Set
const icons = ['✦', '⚡', '☕', '💼', '🛒', '💡', '📌', '🗓️', '⚐', '✎', '★', '✈'];
let selectedIcon = '✦';

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    renderIcons();
    renderCategories();
    renderAllViews();
});

// --- Modal (Pop-up) Functions ---
function openModal(id) {
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// --- Navigation ---
function switchView(viewName) {
    document.querySelectorAll('.container').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(viewName !== 'settings') {
        document.getElementById(`nav-${viewName}`).classList.add('active');
    }
    renderAllViews();
}

// --- Icon Selection Logic ---
function renderIcons() {
    let grid = document.getElementById('taskIconGrid');
    grid.innerHTML = '';
    icons.forEach(icon => {
        let div = document.createElement('div');
        div.className = `icon-option ${icon === selectedIcon ? 'selected' : ''}`;
        div.textContent = icon;
        div.onclick = () => {
            selectedIcon = icon;
            renderIcons(); // Re-render to update selected class
        };
        grid.appendChild(div);
    });
}

// --- Task Functions ---
function addTask() {
    let title = document.getElementById('taskInput').value.trim();
    let desc = document.getElementById('taskDesc').value.trim();
    let time = document.getElementById('taskTime').value;
    let catId = document.getElementById('taskCategory').value;
    
    if (!title || !time) return alert('Task Title and Time are required!');

    tasks.push({ id: Date.now().toString(), title, desc, icon: selectedIcon, time, categoryId: catId, isCompleted: false });
    localStorage.setItem('orbit_tasks_v4', JSON.stringify(tasks));
    
    document.getElementById('taskInput').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskTime').value = '';
    
    closeModal('taskModal');
    renderAllViews();
}

function renderAllViews() {
    renderHomeTimeline();
    renderAllTasks();
}

function renderTaskHTML(task) {
    let cat = categories.find(c => c.id === task.categoryId) || categories[0];
    let timeText = new Date(task.time).toLocaleString('en-US', {day: 'numeric', month:'short', hour: '2-digit', minute:'2-digit'});
    
    return `
        <div class="task-card ${task.isCompleted ? 'completed' : ''}">
            <div class="task-header">
                <div class="task-title"><span>${task.icon}</span> ${task.title}</div>
                <span class="badge" style="background: ${cat.color}">${cat.name}</span>
            </div>
            ${task.desc ? `<div class="task-desc">${task.desc}</div>` : ''}
            <div class="task-time">${timeText}</div>
            <div class="actions">
                <button class="btn-icon" onclick="toggleComplete('${task.id}')">${task.isCompleted ? 'Undo' : 'Done ✓'}</button>
                <button class="btn-icon" onclick="deleteTask('${task.id}')">Delete ✕</button>
            </div>
        </div>
    `;
}

// --- Timeline Logic ---
function renderHomeTimeline() {
    let todayBox = document.querySelector('#timelineToday .list');
    let tomorrowBox = document.querySelector('#timelineTomorrow .list');
    let nextWeekBox = document.querySelector('#timelineNextWeek .list');
    
    todayBox.innerHTML = ''; tomorrowBox.innerHTML = ''; nextWeekBox.innerHTML = '';
    
    let now = new Date();
    let today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let tomorrow = today + (86400000); 
    
    tasks.filter(t => !t.isCompleted).sort((a,b) => new Date(a.time) - new Date(b.time)).forEach(task => {
        let tDate = new Date(task.time);
        let tTime = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate()).getTime();
        
        let html = renderTaskHTML(task);
        if (tTime === today) todayBox.innerHTML += html;
        else if (tTime === tomorrow) tomorrowBox.innerHTML += html;
        else nextWeekBox.innerHTML += html;
    });
}

function renderAllTasks() {
    let list = document.getElementById('allTaskList');
    list.innerHTML = '';
    tasks.sort((a,b) => new Date(a.time) - new Date(b.time)).forEach(task => {
        list.innerHTML += renderTaskHTML(task);
    });
}

function toggleComplete(id) {
    let task = tasks.find(t => t.id === id);
    if(task) task.isCompleted = !task.isCompleted;
    localStorage.setItem('orbit_tasks_v4', JSON.stringify(tasks));
    renderAllViews();
}

function deleteTask(id) {
    if(confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        localStorage.setItem('orbit_tasks_v4', JSON.stringify(tasks));
        renderAllViews();
    }
}

// --- Category Functions ---
function addCategory() {
    let name = document.getElementById('newCatName').value.trim();
    let color = document.getElementById('newCatColor').value;
    if(!name) return alert('Category name cannot be empty!');
    
    categories.push({ id: Date.now().toString(), name, color });
    localStorage.setItem('orbit_cats_v4', JSON.stringify(categories));
    document.getElementById('newCatName').value = '';
    renderCategories();
}

function renderCategories() {
    let select = document.getElementById('taskCategory');
    select.innerHTML = '';
    categories.forEach(c => {
        let opt = document.createElement('option');
        opt.value = c.id; opt.textContent = c.name;
        select.appendChild(opt);
    });

    let list = document.getElementById('catList');
    list.innerHTML = '';
    categories.forEach((c, index) => {
        list.innerHTML += `
            <div class="task-card" style="flex-direction:row; justify-content:space-between; align-items:center; padding: 10px;">
                <span class="badge" style="background: ${c.color}; font-size:13px;">${c.name}</span>
                <button class="btn-icon" onclick="deleteCategory(${index})">✕</button>
            </div>
        `;
    });
}

function deleteCategory(index) {
    if(categories.length <= 1) return alert('You must have at least 1 category!');
    categories.splice(index, 1);
    localStorage.setItem('orbit_cats_v4', JSON.stringify(categories));
    renderCategories(); renderAllViews();
}

// --- Dark Mode ---
function toggleDarkMode() {
    let isDark = document.getElementById('darkModeToggle').checked;
    if(isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    if(localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').checked = true;
    }
}
