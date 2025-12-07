// =============================================
// DOM ELEMENT REFERENCES (will be set after components load)
// =============================================
let documentTypeSelect, documentTitle, documentTypeLabel, documentNumber,
    quoteSection, bankingSection, invoiceReference, tableBody;

// =============================================
// DOCUMENT TYPE MANAGEMENT
// =============================================
function initializeDocumentType() {
    const savedType = localStorage.getItem('documentType') || 'quote';
    documentTypeSelect.value = savedType;
    updateDocumentType(savedType);
    
    // Load saved numbers for each type
    const quoteNum = localStorage.getItem('lastQuoteNumber') || '2508';
    const invoiceNum = localStorage.getItem('lastInvoiceNumber') || 'INV-2508';
    
    if (savedType === 'quote') {
        documentNumber.textContent = quoteNum;
    } else {
        documentNumber.textContent = invoiceNum;
        invoiceReference.textContent = invoiceNum;
    }
}

function updateDocumentType(type) {
    // Update UI
    if (type === 'quote') {
        documentTitle.textContent = 'QUOTE';
        documentTitle.classList.remove('invoice-title');
        documentTypeLabel.textContent = 'QUOTE';
        if (quoteSection) quoteSection.style.display = 'block';
        if (bankingSection) bankingSection.style.display = 'none';
    } else {
        documentTitle.textContent = 'INVOICE';
        documentTitle.classList.add('invoice-title');
        documentTypeLabel.textContent = 'INVOICE';
        if (quoteSection) quoteSection.style.display = 'none';
        if (bankingSection) bankingSection.style.display = 'block';
        
        // Update invoice reference with current document number
        if (invoiceReference && documentNumber) {
            invoiceReference.textContent = documentNumber.textContent;
        }
    }
    
    // Save selection
    localStorage.setItem('documentType', type);
}

// =============================================
// CURRENCY FUNCTIONS
// =============================================
function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function parseCurrency(value) {
    return parseFloat(value.replace(/[^0-9.-]+/g, ""));
}

// =============================================
// ROW MANAGEMENT
// =============================================
function deleteRow(button) {
    const row = button.closest('tr');
    if (confirm('Are you sure you want to delete this item?')) {
        row.remove();
        calculateTotals();
    }
}

function addRow() {
    const newRow = document.createElement('tr');
    newRow.classList.add('item-row');
    newRow.innerHTML = `
        <td contenteditable="true">Item</td>
        <td class="description-cell" contenteditable="true">
            Description...
            <button class="delete-btn" onclick="deleteRow(this)" title="Delete this item">×</button>
        </td>
        <td class="qty-cell" contenteditable="true">1</td>
        <td class="rate-cell" contenteditable="true">R 0.00</td>
        <td class="total-amount">R <span class="line-total">0.00</span></td>
    `;
    tableBody.appendChild(newRow);
    attachListeners();
    calculateTotals();
    
    // Auto-focus on the description cell for quick editing
    setTimeout(() => {
        newRow.querySelector('.description-cell').focus();
    }, 100);
}

// =============================================
// CALCULATION FUNCTIONS
// =============================================
const vatRate = 0.15;

function calculateTotals() {
    let subtotal = 0;
    const itemRows = document.querySelectorAll('.item-row');

    itemRows.forEach(row => {
        const qtyElement = row.querySelector('.qty-cell');
        const rateElement = row.querySelector('.rate-cell');
        const lineTotalElement = row.querySelector('.line-total');

        const qty = parseCurrency(qtyElement.textContent);
        const rate = parseCurrency(rateElement.textContent);
        const lineTotal = qty * rate;
        
        subtotal += lineTotal;
        lineTotalElement.textContent = formatCurrency(lineTotal);
        
        if (rateElement.textContent !== 'R ' + formatCurrency(rate)) {
            rateElement.textContent = 'R ' + formatCurrency(rate);
        }
    });

    const vatAmount = subtotal * vatRate;
    const grandTotal = subtotal + vatAmount;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('vat-amount').textContent = formatCurrency(vatAmount);
    document.getElementById('grand-total').textContent = formatCurrency(grandTotal);
}

