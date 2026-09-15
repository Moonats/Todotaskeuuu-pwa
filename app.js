// GANTI DENGAN URL GOOGLE APPS SCRIPT-MU!
const CLOUD_URL = "https://script.google.com/macros/s/AKfycby5dCP-c1mW-9KcPE1wHcYFfr4NupNy_awoyZYfs2U637olK_jKGwDdKyB0hQANQ-Bu/exec";

let tasks = [];
let categories = [
    { id: '1', name: 'General', color: '#808080' },
    { id: '2', name: 'Work', color: '#0074D9' }
]; 

const icons = ['✦', '⚡', '☕', '💼', '🛒', '💡', '📌', '🗓️', '⚐', '✎', '★', '✈'];
let selectedIcon = '✦';
let editingTaskId = null; 

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    renderIcons();
    fetchDataFromCloud();
});

// --- CLOUD SYSTEM ---
function fetchDataFromCloud() {
    let list = document.getElementById('allTaskList');
    if(list) list.innerHTML = "<p style='text-align:center;'><i>Loading data from cloud...</i></p>";
    
    fetch(CLOUD_URL)
        .then(response => response.json())
        .then(data => {
            if (data && Array.isArray(data.tasks)) tasks = data.tasks;
            if (data && Array.isArray(data.categories) && data.categories.length > 0) {
                categories = data.categories;
            }
            renderCategoriesDropdown();
            renderAllViews();
        })
        .catch(err => {
            console.log("Cloud Error:", err);
            renderCategoriesDropdown(); renderAllViews();
        });
}

function saveDataToCloud() {
    if(!Array.isArray(tasks)) tasks = [];
    let payload = { tasks: tasks, categories: categories };
    renderAllViews();
    fetch(CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
        body: JSON.stringify(payload)
    }).catch(err => console.log(err));
}

// --- NAV & MODALS ---
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { 
    document.getElementById(id).classList.remove('active'); 
    document.getElementById('quickCatBox').style.display = 'none';
}

function switchView(viewName) {
    document.querySelectorAll('.container').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    let activeNav = document.getElementById(`nav-${viewName}`);
    if(activeNav) activeNav.classList.add('active');
    
    renderAllViews();
}

// --- TUGAS ---
function renderIcons() {
    let grid = document.getElementById('taskIconGrid');
    if(!grid) return;
    grid.innerHTML = '';
    icons.forEach(icon => {
        let div = document.createElement('div');
        div.className = `icon-option ${icon === selectedIcon ? 'selected' : ''}`;
        div.textContent = icon;
        div.onclick = () => { selectedIcon = icon; renderIcons(); };
        grid.appendChild(div);
    });
}

function openNewTaskModal() {
    editingTaskId = null; 
    document.getElementById('taskModalTitle').innerText = "New Task";
    document.getElementById('taskInput').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskTime').value = '';
    document.getElementById('quickCatBox').style.display = 'none';
    selectedIcon = '✦'; 
    
    renderIcons();
    renderCategoriesDropdown(); 
    
    openModal('taskModal');
}

function editTask(id) {
    let task = tasks.find(t => String(t.id) === String(id));
    if(!task) return;
    
    editingTaskId = id; 
    document.getElementById('taskModalTitle').innerText = "Edit Task";
    document.getElementById('taskInput').value = task.title;
    document.getElementById('taskDesc').value = task.desc || '';
    document.getElementById('taskTime').value = task.time || '';
    document.getElementById('quickCatBox').style.display = 'none';
    selectedIcon = task.icon || '✦';
    
    renderIcons();
    renderCategoriesDropdown(); 
    
    let catSelect = document.getElementById('taskCategory');
    if(catSelect) catSelect.value = task.categoryId;
    
    openModal('taskModal');
}

