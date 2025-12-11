// --- ELEMENTOS ---
const walletBalanceEl = document.getElementById('wallet-balance');
const invoiceTotalEl = document.getElementById('invoice-total');
const myInvoicePartEl = document.getElementById('my-invoice-part');
const list = document.getElementById('transactions-list');
const invoiceSplitList = document.getElementById('invoice-split-list');
const form = document.getElementById('form');
const userSelect = document.getElementById('user-select');
const categorySelect = document.getElementById('category-select');
const categoriesListEl = document.getElementById('categories-list');

// Inputs de Cadastro
const inputNewUser = document.getElementById('new-user-name');
const btnAddUser = document.getElementById('btn-add-user');
const inputNewCategory = document.getElementById('new-category-name');
const btnAddCategory = document.getElementById('btn-add-category');

// Inputs de Transação
const descInput = document.getElementById('desc');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('trans-type');
const methodInputs = document.getElementsByName('method'); // Radio buttons

// --- ESTADO (DADOS) ---
// Tenta carregar ou inicia vazio
let transactions = JSON.parse(localStorage.getItem('transactions_v2')) || [];
let users = JSON.parse(localStorage.getItem('users_v2')) || [];
let categories = JSON.parse(localStorage.getItem('categories_v2')) || ['Alimentação', 'Transporte', 'Lazer', 'Contas Fixas', 'Saúde'];

// --- FUNÇÕES DE SETUP E UI ---

// Atualiza Dropdowns (Usuários e Categorias)
function updateDropdowns() {
    // 1. Usuários
    userSelect.innerHTML = '<option value="Eu">Eu (Pessoal)</option>';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.innerText = user;
        userSelect.appendChild(option);
    });

    // 2. Categorias Select
    categorySelect.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.innerText = cat;
        categorySelect.appendChild(option);
    });

    // 3. Painel de Tags de Categorias
    categoriesListEl.innerHTML = '';
    categories.forEach(cat => {
        const tag = document.createElement('div');
        tag.classList.add('tag');
        tag.innerHTML = `${cat} <span class="tag-delete" onclick="removeCategory('${cat}')">&times;</span>`;
        categoriesListEl.appendChild(tag);
    });
}

// --- INTEGRAÇÃO LÓGICA (O PULO DO GATO) ---
// Quando muda o usuário, se não for "Eu", força Cartão de Crédito
userSelect.addEventListener('change', (e) => {
    const selectedUser = e.target.value;
    if (selectedUser !== 'Eu') {
        document.getElementById('method-credit').checked = true;
        // Desabilita opção de débito para outros (opcional, mas evita erro)
        document.getElementById('method-debit').disabled = true;
    } else {
        document.getElementById('method-debit').disabled = false;
    }
});

// --- TRANSAÇÕES ---

function addTransaction(e) {
    e.preventDefault();

    const description = descInput.value.trim();
    const amount = +amountInput.value;
    const type = typeInput.value;
    const user = userSelect.value;
    const category = categorySelect.value;
    
    // Pega qual radio button está marcado (credit ou debit)
    let method = 'debit'; 
    for(const rb of methodInputs) {
        if(rb.checked) method = rb.value;
    }

    if(description === '' || amount === 0) {
        alert("Preencha descrição e valor.");
        return;
    }

    const transaction = {
        id: Date.now(),
        desc: description,
        amount: amount,
        type: type, // 'income' ou 'expense'
        user: user,
        category: category,
        method: method // 'debit' ou 'credit'
    };

    transactions.push(transaction);
    saveData();
    updateScreen();
    
    // Limpar form
    descInput.value = '';
    amountInput.value = '';
}

function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    updateScreen();
}

// --- CÁLCULOS PRINCIPAIS ---

