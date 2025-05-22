document.addEventListener('DOMContentLoaded', () => {
  const todayDateEl = document.getElementById('todayDate');
  const openingBalanceForm = document.getElementById('openingBalanceForm');
  const transactionForm = document.getElementById('transactionForm');
  const summaryDiv = document.getElementById('summary');
  const transactionListDiv = document.getElementById('transactionList');
  const newDayBtn = document.getElementById('newDayBtn');
  const channelSelect = document.getElementById('channelSelect');

  // Today's date string in YYYY-MM-DD format
  const todayStr = new Date().toISOString().slice(0, 10);
  todayDateEl.textContent = todayStr;

  // Storage keys scoped per day
  const keyOpeningBalances = `openingBalances_${todayStr}`;
  const keyTransactions = `transactions_${todayStr}`;

  // Retrieve or initialize today's opening balances
  function getOpeningBalances() {
    return JSON.parse(localStorage.getItem(keyOpeningBalances) || '{}');
  }
  function saveOpeningBalances(data) {
    localStorage.setItem(keyOpeningBalances, JSON.stringify(data));
  }

  // Retrieve or initialize today's transactions
  function getTransactions() {
    return JSON.parse(localStorage.getItem(keyTransactions) || '[]');
  }
  function saveTransactions(data) {
    localStorage.setItem(keyTransactions, JSON.stringify(data));
  }

  // Update the summary of balances
  function updateSummary() {
    const openingBalances = getOpeningBalances();
    const transactions = getTransactions();

    // Calculate current balance per channel = opening balance + sum(transactions)
    const balances = { ...openingBalances };

    transactions.forEach(({ amount, type, channel }) => {
      if (!(channel in balances)) balances[channel] = 0;
      balances[channel] += type === 'income' ? amount : -amount;
    });

    // Show balances
    if (Object.keys(balances).length === 0) {
      summaryDiv.innerHTML = `<p class="text-gray-500">No balances set for today.</p>`;
      return;
    }

    summaryDiv.innerHTML = Object.entries(balances)
      .map(
        ([channel, total]) =>
          `<div class="flex justify-between border-b py-1"><span>${channel}</span><span>${total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>`
      )
      .join('');
  }

  // Update transaction history list
  function updateTransactionList() {
    const transactions = getTransactions();

    if (transactions.length === 0) {
      transactionListDiv.innerHTML = `<p class="text-gray-500">No transactions recorded today.</p>`;
      return;
    }

    // Show newest first
    const rows = transactions
      .slice()
      .reverse()
      .map(({ amount, type, channel, date }) => {
        const dateObj = new Date(date);
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
          <div class="flex justify-between border-b py-1">
            <div><strong>${channel}</strong> (${type})</div>
            <div>${amount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
            <div class="text-gray-500 text-xs">${timeStr}</div>
          </div>
        `;
      });

    transactionListDiv.innerHTML = rows.join('');
  }

  // Set opening balance for a channel
  openingBalanceForm.addEventListener('submit', e => {
    e.preventDefault();
    const channel = channelSelect.value;
    const amount = parseFloat(document.getElementById('openingAmount').value);

    if (!channel) return alert('Please select a channel.');
    if (isNaN(amount) || amount < 0) return alert('Enter a valid opening amount.');

    const openingBalances = getOpeningBalances();
    openingBalances[channel] = amount;
    saveOpeningBalances(openingBalances);

    openingBalanceForm.reset();
    updateSummary();
    alert(`Opening balance set for ${channel}: ${amount.toLocaleString()}`);
  });

  // Add transaction (income or expense)
  transactionForm.addEventListener('submit', e => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const channel = document.getElementById('channel').value;

    if (!channel) return alert('Please select a channel.');
    if (isNaN(amount) || amount <= 0) return alert('Enter a valid amount.');

    // Ensure opening balance exists for channel
    const openingBalances = getOpeningBalances();
    if (!(channel in openingBalances)) {
      return alert(`Please set an opening balance for ${channel} before adding transactions.`);
    }

    const transactions = getTransactions();
    transactions.push({ amount, type, channel, date: new Date().toISOString() });
    saveTransactions(transactions);

    transactionForm.reset();
    updateSummary();
    updateTransactionList();
  });

  // New day resets opening balances and transactions (confirm first)
  newDayBtn.addEventListener('click', () => {
    if (confirm('Start a new day? This will clear today\'s opening balances and transactions.')) {
      localStorage.removeItem(keyOpeningBalances);
      localStorage.removeItem(keyTransactions);
      updateSummary();
      updateTransactionList();
      alert('New day started. Please set opening balances.');
    }
  });

  // Initial rendering
  updateSummary();
  updateTransactionList();
});