function saveTask() {
    let titleInput = document.getElementById('taskInput');
    if(!titleInput) return;
    
    let title = titleInput.value.trim();
    let desc = document.getElementById('taskDesc').value.trim();
    let time = document.getElementById('taskTime').value;
    let catSelect = document.getElementById('taskCategory');
    let catId = catSelect ? catSelect.value : categories[0].id;
    
    if (!title) return alert('Task title is required!'); 

    if(!Array.isArray(tasks)) tasks = [];

    if (editingTaskId) {
        let task = tasks.find(t => String(t.id) === String(editingTaskId));
        if(task) {
            task.title = title; task.desc = desc; task.time = time;
            task.categoryId = catId; task.icon = selectedIcon;
        }
    } else {
        tasks.push({ id: Date.now().toString(), title, desc, icon: selectedIcon, time, categoryId: catId, isCompleted: false });
    }
    
    closeModal('taskModal');
    saveDataToCloud();
}
window.addTask = saveTask; 

function getSafeDate(timeStr) {
    if (!timeStr) return new Date('2099-01-01');
    let d = new Date(timeStr);
    return isNaN(d.getTime()) ? new Date('2099-01-01') : d;
}

function renderTaskHTML(task) {
    let cat = categories.find(c => String(c.id) === String(task.categoryId));
    if (!cat) cat = categories[0] || {name: "General", color: "#888"};
    
    let timeText = "No Date";
    if (task.time) {
        let d = new Date(task.time);
        if (!isNaN(d.getTime())) {
            timeText = d.toLocaleString('en-US', {day: 'numeric', month:'short', hour: '2-digit', minute:'2-digit'});
        }
    }
    
    let isDone = (task.isCompleted === true || task.isCompleted === "true");

    return `
        <div class="task-card ${isDone ? 'completed' : ''}">
            <div class="task-header">
                <div class="task-title"><span>${task.icon}</span> ${task.title}</div>
                <span class="badge" style="background: ${cat.color}">${cat.name}</span>
            </div>
            ${task.desc ? `<div class="task-desc">${task.desc}</div>` : ''}
            <div class="task-time">${timeText}</div>
            <div class="actions">
                <button class="btn-icon" onclick="toggleComplete('${task.id}')">${isDone ? 'Undo' : 'Done ✓'}</button>
                <button class="btn-icon" onclick="editTask('${task.id}')">Edit ✏️</button>
                <button class="btn-icon" onclick="deleteTask('${task.id}')">Delete ✕</button>
            </div>
        </div>
    `;
}

function renderHomeTimeline() {
    let todayBox = document.querySelector('#timelineToday .list');
    let tomorrowBox = document.querySelector('#timelineTomorrow .list');
    let nextWeekBox = document.querySelector('#timelineNextWeek .list');
    
    if(!todayBox) return;
    todayBox.innerHTML = ''; tomorrowBox.innerHTML = ''; nextWeekBox.innerHTML = '';
    
    let now = new Date();
    let today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let tomorrow = today + 86400000; 
    
    let activeTasks = tasks.filter(t => t.isCompleted !== true && t.isCompleted !== "true");
    
    activeTasks.sort((a,b) => getSafeDate(a.time) - getSafeDate(b.time)).forEach(task => {
        let html = renderTaskHTML(task);
        if (!task.time || isNaN(new Date(task.time).getTime())) {
            nextWeekBox.innerHTML += html; 
            return;
        }
        let tDate = new Date(task.time);
        let tTime = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate()).getTime();
        
        if (tTime === today) todayBox.innerHTML += html;
        else if (tTime === tomorrow) tomorrowBox.innerHTML += html;
        else nextWeekBox.innerHTML += html;
    });
}

