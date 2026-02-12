// Load items from localStorage when page loads
window.addEventListener('DOMContentLoaded', function() {
    displayItems();
    document.getElementById('inventory-form').addEventListener('submit', addItem);
});

// Add item to localStorage
function addItem(e) {
    e.preventDefault();
    
    const item = {
        id: Date.now(),
        name: document.getElementById('item-name').value,
        buyPrice: parseFloat(document.getElementById('buy-price').value),
        sellPrice: parseFloat(document.getElementById('sell-price').value),
        quantity: parseInt(document.getElementById('quantity').value),
        description: document.getElementById('description').value
    };
    
    // Get existing items from localStorage
    let items = JSON.parse(localStorage.getItem('inventoryItems')) || [];
    
    // Add new item
    items.push(item);
    
    // Save to localStorage
    localStorage.setItem('inventoryItems', JSON.stringify(items));
    
    // Clear form
    document.getElementById('inventory-form').reset();
    
    // Refresh display
    displayItems();
}

// Display items from localStorage
function displayItems() {
    const itemsList = document.getElementById('items-list');
    const items = JSON.parse(localStorage.getItem('inventoryItems')) || [];
    
    itemsList.innerHTML = '';
    
    if (items.length === 0) {
        itemsList.innerHTML = '<p>No items added yet.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.marginTop = '20px';
    
    // Create header
    const headerRow = document.createElement('tr');
    const headers = ['Name', 'Buy Price', 'Sell Price', 'Quantity', 'Description', 'Profit', 'Sell', 'Action'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.border = '1px solid #ddd';
        th.style.padding = '10px';
        th.style.backgroundColor = '#f0f0f0';
        th.style.fontWeight = 'bold';
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    // Create rows
    items.forEach(item => {
        const row = document.createElement('tr');
        const profit = (item.sellPrice - item.buyPrice) * item.quantity;
        
        const cells = [
            item.name,
            item.buyPrice.toFixed(2) +" Ksh",
            item.sellPrice.toFixed(2) +" Ksh",
            item.quantity,
            item.description,
            profit.toFixed(2) +" Ksh"
        ];
        
        cells.forEach(cellText => {
            const td = document.createElement('td');
            td.textContent = cellText;
            td.style.border = '1px solid #ddd';
            td.style.padding = '10px';
            row.appendChild(td);
        });
        
        // Add sell button
        const sellTd = document.createElement('td');
        const sellBtn = document.createElement('button');
        sellBtn.textContent = 'Record Sale';
        sellBtn.style.padding = '5px 10px';
        sellBtn.style.backgroundColor = 'blue';
        sellBtn.style.color = 'white';
        sellBtn.style.border = 'none';
        sellBtn.style.cursor = 'pointer';
        sellBtn.onclick = () => recordSale(item);
        sellTd.appendChild(sellBtn);
        sellTd.style.border = '1px solid #ddd';
        sellTd.style.padding = '10px';
        sellTd.style.textAlign = 'center';
        sellTd.style.borderRadius = '5px';
        row.appendChild(sellTd);
        
        // Add delete button
        const deleteTd = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.padding = '5px 10px';
        deleteBtn.style.backgroundColor = '#ff4444';
        deleteBtn.style.color = 'white';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.onclick = () => deleteItem(item.id);
        deleteTd.appendChild(deleteBtn);
        deleteTd.style.border = '1px solid #ddd';
        deleteTd.style.padding = '10px';
        deleteTd.style.textAlign = 'center';
        deleteTd.style.borderRadius = '5px';
        row.appendChild(deleteTd);
        
        table.appendChild(row);
    });
    
    itemsList.appendChild(table);
}

// Record a sale for an item – FIXED for analysis integration
function recordSale(item) {
    const quantityInput = prompt(`Enter quantity sold for "${item.name}" (available: ${item.quantity}):`);
    if (quantityInput === null) return;
    const quantitySold = parseInt(quantityInput);
    if (isNaN(quantitySold) || quantitySold <= 0) {
        alert('Please enter a valid quantity');
        return;
    }
    if (quantitySold > item.quantity) {
        alert('Quantity sold cannot exceed available quantity');
        return;
    }
    
    // --- SALE OBJECT WITH EXACT PROPERTY NAMES ANALYSIS EXPECTS ---
    const sale = {
        id: Date.now(),               // NOT saleId
        itemName: item.name,
        buyPrice: item.buyPrice,
        salePrice: item.sellPrice,
        quantity: quantitySold,       // NOT quantitySold
        totalCost: item.buyPrice * quantitySold,
        totalSale: item.sellPrice * quantitySold,
        profitLoss: (item.sellPrice - item.buyPrice) * quantitySold, // NOT profit
        saleDate: new Date().toISOString()
    };
    
    // Save sale
    let salesData = JSON.parse(localStorage.getItem('salesData')) || [];
    salesData.push(sale);
    localStorage.setItem('salesData', JSON.stringify(salesData));
    
    // Reduce inventory
    let items = JSON.parse(localStorage.getItem('inventoryItems')) || [];
    items = items.map(i => {
        if (i.id === item.id) i.quantity -= quantitySold;
        return i;
    });
    localStorage.setItem('inventoryItems', JSON.stringify(items));
    
    alert(`✅ Sold ${quantitySold} × ${item.name}`);
    displayItems();
}

// Delete item from localStorage
function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        let items = JSON.parse(localStorage.getItem('inventoryItems')) || [];
        items = items.filter(item => item.id !== id);
        localStorage.setItem('inventoryItems', JSON.stringify(items));
        displayItems();
    }
}