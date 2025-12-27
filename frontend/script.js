const API_KEY = 'student123';
// Use relative path so it works on both localhost and Render
const BASE_URL = '';

async function fetchTasks() {
  try {
    const res = await fetch(`${BASE_URL}/tasks`, {
      headers: { 'x-api-key': API_KEY }
    });
    const tasks = await res.json();
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
      emptyState.classList.add('show');
    } else {
      emptyState.classList.remove('show');
      tasks.forEach(task => {
        const li = document.createElement('li');
        if (task.status === 'completed') li.classList.add('completed');
        
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        const checkbox = document.createElement('div');
        checkbox.className = 'checkbox';
        checkbox.innerHTML = task.status === 'completed' ? '✓' : '';
        
        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = task.title;
        
        taskContent.appendChild(checkbox);
        taskContent.appendChild(taskText);
        li.appendChild(taskContent);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = 'Delete';
        delBtn.onclick = (e) => { e.stopPropagation(); deleteTask(task.id); };
        
        li.appendChild(delBtn);
        li.onclick = () => toggleTask(task.id, task.status);
        taskList.appendChild(li);
      });
    }
    
    updateStats(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    alert('Failed to load tasks. Make sure the backend is running.');
  }
}

function updateStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  document.getElementById('totalTasks').textContent = `Total: ${total}`;
  document.getElementById('completedTasks').textContent = `Completed: ${completed}`;
}

async function addTask() {
  const input = document.getElementById('taskInput');
  const title = input.value.trim();
  if (!title) {
    input.focus();
    return;
  }
  
  try {
    await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({ title })
    });
    input.value = '';
    input.focus();
    fetchTasks();
  } catch (error) {
    console.error('Error adding task:', error);
    alert('Failed to add task.');
  }
}

async function toggleTask(id, status) {
  const newStatus = status === 'pending' ? 'completed' : 'pending';
  try {
    await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({ status: newStatus })
    });
    fetchTasks();
  } catch (error) {
    console.error('Error toggling task:', error);
    alert('Failed to update task.');
  }
}

async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  try {
    await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'x-api-key': API_KEY }
    });
    fetchTasks();
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Failed to delete task.');
  }
}

// Allow Enter key to add task
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
  fetchTasks();
});
