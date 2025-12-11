// --- ELEMENTOS DO DOM ---
const btnAddUsuario = document.getElementById('btn-add-usuario');
const inputNovoUsuario = document.getElementById('novo-usuario-nome');
const selectUsuarios = document.getElementById('user-select');
const formFinanceiro = document.getElementById('financial-form');
const listaTransacoes = document.getElementById('transaction-list');
const listaTotais = document.getElementById('user-totals');
const spanTotalGastos = document.getElementById('total-expenses');

// --- ESTADO INICIAL (Carregar do LocalStorage) ---
// Carrega transações salvas ou cria lista vazia
let transacoes = JSON.parse(localStorage.getItem('transacoes_db')) || [];
// Carrega usuários extras ou lista vazia
let usuariosExtras = JSON.parse(localStorage.getItem('usuarios_db')) || [];

// --- FUNÇÕES ---

// 1. Atualizar o Select (Dropdown) com os usuários cadastrados
function atualizarSelectUsuarios() {
    // Limpa as opções atuais (mantendo o "Quem gastou?" e "Eu")
    selectUsuarios.innerHTML = `
        <option value="" disabled selected>Quem gastou?</option>
        <option value="Eu">Eu (Pessoal)</option>
    `;
    
    // Adiciona cada usuário extra cadastrado
    usuariosExtras.forEach(usuario => {
        const option = document.createElement('option');
        option.value = usuario;
        option.innerText = usuario;
        selectUsuarios.appendChild(option);
    });
}

// 2. Adicionar Novo Usuário (A lógica do botão +)
btnAddUsuario.addEventListener('click', () => {
    const nome = inputNovoUsuario.value.trim();
    
    if (nome === "") {
        alert("Digite um nome para cadastrar!");
        return;
    }
    
    if (usuariosExtras.includes(nome)) {
        alert("Esse usuário já existe!");
        return;
    }

    // Adiciona ao array e salva
    usuariosExtras.push(nome);
    localStorage.setItem('usuarios_db', JSON.stringify(usuariosExtras));
    
    // Atualiza a tela
    atualizarSelectUsuarios();
    inputNovoUsuario.value = ""; // Limpa o campo
    alert(`Usuário "${nome}" cadastrado com sucesso!`);
});

// 3. Adicionar Transação
formFinanceiro.addEventListener('submit', (e) => {
    e.preventDefault();

    const descricao = document.getElementById('description').value;
    const valor = parseFloat(document.getElementById('amount').value);
    const tipo = document.getElementById('type').value;
    const usuario = document.getElementById('user-select').value;

    if (!usuario) {
        alert("Por favor, selecione quem gastou.");
        return;
    }

    const transacao = {
        id: Date.now(),
        descricao,
        valor,
        tipo,
        usuario
    };

    transacoes.push(transacao);
    localStorage.setItem('transacoes_db', JSON.stringify(transacoes));
    
    atualizarInterface();
    formFinanceiro.reset();
});

// 4. Atualizar a Interface (Extrato e Totais)
function atualizarInterface() {
    listaTransacoes.innerHTML = '';
    listaTotais.innerHTML = '';
    
    let totalGeralGastos = 0;
    let gastosPorUsuario = {};

    // Inicializa contadores para todos os usuários (Eu + Extras)
    gastosPorUsuario['Eu'] = 0;
    usuariosExtras.forEach(u => gastosPorUsuario[u] = 0);

    // Processa transações
    transacoes.forEach(t => {
        // Adiciona ao HTML do histórico
        const li = document.createElement('li');
        li.classList.add(t.tipo);
        li.innerHTML = `
            <strong>${t.descricao}</strong> 
            <span>${t.usuario}</span>
            <span>R$ ${t.valor.toFixed(2)}</span>
        `;
        listaTransacoes.prepend(li); // Adiciona no topo

        // Calcula totais (se for despesa)
        if (t.tipo === 'expense') {
            totalGeralGastos += t.valor;
            if (gastosPorUsuario[t.usuario] !== undefined) {
                gastosPorUsuario[t.usuario] += t.valor;
            } else {
                gastosPorUsuario[t.usuario] = t.valor;
            }
        }
    });

    // Atualiza totais na tela
    spanTotalGastos.innerText = totalGeralGastos.toFixed(2);

    // Cria lista de quanto cada um deve
    for (const [nome, valor] of Object.entries(gastosPorUsuario)) {
        if (valor > 0) {
            const li = document.createElement('li');
            li.innerHTML = `${nome}: <strong>R$ ${valor.toFixed(2)}</strong>`;
            listaTotais.appendChild(li);
        }
    }
}

// Inicializar ao abrir a página
atualizarSelectUsuarios();
atualizarInterface();