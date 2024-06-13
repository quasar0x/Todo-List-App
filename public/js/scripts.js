async function fetchTodos() {
    try {
        const response = await fetch('http://localhost:3001/get-todos', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        if (!response.ok) {
            if (response.status === 403) {
                alert('Session expired. Please login again.');
                showLogin();
                return;
            }
            throw new Error('Failed to fetch todos');
        }
        const todos = await response.json();
        const todoList = document.getElementById('todo-list');
        todoList.innerHTML = '';
        todos.forEach(todo => {
            const li = createTodoElement(todo);
            todoList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
}

function createTodoElement(todo) {
    const li = document.createElement('li');
    li.dataset.id = todo._id;
    if (todo.completed) {
        li.classList.add('completed');
    }

    const taskDetails = document.createElement('div');
    taskDetails.className = 'task-details';

    const taskTitle = document.createElement('span');
    taskTitle.className = 'task-title';
    taskTitle.textContent = todo.task;
    taskDetails.appendChild(taskTitle);

    const taskMeta = document.createElement('div');
    taskMeta.className = 'task-meta';

    if (todo.dueDate) {
        const dueDate = document.createElement('span');
        dueDate.textContent = `Due: ${new Date(todo.dueDate).toLocaleDateString()}`;
        taskMeta.appendChild(dueDate);
    }

    if (todo.priority) {
        const priority = document.createElement('span');
        priority.textContent = `Priority: ${todo.priority}`;
        taskMeta.appendChild(priority);
    }

    taskDetails.appendChild(taskMeta);
    li.appendChild(taskDetails);

    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';

    const completeButton = document.createElement('button');
    completeButton.textContent = todo.completed ? 'Undo' : 'Complete';
    completeButton.className = 'complete-button';
    completeButton.onclick = () => toggleComplete(todo._id, todo.completed);
    taskActions.appendChild(completeButton);

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'edit-button';
    editButton.onclick = () => editTask(todo._id, todo.task);
    taskActions.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-button';
    deleteButton.onclick = () => deleteTask(todo._id);
    taskActions.appendChild(deleteButton);

    li.appendChild(taskActions);
    return li;
}

async function addTask() {
    const task = document.getElementById('new-task').value;
    const dueDate = document.getElementById('due-date').value;
    const priority = document.getElementById('priority').value;

    if (!task) return;

    try {
        const response = await fetch('http://localhost:3001/add-task', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ task, dueDate, priority })
        });

        if (!response.ok) {
            if (response.status === 403) {
                alert('Session expired. Please login again.');
                showLogin();
                return;
            }
            throw new Error('Failed to add task');
        }

        const newTask = await response.json();
        const todoList = document.getElementById('todo-list');
        const li = createTodoElement(newTask);
        li.classList.add('slide-in');
        todoList.appendChild(li);
        document.getElementById('new-task').value = '';
        document.getElementById('due-date').value = '';
        document.getElementById('priority').value = 'low';
    } catch (error) {
        console.error('Error adding task:', error);
        alert(error.message);
    }
}

async function deleteTask(id) {
    const taskElement = document.querySelector(`li[data-id='${id}']`);
    taskElement.classList.add('slide-out');
    setTimeout(async () => {
        try {
            const response = await fetch(`http://localhost:3001/delete-task/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            if (!response.ok) {
                if (response.status === 403) {
                    alert('Session expired. Please login again.');
                    showLogin();
                    return;
                }
                throw new Error('Failed to delete task');
            }
            taskElement.remove();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert(error.message);
        }
    }, 500);
}

async function toggleComplete(id, currentStatus) {
    try {
        const response = await fetch(`http://localhost:3001/toggle-complete/${id}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ completed: !currentStatus })
        });
        if (!response.ok) {
            if (response.status === 403) {
                alert('Session expired. Please login again.');
                showLogin();
                return;
            }
            throw new Error('Failed to toggle task completion');
        }
        fetchTodos();
    } catch (error) {
        console.error('Error toggling task completion:', error);
        alert(error.message);
    }
}

function editTask(id, currentTask) {
    const newTask = prompt("Edit your task", currentTask);
    if (newTask !== null) {
        updateTask(id, newTask);
    }
}

async function updateTask(id, newTask) {
    try {
        const response = await fetch(`http://localhost:3001/update-task/${id}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ task: newTask })
        });
        if (!response.ok) {
            if (response.status === 403) {
                alert('Session expired. Please login again.');
                showLogin();
                return;
            }
            throw new Error('Failed to update task');
        }
        fetchTodos();
    } catch (error) {
        console.error('Error updating task:', error);
        alert(error.message);
    }
}

async function fetchQuote() {
    try {
        const response = await fetch('http://localhost:3001/get-quote');
        const data = await response.json();
        const quoteContainer = document.getElementById('quote-container');
        const quoteText = document.getElementById('quote');
        quoteText.textContent = `"${data.content}" — ${data.author}`;
    } catch (error) {
        console.error('Error fetching the quote:', error);
    }
}

async function fetchBackgroundImage() {
    try {
        const response = await fetch('http://localhost:3001/get-background-image');
        const data = await response.json();
        document.body.style.backgroundImage = `url(${data.url})`;
    } catch (error) {
        console.error('Error fetching the background image:', error);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
}

function togglePasswordVisibility(passwordFieldId) {
    const passwordField = document.getElementById(passwordFieldId);
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
}

function searchTasks() {
    const searchValue = document.getElementById('search').value.toLowerCase();
    const tasks = document.querySelectorAll('#todo-list li');
    tasks.forEach(task => {
        if (task.textContent.toLowerCase().includes(searchValue)) {
            task.style.display = '';
        } else {
            task.style.display = 'none';
        }
    });
}

// User authentication
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const response = await fetch('http://localhost:3001/login', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
            throw new Error('Login failed');
        }
        const data = await response.json();
        localStorage.setItem('token', data.token);
        showTodoContainer();
    } catch (error) {
        console.error('Error during login:', error);
        alert(error.message);
    }
}

async function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        const response = await fetch('http://localhost:3001/register', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
            throw new Error('Registration failed');
        }
        alert('Registration successful');
        showLogin();
    } catch (error) {
        console.error('Error during registration:', error);
        alert(error.message);
    }
}

function showLogin() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('todo-container').classList.add('hidden');
}

function showRegister() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.remove('hidden');
    document.getElementById('todo-container').classList.add('hidden');
}

function showTodoContainer() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('todo-container').classList.remove('hidden');
    fetchTodos();
}

// Fetch todos and quote on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        showTodoContainer();
    } else {
        showLogin();
    }
    fetchQuote();
    fetchBackgroundImage();
});
