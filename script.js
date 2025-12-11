// --- DADOS INICIAIS ---
const defaultCategories = [
    { id: '1', name: 'Salário', type: 'income', limit: 0, color: '#10b981' },
    { id: '2', name: 'Freelance', type: 'income', limit: 0, color: '#34d399' },
    { id: '3', name: 'Alimentação', type: 'expense', limit: 800, color: '#ef4444' },
    { id: '4', name: 'Moradia', type: 'expense', limit: 1200, color: '#f59e0b' },
    { id: '5', name: 'Transporte', type: 'expense', limit: 400, color: '#3b82f6' },
    { id: '6', name: 'Lazer', type: 'expense', limit: 300, color: '#8b5cf6' }
];

let appData = {
    transactions: [],
    categories: defaultCategories
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupFilters();
    updateDashboard();
    renderTransactions();
    renderCategoryList();
    
    // Define a data de hoje no input escondido
    document.getElementById('date').valueAsDate = new Date();
});

// --- PERSISTÊNCIA (LOCALSTORAGE) ---
function saveData() {
    localStorage.setItem('budgetApp', JSON.stringify(appData));
    updateDashboard();
    renderTransactions();
    renderCategoryList();
}

function loadData() {
    const data = localStorage.getItem('budgetApp');
    if (data) {
        appData = JSON.parse(data);
    }
}

// --- NAVEGAÇÃO ---
function showSection(sectionId) {
    // Remove classe ativa de todas as seções e links
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar li').forEach(l => l.classList.remove('active'));
    
    // Ativa a seção desejada
    document.getElementById(sectionId).classList.add('active');
    
    // Ativa o menu correspondente
    const menuIndex = sectionId === 'dashboard' ? 0 : sectionId === 'transactions' ? 1 : 2;
    document.querySelectorAll('.sidebar li')[menuIndex].classList.add('active');
}