function updateScreen() {
    list.innerHTML = '';
    invoiceSplitList.innerHTML = '';

    let walletTotal = 0; // Salário + Entradas - Saídas no Débito
    let invoiceTotal = 0; // Soma de tudo que é Crédito
    let myInvoiceTotal = 0; // Quanto EU gastei no crédito
    let othersInvoice = {}; // Objeto para somar gastos dos outros

    // Inicializa o objeto de rateio para os usuários cadastrados
    users.forEach(u => othersInvoice[u] = 0);

    transactions.forEach(t => {
        // 1. Renderizar Lista
        const li = document.createElement('li');
        // Define classe CSS
        if(t.type === 'income') li.classList.add('income');
        else if(t.method === 'credit') li.classList.add('expense-credit');
        else li.classList.add('expense-debit');

        const labelMethod = t.method === 'credit' ? '<span class="badge-credit">Cartão</span>' : '';
        const sign = t.type === 'expense' ? '-' : '+';

        li.innerHTML = `
            <div class="transaction-info">
                <strong>${t.desc} ${labelMethod}</strong>
                <small>${t.user} | ${t.category} | ${t.date ? t.date : 'Hoje'}</small>
            </div>
            <div style="display:flex; align-items:center;">
                <span class="transaction-amount">${sign} R$ ${t.amount.toFixed(2)}</span>
                <button class="delete-btn" onclick="removeTransaction(${t.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.prepend(li); // Adiciona no topo

        // 2. Matemática Financeira
        if (t.type === 'income') {
            // Entrada sempre vai pra conta/carteira
            walletTotal += t.amount;
        } else {
            // É DESPESA
            if (t.method === 'debit') {
                // Se pagou no débito, sai da carteira na hora
                walletTotal -= t.amount;
            } else {
                // Se é Crédito, soma na FATURA
                invoiceTotal += t.amount;
                
                // Separa quem gastou no crédito
                if(t.user === 'Eu') {
                    myInvoiceTotal += t.amount;
                } else {
                    if(!othersInvoice[t.user]) othersInvoice[t.user] = 0;
                    othersInvoice[t.user] += t.amount;
                }
            }
        }
    });

    // Atualiza Dashboard
    walletBalanceEl.innerText = `R$ ${walletTotal.toFixed(2)}`;
    invoiceTotalEl.innerText = `R$ ${invoiceTotal.toFixed(2)}`;
    
    // Atualiza Rateio (Quem deve no cartão)
    for (const [nome, valor] of Object.entries(othersInvoice)) {
        if (valor > 0) {
            const li = document.createElement('li');
            li.innerHTML = `<span>${nome}</span> <strong>R$ ${valor.toFixed(2)}</strong>`;
            invoiceSplitList.appendChild(li);
        }
    }
    
    myInvoicePartEl.innerText = `R$ ${myInvoiceTotal.toFixed(2)}`;
}

// --- CADASTROS AUXILIARES ---

// Adicionar Usuário
btnAddUser.addEventListener('click', () => {
    const name = inputNewUser.value.trim();
    if(name && !users.includes(name)) {
        users.push(name);
        saveData();
        updateDropdowns();
        inputNewUser.value = '';
    }
});

// Adicionar Categoria
btnAddCategory.addEventListener('click', () => {
    const cat = inputNewCategory.value.trim();
    if(cat && !categories.includes(cat)) {
        categories.push(cat);
        saveData();
        updateDropdowns();
        inputNewCategory.value = '';
    }
});

// Remover Categoria
window.removeCategory = function(catName) {
    if(confirm(`Remover categoria ${catName}?`)) {
        categories = categories.filter(c => c !== catName);
        saveData();
        updateDropdowns();
    }
}

// Persistência
function saveData() {
    localStorage.setItem('transactions_v2', JSON.stringify(transactions));
    localStorage.setItem('users_v2', JSON.stringify(users));
    localStorage.setItem('categories_v2', JSON.stringify(categories));
}

// Limpar Tudo (Reset)
document.getElementById('btn-clear-all').addEventListener('click', () => {
    if(confirm("Tem certeza? Isso apagará TUDO.")) {
        localStorage.clear();
        location.reload();
    }
});

// Inicialização
updateDropdowns();
updateScreen();