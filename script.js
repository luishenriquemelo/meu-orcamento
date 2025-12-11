// Captura elementos
const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const usersList = document.getElementById('users-list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const transType = document.getElementById('trans-type');
const userSelect = document.getElementById('user-select');

// Novos elementos de Usuário
const inputNovoUsuario = document.getElementById('novo-usuario-nome');
const btnAddUsuario = document.getElementById('btn-add-usuario');

// --- DADOS (LocalStorage) ---
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let usersDB = JSON.parse(localStorage.getItem('usersDB')) || [];

// --- FUNÇÕES DE USUÁRIO ---

// Atualiza o Select e a Lista de Rateio
function updateUsersUI() {
    // 1. Atualiza o Select do formulário
    userSelect.innerHTML = `
        <option value="" disabled selected>Selecione...</option>
        <option value="Eu">Eu (Pessoal)</option>
    `;
    usersDB.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.innerText = user;
        userSelect.appendChild(option);
    });
}

// Adicionar Novo Usuário
btnAddUsuario.addEventListener('click', () => {
    const nome = inputNovoUsuario.value.trim();
    if (nome === "") {
        alert("Digite um nome!");
        return;
    }
    if (usersDB.includes(nome)) {
        alert("Usuário já existe!");
        return;
    }

    usersDB.push(nome);
    localStorage.setItem('usersDB', JSON.stringify(usersDB));
    updateUsersUI();
    updateValues(); // Atualiza rateio para aparecer o nome novo com zero
    inputNovoUsuario.value = "";
});

// --- FUNÇÕES FINANCEIRAS ---

function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '' || !userSelect.value) {
        alert('Por favor, preencha a descrição, valor e quem gastou.');
        return;
    }

    const transaction = {
        id: generateID(),
        text: text.value,
        amount: +amount.value, // converte string para numero
        type: transType.value, // 'income' ou 'expense'
        user: userSelect.value
    };

    transactions.push(transaction);
    addTransactionDOM(transaction);
    updateValues();
    updateLocalStorage();

    text.value = '';
    amount.value = '';
}

// Gera ID aleatório
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Adiciona transação na lista visual (Histórico)
function addTransactionDOM(transaction) {
    const sign = transaction.type === 'expense' ? '-' : '+';
    const item = document.createElement('li');

    // Define a classe CSS baseada no tipo
    item.classList.add(transaction.type === 'expense' ? 'minus' : 'plus');

    item.innerHTML = `
        <div style="display:flex; flex-direction:column;">
            <strong>${transaction.text}</strong>
            <small style="color:#777">${transaction.user}</small>
        </div>
        <div>
            <span>${sign} R$ ${Math.abs(transaction.amount).toFixed(2)}</span>
            <button class="delete-btn" onclick="removeTransaction(${transaction.id})"><i class="fas fa-trash"></i></button>
        </div>
    `;

    list.prepend(item); // Adiciona no topo
}

// Atualiza os Totais (Dashboard e Rateio)
function updateValues() {
    // 1. Cálculos Gerais (Entradas e Saídas)
    const amounts_income = transactions
        .filter(t => t.type === 'income')
        .map(t => t.amount);
    
    const amounts_expense = transactions
        .filter(t => t.type === 'expense')
        .map(t => t.amount);

    const totalIncome = amounts_income.reduce((acc, item) => (acc += item), 0);
    const totalExpense = amounts_expense.reduce((acc, item) => (acc += item), 0);
    const totalBalance = totalIncome - totalExpense;

    balance.innerText = `R$ ${totalBalance.toFixed(2)}`;
    money_plus.innerText = `+ R$ ${totalIncome.toFixed(2)}`;
    money_minus.innerText = `- R$ ${totalExpense.toFixed(2)}`;

    // 2. Cálculo do Rateio (Quem deve quanto - Apenas Saídas)
    usersList.innerHTML = '';
    
    // Lista de todos usuários (Eu + Extras)
    const allUsers = ['Eu', ...usersDB];
    
    allUsers.forEach(user => {
        // Soma gastos desse usuário
        const userSpend = transactions
            .filter(t => t.user === user && t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        if (userSpend > 0 || user !== 'Eu') { // Mostra se gastou algo ou se é usuário extra
             const li = document.createElement('li');
             li.innerHTML = `
                <span>${user}</span>
                <strong>R$ ${userSpend.toFixed(2)}</strong>
             `;
             usersList.appendChild(li);
        }
    });
}

function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    init();
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function init() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateUsersUI();
    updateValues();
}

form.addEventListener('submit', addTransaction);

// Inicializa o app
init();