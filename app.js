let tasks = JSON.parse(localStorage.getItem('tasks_v2')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [
    { id: '1', name: 'Umum', color: '#808080' },
    { id: '2', name: 'Kerja', color: '#007bff' }
];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    Notification.requestPermission();
    loadTheme();
    renderCategories();
    renderTasks();
    startAlarmChecker();
});

// --- Fungsi Tugas ---
function addTask() {
    let text = document.getElementById('taskInput').value.trim();
    let time = document.getElementById('taskTime').value;
    let catId = document.getElementById('taskCategory').value;
    
    if (!text) return alert('Tugas tidak boleh kosong!');

    let newTask = {
        id: Date.now().toString(),
        text: text,
        time: time,
        categoryId: catId,
        isCompleted: false,
        notified: false
    };

    tasks.push(newTask);
    saveTasks();
    document.getElementById('taskInput').value = '';
    renderTasks();
}

function renderTasks() {
    let list = document.getElementById('taskList');
    list.innerHTML = '';
    
    let filteredTasks = tasks.filter(t => {
        if (currentFilter === 'pending') return !t.isCompleted;
        if (currentFilter === 'completed') return t.isCompleted;
        return true; // 'all'
    });

    filteredTasks.forEach(task => {
        let cat = categories.find(c => c.id === task.categoryId) || categories[0];
        let li = document.createElement('li');
        if (task.isCompleted) li.className = 'completed';

        let timeText = task.time ? new Date(task.time).toLocaleString('id-ID') : 'Tidak ada waktu';

        li.innerHTML = `
            <div class="task-header">
                <span class="task-title">${task.text}</span>
                <span class="badge" style="background: ${cat.color}">${cat.name}</span>
            </div>
            <div class="task-time">⏰ ${timeText}</div>
            <div class="actions">
                <button class="btn-icon" onclick="toggleComplete('${task.id}')" title="Selesai/Belum">✔</button>
                <button class="btn-icon" onclick="editTask('${task.id}')" title="Edit">✏</button>
                <button class="btn-icon" onclick="deleteTask('${task.id}')" title="Hapus">🗑</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function toggleComplete(id) {
    let task = tasks.find(t => t.id === id);
    if(task) task.isCompleted = !task.isCompleted;
    saveTasks(); renderTasks();
}

function deleteTask(id) {
    if(confirm('Hapus tugas ini?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks(); renderTasks();
    }
}

function editTask(id) {
    let task = tasks.find(t => t.id === id);
    if(task) {
        let newText = prompt('Edit tugas:', task.text);
        if(newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            saveTasks(); renderTasks();
        }
    }
}

function saveTasks() {
    localStorage.setItem('tasks_v2', JSON.stringify(tasks));
}

// --- Filter & Navigasi ---
function setFilter(filter) {
    currentFilter = filter;
    document.getElementById('mainSection').style.display = 'block';
    document.getElementById('settingsSection').style.display = 'none';
    
    document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${filter}`).classList.add('active');
    renderTasks();
}

function showSettings() {
    document.getElementById('mainSection').style.display = 'none';
    document.getElementById('settingsSection').style.display = 'block';
    document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab-settings').classList.add('active');
}

// --- Kategori Custom ---
function addCategory() {
    let name = document.getElementById('newCatName').value.trim();
    let color = document.getElementById('newCatColor').value;
    if(!name) return;
    
    categories.push({ id: Date.now().toString(), name, color });
    localStorage.setItem('categories', JSON.stringify(categories));
    document.getElementById('newCatName').value = '';
    renderCategories();
}

function renderCategories() {
    // Render di Select Input
    let select = document.getElementById('taskCategory');
    select.innerHTML = '';
    categories.forEach(c => {
        let opt = document.createElement('option');
        opt.value = c.id; opt.textContent = c.name;
        select.appendChild(opt);
    });

    // Render di Settings
    let list = document.getElementById('catList');
    list.innerHTML = '';
    categories.forEach((c, index) => {
        let li = document.createElement('li');
        li.style.flexDirection = 'row';
        li.style.justifyContent = 'space-between';
        li.innerHTML = `
            <span class="badge" style="background: ${c.color}; font-size:14px;">${c.name}</span>
            <button class="btn-icon" onclick="deleteCategory(${index})">🗑</button>
        `;
        list.appendChild(li);
    });
}

function deleteCategory(index) {
    if(categories.length <= 1) return alert('Minimal harus ada 1 kategori!');
    categories.splice(index, 1);
    localStorage.setItem('categories', JSON.stringify(categories));
    renderCategories(); renderTasks();
}

// --- Pengaturan Lainnya (Dark Mode & Pengingat) ---
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
    let theme = localStorage.getItem('theme');
    if(theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').checked = true;
    }
}

// Mengecek waktu setiap menit untuk memunculkan notifikasi
function startAlarmChecker() {
    setInterval(() => {
        let now = new Date();
        tasks.forEach(task => {
            if (task.time && !task.isCompleted && !task.notified) {
                let taskTime = new Date(task.time);
                if (now >= taskTime) {
                    if (Notification.permission === "granted") {
                        new Notification("Pengingat Tugas!", { body: task.text });
                    }
                    task.notified = true; // Tandai agar tidak spam notif
                    saveTasks();
                }
            }
        });
    }, 60000); // Cek setiap 60 detik
}
