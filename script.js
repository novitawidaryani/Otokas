// Default Data State & LocalStorage initialization
let transactions = JSON.parse(localStorage.getItem('otokas_transactions')) || [];

let budgets = JSON.parse(localStorage.getItem('otokas_budgets')) || {
    'Makanan': 500000,
    'Transportasi': 200000,
    'Komponen Praktikum': 150000
};

let defaultCategories = ['Makanan', 'Transportasi', 'Hiburan', 'Gaji', 'Lain-lain'];
let customCategories = JSON.parse(localStorage.getItem('otokas_custom_categories')) || ['Komponen Praktikum', 'Cetak Laporan'];

let pieChartInstance = null;
let lineChartInstance = null;

// Initialize App on Load
window.onload = function() {
    document.getElementById('tx-date').valueAsDate = new Date();
    populateCategoryDropdowns();
    updateAllUI();
};

// Switch Tabs SPA
function switchTab(tabId) {
    ['dashboard', 'riwayat', 'anggaran'].forEach(t => {
        document.getElementById(`page-${t}`).classList.add('hidden');
        document.getElementById(`nav-${t}`).classList.remove('text-[#364C84]', 'font-bold');
        document.getElementById(`nav-${t}`).classList.add('text-gray-400', 'font-semibold');
    });
    document.getElementById(`page-${tabId}`).classList.remove('hidden');
    document.getElementById(`nav-${tabId}`).classList.remove('text-gray-400', 'font-semibold');
    document.getElementById(`nav-${tabId}`).classList.add('text-[#364C84]', 'font-bold');

    if(tabId === 'dashboard') {
        renderCategoryPieChart();
        renderDailyExpenseLineChart();
    } else if(tabId === 'anggaran') {
        renderBudgetStatus();
    }
}

// Modal Controls
function openTransactionModal(type, id = null) {
    const form = document.getElementById('transaction-form');
    form.reset(); 
    document.getElementById('custom-category-wrapper').classList.add('hidden');
    populateCategoryDropdowns();
    
    document.getElementById('tx-type').value = type;
    
    if(id) {
        const tx = transactions.find(t => t.id === id);
        if(tx) {
            document.getElementById('modal-title').innerText = `Edit ${type}`;
            document.getElementById('tx-id').value = tx.id;
            document.getElementById('tx-name').value = tx.name;
            document.getElementById('tx-amount').value = tx.amount;
            document.getElementById('tx-date').value = tx.date;
            document.getElementById('tx-category').value = tx.category;
            document.getElementById('tx-note').value = tx.note || '';
        }
    } else {
        document.getElementById('modal-title').innerText = `Catat ${type}`;
        document.getElementById('tx-id').value = '';
        document.getElementById('tx-date').valueAsDate = new Date();
    }
    
    document.getElementById('transaction-modal').classList.remove('hidden');
}

function closeTransactionModal() {
    document.getElementById('transaction-modal').classList.add('hidden');
    document.getElementById('transaction-form').reset();
    document.getElementById('custom-category-wrapper').classList.add('hidden');
}

// Populate Category Dropdowns across forms
function getAllCategories() {
    return [...new Set([...defaultCategories, ...customCategories])];
}

function populateCategoryDropdowns() {
    const allCats = getAllCategories();
    
    const txSelect = document.getElementById('tx-category');
    const currentTxSel = txSelect.value;
    txSelect.innerHTML = allCats.map(c => `<option value="${c}">${c}</option>`).join('') + `<option value="ADD_NEW">➕ Tambah Kategori Baru...</option>`;
    if (currentTxSel && currentTxSel !== 'ADD_NEW') txSelect.value = currentTxSel;
    
    const filterCat = document.getElementById('filter-category');
    const currentFilter = filterCat.value;
    filterCat.innerHTML = `<option value="">Semua Kategori</option>` + allCats.map(c => `<option value="${c}" ${c === currentFilter ? 'selected' : ''}>${c}</option>`).join('');

    const budgetCat = document.getElementById('budget-category');
    budgetCat.innerHTML = allCats.map(c => `<option value="${c}">${c}</option>`).join('');
    
    const pdfCat = document.getElementById('pdf-category');
    pdfCat.innerHTML = `<option value="">Semua Kategori</option>` + allCats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function checkCustomCategory(selectEl) {
    const wrapper = document.getElementById('custom-category-wrapper');
    const customInput = document.getElementById('tx-custom-category');
    if(selectEl.value === 'ADD_NEW') {
        wrapper.classList.remove('hidden');
        customInput.required = true;
    } else {
        wrapper.classList.add('hidden');
        customInput.required = false;
        customInput.value = '';
    }
}

// Handle Transaction Submit
function handleTransactionSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('tx-id').value;
    const type = document.getElementById('tx-type').value;
    const name = document.getElementById('tx-name').value;
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const date = document.getElementById('tx-date').value;
    let category = document.getElementById('tx-category').value;
    const note = document.getElementById('tx-note').value;

    if(category === 'ADD_NEW') {
        const customVal = document.getElementById('tx-custom-category').value.trim();
        if(customVal) {
            const allExisting = getAllCategories().map(c => String(c).toLowerCase());
            if(!allExisting.includes(customVal.toLowerCase())) {
                customCategories.push(customVal);
                localStorage.setItem('otokas_custom_categories', JSON.stringify(customCategories));
            }
            category = customVal;
        } else {
            category = 'Lain-lain';
        }
    }

    if (id) {
        const index = transactions.findIndex(t => t.id == id);
        if (index !== -1) {
            transactions[index] = { id: parseInt(id), name, amount, type, category, date, note };
        }
    } else {
        const newTx = { id: Date.now(), name, amount, type, category, date, note };
        transactions.unshift(newTx);
    }

    saveAndRefresh();
    closeTransactionModal();
}

