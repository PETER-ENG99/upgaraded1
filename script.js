document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('transactionForm');
  const summaryDiv = document.getElementById('summary');

  function getTransactions() {
    return JSON.parse(localStorage.getItem('transactions') || '[]');
  }

  function saveTransactions(data) {
    localStorage.setItem('transactions', JSON.stringify(data));
  }

  function updateSummary() {
    const transactions = getTransactions();
    const balances = {};

    transactions.forEach(({ amount, type, channel }) => {
      if (!balances[channel]) balances[channel] = 0;
      balances[channel] += type === 'income' ? amount : -amount;
    });

    summaryDiv.innerHTML = Object.entries(balances)
      .map(([channel, total]) =>
        `<div class="flex justify-between border-b py-1"><span>${channel}</span><span>${total.toFixed(2)}</span></div>`
      )
      .join('');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const channel = document.getElementById('channel').value;

    if (isNaN(amount) || amount <= 0) {
      alert('Enter a valid amount.');
      return;
    }

    const transactions = getTransactions();
    transactions.push({ amount, type, channel, date: new Date().toISOString() });
    saveTransactions(transactions);

    form.reset();
    updateSummary();
  });

  updateSummary();
});