function renderAllTasks() {
    let list = document.getElementById('allTaskList');
    if(!list) return;
    list.innerHTML = '';
    
    if(tasks.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888;">No tasks yet.</p>';
        return;
    }

    categories.forEach(cat => {
        let catTasks = tasks.filter(t => String(t.categoryId) === String(cat.id));
        if (String(cat.id) === String(categories[0].id)) {
            let orphanTasks = tasks.filter(t => !t.categoryId || !categories.find(c => String(c.id) === String(t.categoryId)));
            catTasks = catTasks.concat(orphanTasks);
        }
        if(catTasks.length === 0) return; 

        let pending = catTasks.filter(t => t.isCompleted !== true && t.isCompleted !== "true").sort((a,b) => getSafeDate(a.time) - getSafeDate(b.time));
        let completed = catTasks.filter(t => t.isCompleted === true || t.isCompleted === "true").sort((a,b) => getSafeDate(a.time) - getSafeDate(b.time));

        let catHTML = `
            <div style="margin-bottom: 25px; background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
                <h3 style="color: ${cat.color}; border-bottom: 2px solid ${cat.color}; margin-top: 0; padding-bottom: 8px;">${cat.name}</h3>
                <div style="margin-bottom: 15px; margin-top: 15px;">
                    <h4 style="font-size: 13px; opacity: 0.7; margin-bottom: 10px;">⏳ PENDING</h4>
                    ${pending.length > 0 ? pending.map(t => renderTaskHTML(t)).join('') : '<p style="font-size:13px; color:#888; font-style:italic;">Empty</p>'}
                </div>
                <div style="margin-top: 20px; border-top: 1px dashed var(--border); padding-top: 15px;">
                    <h4 style="font-size: 13px; opacity: 0.7; margin-bottom: 10px;">✅ COMPLETED</h4>
                    ${completed.length > 0 ? completed.map(t => renderTaskHTML(t)).join('') : '<p style="font-size:13px; color:#888; font-style:italic;">Empty</p>'}
                </div>
            </div>
        `;
        list.innerHTML += catHTML;
    });
}

function toggleComplete(id) {
    let task = tasks.find(t => String(t.id) === String(id));
    if(task) { 
        task.isCompleted = (task.isCompleted === true || task.isCompleted === "true") ? false : true; 
        saveDataToCloud(); 
    }
}
function deleteTask(id) {
    if(confirm('Delete this task?')) { tasks = tasks.filter(t => String(t.id) !== String(id)); saveDataToCloud(); }
}

// --- PENGELOLAAN KATEGORI DI DALAM MODAL TUGAS ---
function toggleQuickCatForm() {
    let box = document.getElementById('quickCatBox');
    let isOpen = box.style.display === 'block';
    box.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
        renderQuickCatList();
    }
}

function quickAddCategory() {
    let nameInput = document.getElementById('quickCatName');
    let colorInput = document.getElementById('quickCatColor');
    let name = nameInput.value.trim();
    let color = colorInput.value;
    
    if(!name) return alert('Category name is required!');
    
    let newId = Date.now().toString();
    categories.push({ id: newId, name, color });
    
    nameInput.value = '';
    renderCategoriesDropdown();
    renderQuickCatList();
    
    document.getElementById('taskCategory').value = newId;
    saveDataToCloud();
}

function renderCategoriesDropdown() {
    let select = document.getElementById('taskCategory');
    if(select) {
        select.options.length = 0; 
        if (categories.length === 0) {
            select.options.add(new Option("(No categories)", "1"));
        } else {
            categories.forEach(c => { 
                select.options.add(new Option(c.name, c.id)); 
            });
        }
    }
}

function renderQuickCatList() {
    let list = document.getElementById('quickCatList');
    if(!list) return;
    list.innerHTML = '';
    
    categories.forEach((c, index) => {
        list.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border);">
                <span style="font-size: 13px; font-weight: bold; color: ${c.color};">● ${c.name}</span>
                <button style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-weight: bold; font-size: 12px;" onclick="quickDeleteCategory(${index})">Delete ✕</button>
            </div>
        `;
    });
}

function quickDeleteCategory(index) {
    if(categories.length <= 1) return alert('You must keep at least 1 category!');
    categories.splice(index, 1);
    renderCategoriesDropdown();
    renderQuickCatList();
    saveDataToCloud();
}

// --- TEMA ---
function toggleDarkMode() {
    let isDark = document.getElementById('darkModeToggle').checked;
    if(isDark) { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme', 'light'); }
}
function loadTheme() {
    if(localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        let toggle = document.getElementById('darkModeToggle'); if(toggle) toggle.checked = true;
    }
}
