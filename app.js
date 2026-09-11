// GANTI DENGAN URL GOOGLE APPS SCRIPT-MU!
const CLOUD_URL = "https://script.google.com/macros/s/AKfycby5dCP-c1mW-9KcPE1wHcYFfr4NupNy_awoyZYfs2U637olK_jKGwDdKyB0hQANQ-Bu/exec";

// Matikan Service Worker lama agar cache hilang
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) registration.unregister();
    });
}

let tasks = [];
let categories = [
    { id: '1', name: 'General', color: '#808080' },
    { id: '2', name: 'Work', color: '#0074D9' }
];

const icons = ['✦', '⚡', '☕', '💼', '🛒', '💡', '📌', '🗓️', '⚐', '✎', '★', '✈'];
let selectedIcon = '✦';
let editingTaskId = null; // Menyimpan ID tugas yang sedang diedit

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    renderIcons();
    fetchDataFromCloud();
});

// --- CLOUD SYSTEM ---
function fetchDataFromCloud() {
    let list = document.getElementById('allTaskList');
    if(list) list.innerHTML = "<i>Memuat data dari awan...</i>";
    
    fetch(CLOUD_URL)
        .then(response => response.json())
        .then(data => {
            if (data && Array.isArray(data.tasks)) tasks = data.tasks;
            if (data && Array.isArray(data.categories) && data.categories.length > 0) categories = data.categories;
            renderCategories();
            renderAllViews();
        })
        .catch(err => {
            console.log("Memuat lokal", err);
            renderCategories(); renderAllViews();
        });
}

function saveDataToCloud() {
    let payload = { tasks: tasks, categories: categories };
    renderAllViews();
    fetch(CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
        body: JSON.stringify(payload)
    }).catch(err => console.log("Gagal simpan cloud", err));
}

// --- NAV & MODALS ---
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function switchView(viewName) {
    document.querySelectorAll('.container').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(viewName !== 'settings') document.getElementById(`nav-${viewName}`).classList.add('active');
    renderAllViews();
}

// --- TASK FUNCTIONS ---
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
    editingTaskId = null; // Reset ke mode tambah baru
    document.getElementById('taskModalTitle').innerText = "New Task";
    document.getElementById('taskInput').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskTime').value = '';
    selectedIcon = '✦'; renderIcons();
    openModal('taskModal');
}

function editTask(id) {
    let task = tasks.find(t => t.id === id);
    if(!task) return;
    
    editingTaskId = id; // Set ke mode edit
    document.getElementById('taskModalTitle').innerText = "Edit Task";
    document.getElementById('taskInput').value = task.title;
    document.getElementById('taskDesc').value = task.desc || '';
    document.getElementById('taskTime').value = task.time || '';
    
    selectedIcon = task.icon || '✦';
    renderIcons();
    
    let catSelect = document.getElementById('taskCategory');
    if(catSelect) catSelect.value = task.categoryId;
    
    openModal('taskModal');
}

function saveTask() { // Menggantikan addTask
    let title = document.getElementById('taskInput').value.trim();
    let desc = document.getElementById('taskDesc').value.trim();
    let time = document.getElementById('taskTime').value;
    let catId = document.getElementById('taskCategory').value;
    
    if (!title) return alert('Task Title is required!'); // Waktu kini opsional

    if (editingTaskId) {
        // Mode Edit
        let task = tasks.find(t => t.id === editingTaskId);
        if(task) {
            task.title = title; task.desc = desc; task.time = time;
            task.categoryId = catId; task.icon = selectedIcon;
        }
    } else {
        // Mode Tambah Baru
        tasks.push({ id: Date.now().toString(), title, desc, icon: selectedIcon, time, categoryId: catId, isCompleted: false });
    }
    
    closeModal('taskModal');
    saveDataToCloud();
}

