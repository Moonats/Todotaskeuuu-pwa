// PENTING: Ganti dengan URL dari Google Apps Script-mu!
const CLOUD_URL = "https://script.google.com/macros/s/AKfycby5dCP-c1mW-9KcPE1wHcYFfr4NupNy_awoyZYfs2U637olK_jKGwDdKyB0hQANQ-Bu/exec";

// --- 1. PENGHANCUR CACHE LAMA (Wajib ada agar tidak nge-bug) ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister(); // Membunuh sistem offline lama
        }
    });
}

let tasks = [];
let categories = [
    { id: '1', name: 'General', color: '#808080' },
    { id: '2', name: 'Work', color: '#0074D9' }
];

const icons = ['✦', '⚡', '☕', '💼', '🛒', '💡', '📌', '🗓️', '⚐', '✎', '★', '✈'];
let selectedIcon = '✦';

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    renderIcons();
    fetchDataFromCloud();
});

// --- 2. CLOUD SYSTEM (Google Sheets) ---
function fetchDataFromCloud() {
    let list = document.getElementById('allTaskList');
    if(list) list.innerHTML = "<i>Memuat data dari Google Drive...</i>";
    
    fetch(CLOUD_URL)
        .then(response => response.json())
        .then(data => {
            if (data && Array.isArray(data.tasks)) tasks = data.tasks;
            if (data && Array.isArray(data.categories) && data.categories.length > 0) categories = data.categories;
            renderCategories();
            renderAllViews();
        })
        .catch(err => {
            console.log("Info: Memuat data lokal karena cloud belum tersambung.", err);
            renderCategories();
            renderAllViews();
        });
}

function saveDataToCloud() {
    let payload = { tasks: tasks, categories: categories };
    renderAllViews(); // Update UI di layar HP langsung
    
    // Bypass CORS Google Sheets
    fetch(CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
        body: JSON.stringify(payload)
    }).catch(err => console.log("Gagal menyimpan ke cloud", err));
}

// --- 3. FUNGSI NAVIGASI & MODAL ---
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function switchView(viewName) {
    document.querySelectorAll('.container').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(viewName !== 'settings') { document.getElementById(`nav-${viewName}`).classList.add('active'); }
    renderAllViews();
}

// --- 4. FUNGSI TUGAS ---
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

function addTask() {
    let title = document.getElementById('taskInput').value.trim();
    let desc = document.getElementById('taskDesc').value.trim();
    let time = document.getElementById('taskTime').value;
    let catId = document.getElementById('taskCategory').value;
    
    if (!title || !time) return alert('Judul dan Waktu Tugas wajib diisi!');

    tasks.push({ id: Date.now().toString(), title, desc, icon: selectedIcon, time, categoryId: catId, isCompleted: false });
    
    document.getElementById('taskInput').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskTime').value = '';
    
    closeModal('taskModal');
    saveDataToCloud();
    alert('Tugas berhasil dicatat!');
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

function renderHomeTimeline() {
    let todayBox = document.querySelector('#timelineToday .list');
    let tomorrowBox = document.querySelector('#timelineTomorrow .list');
    let nextWeekBox = document.querySelector('#timelineNextWeek .list');
    
    if(!todayBox || !tomorrowBox || !nextWeekBox) return;
    
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
    if(!list) return;
    list.innerHTML = '';
    tasks.sort((a,b) => new Date(a.time) - new Date(b.time)).forEach(task => {
        list.innerHTML += renderTaskHTML(task);
    });
}

function toggleComplete(id) {
    let task = tasks.find(t => t.id === id);
    if(task) { task.isCompleted = !task.isCompleted; saveDataToCloud(); }
}

function deleteTask(id) {
    if(confirm('Yakin ingin menghapus tugas ini?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveDataToCloud();
    }
}

// --- 5. FUNGSI KATEGORI (SUPER AMAN) ---
function addCategory() {
    try {
        let nameInput = document.getElementById('newCatName');
        let colorInput = document.getElementById('newCatColor');
        
        if(!nameInput || !colorInput) {
            return alert("Error form tidak ditemukan! Coba refresh.");
        }
        
        let name = nameInput.value.trim();
        let color = colorInput.value;
        
        if(!name) return alert('Nama kategori tidak boleh kosong ya!');
        
        // Cek darurat kalau categories rusak dari cloud
        if(!Array.isArray(categories)) categories = []; 
        
        categories.push({ id: Date.now().toString(), name: name, color: color });
        nameInput.value = ''; // Kosongkan form
        
        renderCategories();
        saveDataToCloud();
        
        // Notifikasi agar tahu tombol berhasil ditekan
        alert("Kategori '" + name + "' berhasil ditambahkan!"); 
    } catch(error) {
        alert("Aduh, ada error: " + error.message);
    }
}

function renderCategories() {
    if(!Array.isArray(categories)) categories = [];
    
    let select = document.getElementById('taskCategory');
    if(select) {
        select.innerHTML = '';
        categories.forEach(c => {
            let opt = document.createElement('option');
            opt.value = c.id; opt.textContent = c.name;
            select.appendChild(opt);
        });
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
    if(categories.length <= 1) return alert('Kamu harus menyisakan minimal 1 kategori!');
    categories.splice(index, 1);
    renderCategories(); renderAllViews(); saveDataToCloud();
}

// --- 6. DARK MODE ---
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
        let toggle = document.getElementById('darkModeToggle');
        if(toggle) toggle.checked = true;
    }
}
