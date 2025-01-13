document.getElementById('calculate').addEventListener('click', () => {
    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    let totalBuyQty = 0;
    let totalSellQty = 0;

    for (let i = 1; i <= 10; i++) {
        const buyQty = parseFloat(document.getElementById(`buyQty${i}`).value) || 0;
        const buyValue = parseFloat(document.getElementById(`buyValue${i}`).value) || 0;
        const sellQty = parseFloat(document.getElementById(`sellQty${i}`).value) || 0;
        const sellValue = parseFloat(document.getElementById(`sellValue${i}`).value) || 0;

        totalBuyAmount += buyQty * buyValue;
        totalSellAmount += sellQty * sellValue;

        totalBuyQty += buyQty;
        totalSellQty += sellQty;
    }

    const averageBuyValue = totalBuyQty > 0 ? totalBuyAmount / totalBuyQty : 0;
    const averageSellValue = totalSellQty > 0 ? totalSellAmount / totalSellQty : 0;
    const totalProfit = totalSellAmount - totalBuyAmount;

    document.getElementById('totalBuyAmount').value = totalBuyAmount.toFixed(2);
    document.getElementById('totalSellAmount').value = totalSellAmount.toFixed(2);
    document.getElementById('totalBuyQuantity').value = totalBuyQty.toFixed(2);
    document.getElementById('totalSellQuantity').value = totalSellQty.toFixed(2);
    document.getElementById('averageBuyValue').value = averageBuyValue.toFixed(2);
    document.getElementById('averageSellValue').value = averageSellValue.toFixed(2);
    document.getElementById('totalProfit').value = totalProfit.toFixed(2);
});

// Add event listener for the Reset button
document.getElementById('reset').addEventListener('click', () => {
    const buyQty1 = document.getElementById("buyQty1");
    // Loop through all input fields and reset their values to 0 or empty
    for (let i = 1; i <= 10; i++) {
        document.getElementById(`buyQty${i}`).value = '';
        document.getElementById(`buyValue${i}`).value = '';
        document.getElementById(`sellQty${i}`).value = '';
        document.getElementById(`sellValue${i}`).value = '';
    }

    // Reset result fields
    document.getElementById('totalBuyAmount').value = '';
    document.getElementById('totalSellAmount').value = '';
    document.getElementById('totalBuyQuantity').value = '';
    document.getElementById('totalSellQuantity').value = '';
    document.getElementById('averageBuyValue').value = '';
    document.getElementById('averageSellValue').value = '';
    document.getElementById('totalProfit').value = '';

    buyQty1.focus();
});

