document.getElementById('testForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    event_type: document.getElementById('eventType').value,
    user_id: document.getElementById('userId').value || undefined,
    amount: parseFloat(document.getElementById('amount').value),
    currency: document.getElementById('currency').value,
    transaction_id: document.getElementById('transactionId').value || undefined,
  };
  const resultDiv = document.getElementById('result');
  resultDiv.textContent = 'Sending webhook...';

  try {
    const response = await fetch(window.location.href, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    resultDiv.textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    resultDiv.textContent = 'Error: ' + error.message;
  }
});