function attachListeners() {
    const editableCells = document.querySelectorAll('.item-row .qty-cell, .item-row .rate-cell');
    editableCells.forEach(cell => {
        cell.removeEventListener('input', calculateTotals);
        cell.addEventListener('input', calculateTotals);
    });
}

// =============================================
// CLIENT INFORMATION FUNCTIONS
// =============================================
function saveClientInfo() {
    const clientInfo = {
        name: document.getElementById('client-name-input').value,
        address: document.getElementById('client-address-textarea').value
    };
    
    localStorage.setItem('lastClientInfo', JSON.stringify(clientInfo));
}

function loadClientInfo() {
    const savedInfo = localStorage.getItem('lastClientInfo');
    if (savedInfo) {
        const clientInfo = JSON.parse(savedInfo);
        document.getElementById('client-name-input').value = clientInfo.name || '';
        document.getElementById('client-address-textarea').value = clientInfo.address || '';
    }
}

// =============================================
// DOCUMENT NUMBER MANAGEMENT (WITH CONFIRMATION)
// =============================================
function incrementDocumentNumber() {
    const currentType = documentTypeSelect.value;
    let currentNum = documentNumber.textContent;
    let nextNum;
    
    // Show warning if document number is empty or invalid
    if (!currentNum.trim()) {
        alert('⚠️ Document number is empty! Please enter a valid document number first.');
        documentNumber.focus();
        return;
    }
    
    // Get the next number
    if (currentType === 'quote') {
        // Extract numeric part for quotes
        const match = currentNum.match(/\d+/);
        if (match) {
            const nextNumInt = parseInt(match[0]) + 1;
            nextNum = nextNumInt.toString();
        } else {
            alert('⚠️ Invalid quote number format! Expected format: 2508');
            return;
        }
    } else {
        // For invoices, handle INV- prefix
        if (currentNum.startsWith('INV-')) {
            const numPart = currentNum.replace('INV-', '');
            const match = numPart.match(/\d+/);
            if (match) {
                const nextNumInt = parseInt(match[0]) + 1;
                nextNum = 'INV-' + nextNumInt;
            } else {
                alert('⚠️ Invalid invoice number format! Expected format: INV-2508');
                return;
            }
        } else {
            // If no INV- prefix, add it
            nextNum = 'INV-2508';
        }
    }
    
    // Show confirmation dialog
    const confirmed = confirm(`⚠️ Are you sure you want to increment the document number?\n\nCurrent: ${currentNum}\nNext: ${nextNum}\n\nClick OK to continue or Cancel to keep current number.`);
    
    if (confirmed) {
        // Update the document number
        documentNumber.textContent = nextNum;
        
        // Update localStorage
        if (currentType === 'quote') {
            localStorage.setItem('lastQuoteNumber', nextNum);
        } else {
            localStorage.setItem('lastInvoiceNumber', nextNum);
            if (invoiceReference) {
                invoiceReference.textContent = nextNum;
            }
        }
        
        // Show success message
        setTimeout(() => {
            alert(`✅ Document number updated to: ${nextNum}`);
        }, 100);
    }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================
function printDocument() {
    // Save current state before printing
    saveClientInfo();
    
    // Show print confirmation
    const confirmed = confirm('🖨️ Ready to print/export PDF?\n\nMake sure:\n1. Document number is correct\n2. Client details are accurate\n3. All line items are correct\n\nClick OK to continue or Cancel to review.');
    
    if (confirmed) {
        window.print();
    }
}

// =============================================
// EVENT LISTENER SETUP
// =============================================
function setupEventListeners() {
    // Document type change
    if (documentTypeSelect) {
        documentTypeSelect.addEventListener('change', function() {
            // Show warning when switching document types
            const confirmed = confirm(`⚠️ Switch document type?\n\nCurrent: ${documentTypeLabel.textContent}\nNew: ${this.value.toUpperCase()}\n\nThis will show/hide banking details and acceptance section.\n\nClick OK to continue or Cancel to keep current type.`);
            
            if (confirmed) {
                updateDocumentType(this.value);
            } else {
                // Revert the select to previous value
                const currentType = localStorage.getItem('documentType') || 'quote';
                this.value = currentType;
            }
        });
    }
    
    // Auto-save client info when fields change
    const clientFields = document.querySelectorAll('#client-name-input, #client-address-textarea');
    clientFields.forEach(field => {
        field.addEventListener('change', saveClientInfo);
        field.addEventListener('input', function() {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(saveClientInfo, 1000);
        });
    });
    
    // Update invoice reference when document number changes
    if (documentNumber) {
        documentNumber.addEventListener('input', function() {
            // Validate document number format
            const currentType = documentTypeSelect.value;
            const currentNum = this.textContent.trim();
            
            if (currentType === 'invoice') {
                // Check if invoice number starts with INV-
                if (currentNum && !currentNum.startsWith('INV-')) {
                    const addPrefix = confirm(`⚠️ Invoice number doesn't start with "INV-".\n\nDo you want to add the prefix automatically?\n\nCurrent: ${currentNum}\nWith prefix: INV-${currentNum}\n\nClick OK to add prefix or Cancel to keep as is.`);
                    
                    if (addPrefix) {
                        this.textContent = 'INV-' + currentNum;
                    }
                }
                
                if (invoiceReference) {
                    invoiceReference.textContent = this.textContent;
                }
            }
            
            // Auto-save document number changes
            setTimeout(saveDocumentNumber, 500);
        });
    }
    
    // Warn before leaving page with unsaved changes
    window.addEventListener('beforeunload', function(e) {
        // Check if there are unsaved changes (simple check)
        const hasItems = document.querySelectorAll('.item-row').length > 0;
        
        if (hasItems) {
            // Show warning (modern browsers show generic message)
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
}

// Save document number to localStorage
function saveDocumentNumber() {
    const currentType = documentTypeSelect.value;
    const currentNum = documentNumber.textContent.trim();
    
    if (currentNum) {
        if (currentType === 'quote') {
            localStorage.setItem('lastQuoteNumber', currentNum);
        } else {
            localStorage.setItem('lastInvoiceNumber', currentNum);
        }
    }
}

// =============================================
// INITIALIZATION
// =============================================
function initializeApp() {
    // Initialize DOM element references
    documentTypeSelect = document.getElementById('document-type');
    documentTitle = document.getElementById('document-title');
    documentTypeLabel = document.getElementById('document-type-label');
    documentNumber = document.getElementById('document-number');
    quoteSection = document.getElementById('quote-section');
    bankingSection = document.getElementById('banking-section');
    invoiceReference = document.getElementById('invoice-reference');
    tableBody = document.querySelector('#item-table tbody');
    
    // Set current date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB');
    document.getElementById('document-date').textContent = formattedDate;
    
    // Initialize components
    initializeDocumentType();
    loadClientInfo();
    attachListeners();
    calculateTotals();
    setupEventListeners();
    
    // Auto-save on load
    saveClientInfo();
    saveDocumentNumber();
}

// =============================================
// COMPONENT LOADING
// =============================================
function loadComponents() {
    // Load header component
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load header.html');
            return response.text();
        })
        .then(html => {
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                headerContainer.innerHTML = html;
            }
            
            // Load banking component
            return fetch('banking.html');
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to load banking.html');
            return response.text();
        })
        .then(html => {
            const bankingContainer = document.getElementById('banking-container');
            if (bankingContainer) {
                bankingContainer.innerHTML = html;
                
                // Re-initialize banking section reference after it's loaded
                setTimeout(() => {
                    bankingSection = document.getElementById('banking-section');
                    
                    // Now initialize the app
                    initializeApp();
                }, 100);
            }
        })
        .catch(error => {
            console.error('Error loading components:', error);
            // Still try to initialize even if components fail
            initializeApp();
        });
}

// =============================================
// MAIN ENTRY POINT
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    loadComponents();
});

// =============================================
// PWA SERVICE WORKER REGISTRATION
// =============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// =============================================
// GLOBAL EXPORTS (for inline event handlers)
// =============================================
// Make functions available globally for inline onclick attributes
window.deleteRow = deleteRow;
window.addRow = addRow;
window.printDocument = printDocument;
window.incrementDocumentNumber = incrementDocumentNumber;
