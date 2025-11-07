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
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.renderTasks();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Formulário de adição de tarefa
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Validação de datas
        document.getElementById('taskStartDate').addEventListener('change', () => {
            this.validateDates('taskStartDate', 'taskEndDate');
        });

        document.getElementById('taskEndDate').addEventListener('change', () => {
            this.validateDates('taskStartDate', 'taskEndDate');
        });

        // Botões de controle de dados
        document.getElementById('saveData').addEventListener('click', () => {
            this.saveToLocalStorage();
        });

        document.getElementById('loadData').addEventListener('click', () => {
            this.loadFromLocalStorage();
            this.renderTasks();
        });

        document.getElementById('clearData').addEventListener('click', () => {
            this.clearLocalStorage();
        });

        // Botão para excluir tarefas concluídas
        document.getElementById('clearCompleted').addEventListener('click', () => {
            this.clearCompletedTasks();
        });

        // Botão para salvar edição de tarefa
        document.getElementById('saveEditTask').addEventListener('click', () => {
            this.saveEditedTask();
        });
    }

    // Adicionar uma nova tarefa
    addTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const responsible = document.getElementById('taskResponsible').value.trim();
        const startDate = document.getElementById('taskStartDate').value;
        const endDate = document.getElementById('taskEndDate').value;
        const priority = document.getElementById('taskPriority').value;
        const description = document.getElementById('taskDescription').value.trim();
        const observations = document.getElementById('taskObservations').value.trim();

        // Validação básica
        if (!title || !responsible || !startDate || !endDate || !priority) {
            this.showAlert('Por favor, preencha todos os campos obrigatórios.', 'warning');
            return;
        }

        // Verificar se a data de término é posterior à data de início
        if (new Date(endDate) < new Date(startDate)) {
            this.showAlert('A data de término deve ser posterior à data de início.', 'warning');
            return;
        }

        // Criar nova tarefa
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

    // Marcar tarefa como concluída
    markTaskAsCompleted(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = true;
            this.renderTasks();
            this.showAlert('Tarefa marcada como concluída!', 'success');
        }
    }

    // Excluir tarefa
    deleteTask(taskId) {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.renderTasks();
            this.showAlert('Tarefa excluída com sucesso!', 'success');
        }
    }

    // Abrir modal para editar tarefa
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

    // Salvar tarefa editada
    saveEditedTask() {
        const taskId = parseInt(document.getElementById('editTaskId').value);
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            task.title = document.getElementById('editTaskTitle').value.trim();
            task.responsible = document.getElementById('editTaskResponsible').value.trim();
            task.startDate = document.getElementById('editTaskStartDate').value;
            task.endDate = document.getElementById('editTaskEndDate').value;
            task.priority = document.getElementById('editTaskPriority').value;
            task.description = document.getElementById('editTaskDescription').value.trim();
            task.observations = document.getElementById('editTaskObservations').value.trim();

            // Validação
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

    // Excluir todas as tarefas concluídas
    clearCompletedTasks() {
        if (confirm('Tem certeza que deseja excluir todas as tarefas concluídas? Esta ação não pode ser desfeita.')) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.renderTasks();
            this.showAlert('Todas as tarefas concluídas foram excluídas.', 'success');
        }
    }

    // Renderizar as tarefas na interface
    renderTasks() {
        const pendingTasksContainer = document.getElementById('pendingTasks');
        const completedTasksContainer = document.getElementById('completedTasks');
        const emptyPending = document.getElementById('emptyPending');
        const emptyCompleted = document.getElementById('emptyCompleted');
        
        // Limpar containers
        pendingTasksContainer.innerHTML = '';
        completedTasksContainer.innerHTML = '';
        
        // Filtrar tarefas
        const pendingTasks = this.tasks.filter(task => !task.completed);
        const completedTasks = this.tasks.filter(task => task.completed);
        
        // Atualizar contadores
        document.getElementById('pendingCount').textContent = pendingTasks.length;
        document.getElementById('completedCount').textContent = completedTasks.length;
        
        // Mostrar/ocultar estados vazios
        emptyPending.style.display = pendingTasks.length === 0 ? 'block' : 'none';
        emptyCompleted.style.display = completedTasks.length === 0 ? 'block' : 'none';
        
        // Renderizar tarefas pendentes
        pendingTasks.forEach(task => {
            pendingTasksContainer.appendChild(this.createTaskCard(task));
        });
        
        // Renderizar tarefas concluídas
        completedTasks.forEach(task => {
            completedTasksContainer.appendChild(this.createTaskCard(task));
        });
    }

    // Criar cartão de tarefa
    createTaskCard(task) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        const priorityClass = `priority-${task.priority}`;
        const statusClass = task.completed ? 'task-completed' : 'task-pending';
        
        col.innerHTML = `
            <div class="card task-card ${statusClass} ${priorityClass}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title task-title ${task.completed ? 'completed-task' : ''}">${task.title}</h6>
                        <span class="badge ${this.getPriorityBadgeClass(task.priority)} badge-priority">
                            ${this.getPriorityText(task.priority)}
                        </span>
                    </div>
                    
                    <p class="card-text task-details mb-2">
                        <i class="bi bi-person me-1"></i>${task.responsible}
                    </p>
                    
                    <p class="card-text task-details mb-2">
                        <i class="bi bi-calendar-event me-1"></i>
                        ${this.formatDate(task.startDate)} - ${this.formatDate(task.endDate)}
                    </p>
                    
                    ${task.description ? `<p class="card-text mb-2">${task.description}</p>` : ''}
                    
                    ${task.observations ? `
                        <div class="mb-2">
                            <small class="text-muted"><strong>Observações:</strong> ${task.observations}</small>
                        </div>
                    ` : ''}
                    
                    <div class="task-actions">
                        ${!task.completed ? `
                            <button class="btn btn-sm btn-success btn-action complete-task" data-id="${task.id}">
                                <i class="bi bi-check-lg"></i>
                            </button>
                            <button class="btn btn-sm btn-primary btn-action edit-task" data-id="${task.id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger btn-action delete-task" data-id="${task.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar event listeners aos botões
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

    // Obter classe do badge de prioridade
    getPriorityBadgeClass(priority) {
        switch (priority) {
            case 'high': return 'bg-danger';
            case 'medium': return 'bg-warning text-dark';
            case 'low': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    // Obter texto da prioridade
    getPriorityText(priority) {
        switch (priority) {
            case 'high': return 'Alta';
            case 'medium': return 'Média';
            case 'low': return 'Baixa';
            default: return 'Não definida';
        }
    }

    // Formatar data para exibição
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    // Validar datas
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

    // Mostrar alerta
    showAlert(message, type) {
        // Criar elemento de alerta
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
        
        // Remover alerta após 3 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }

    // Salvar dados no localStorage
    saveToLocalStorage() {
        const data = {
            tasks: this.tasks,
            nextId: this.nextId
        };
        
        localStorage.setItem('todoAppData', JSON.stringify(data));
        this.showAlert('Dados salvos com sucesso no localStorage!', 'success');
    }

    // Carregar dados do localStorage
    loadFromLocalStorage() {
        const data = localStorage.getItem('todoAppData');
        
        if (data) {
            try {
                const parsedData = JSON.parse(data);
                this.tasks = parsedData.tasks.map(task => {
                    // Garantir que todas as propriedades existam
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
                this.showAlert('Erro ao carregar dados do localStorage.', 'danger');
            }
        } else {
            this.showAlert('Nenhum dado encontrado no localStorage.', 'info');
        }
    }

    // Limpar localStorage
    clearLocalStorage() {
        if (confirm('Tem certeza que deseja limpar todos os dados do localStorage? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('todoAppData');
            this.tasks = [];
            this.nextId = 1;
            this.renderTasks();
            this.showAlert('Dados do localStorage foram limpos com sucesso!', 'success');
        }
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});