// Delete Transaction
function deleteTransaction(id) {
    if(confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveAndRefresh();
    }
}

// Save & Refresh All UI
function saveAndRefresh() {
    localStorage.setItem('otokas_transactions', JSON.stringify(transactions));
    populateCategoryDropdowns();
    updateAllUI();
}

function updateAllUI() {
    updateDashboardSummary();
    filterTransactions();
    renderCategoryPieChart();
    renderDailyExpenseLineChart();
    renderBudgetStatus();
}

// Dashboard Calculation
function updateDashboardSummary() {
    let totalBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    transactions.forEach(t => {
        if(t.type === 'Pemasukan') {
            totalBalance += t.amount;
            totalIncome += t.amount;
        } else {
            totalBalance -= t.amount;
            totalExpense += t.amount;
        }

        const tDate = new Date(t.date);
        if(tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
            if(t.type === 'Pemasukan') monthIncome += t.amount;
            else monthExpense += t.amount;
        }
    });

    document.getElementById('dash-total-balance').innerText = formatRupiah(totalBalance);
    document.getElementById('dash-month-income').innerText = formatRupiah(monthIncome);
    document.getElementById('dash-month-expense').innerText = formatRupiah(monthExpense);
    
    const badge = document.getElementById('dash-status-badge');
    if (totalBalance < 0) {
        badge.innerText = 'Defisit';
        badge.className = 'text-[10px] font-bold px-3 py-1 rounded-full shadow bg-rose-100 text-rose-700';
    } else if (totalIncome > 0 && totalExpense >= (0.75 * totalIncome)) {
        badge.innerText = 'Waspada: Saldo Menipis';
        badge.className = 'text-[10px] font-bold px-3 py-1 rounded-full shadow bg-amber-100 text-amber-700';
    } else {
        badge.innerText = 'Aman';
        badge.className = 'text-[10px] font-bold px-3 py-1 rounded-full shadow bg-[#E7F1A8] text-[#364C84]';
    }
}

