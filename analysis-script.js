
let chartInstance = null;
let currentFilteredSales = [];
let currentGroupedData = [];


const formatKsh = (value) => {
    if (value === undefined || value === null) return 'Ksh 0.00';
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

// DATA ACCESS 
const getAllSales = () => {
    const data = localStorage.getItem('salesData');
    if (!data) return [];
    let sales = JSON.parse(data);
    
   
    sales = sales.map(sale => {
        if (sale.saleId !== undefined && sale.id === undefined) {
            sale.id = sale.saleId;
            delete sale.saleId;
        }
        if (sale.quantitySold !== undefined && sale.quantity === undefined) {
            sale.quantity = sale.quantitySold;
            delete sale.quantitySold;
        }
        if (sale.profit !== undefined && sale.profitLoss === undefined) {
            sale.profitLoss = sale.profit;
            delete sale.profit;
        }
       
        sale.id = sale.id ?? Date.now() + Math.random();
        sale.quantity = sale.quantity ?? 0;
        sale.totalCost = sale.totalCost ?? 0;
        sale.totalSale = sale.totalSale ?? 0;
        sale.profitLoss = sale.profitLoss ?? 0;
        sale.itemName = sale.itemName ?? 'Unknown';
        sale.saleDate = sale.saleDate ?? new Date().toISOString();
        return sale;
    });
    return sales;
};


const filterByPeriod = (sales, period, start = null, end = null) => {
    const now = new Date();

    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        return sales.filter(sale => {
            const saleDate = new Date(sale.saleDate);
            return saleDate >= startDate && saleDate <= endDate;
        });
    }

    switch (period) {
        case 'day':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return sales.filter(s => new Date(s.saleDate) >= today);
        case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            return sales.filter(s => new Date(s.saleDate) >= weekStart);
        case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return sales.filter(s => new Date(s.saleDate) >= monthStart);
        default:
            return sales;
    }
};


const groupByPeriod = (sales, groupType) => {
    const groups = {};

    sales.forEach(sale => {
        const date = new Date(sale.saleDate);
        let key;

        if (groupType === 'day') {
            key = date.toLocaleDateString('en-KE');
        } else if (groupType === 'week') {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = `Week of ${weekStart.toLocaleDateString('en-KE')}`;
        } else if (groupType === 'month') {
            key = date.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
        } else {
            key = 'All Time';
        }

        if (!groups[key]) {
            groups[key] = {
                period: key,
                items: 0,
                cost: 0,
                sales: 0,
                profit: 0,
                salesData: []
            };
        }

        groups[key].items += sale.quantity;
        groups[key].cost += sale.totalCost;
        groups[key].sales += sale.totalSale;
        groups[key].profit += sale.profitLoss;
        groups[key].salesData.push(sale);
    });

    return Object.values(groups);
};


const updateSummaryCards = (filteredSales) => {
    let totalCost = 0, totalSales = 0, totalItems = 0;

    filteredSales.forEach(s => {
        totalCost += s.totalCost;
        totalSales += s.totalSale;
        totalItems += s.quantity;
    });

    const netProfit = totalSales - totalCost;

    document.getElementById('totalSales').textContent = formatKsh(totalSales);
    document.getElementById('totalCost').textContent = formatKsh(totalCost);
    document.getElementById('netProfit').textContent = formatKsh(netProfit);
    document.getElementById('itemsSold').textContent = totalItems;
};