// Menghindari error Invalid Date di layar
function renderTaskHTML(task) {
    let cat = categories.find(c => c.id === task.categoryId) || categories[0] || {name: "General", color: "#888"};
    
    let timeText = "No Date";
    if (task.time) {
        let d = new Date(task.time);
        if (!isNaN(d.getTime())) {
            timeText = d.toLocaleString('en-US', {day: 'numeric', month:'short', hour: '2-digit', minute:'2-digit'});
        }
    }
    
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
                <button class="btn-icon" onclick="editTask('${task.id}')">Edit ✏️</button>
                <button class="btn-icon" onclick="deleteTask('${task.id}')">Delete ✕</button>
            </div>
        </div>
    `;
}

// --- HOME TIMELINE ---
function renderHomeTimeline() {
    let todayBox = document.querySelector('#timelineToday .list');
    let tomorrowBox = document.querySelector('#timelineTomorrow .list');
    let nextWeekBox = document.querySelector('#timelineNextWeek .list');
    
    if(!todayBox) return;
    todayBox.innerHTML = ''; tomorrowBox.innerHTML = ''; nextWeekBox.innerHTML = '';
    
    let now = new Date();
    let today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let tomorrow = today + 86400000; 
    
    // Sortir tugas yg belum selesai & pastikan ditangani walau tanpa tanggal
    let activeTasks = tasks.filter(t => !t.isCompleted);
    activeTasks.sort((a,b) => new Date(a.time || '2099-01-01') - new Date(b.time || '2099-01-01')).forEach(task => {
        let html = renderTaskHTML(task);
        
        if (!task.time || isNaN(new Date(task.time).getTime())) {
            nextWeekBox.innerHTML += html; // Masuk ke Nanti jika tanpa waktu
            return;
        }
        
        let tDate = new Date(task.time);
        let tTime = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate()).getTime();
        
        if (tTime === today) todayBox.innerHTML += html;
        else if (tTime === tomorrow) tomorrowBox.innerHTML += html;
        else nextWeekBox.innerHTML += html;
    });
}

// --- ALL TASKS (DIKELOMPOKKAN BY CATEGORY & STATUS) ---
function renderAllTasks() {
    let list = document.getElementById('allTaskList');
    if(!list) return;
    list.innerHTML = '';
    
    if(tasks.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888;">No tasks yet.</p>';
        return;
    }

    // Pastikan tugas yatim (kategorinya terhapus) masuk ke kategori pertama
    tasks.forEach(t => {
        if (!categories.find(c => c.id === t.categoryId)) t.categoryId = categories[0] ? categories[0].id : '';
    });

    categories.forEach(cat => {
        let catTasks = tasks.filter(t => t.categoryId === cat.id);
        if(catTasks.length === 0) return; // Lewati kategori yg kosong

        // Pisahkan selesai & belum
        let pending = catTasks.filter(t => !t.isCompleted).sort((a,b) => new Date(a.time||'2099') - new Date(b.time||'2099'));
        let completed = catTasks.filter(t => t.isCompleted).sort((a,b) => new Date(a.time||'2099') - new Date(b.time||'2099'));

        let catHTML = `
            <div style="margin-bottom: 25px; background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
                <h3 style="color: ${cat.color}; border-bottom: 2px solid ${cat.color}; margin-top: 0; padding-bottom: 8px;">${cat.name}</h3>
                
                <div style="margin-bottom: 15px; margin-top: 15px;">
                    <h4 style="font-size: 13px; opacity: 0.7; margin-bottom: 10px;">⏳ PENDING</h4>
                    ${pending.length > 0 ? pending.map(t => renderTaskHTML(t)).join('') : '<p style="font-size:13px; color:#888; font-style:italic;">No pending tasks.</p>'}
                </div>

                <div style="margin-top: 20px; border-top: 1px dashed var(--border); padding-top: 15px;">
                    <h4 style="font-size: 13px; opacity: 0.7; margin-bottom: 10px;">✅ COMPLETED</h4>
                    ${completed.length > 0 ? completed.map(t => renderTaskHTML(t)).join('') : '<p style="font-size:13px; color:#888; font-style:italic;">No completed tasks.</p>'}
                </div>
            </div>
        `;
        list.innerHTML += catHTML;
    });
}

function toggleComplete(id) {
    let task = tasks.find(t => t.id === id);
    if(task) { task.isCompleted = !task.isCompleted; saveDataToCloud(); }
}
function deleteTask(id) {
    if(confirm('Delete this task?')) { tasks = tasks.filter(t => t.id !== id); saveDataToCloud(); }
}

// --- KATEGORI & SETTINGS ---
function addCategory() {
    let name = document.getElementById('newCatName').value.trim();
    let color = document.getElementById('newCatColor').value;
    if(!name) return alert('Nama kategori wajib diisi!');
    
    categories.push({ id: Date.now().toString(), name, color });
    document.getElementById('newCatName').value = '';
    renderCategories(); saveDataToCloud();
}
function renderCategories() {
    let select = document.getElementById('taskCategory');
    if(select) {
        select.innerHTML = '';
        categories.forEach(c => { select.innerHTML += `<option value="${c.id}">${c.name}</option>`; });
    }
    let list = document.getElementById('catList');
    if(list) {
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
}
function deleteCategory(index) {
    if(categories.length <= 1) return alert('Minimal sisakan 1 kategori!');
    categories.splice(index, 1); renderCategories(); renderAllViews(); saveDataToCloud();
}

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
