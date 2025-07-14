// Configuração da API - detecta automaticamente a origem
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000' 
    : 'http://localhost:3000';

// Utilitários
const showNotification = (message, type = 'info') => {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    const icon = notification.querySelector('.notification-icon');
    const messageEl = notification.querySelector('.notification-message');
    
    if (!icon || !messageEl) return;
    
    // Definir ícone baseado no tipo
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    icon.textContent = icons[type] || icons.info;
    messageEl.textContent = message;
    
    // Remover classes anteriores e adicionar nova
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    // Remover notificação após 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
};

const toggleLoading = (buttonId, isLoading) => {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    const textSpan = button.querySelector('.btn-text');
    const loadingSpan = button.querySelector('.btn-loading');
    
    if (!textSpan || !loadingSpan) return;
    
    if (isLoading) {
        textSpan.style.display = 'none';
        loadingSpan.style.display = 'flex';
        button.disabled = true;
    } else {
        textSpan.style.display = 'block';
        loadingSpan.style.display = 'none';
        button.disabled = false;
    }
};

const validateUsername = (username) => {
    // Validação básica: apenas letras, números, pontos e underscores
    const regex = /^[a-zA-Z0-9._]{1,30}$/;
    return regex.test(username);
};

// Função para fazer requisições com timeout e melhor tratamento de erros
const makeRequest = async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            mode: 'cors', // Forçar CORS
            credentials: 'omit', // Não enviar cookies
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Access-Control-Allow-Origin': '*',
                ...options.headers
            }
        });
        
        clearTimeout(timeoutId);
        
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Se não for JSON, tenta obter como texto
            const text = await response.text();
            data = { message: text };
        }
        
        return {
            ok: response.ok,
            status: response.status,
            data: data
        };
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('Timeout: Servidor não respondeu em tempo hábil');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Erro de conexão: Verifique se o servidor está rodando');
        } else {
            throw error;
        }
    }
};

// Funções da API
const addUser = async (username) => {
    try {
        const result = await makeRequest(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            body: JSON.stringify({ username })
        });
        
        if (result.ok) {
            return { 
                success: true, 
                data: result.data.newUser || result.data, 
                message: result.data.msg || 'Usuário adicionado com sucesso' 
            };
        } else {
            return { 
                success: false, 
                message: result.data.msg || result.data.message || 'Erro ao adicionar usuário' 
            };
        }
    } catch (error) {
        console.error('Erro na requisição addUser:', error);
        return { success: false, message: error.message };
    }
};

const getAllUsers = async () => {
    try {
        const result = await makeRequest(`${API_BASE_URL}/users/all`);
        
        if (result.ok) {
            return { 
                success: true, 
                data: result.data.users || result.data, 
                message: result.data.msg || 'Usuários carregados com sucesso' 
            };
        } else {
            return { 
                success: false, 
                message: result.data.msg || result.data.message || 'Erro ao carregar usuários' 
            };
        }
    } catch (error) {
        console.error('Erro na requisição getAllUsers:', error);
        return { success: false, message: error.message };
    }
};

const getUserByUsername = async (username) => {
    try {
        const result = await makeRequest(`${API_BASE_URL}/users/${encodeURIComponent(username)}`);
        
        if (result.ok) {
            return { 
                success: true, 
                data: result.data.user || result.data, 
                message: result.data.msg || 'Usuário encontrado' 
            };
        } else {
            return { 
                success: false, 
                message: result.data.msg || result.data.message || 'Usuário não encontrado' 
            };
        }
    } catch (error) {
        console.error('Erro na requisição getUserByUsername:', error);
        return { success: false, message: error.message };
    }
};