// Ledger Filtering
function filterTransactions() {
    const keyword = document.getElementById('search-input').value.toLowerCase();
    const catFilter = document.getElementById('filter-category').value;
    const dateRange = document.getElementById('filter-date-range').value;

    let filtered = transactions.filter(t => {
        const matchKeyword = t.name.toLowerCase().includes(keyword) || (t.note && t.note.toLowerCase().includes(keyword));
        const matchCat = catFilter === "" || t.category === catFilter;
        
        let matchDate = true;
        const tDate = new Date(t.date);
        const today = new Date();

        if(dateRange === 'today') {
            matchDate = tDate.toDateString() === today.toDateString();
        } else if(dateRange === 'month') {
            matchDate = tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
        }

        return matchKeyword && matchCat && matchDate;
    });

    document.getElementById('transaction-count').innerText = `${filtered.length} item`;
    
    const listEl = document.getElementById('transaction-list');
    if(filtered.length === 0) {
        listEl.innerHTML = `<div class="bg-white p-6 rounded-2xl text-center text-gray-400 text-sm border border-gray-100">Tidak ada riwayat transaksi ditemukan.</div>`;
        return;
    }

    listEl.innerHTML = filtered.map(t => `
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-[#85B1EE]/20 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${t.type === 'Pemasukan' ? 'bg-[#E7F1A8] text-[#364C84]' : 'bg-rose-100 text-rose-600'}">
                    ${t.type === 'Pemasukan' ? '↓' : '↑'}
                </div>
                <div>
                    <h4 class="font-bold text-sm text-[#364C84]">${t.name}</h4>
                    <p class="text-[11px] text-gray-400">${t.category} • ${t.date} ${t.note ? '• ' + t.note : ''}</p>
                </div>
            </div>
            <div class="text-right flex items-center space-x-3">
                <div>
                    <p class="font-bold text-sm ${t.type === 'Pemasukan' ? 'text-emerald-600' : 'text-rose-600'}">
                        ${t.type === 'Pemasukan' ? '+' : '-'}${formatRupiah(t.amount)}
                    </p>
                </div>
                <div class="flex items-center space-x-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                    <button onclick="openTransactionModal('${t.type}', ${t.id})" class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Edit Transaksi">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button onclick="deleteTransaction(${t.id})" class="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Hapus Transaksi">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Charts Rendering
function renderCategoryPieChart() {
    const filterType = document.getElementById('chart-type-filter').value;
    const categorySums = {};

    transactions.filter(t => t.type === filterType).forEach(t => {
        categorySums[t.category] = (categorySums[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categorySums);
    const data = Object.values(categorySums);

    const ctx = document.getElementById('categoryPieChart').getContext('2d');
    if(pieChartInstance) pieChartInstance.destroy();

    if(labels.length === 0) {
        pieChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Belum ada data'],
                datasets: [{ data: [1], backgroundColor: ['#e5e7eb'] }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
        return;
    }

    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#364C84', '#85B1EE', '#E7F1A8', '#f43f5e', '#fbbf24', '#a855f7', '#10b981'],
                borderWidth: 2,
                borderColor: '#FFFDF5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            },
            cutout: '65%'
        }
    });
}

function renderDailyExpenseLineChart() {
    const labels = [];
    const dataValues = [];

    for(let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
        
        labels.push(dayName);

        const totalExp = transactions
            .filter(t => t.type === 'Pengeluaran' && t.date === dateString)
            .reduce((sum, t) => sum + t.amount, 0);

        dataValues.push(totalExp);
    }

    const ctx = document.getElementById('dailyExpenseLineChart').getContext('2d');
    if(lineChartInstance) lineChartInstance.destroy();

    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pengeluaran (Rp)',
                data: dataValues,
                borderColor: '#f43f5e',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                fill: true,
                tension: 0.35,
                borderWidth: 3,
                pointBackgroundColor: '#f43f5e',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { font: { size: 10 } },
                    grid: { color: 'rgba(0,0,0,0.03)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

// Budget Management
function handleBudgetSubmit(e) {
    e.preventDefault();
    const category = document.getElementById('budget-category').value;
    const limit = parseFloat(document.getElementById('budget-limit').value);

    budgets[category] = limit;
    localStorage.setItem('otokas_budgets', JSON.stringify(budgets));
    renderBudgetStatus();
    alert('Batas anggaran berhasil disimpan/diperbarui!');
    e.target.reset();
}

function editBudget(category) {
    document.getElementById('budget-category').value = category;
    document.getElementById('budget-limit').value = budgets[category];
    document.getElementById('budget-limit').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteBudget(category) {
    if(confirm(`Apakah Anda yakin ingin menghapus batas anggaran untuk kategori "${category}"?`)) {
        delete budgets[category];
        localStorage.setItem('otokas_budgets', JSON.stringify(budgets));
        renderBudgetStatus();
    }
}

function renderBudgetStatus() {
    const container = document.getElementById('budget-status-list');
    const cats = Object.keys(budgets);

    if(cats.length === 0) {
        container.innerHTML = `<div class="bg-white p-5 rounded-2xl text-center text-gray-400 text-xs">Belum ada batas anggaran yang diatur.</div>`;
        return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const spentPerCat = {};
    transactions.forEach(t => {
        if(t.type === 'Pengeluaran') {
            const tDate = new Date(t.date);
            if(tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                spentPerCat[t.category] = (spentPerCat[t.category] || 0) + t.amount;
            }
        }
    });

    container.innerHTML = cats.map(cat => {
        const limit = budgets[cat];
        const spent = spentPerCat[cat] || 0;
        const remaining = limit - spent;
        const percentage = Math.min(Math.round((spent / limit) * 100), 100);
        
        let badgeColor = 'bg-emerald-100 text-emerald-700';
        let statusText = 'Aman';
        let remainingText = `Sisa: ${formatRupiah(remaining)}`;
        let remainingClass = 'text-emerald-600';

        if(spent > limit) {
            badgeColor = 'bg-rose-100 text-rose-700';
            statusText = 'Melewati Batas!';
            remainingText = `Overbudget: ${formatRupiah(Math.abs(remaining))}`;
            remainingClass = 'text-rose-600';
        } else if(percentage >= 80) {
            badgeColor = 'bg-amber-100 text-amber-700';
            statusText = 'Mendekati Batas (≥80%)';
            remainingClass = 'text-amber-600';
        }

        return `
            <div class="bg-white p-5 rounded-3xl shadow-sm border border-[#85B1EE]/20 space-y-3 relative group">
                <div class="absolute top-4 right-5 flex items-center space-x-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                    <button onclick="editBudget('${cat}')" class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Edit Anggaran">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button onclick="deleteBudget('${cat}')" class="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Hapus Anggaran">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
                <div class="flex justify-between items-center pr-28">
                    <div>
                        <h4 class="font-bold text-sm text-[#364C84]">${cat}</h4>
                        <p class="text-xs text-gray-400">Limit: ${formatRupiah(limit)}</p>
                    </div>
                </div>
                <div class="flex justify-between items-center mt-1">
                    <span class="text-[10px] font-bold px-2.5 py-1 rounded-full ${badgeColor}">${statusText}</span>
                </div>
                <div class="space-y-1 pt-2">
                    <div class="flex justify-between text-xs font-semibold">
                        <span class="text-gray-500">Terpakai: ${formatRupiah(spent)}</span>
                        <span class="${remainingClass}">${remainingText}</span>
                    </div>
                    <div class="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div class="h-full rounded-full ${percentage >= 100 ? 'bg-rose-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-[#85B1EE]'}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// PDF Features 
function openPDFModal() {
    document.getElementById('pdf-modal').classList.remove('hidden');
    populateCategoryDropdowns(); 
}

function closePDFModal() {
    document.getElementById('pdf-modal').classList.add('hidden');
    document.getElementById('pdf-form').reset();
}

function handlePDFDownload(e) {
    e.preventDefault();
    const catFilter = document.getElementById('pdf-category').value;
    const startDate = document.getElementById('pdf-start-date').value;
    const endDate = document.getElementById('pdf-end-date').value;

    let dataToExport = transactions.filter(t => {
        let matchCat = catFilter === "" || t.category === catFilter;
        let matchDate = true;
        if (startDate) matchDate = matchDate && (t.date >= startDate);
        if (endDate) matchDate = matchDate && (t.date <= endDate);
        return matchCat && matchDate;
    });

    if (dataToExport.length === 0) {
        alert("Tidak ada data transaksi yang sesuai dengan filter yang dipilih.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(54, 76, 132); 
    doc.text("Laporan Transaksi OtoKas", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleString('id-ID');
    let infoText = `Dicetak pada: ${dateStr}`;
    if(catFilter) infoText += ` | Kategori: ${catFilter}`;
    if(startDate || endDate) infoText += ` | Periode: ${startDate || '-'} s/d ${endDate || '-'}`;
    doc.text(infoText, 14, 28);

    const tableColumns = ["Tanggal", "Nama Transaksi", "Kategori", "Tipe", "Nominal", "Catatan"];
    const tableRows = [];

    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    dataToExport.forEach(t => {
        if(t.type === 'Pemasukan') totalPemasukan += t.amount;
        else totalPengeluaran += t.amount;

        const txData = [
            t.date,
            t.name,
            t.category,
            t.type,
            formatRupiah(t.amount),
            t.note || "-"
        ];
        tableRows.push(txData);
    });

    tableRows.push(["", "", "", "TOTAL PEMASUKAN", formatRupiah(totalPemasukan), ""]);
    tableRows.push(["", "", "", "TOTAL PENGELUARAN", formatRupiah(totalPengeluaran), ""]);

    doc.autoTable({
        startY: 35,
        head: [tableColumns],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [54, 76, 132] },
        styles: { fontSize: 9 },
        willDrawCell: function (data) {
            if (data.row.index >= dataToExport.length) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = [54, 76, 132];
            }
        }
    });

    const fileName = `Laporan_OtoKas_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    closePDFModal(); 
}

// Utility Format Rupiah
function formatRupiah(num) {
    return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}