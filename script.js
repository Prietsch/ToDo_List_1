// Classe para representar uma tarefa
class Task {
    constructor(id, title, responsible, startDate, endDate, priority, description, observations, completed = false) {
        this.id = id;
        this.title = title;
        this.responsible = responsible;
        this.startDate = startDate;
        this.endDate = endDate;
        this.priority = priority;
        this.description = description;
        this.observations = observations;
        this.completed = completed;
        this.createdAt = new Date().toISOString();
    }
}

// Classe principal da aplicação
class TodoApp {
    constructor() {
        this.tasks = [];
        this.nextId = 1;
        this.stateHistory = [];
        this.currentStateIndex = -1;
        this.maxHistoryStates = 20;
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.renderTasks();
        this.saveState();
    }

    setupEventListeners() {
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        document.getElementById('taskStartDate').addEventListener('change', () => {
            this.validateDates('taskStartDate', 'taskEndDate');
        });

        document.getElementById('taskEndDate').addEventListener('change', () => {
            this.validateDates('taskStartDate', 'taskEndDate');
        });

        document.getElementById('saveData').addEventListener('click', () => {
            this.saveToLocalStorage();
        });

        document.getElementById('loadData').addEventListener('click', () => {
            this.loadFromLocalStorage();
            this.renderTasks();
            this.saveState();
        });

        document.getElementById('clearData').addEventListener('click', () => {
            this.clearLocalStorage();
        });

        document.getElementById('clearCompleted').addEventListener('click', () => {
            this.clearCompletedTasks();
        });

        document.getElementById('saveEditTask').addEventListener('click', () => {
            this.saveEditedTask();
        });

        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undo();
        });
        
        document.getElementById('redoBtn').addEventListener('click', () => {
            this.redo();
        });
        
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && !e.altKey) {
                if (e.key === 'z' || e.key === 'Z') {
                    e.preventDefault();
                    this.undo();
                } else if (e.key === 'y' || e.key === 'Y') {
                    e.preventDefault();
                    this.redo();
                }
            }
        });

        this.setupInputValidation();
    }

    setupInputValidation() {
        const titleInput = document.getElementById('taskTitle');
        const responsibleInput = document.getElementById('taskResponsible');
        const descriptionInput = document.getElementById('taskDescription');
        const observationsInput = document.getElementById('taskObservations');

        titleInput.addEventListener('input', () => {
            if (titleInput.value.length > 100) {
                titleInput.value = titleInput.value.substring(0, 100);
            }
        });

        responsibleInput.addEventListener('input', () => {
            if (responsibleInput.value.length > 50) {
                responsibleInput.value = responsibleInput.value.substring(0, 50);
            }
        });

        descriptionInput.addEventListener('input', () => {
            if (descriptionInput.value.length > 500) {
                descriptionInput.value = descriptionInput.value.substring(0, 500);
            }
        });

        observationsInput.addEventListener('input', () => {
            if (observationsInput.value.length > 300) {
                observationsInput.value = observationsInput.value.substring(0, 300);
            }
        });
    }

    saveState() {
        if (this.currentStateIndex < this.stateHistory.length - 1) {
            this.stateHistory = this.stateHistory.slice(0, this.currentStateIndex + 1);
        }
        
        const currentState = {
            tasks: JSON.parse(JSON.stringify(this.tasks)),
            nextId: this.nextId,
            timestamp: new Date().toISOString()
        };
        
        this.stateHistory.push(currentState);
        this.currentStateIndex = this.stateHistory.length - 1;
        
        if (this.stateHistory.length > this.maxHistoryStates) {
            this.stateHistory.shift();
            this.currentStateIndex--;
        }
        
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.currentStateIndex > 0) {
            this.currentStateIndex--;
            this.loadState(this.currentStateIndex);
            this.showAlert('Ação desfeita!', 'info');
        } else {
            this.showAlert('Não há mais ações para desfazer.', 'warning');
        }
    }

    redo() {
        if (this.currentStateIndex < this.stateHistory.length - 1) {
            this.currentStateIndex++;
            this.loadState(this.currentStateIndex);
            this.showAlert('Ação refeita!', 'info');
        } else {
            this.showAlert('Não há mais ações para refazer.', 'warning');
        }
    }

    loadState(index) {
        const state = this.stateHistory[index];
        if (state) {
            this.tasks = state.tasks.map(task => {
                return new Task(
                    task.id,
                    task.title,
                    task.responsible,
                    task.startDate,
                    task.endDate,
                    task.priority,
                    task.description || '',
                    task.observations || '',
                    task.completed || false
                );
            });
            this.nextId = state.nextId || this.tasks.length + 1;
            this.renderTasks();
            this.updateUndoRedoButtons();
        }
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.disabled = this.currentStateIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.currentStateIndex >= this.stateHistory.length - 1;
    }

    addTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const responsible = document.getElementById('taskResponsible').value.trim();
        const startDate = document.getElementById('taskStartDate').value;
        const endDate = document.getElementById('taskEndDate').value;
        const priority = document.getElementById('taskPriority').value;
        const description = document.getElementById('taskDescription').value.trim();
        const observations = document.getElementById('taskObservations').value.trim();

        if (!title || !responsible || !startDate || !endDate || !priority) {
            this.showAlert('Por favor, preencha todos os campos obrigatórios.', 'warning');
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            this.showAlert('A data de término deve ser posterior à data de início.', 'warning');
            return;
        }

        this.saveState();

        const task = new Task(
            this.nextId++,
            title,
            responsible,
            startDate,
            endDate,
            priority,
            description,
            observations
        );

        this.tasks.push(task);
        this.renderTasks();
        document.getElementById('taskForm').reset();
        this.showAlert('Tarefa adicionada com sucesso!', 'success');
    }

    markTaskAsCompleted(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.saveState();
            task.completed = true;
            this.renderTasks();
            this.showAlert('Tarefa marcada como concluída!', 'success');
        }
    }

    deleteTask(taskId) {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            this.saveState();
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.renderTasks();
            this.showAlert('Tarefa excluída com sucesso!', 'success');
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('editTaskId').value = task.id;
            document.getElementById('editTaskTitle').value = task.title;
            document.getElementById('editTaskResponsible').value = task.responsible;
            document.getElementById('editTaskStartDate').value = task.startDate;
            document.getElementById('editTaskEndDate').value = task.endDate;
            document.getElementById('editTaskPriority').value = task.priority;
            document.getElementById('editTaskDescription').value = task.description;
            document.getElementById('editTaskObservations').value = task.observations;

            const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
            modal.show();
        }
    }

    saveEditedTask() {
        const taskId = parseInt(document.getElementById('editTaskId').value);
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            this.saveState();
            
            task.title = document.getElementById('editTaskTitle').value.trim();
            task.responsible = document.getElementById('editTaskResponsible').value.trim();
            task.startDate = document.getElementById('editTaskStartDate').value;
            task.endDate = document.getElementById('editTaskEndDate').value;
            task.priority = document.getElementById('editTaskPriority').value;
            task.description = document.getElementById('editTaskDescription').value.trim();
            task.observations = document.getElementById('editTaskObservations').value.trim();

            if (!task.title || !task.responsible || !task.startDate || !task.endDate) {
                this.showAlert('Por favor, preencha todos os campos obrigatórios.', 'warning');
                return;
            }

            if (new Date(task.endDate) < new Date(task.startDate)) {
                this.showAlert('A data de término deve ser posterior à data de início.', 'warning');
                return;
            }

            this.renderTasks();
            const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
            modal.hide();
            this.showAlert('Tarefa atualizada com sucesso!', 'success');
        }
    }

    clearCompletedTasks() {
        if (confirm('Tem certeza que deseja excluir todas as tarefas concluídas? Esta ação não pode ser desfeita.')) {
            this.saveState();
            this.tasks = this.tasks.filter(t => !t.completed);
            this.renderTasks();
            this.showAlert('Todas as tarefas concluídas foram excluídas.', 'success');
        }
    }

    renderTasks() {
        const pendingTasksContainer = document.getElementById('pendingTasks');
        const completedTasksContainer = document.getElementById('completedTasks');
        const emptyPending = document.getElementById('emptyPending');
        const emptyCompleted = document.getElementById('emptyCompleted');
        
        pendingTasksContainer.innerHTML = '';
        completedTasksContainer.innerHTML = '';
        
        const pendingTasks = this.tasks.filter(task => !task.completed);
        const completedTasks = this.tasks.filter(task => task.completed);
        
        document.getElementById('pendingCount').textContent = pendingTasks.length;
        document.getElementById('completedCount').textContent = completedTasks.length;
        
        emptyPending.style.display = pendingTasks.length === 0 ? 'block' : 'none';
        emptyCompleted.style.display = completedTasks.length === 0 ? 'block' : 'none';
        
        pendingTasks.forEach(task => {
            pendingTasksContainer.appendChild(this.createTaskCard(task));
        });
        
        completedTasks.forEach(task => {
            completedTasksContainer.appendChild(this.createTaskCard(task));
        });
    }

    createTaskCard(task) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        const priorityClass = `priority-${task.priority}`;
        const statusClass = task.completed ? 'task-completed' : 'task-pending';
        
        col.innerHTML = `
            <div class="card task-card ${statusClass} ${priorityClass}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title task-title ${task.completed ? 'completed-task' : ''}">${this.escapeHtml(task.title)}</h6>
                        <span class="badge ${this.getPriorityBadgeClass(task.priority)} badge-priority">
                            ${this.getPriorityText(task.priority)}
                        </span>
                    </div>
                    
                    <p class="card-text task-details mb-2">
                        <i class="bi bi-person me-1"></i>${this.escapeHtml(task.responsible)}
                    </p>
                    
                    <p class="card-text task-details mb-2">
                        <i class="bi bi-calendar-event me-1"></i>
                        ${this.formatDate(task.startDate)} - ${this.formatDate(task.endDate)}
                    </p>
                    
                    ${task.description ? `<p class="card-text mb-2">${this.escapeHtml(task.description)}</p>` : ''}
                    
                    ${task.observations ? `
                        <div class="mb-2">
                            <small class="text-muted"><strong>Observações:</strong> ${this.escapeHtml(task.observations)}</small>
                        </div>
                    ` : ''}
                    
                    <div class="task-actions">
                        ${!task.completed ? `
                            <button class="btn btn-sm btn-success btn-action complete-task" data-id="${task.id}" title="Marcar como concluída">
                                <i class="bi bi-check-lg"></i>
                            </button>
                            <button class="btn btn-sm btn-primary btn-action edit-task" data-id="${task.id}" title="Editar tarefa">
                                <i class="bi bi-pencil"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger btn-action delete-task" data-id="${task.id}" title="Excluir tarefa">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        if (!task.completed) {
            col.querySelector('.complete-task').addEventListener('click', () => {
                this.markTaskAsCompleted(task.id);
            });
            
            col.querySelector('.edit-task').addEventListener('click', () => {
                this.editTask(task.id);
            });
        }
        
        col.querySelector('.delete-task').addEventListener('click', () => {
            this.deleteTask(task.id);
        });
        
        return col;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getPriorityBadgeClass(priority) {
        switch (priority) {
            case 'high': return 'bg-danger';
            case 'medium': return 'bg-warning text-dark';
            case 'low': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    getPriorityText(priority) {
        switch (priority) {
            case 'high': return 'Alta';
            case 'medium': return 'Média';
            case 'low': return 'Baixa';
            default: return 'Não definida';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    validateDates(startDateId, endDateId) {
        const startDate = document.getElementById(startDateId).value;
        const endDate = document.getElementById(endDateId).value;
        
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            document.getElementById(endDateId).classList.add('is-invalid');
            document.getElementById(startDateId).classList.add('is-invalid');
        } else {
            document.getElementById(endDateId).classList.remove('is-invalid');
            document.getElementById(startDateId).classList.remove('is-invalid');
        }
    }

    showAlert(message, type) {
        const existingAlerts = document.querySelectorAll('.alert.position-fixed');
        existingAlerts.forEach(alert => alert.remove());
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '1050';
        alertDiv.style.minWidth = '300px';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }

    saveToLocalStorage() {
        const data = {
            tasks: this.tasks,
            nextId: this.nextId
        };
        
        try {
            localStorage.setItem('todoAppData', JSON.stringify(data));
            this.showAlert('Dados salvos com sucesso no localStorage!', 'success');
        } catch (e) {
            console.error('Erro ao salvar no localStorage:', e);
            this.showAlert('Erro ao salvar dados no localStorage. O storage pode estar cheio.', 'danger');
        }
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('todoAppData');
        
        if (data) {
            try {
                const parsedData = JSON.parse(data);
                this.tasks = parsedData.tasks.map(task => {
                    return new Task(
                        task.id,
                        task.title,
                        task.responsible,
                        task.startDate,
                        task.endDate,
                        task.priority,
                        task.description || '',
                        task.observations || '',
                        task.completed || false
                    );
                });
                this.nextId = parsedData.nextId || this.tasks.length + 1;
                this.showAlert('Dados recuperados com sucesso do localStorage!', 'success');
            } catch (e) {
                console.error('Erro ao carregar dados:', e);
                this.showAlert('Erro ao carregar dados do localStorage. Os dados podem estar corrompidos.', 'danger');
            }
        } else {
            this.showAlert('Nenhum dado encontrado no localStorage.', 'info');
        }
    }

    clearLocalStorage() {
        if (confirm('Tem certeza que deseja limpar todos os dados do localStorage? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('todoAppData');
            this.tasks = [];
            this.nextId = 1;
            this.stateHistory = [];
            this.currentStateIndex = -1;
            this.renderTasks();
            this.saveState();
            this.showAlert('Dados do localStorage foram limpos com sucesso!', 'success');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
