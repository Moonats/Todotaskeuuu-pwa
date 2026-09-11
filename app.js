document.addEventListener('DOMContentLoaded', () => {
    Notification.requestPermission(); // Minta izin notifikasi
    loadTasks();
});

function addTask() {
    let input = document.getElementById('taskInput');
    let taskText = input.value.trim();
    if (taskText === "") return;

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(taskText);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    input.value = "";
    
    // Munculkan notifikasi saat tugas ditambahkan
    if (Notification.permission === "granted") {
        new Notification("Tugas Dicatat!", { body: taskText });
    }

    loadTasks();
}

function loadTasks() {
    let taskList = document.getElementById('taskList');
    taskList.innerHTML = "";
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    tasks.forEach((task, index) => {
        let li = document.createElement('li');
        li.textContent = task;
        
        let btn = document.createElement('button');
        btn.textContent = "Selesai";
        btn.className = "delete";
        btn.onclick = () => removeTask(index);
        
        li.appendChild(btn);
        taskList.appendChild(li);
    });
}

function removeTask(index) {
    let tasks = JSON.parse(localStorage.getItem('tasks'));
    tasks.splice(index, 1);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    loadTasks();
}
