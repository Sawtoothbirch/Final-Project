let profitChart;

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function getSalesData() {
    const salesData = localStorage.getItem('salesData');
    return salesData ? JSON.parse(salesData) : [];
}

function getInventoryData() {
    const inventoryData = localStorage.getItem('inventoryItems');
    return inventoryData ? JSON.parse(inventoryData) : [];
}

function loadAnalysisData() {
    const salesData = getSalesData();
    const inventoryData = getInventoryData();
    
    // Update summary cards with comprehensive profit/loss tracking
    updateSummaryCards(salesData, inventoryData);
    
    // Update detailed table
    updateDetailedTable(salesData);
    
    // Create chart
    createProfitChart(salesData);
}

// Update summary cards with totals including inventory value
function updateSummaryCards(salesData, inventoryData) {
    let totalSales = 0;
    let totalCost = 0;
    let totalItemsSold = 0;
    let realizeProft = 0;
    
    // Calculate from sales data
    salesData.forEach(sale => {
        totalSales += sale.totalSale;
        totalCost += sale.totalCost;
        totalItemsSold += sale.quantitySold;
        realizeProft += sale.profit;
    });
    
    // Calculate inventory investment and potential value
    let totalInventoryInvestment = 0;
    let totalInventoryValue = 0;
    let totalInventoryItems = 0;
    
    inventoryData.forEach(item => {
        if (item.quantity > 0) {
            const itemInvestment = item.buyPrice * item.quantity;
            const itemValue = item.sellPrice * item.quantity;
            totalInventoryInvestment += itemInvestment;
            totalInventoryValue += itemValue;
            totalInventoryItems += item.quantity;
        }
    });
    
    const unrealizedProfit = totalInventoryValue - totalInventoryInvestment;
    const totalProfit = realizeProft + unrealizedProfit;
    const totalInvestment = totalCost + totalInventoryInvestment;
    
    // Update display
    document.getElementById('total-sales').textContent = formatCurrency(totalSales);
    document.getElementById('total-cost').textContent = formatCurrency(totalCost);
    document.getElementById('net-profit').textContent = formatCurrency(realizeProft);
    document.getElementById('items-sold').textContent = totalItemsSold;
    
    // Change color based on profit/loss
    const profitElement = document.getElementById('net-profit');
    if (realizeProft > 0) {
        profitElement.style.color = 'green';
    } else if (realizeProft < 0) {
        profitElement.style.color = 'red';
    }
}

// Update detailed breakdown table
function updateDetailedTable(salesData) {
    const tbody = document.getElementById('analysis-data');
    
    if (salesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No sales data available. Record sales first.</td></tr>';
        return;
    }
    
    let html = '';
    salesData.forEach(sale => {
        const profitLoss = sale.profit;
        const status = profitLoss > 0 ? '<span style="color: green;">✓ Profit</span>' : '<span style="color: red;">✗ Loss</span>';
        
        html += `
            <tr>
                <td>${sale.itemName}</td>
                <td>${sale.quantitySold}</td>
                <td>${formatCurrency(sale.totalCost)}</td>
                <td>${formatCurrency(sale.totalSale)}</td>
                <td>${formatCurrency(profitLoss)}</td>
                <td>${status}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}


// Create profit trend chart
function createProfitChart(salesData) {
    const ctx = document.getElementById('profitChart').getContext('2d');
    
    if (window.profitChartInstance) {
        window.profitChartInstance.destroy();
    }
    
    if (salesData.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No sales data to display', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }
    
    const labels = salesData.map(s => s.itemName);
    const profitData = salesData.map(s => s.profit);
    
    window.profitChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Profit/Loss per Item',
                data: profitData,
                backgroundColor: profitData.map(p => p > 0 ? '#4CAF50' : '#f44336'),
                borderColor: '#333',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Profit/Loss (Ksh)'
                    }
                }
            }
        }
    });
}
function setupPeriodButtons() {
    const buttons = document.querySelectorAll('.period-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadAnalysisData();
        });
    });
}

// Setup date range filter
function setupDateRangeFilter() {
    const applyBtn = document.getElementById('apply-range');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            
            if (startDate && endDate) {
                loadAnalysisData();
            } else {
                alert('Please select both start and end dates');
            }
        });
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', function() {
    loadAnalysisData();
    setupPeriodButtons();
    setupDateRangeFilter();
});