const updateUserStatus = async (username, status) => {
    try {
        const result = await makeRequest(`${API_BASE_URL}/users/${encodeURIComponent(username)}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        
        if (result.ok) {
            return { 
                success: true, 
                data: result.data.updatedUser || result.data, 
                message: result.data.msg || 'Status atualizado com sucesso' 
            };
        } else {
            return { 
                success: false, 
                message: result.data.msg || result.data.message || 'Erro ao atualizar status' 
            };
        }
    } catch (error) {
        console.error('Erro na requisição updateUserStatus:', error);
        return { success: false, message: error.message };
    }
};

// Funções da página index.html
const initAddUserPage = () => {
    const form = document.getElementById('addUserForm');
    const usernameInput = document.getElementById('username');
    const previewContainer = document.getElementById('previewContainer');
    
    if (!form || !usernameInput) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        
        // Validação
        if (!username) {
            showNotification('Por favor, digite um username', 'warning');
            return;
        }
        
        if (!validateUsername(username)) {
            showNotification('Username inválido. Use apenas letras, números, pontos e underscores', 'error');
            return;
        }
        
        toggleLoading('submitBtn', true);
        
        const result = await addUser(username);
        
        toggleLoading('submitBtn', false);
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Mostrar preview se os elementos existirem
            if (previewContainer) {
                const previewUsername = document.getElementById('previewUsername');
                const previewLink = document.getElementById('previewLink');
                
                if (previewUsername && previewLink && result.data) {
                    previewUsername.textContent = `@${result.data.username}`;
                    previewLink.textContent = result.data.link;
                    previewLink.href = result.data.link;
                    previewContainer.style.display = 'block';
                    
                    // Scroll para o preview
                    previewContainer.scrollIntoView({ behavior: 'smooth' });
                }
            }
            
            // Limpar formulário
            form.reset();
        } else {
            showNotification(result.message, 'error');
        }
    });
    
    // Validação em tempo real
    usernameInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        
        if (value && !validateUsername(value)) {
            e.target.style.borderColor = 'var(--error-color)';
        } else {
            e.target.style.borderColor = '';
        }
    });
};

// Funções da página gerenciar.html
const initManagePage = () => {
    const searchBtn = document.getElementById('searchBtn');
    const loadAllBtn = document.getElementById('loadAllBtn');
    const clearBtn = document.getElementById('clearBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (!searchBtn || !loadAllBtn || !searchInput) return;
    
    // Buscar usuário específico
    searchBtn.addEventListener('click', async () => {
        const username = searchInput.value.trim();
        
        if (!username) {
            showNotification('Digite um username para buscar', 'warning');
            return;
        }
        
        toggleLoading('searchBtn', true);
        showLoadingState();
        
        const result = await getUserByUsername(username);
        
        toggleLoading('searchBtn', false);
        hideLoadingState();
        
        if (result.success) {
            displayUsers([result.data], `Busca por: ${username}`);
            showNotification('Usuário encontrado!', 'success');
        } else {
            displayUsers([], `Busca por: ${username}`);
            showNotification(result.message, 'error');
        }
    });
    
    // Carregar todos os usuários
    loadAllBtn.addEventListener('click', async () => {
        toggleLoading('loadAllBtn', true);
        showLoadingState();
        
        const result = await getAllUsers();
        
        toggleLoading('loadAllBtn', false);
        hideLoadingState();
        
        if (result.success) {
            displayUsers(result.data, 'Todos os usuários');
            showNotification(`${result.data.length} usuários carregados`, 'success');
        } else {
            displayUsers([], 'Todos os usuários');
            showNotification(result.message, 'error');
        }
    });
    
    // Limpar resultados
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearResults();
            showNotification('Resultados limpos', 'info');
        });
    }
    
    // Buscar ao pressionar Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
};

const showLoadingState = () => {
    const loadingState = document.getElementById('loadingState');
    const usersGrid = document.getElementById('usersGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsHeader = document.getElementById('resultsHeader');
    
    if (loadingState) loadingState.style.display = 'block';
    if (usersGrid) usersGrid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';
    if (resultsHeader) resultsHeader.style.display = 'none';
};

const hideLoadingState = () => {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) loadingState.style.display = 'none';
};

const displayUsers = (users, title) => {
    const usersGrid = document.getElementById('usersGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsHeader = document.getElementById('resultsHeader');
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsCount = document.getElementById('resultsCount');
    
    if (!usersGrid) return;
    
    // Garantir que users é um array
    if (!Array.isArray(users)) {
        users = [];
    }
    
    // Atualizar header
    if (resultsHeader && resultsTitle && resultsCount) {
        resultsTitle.textContent = title;
        resultsCount.textContent = `${users.length} usuário${users.length !== 1 ? 's' : ''} encontrado${users.length !== 1 ? 's' : ''}`;
        resultsHeader.style.display = 'flex';
    }
    
    // Limpar grid
    usersGrid.innerHTML = '';
    
    if (users.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // Criar cards dos usuários
    users.forEach(user => {
        if (user && user.username) {
            const userCard = createUserCard(user);
            usersGrid.appendChild(userCard);
        }
    });
};

const createUserCard = (user) => {
    const card = document.createElement('div');
    card.className = 'user-card';
    
    const statusColor = user.status ? '#28a745' : '#dc3545';
    const statusText = user.status ? 'Enviado' : 'Não Enviado';
    
    card.innerHTML = `
        <div class="user-info">
            <div class="user-username" style="color: ${statusColor}">@${user.username}</div>
            <a href="${user.link}" target="_blank" class="user-link">
                🔗 ${user.link}
            </a>
            <div class="user-status">
                <label style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
                    <input type="checkbox" ${user.status ? 'checked' : ''} onchange="toggleUserStatus('${user.username}', this.checked)">
                    <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
                </label>
            </div>
        </div>
        <div class="user-actions">
            <button class="btn btn-secondary btn-small" onclick="visitProfile('${user.link}')">
                📱 Visitar
            </button>
            <button class="btn btn-outline btn-small" onclick="copyLink('${user.link}')">
                📋 Copiar Link
            </button>
        </div>
    `;
    
    return card;
};

const toggleUserStatus = async (username, newStatus) => {
    const result = await updateUserStatus(username, newStatus);
    
    if (result.success) {
        showNotification(`Status de @${username} alterado para ${newStatus ? 'Enviado' : 'Não Enviado'}`, 'success');
        
        // Atualizar a cor do username e texto do status no card
        const userCard = document.querySelector(`input[onchange*="${username}"]`).closest('.user-card');
        if (userCard) {
            const usernameEl = userCard.querySelector('.user-username');
            const statusSpan = userCard.querySelector('.user-status span');
            const statusColor = newStatus ? '#28a745' : '#dc3545';
            const statusText = newStatus ? 'Enviado' : 'Não Enviado';
            
            if (usernameEl) {
                usernameEl.style.color = statusColor;
            }
            
            if (statusSpan) {
                statusSpan.style.color = statusColor;
                statusSpan.textContent = statusText;
            }
        }
    } else {
        showNotification(result.message, 'error');
        
        // Reverter o checkbox em caso de erro
        const checkbox = document.querySelector(`input[onchange*="${username}"]`);
        if (checkbox) {
            checkbox.checked = !newStatus;
        }
    }
};

const visitProfile = (link) => {
    window.open(link, '_blank');
};

const copyLink = async (link) => {
    try {
        await navigator.clipboard.writeText(link);
        showNotification('Link copiado para a área de transferência!', 'success');
    } catch (error) {
        // Fallback para navegadores que não suportam clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showNotification('Link copiado para a área de transferência!', 'success');
        } catch (err) {
            showNotification('Erro ao copiar link', 'error');
        }
        
        document.body.removeChild(textArea);
    }
};

const clearResults = () => {
    const usersGrid = document.getElementById('usersGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsHeader = document.getElementById('resultsHeader');
    
    if (usersGrid) usersGrid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    if (resultsHeader) resultsHeader.style.display = 'none';
};

// Função para detectar se o servidor está rodando
const checkServerStatus = async () => {
    try {
        const result = await makeRequest(`${API_BASE_URL}/users/all`);
        return result.ok;
    } catch (error) {
        console.error('Erro ao verificar status do servidor:', error);
        return false;
    }
};

// Inicialização baseada na página atual
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html' || currentPage === '') {
        initAddUserPage();
    } else if (currentPage === 'gerenciar.html') {
        initManagePage();
    }
    
    // Fechar notificação ao clicar
    const notification = document.getElementById('notification');
    if (notification) {
        notification.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
});

// Verificar status do servidor ao carregar a página
window.addEventListener('load', async () => {
    const isServerRunning = await checkServerStatus();
    
    if (!isServerRunning) {
        showNotification('⚠️ Servidor não está rodando. Certifique-se de que o backend está ativo em localhost:3000', 'warning');
    }
});