const updateTable = (groupedData) => {
    const tbody = document.getElementById('tableBody');
    if (!tbody) {
        console.error('❌ updateTable: tableBody element not found');
        return;
    }

    if (groupedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="no-data">
            <i class="fas fa-inbox"></i><span>No transactions in this period</span>
        </td></tr>`;
        return;
    }

    let html = '';
    groupedData.forEach((g, index) => {
        let statusClass = 'status-neutral', statusText = 'Break even';
        if (g.profit > 0) {
            statusClass = 'status-profit';
            statusText = 'Profit';
        } else if (g.profit < 0) {
            statusClass = 'status-loss';
            statusText = 'Loss';
        }

       
        html += `<tr data-period-index="${index}">
            <td>${g.period}</td>
            <td>${g.items}</td>
            <td>${formatKsh(g.cost)}</td>
            <td>${formatKsh(g.sales)}</td>
            <td>${formatKsh(g.profit)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        </tr>`;
    });
    tbody.innerHTML = html;
};

//  DRILL-DOWN: Show individual sales + DELETE buttons
const showIndividualSales = (periodIndex) => {
    
    if (!currentGroupedData || currentGroupedData.length === 0) {
        console.error('❌ showIndividualSales: currentGroupedData is empty');
        return;
    }
    if (periodIndex === undefined || periodIndex === null) {
        console.error('❌ showIndividualSales: periodIndex is missing');
        return;
    }
    if (periodIndex < 0 || periodIndex >= currentGroupedData.length) {
        console.error(`❌ showIndividualSales: periodIndex ${periodIndex} out of bounds (0-${currentGroupedData.length-1})`);
        return;
    }

    const periodGroup = currentGroupedData[periodIndex];
    const salesList = periodGroup.salesData || [];
    const periodLabel = periodGroup.period || 'Unknown period';

   
    const modal = document.getElementById('salesModal');
    if (!modal) {
        console.error('❌ showIndividualSales: Modal element #salesModal not found');
        return;
    }
    const modalPeriodLabel = document.getElementById('modalPeriodLabel');
    if (!modalPeriodLabel) {
        console.error('❌ showIndividualSales: #modalPeriodLabel not found');
        return;
    }
    const modalBody = document.getElementById('modalTableBody');
    if (!modalBody) {
        console.error('❌ showIndividualSales: #modalTableBody not found');
        return;
    }

  
    modalPeriodLabel.textContent = periodLabel;

    if (salesList.length === 0) {
        modalBody.innerHTML = `<tr><td colspan="7" class="no-data">No individual sales found</td></tr>`;
    } else {
        let rows = '';
        salesList.forEach(sale => {
            const profit = sale.profitLoss || 0;
            const statusClass = profit > 0 ? 'status-profit' : (profit < 0 ? 'status-loss' : 'status-neutral');
            const statusText = profit > 0 ? 'Profit' : (profit < 0 ? 'Loss' : 'Break Even');

            rows += `<tr>
                <td>${sale.itemName || 'Unknown'}</td>
                <td>${sale.quantity || 0}</td>
                <td>${formatKsh(sale.totalCost || 0)}</td>
                <td>${formatKsh(sale.totalSale || 0)}</td>
                <td>${formatKsh(sale.profitLoss || 0)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-delete-sale" data-sale-id="${sale.id}" title="Delete this sale">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`;
        });
        modalBody.innerHTML = rows;
    }

    modal.classList.add('show');

    
    document.querySelectorAll('.btn-delete-sale').forEach(btn => {
        btn.removeEventListener('click', handleDeleteClick);
        btn.addEventListener('click', handleDeleteClick);
    });
};


function handleDeleteClick(e) {
    e.stopPropagation();
    const saleId = this.dataset.saleId;
    if (saleId) {
        deleteSale(Number(saleId));
    }
}

// CLOSE MODAL 
const closeModal = () => {
    const modal = document.getElementById('salesModal');
    if (modal) {
        modal.classList.remove('show');
    }
};