// --- DASHBOARD E CÁLCULOS ---
function updateDashboard() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtra transações do mês atual
    const currentTrans = appData.transactions.filter(t => {
        const d = new Date(t.date + 'T00:00:00');
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = currentTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = currentTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    document.getElementById('total-income').innerText = formatCurrency(income);
    document.getElementById('total-expense').innerText = formatCurrency(expense);
    document.getElementById('total-balance').innerText = formatCurrency(income - expense);

    drawChart(currentTrans);
    checkBudgets(currentTrans);
}

function checkBudgets(transactions) {
    const list = document.getElementById('budget-alerts');
    list.innerHTML = '';
    
    const expensesByCategory = {};
    transactions.forEach(t => {
        if(t.type === 'expense') {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        }
    });

    // Gera alertas para categorias de despesa com limite definido
    appData.categories.filter(c => c.type === 'expense' && c.limit > 0).forEach(cat => {
        const spent = expensesByCategory[cat.name] || 0;
        const percent = (spent / cat.limit) * 100;
        
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${cat.name}</span>
            <span class="${percent > 100 ? 'over-budget' : ''}">
                ${formatCurrency(spent)} / ${formatCurrency(cat.limit)}
            </span>
        `;
        list.appendChild(li);
    });
}

// --- GRÁFICO (PIZZA) ---
function drawChart(transactions) {
    const canvas = document.getElementById('expenseChart');
    const ctx = canvas.getContext('2d');
    const legend = document.getElementById('chart-legend');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    legend.innerHTML = '';

    const data = {};
    let total = 0;
    
    // Agrupa despesas
    transactions.filter(t => t.type === 'expense').forEach(t => {
        data[t.category] = (data[t.category] || 0) + t.amount;
        total += t.amount;
    });

    if (total === 0) {
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Sem despesas este mês", canvas.width/2, canvas.height/2);
        return;
    }

    let startAngle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    Object.keys(data).forEach(catName => {
        const value = data[catName];
        const sliceAngle = (value / total) * 2 * Math.PI;
        const categoryObj = appData.categories.find(c => c.name === catName);
        const color = categoryObj ? categoryObj.color : '#ccc';

        // Desenha fatia
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        startAngle += sliceAngle;

        // Cria legenda
        legend.innerHTML += `
            <div class="legend-item">
                <div class="color-box" style="background:${color}"></div>
                <span>${catName} (${Math.round((value/total)*100)}%)</span>
            </div>
        `;
    });
}

// --- LÓGICA DE TRANSAÇÕES (Adicionar, Editar, Excluir) ---

function renderTransactions() {
    const tbody = document.getElementById('transaction-list');
    tbody.innerHTML = '';

    const filterMonth = parseInt(document.getElementById('filter-month').value);
    const filterYear = parseInt(document.getElementById('filter-year').value);

    // Filtra e ordena por data (mais recente primeiro)
    const filtered = appData.transactions.filter(t => {
        const d = new Date(t.date + 'T00:00:00');
        return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));

    filtered.forEach(t => {
        const row = document.createElement('tr');
        const amountClass = t.type === 'income' ? 'amount-income' : 'amount-expense';
        const sign = t.type === 'income' ? '+' : '-';
        
        row.innerHTML = `
            <td>${formatDate(t.date)}</td>
            <td>${t.desc}</td>
            <td>${t.category}</td>
            <td class="${amountClass}">${sign} ${formatCurrency(t.amount)}</td>
            <td>
                <button class="btn-action" onclick="editTransaction('${t.id}')" title="Editar">✎</button>
                <button class="btn-action" onclick="deleteTransaction('${t.id}')" style="color:red" title="Excluir">🗑</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function saveTransaction(e) {
    e.preventDefault();
    
    const id = document.getElementById('trans-id').value;
    const type = document.querySelector('input[name="type"]:checked').value;
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    const transaction = {
        id: id || Date.now().toString(),
        type, desc, amount, category, date
    };

    if (id) {
        // EDIÇÃO: Encontra e atualiza
        const index = appData.transactions.findIndex(t => t.id === id);
        if(index !== -1) appData.transactions[index] = transaction;
    } else {
        // NOVA: Adiciona ao array
        appData.transactions.push(transaction);
    }

    saveData();
    closeModal();
}

function editTransaction(id) {
    const t = appData.transactions.find(t => t.id === id);
    if (!t) return;

    // Preenche os campos do modal com os dados existentes
    document.getElementById('trans-id').value = t.id;
    document.getElementById('desc').value = t.desc;
    document.getElementById('amount').value = t.amount;
    document.getElementById('date').value = t.date;
    
    // Marca o radio button correto
    const radios = document.getElementsByName('type');
    for(let r of radios) { 
        if(r.value === t.type) r.checked = true; 
    }
    
    // Atualiza o select de categorias com base no tipo e seleciona a categoria certa
    updateCategorySelect();
    document.getElementById('category').value = t.category;
    
    // Abre o modal em modo de edição
    document.getElementById('modal-title').innerText = "Editar Transação";
    document.getElementById('modal').style.display = 'flex';
}

function deleteTransaction(id) {
    if(confirm('Tem certeza que deseja excluir esta transação?')) {
        appData.transactions = appData.transactions.filter(t => t.id !== id);
        saveData();
    }
}

// --- LÓGICA DE CATEGORIAS (Adicionar, Editar, Excluir) ---

function renderCategoryList() {
    const list = document.getElementById('category-list');
    list.innerHTML = '';
    
    appData.categories.forEach(cat => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '10px';
        li.style.borderBottom = '1px solid #eee';
        li.style.background = '#fff';
        
        const colorIndicator = `<span style="display:inline-block; width:10px; height:10px; background:${cat.color}; border-radius:50%; margin-right:8px;"></span>`;

        li.innerHTML = `
            <div>
                ${colorIndicator}
                <strong>${cat.name}</strong> 
                <small style="color:#666">(${cat.type === 'income' ? 'Rec.' : 'Desp.'})</small>
                <div style="font-size: 0.85rem; color: #888;">Meta: ${formatCurrency(cat.limit)}</div>
            </div>
            <div>
                <button class="btn-action" onclick="editCategory('${cat.id}')" title="Editar">✎</button>
                <button class="btn-action" onclick="deleteCategory('${cat.id}')" style="color:red" title="Excluir">🗑</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function saveCategory(e) {
    e.preventDefault();
    const id = document.getElementById('cat-id').value;
    const name = document.getElementById('cat-name').value;
    const type = document.getElementById('cat-type').value;
    const limit = parseFloat(document.getElementById('cat-limit').value);

    if (id) {
        // Editar Categoria Existente
        const index = appData.categories.findIndex(c => c.id === id);
        if (index !== -1) {
            appData.categories[index].name = name;
            appData.categories[index].type = type;
            appData.categories[index].limit = limit;
        }
    } else {
        // Nova Categoria
        const color = '#' + Math.floor(Math.random()*16777215).toString(16);
        appData.categories.push({
            id: Date.now().toString(),
            name, type, limit, color
        });
    }

    saveData();
    resetCategoryForm();
}

function editCategory(id) {
    const cat = appData.categories.find(c => c.id === id);
    if (!cat) return;

    document.getElementById('cat-id').value = cat.id;
    document.getElementById('cat-name').value = cat.name;
    document.getElementById('cat-type').value = cat.type;
    document.getElementById('cat-limit').value = cat.limit;
    
    document.getElementById('btn-save-cat').innerText = "Atualizar Categoria";
    document.querySelector('.category-manager').scrollIntoView({ behavior: 'smooth' });
}

function deleteCategory(id) {
    if (confirm('Tem certeza? Se excluir, o histórico antigo permanecerá com o nome, mas a categoria sumirá das opções.')) {
        appData.categories = appData.categories.filter(c => c.id !== id);
        saveData();
    }
}

function resetCategoryForm() {
    document.getElementById('category-form').reset();
    document.getElementById('cat-id').value = '';
    document.getElementById('btn-save-cat').innerText = "Adicionar Categoria";
}

// --- FUNÇÕES AUXILIARES E MODAL ---

function openNewTransactionModal() {
    resetModalForm();
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    resetModalForm();
}

function resetModalForm() {
    document.getElementById('trans-id').value = '';
    document.getElementById('modal-title').innerText = "Nova Transação";
    document.getElementById('transaction-form').reset();
    document.getElementById('date').valueAsDate = new Date();
    // Reseta para despesa por padrão e atualiza categorias
    document.querySelector('input[name="type"][value="expense"]').checked = true;
    updateCategorySelect();
}

function updateCategorySelect() {
    const type = document.querySelector('input[name="type"]:checked').value;
    const select = document.getElementById('category');
    select.innerHTML = '';

    appData.categories
        .filter(c => c.type === type)
        .forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.innerText = c.name;
            select.appendChild(opt);
        });
}

function setupFilters() {
    const monthSelect = document.getElementById('filter-month');
    const yearSelect = document.getElementById('filter-year');
    
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    // Limpa antes de preencher para evitar duplicação se chamado novamente
    monthSelect.innerHTML = '';
    yearSelect.innerHTML = '';

    months.forEach((m, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.innerText = m;
        if(i === new Date().getMonth()) opt.selected = true;
        monthSelect.appendChild(opt);
    });

    const currentYear = new Date().getFullYear();
    for(let i = currentYear - 2; i <= currentYear + 2; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.innerText = i;
        if(i === currentYear) opt.selected = true;
        yearSelect.appendChild(opt);
    }
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateString) {
    // Corrige problema de fuso horário ao exibir
    const parts = dateString.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}