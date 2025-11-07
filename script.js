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
        // Verificar se os elementos existem antes de adicionar event listeners
        const taskForm = document.getElementById('taskForm');
        const taskStartDate = document.getElementById('taskStartDate');
        const taskEndDate = document.getElementById('taskEndDate');
        const saveData = document.getElementById('saveData');
        const loadData = document.getElementById('loadData');
        const clearData = document.getElementById('clearData');
        const clearCompleted = document.getElementById('clearCompleted');
        const saveEditTask = document.getElementById('saveEditTask');

        // Adicionar event listeners apenas para elementos que existem
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTask();
            });
        }

        if (taskStartDate && taskEndDate) {
            taskStartDate.addEventListener('change', () => {
                this.validateDates('taskStartDate', 'taskEndDate');
            });
            taskEndDate.addEventListener('change', () => {
                this.validateDates('taskStartDate', 'taskEndDate');
            });
        }

        if (saveData) {
            saveData.addEventListener('click', () => {
                this.saveToLocalStorage();
            });
        }

        if (loadData) {
            loadData.addEventListener('click', () => {
                this.loadFromLocalStorage();
                this.renderTasks();
                this.saveState();
            });
        }

        if (clearData) {
            clearData.addEventListener('click', () => {
                this.clearLocalStorage();
            });
        }

        if (clearCompleted) {
            clearCompleted.addEventListener('click', () => {
                this.clearCompletedTasks();
            });
        }

        if (saveEditTask) {
            saveEditTask.addEventListener('click', () => {
                this.saveEditedTask();
            });
        }

        // Adicionar atalhos de teclado para undo/redo (Ctrl+Z e Ctrl+Y)
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

        // Adicionar event listeners apenas se os elementos existirem
        [titleInput, responsibleInput, descriptionInput, observationsInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    const maxLength = this.getMaxLengthForInput(input.id);
                    if (input.value.length > maxLength) {
                        input.value = input.value.substring(0, maxLength);
                    }
                });
            }
        });
    }

    getMaxLengthForInput(inputId) {
        const maxLengths = {
            'taskTitle': 100,
            'taskResponsible': 50,
            'taskDescription': 500,
            'taskObservations': 300,
            'editTaskTitle': 100,
            'editTaskResponsible': 50,
            'editTaskDescription': 500,
            'editTaskObservations': 300
        };
        return maxLengths[inputId] || 255;
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
        // Esta função é mantida para compatibilidade, mas os botões não existem no HTML
        console.log('Estado atual:', this.currentStateIndex, 'Total de estados:', this.stateHistory.length);
    }

    addTask() {
        const titleInput = document.getElementById('taskTitle');
        const responsibleInput = document.getElementById('taskResponsible');
        const startDateInput = document.getElementById('taskStartDate');
        const endDateInput = document.getElementById('taskEndDate');
        const priorityInput = document.getElementById('taskPriority');
        const descriptionInput = document.getElementById('taskDescription');
        const observationsInput = document.getElementById('taskObservations');

        // Verificar se os elementos existem
        if (!titleInput || !responsibleInput || !startDateInput || !endDateInput || !priorityInput) {
            this.showAlert('Erro: elementos do formulário não encontrados.', 'danger');
            return;
        }

        const title = titleInput.value.trim();
        const responsible = responsibleInput.value.trim();
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const priority = priorityInput.value;
        const description = descriptionInput ? descriptionInput.value.trim() : '';
        const observations = observationsInput ? observationsInput.value.trim() : '';

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
        
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.reset();
        }
        
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
            // Verificar se os elementos de edição existem
            const editTaskId = document.getElementById('editTaskId');
            const editTaskTitle = document.getElementById('editTaskTitle');
            const editTaskResponsible = document.getElementById('editTaskResponsible');
            const editTaskStartDate = document.getElementById('editTaskStartDate');
            const editTaskEndDate = document.getElementById('editTaskEndDate');
            const editTaskPriority = document.getElementById('editTaskPriority');
            const editTaskDescription = document.getElementById('editTaskDescription');
            const editTaskObservations = document.getElementById('editTaskObservations');

            if (editTaskId) editTaskId.value = task.id;
            if (editTaskTitle) editTaskTitle.value = task.title;
            if (editTaskResponsible) editTaskResponsible.value = task.responsible;
            if (editTaskStartDate) editTaskStartDate.value = task.startDate;
            if (editTaskEndDate) editTaskEndDate.value = task.endDate;
            if (editTaskPriority) editTaskPriority.value = task.priority;
            if (editTaskDescription) editTaskDescription.value = task.description;
            if (editTaskObservations) editTaskObservations.value = task.observations;

            const modalElement = document.getElementById('editTaskModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        }
    }

    saveEditedTask() {
        const taskIdInput = document.getElementById('editTaskId');
        if (!taskIdInput) return;

        const taskId = parseInt(taskIdInput.value);
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            this.saveState();
            
            const editTaskTitle = document.getElementById('editTaskTitle');
            const editTaskResponsible = document.getElementById('editTaskResponsible');
            const editTaskStartDate = document.getElementById('editTaskStartDate');
            const editTaskEndDate = document.getElementById('editTaskEndDate');
            const editTaskPriority = document.getElementById('editTaskPriority');
            const editTaskDescription = document.getElementById('editTaskDescription');
            const editTaskObservations = document.getElementById('editTaskObservations');

            if (editTaskTitle) task.title = editTaskTitle.value.trim();
            if (editTaskResponsible) task.responsible = editTaskResponsible.value.trim();
            if (editTaskStartDate) task.startDate = editTaskStartDate.value;
            if (editTaskEndDate) task.endDate = editTaskEndDate.value;
            if (editTaskPriority) task.priority = editTaskPriority.value;
            if (editTaskDescription) task.description = editTaskDescription.value.trim();
            if (editTaskObservations) task.observations = editTaskObservations.value.trim();

            if (!task.title || !task.responsible || !task.startDate || !task.endDate || !task.priority) {
                this.showAlert('Por favor, preencha todos os campos obrigatórios.', 'warning');
                return;
            }

            if (new Date(task.endDate) < new Date(task.startDate)) {
                this.showAlert('A data de término deve ser posterior à data de início.', 'warning');
                return;
            }

            this.renderTasks();
            const modalElement = document.getElementById('editTaskModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
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
        
        if (!pendingTasksContainer || !completedTasksContainer) return;
        
        pendingTasksContainer.innerHTML = '';
        completedTasksContainer.innerHTML = '';
        
        const pendingTasks = this.tasks.filter(task => !task.completed);
        const completedTasks = this.tasks.filter(task => task.completed);
        
        const pendingCount = document.getElementById('pendingCount');
        const completedCount = document.getElementById('completedCount');
        
        if (pendingCount) pendingCount.textContent = pendingTasks.length;
        if (completedCount) completedCount.textContent = completedTasks.length;
        
        if (emptyPending) emptyPending.style.display = pendingTasks.length === 0 ? 'block' : 'none';
        if (emptyCompleted) emptyCompleted.style.display = completedTasks.length === 0 ? 'block' : 'none';
        
        pendingTasks.forEach(task => {
            pendingTasksContainer.appendChild(this.createTaskCard(task));
        });
        
        completedTasks.forEach(task => {
            completedTasksContainer.appendChild(this.createTaskCard(task));
        });
    }

    createTaskCard(task) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-3';
        
        const priorityClass = `priority-${task.priority}`;
        const statusClass = task.completed ? 'task-completed' : 'task-pending';
        
        col.innerHTML = `
            <div class="card task-card ${statusClass} ${priorityClass} h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title task-title ${task.completed ? 'completed-task' : ''}">${this.escapeHtml(task.title)}</h6>
                        <span class="badge ${this.getPriorityBadgeClass(task.priority)}">
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
                    
                    ${task.description ? `<p class="card-text mb-2 small">${this.escapeHtml(task.description)}</p>` : ''}
                    
                    ${task.observations ? `
                        <div class="mb-2">
                            <small class="text-muted"><strong>Observações:</strong> ${this.escapeHtml(task.observations)}</small>
                        </div>
                    ` : ''}
                    
                    <div class="task-actions mt-auto">
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
            const completeBtn = col.querySelector('.complete-task');
            const editBtn = col.querySelector('.edit-task');
            
            if (completeBtn) {
                completeBtn.addEventListener('click', () => {
                    this.markTaskAsCompleted(task.id);
                });
            }
            
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    this.editTask(task.id);
                });
            }
        }
        
        const deleteBtn = col.querySelector('.delete-task');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteTask(task.id);
            });
        }
        
        return col;
    }

    escapeHtml(text) {
        if (!text) return '';
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
        if (!dateString) return 'Não definida';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    validateDates(startDateId, endDateId) {
        const startDate = document.getElementById(startDateId);
        const endDate = document.getElementById(endDateId);
        
        if (!startDate || !endDate) return;
        
        if (startDate.value && endDate.value && new Date(endDate.value) < new Date(startDate.value)) {
            endDate.classList.add('is-invalid');
            startDate.classList.add('is-invalid');
        } else {
            endDate.classList.remove('is-invalid');
            startDate.classList.remove('is-invalid');
        }
    }

    showAlert(message, type) {
        // Remover alertas existentes
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
        
        // Auto-remover após 3 segundos
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
                // Inicializar com array vazio em caso de erro
                this.tasks = [];
                this.nextId = 1;
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

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