const updateChart = (groupedData) => {
    const canvas = document.getElementById('profitChart');
    if (!canvas) {
        console.error('❌ updateChart: #profitChart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    if (chartInstance) chartInstance.destroy();

    if (groupedData.length === 0) return;

    const labels = groupedData.map(g => g.period);
    const values = groupedData.map(g => g.profit);

    chartInstance = new Chart(ctx, {
        type: groupedData.length > 8 ? 'line' : 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Profit / Loss (Ksh)',
                data: values,
                backgroundColor: values.map(v => v >= 0 ? 'rgba(46,204,113,0.7)' : 'rgba(231,76,60,0.7)'),
                borderColor: values.map(v => v >= 0 ? 'rgba(46,204,113,1)' : 'rgba(231,76,60,1)'),
                borderWidth: 2,
                tension: 0.2,
                pointRadius: 4,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${formatKsh(ctx.raw)}`
                    }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (val) => formatKsh(val)
                    },
                    grid: { color: 'rgba(0,0,0,0.03)' }
                }
            }
        }
    });
};


const exportSalesData = () => {
    const salesData = getAllSales();
    const dataStr = JSON.stringify(salesData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const feedback = document.getElementById('saveFeedback');
    if (feedback) {
        feedback.textContent = '✓ Exported!';
        feedback.classList.remove('hide');
        setTimeout(() => feedback.classList.add('hide'), 2000);
    }
};


const importSalesData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!Array.isArray(importedData)) {
                alert('Invalid file: must be an array of sales.');
                return;
            }

            const action = confirm(
                `Found ${importedData.length} sales in file.\n` +
                `Current data has ${getAllSales().length} sales.\n\n` +
                `Press OK to REPLACE all existing data.\n` +
                `Press Cancel to MERGE (add new, keep duplicates).`
            );

            if (action) {
                saveAllSales(importedData);
                alert(`Replaced all sales with ${importedData.length} records.`);
            } else {
                const currentSales = getAllSales();
                const existingIds = new Set(currentSales.map(s => s.id));
                const newSales = importedData.filter(s => !existingIds.has(s.id));
                const merged = [...currentSales, ...newSales];
                saveAllSales(merged);
                alert(`Added ${newSales.length} new sales. Total now: ${merged.length}.`);
            }

            const activePeriod = document.querySelector('.period-btn.active')?.dataset.period || 'day';
            refreshDashboard(activePeriod);

            const feedback = document.getElementById('saveFeedback');
            if (feedback) {
                feedback.textContent = '✓ Imported!';
                feedback.classList.remove('hide');
                setTimeout(() => feedback.classList.add('hide'), 2000);
            }

        } catch (err) {
            alert('Error reading file: ' + err.message);
        }
    };
    reader.readAsText(file);

    event.target.value = '';
};


const saveViewState = () => {
    const activePeriodBtn = document.querySelector('.period-btn.active');
    const period = activePeriodBtn ? activePeriodBtn.dataset.period : 'day';
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    const viewState = {
        period: period,
        startDate: startDate,
        endDate: endDate,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('analysisViewState', JSON.stringify(viewState));

    const feedback = document.getElementById('saveFeedback');
    if (feedback) {
        feedback.textContent = '✓ View saved!';
        feedback.classList.remove('hide');
        setTimeout(() => feedback.classList.add('hide'), 2000);
    }
};


const loadSavedViewState = () => {
    const savedState = localStorage.getItem('analysisViewState');
    if (!savedState) return false;

    try {
        const state = JSON.parse(savedState);

        if (state.period) {
            const periodBtns = document.querySelectorAll('.period-btn');
            periodBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.period === state.period) {
                    btn.classList.add('active');
                }
            });
        }
        if (state.startDate) {
            const startInput = document.getElementById('startDate');
            if (startInput) startInput.value = state.startDate;
        }
        if (state.endDate) {
            const endInput = document.getElementById('endDate');
            if (endInput) endInput.value = state.endDate;
        }

        return true;
    } catch (e) {
        console.error('Failed to load saved view state', e);
        return false;
    }
};


const refreshDashboard = (selectedPeriod = 'day') => {
    const allSales = getAllSales();
    const start = document.getElementById('startDate')?.value || '';
    const end = document.getElementById('endDate')?.value || '';

    const filtered = filterByPeriod(allSales, selectedPeriod, start, end);
    const grouped = groupByPeriod(filtered, selectedPeriod);

    currentFilteredSales = filtered;
    currentGroupedData = grouped;

    updateSummaryCards(filtered);
    updateTable(grouped);
    updateChart(grouped);
};


document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Analysis page initializing...');

    const hasSavedState = loadSavedViewState();
    
    if (!hasSavedState) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        if (startInput) startInput.value = thirtyDaysAgo.toISOString().split('T')[0];
        if (endInput) endInput.value = today.toISOString().split('T')[0];
    }

    
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            periodBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            refreshDashboard(this.dataset.period);
        });
    });

   
    const applyBtn = document.getElementById('applyDateBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            refreshDashboard('all');
        });
    }

    
    const saveBtn = document.getElementById('saveViewBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveViewState);
    }

    
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportSalesData);
    }

    // IMPORT (trigger file input)
    const importBtn = document.getElementById('importDataBtn');
    const importFile = document.getElementById('importFileInput');
    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => {
            importFile.click();
        });
        importFile.addEventListener('change', importSalesData);
    }

    
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            
           
            if (row.querySelector('.no-data')) return;

            const periodIndex = row.dataset.periodIndex;
            if (periodIndex !== undefined) {
                showIndividualSales(parseInt(periodIndex, 10));
            } else {
                console.warn('⚠️ Row clicked but has no data-period-index:', row);
            }
        });
        console.log('✅ Drill-down click listener attached');
    } else {
        console.error('❌ tableBody element not found – cannot attach click listener');
    }

    
    const modal = document.getElementById('salesModal');
    if (modal) {
        const closeBtn = document.querySelector('.modal-close');
        const closeFooterBtn = document.querySelector('.modal-close-btn');
        
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
       
window.addEventListener('storage', (e) => {
    if (e.key === 'salesData') {
        const activePeriod = document.querySelector('.period-btn.active')?.dataset.period || 'day';
        refreshDashboard(activePeriod);
    }
});
   
    const activePeriod = document.querySelector('.period-btn.active')?.dataset.period || 'day';
    refreshDashboard(activePeriod);
    console.log('✅ Initial refresh complete');
});