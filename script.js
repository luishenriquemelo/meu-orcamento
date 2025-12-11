// Recupera dados do LocalStorage ou inicia padrões
const storageTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
const storagePeople = JSON.parse(localStorage.getItem('people')) || ['Eu', 'Pai', 'Mãe', 'Esposa'];

let transactions = storageTransactions;
let people = storagePeople;

const list = document.getElementById('transactions-list');
const form = document.getElementById('transaction-form');
const totalAmount = document.getElementById('total-amount');
const myAmount = document.getElementById('my-amount');
const othersAmount = document.getElementById('others-amount');
const personSelect = document.getElementById('person-select');
const peopleSummary =