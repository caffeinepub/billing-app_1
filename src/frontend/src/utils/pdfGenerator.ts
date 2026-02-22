import type { Invoice } from '../backend';
import { formatCurrency, formatDate, getCurrencySymbol } from './formatters';

export async function generateInvoicePDF(invoice: Invoice): Promise<void> {
  const currencySymbol = getCurrencySymbol(invoice.currency);

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups for this site.');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice-${invoice.invoiceNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #000;
            background: #fff;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
          }
          
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
          }
          
          .invoice-title h1 {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .invoice-number {
            font-size: 18px;
            color: #666;
          }
          
          .invoice-status {
            display: inline-block;
            padding: 4px 12px;
            background: ${invoice.status === 'finalized' ? '#000' : '#e5e5e5'};
            color: ${invoice.status === 'finalized' ? '#fff' : '#000'};
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .invoice-parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          
          .party-section h3 {
            font-size: 12px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          
          .party-details p {
            margin-bottom: 4px;
          }
          
          .party-details .name {
            font-weight: 600;
          }
          
          .party-details .info {
            font-size: 14px;
            color: #666;
          }
          
          .invoice-date {
            margin-bottom: 40px;
          }
          
          .invoice-date h3 {
            font-size: 12px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          
          .separator {
            border-top: 2px solid #e5e5e5;
            margin-bottom: 40px;
          }
          
          .line-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          
          .line-items-table thead tr {
            border-bottom: 1px solid #e5e5e5;
          }
          
          .line-items-table th {
            padding: 12px 0;
            font-size: 12px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
          }
          
          .line-items-table th:first-child {
            text-align: left;
          }
          
          .line-items-table th:not(:first-child) {
            text-align: right;
          }
          
          .line-items-table tbody tr {
            border-bottom: 1px solid #e5e5e5;
          }
          
          .line-items-table td {
            padding: 12px 0;
          }
          
          .line-items-table td:first-child {
            text-align: left;
          }
          
          .line-items-table td:not(:first-child) {
            text-align: right;
          }
          
          .totals-section {
            display: flex;
            justify-content: flex-end;
          }
          
          .totals-content {
            width: 50%;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
          }
          
          .total-row.subtotal,
          .total-row.tax {
            color: #666;
          }
          
          .total-row.subtotal .amount,
          .total-row.tax .amount {
            font-weight: 600;
            color: #000;
          }
          
          .total-separator {
            border-top: 1px solid #e5e5e5;
            margin: 12px 0;
          }
          
          .total-row.grand-total {
            font-size: 18px;
            font-weight: bold;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            
            @page {
              margin: 20mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <div class="invoice-title">
              <h1>INVOICE</h1>
              <p class="invoice-number">${invoice.invoiceNumber}</p>
            </div>
            <div>
              <span class="invoice-status">${invoice.status === 'finalized' ? 'Finalized' : 'Draft'}</span>
            </div>
          </div>

          <div class="invoice-parties">
            <div class="party-section">
              <h3>From</h3>
              <div class="party-details">
                <p class="name">InvoiceHub</p>
                <p class="info">Your Business Address</p>
              </div>
            </div>

            <div class="party-section">
              <h3>Bill To</h3>
              <div class="party-details">
                <p class="name">${invoice.customer.name}</p>
                <p class="info">${invoice.customer.email}</p>
                ${invoice.customer.address ? `<p class="info">${invoice.customer.address}</p>` : ''}
              </div>
            </div>
          </div>

          <div class="invoice-date">
            <h3>Invoice Date</h3>
            <p>${formatDate(invoice.date)}</p>
          </div>

          <div class="separator"></div>

          <table class="line-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.lineItems
                .map((item) => {
                  const amount = Number(item.quantity) * Number(item.unitPrice);
                  return `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.quantity.toString()}</td>
                      <td>${formatCurrency(item.unitPrice, invoice.currency)}</td>
                      <td>${currencySymbol}${(amount / 100).toFixed(2)}</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-content">
              <div class="total-row subtotal">
                <span>Subtotal:</span>
                <span class="amount">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div class="total-row tax">
                <span>Tax (${invoice.taxRate.toString()}%):</span>
                <span class="amount">${formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
              <div class="total-separator"></div>
              <div class="total-row grand-total">
                <span>Total:</span>
                <span>${formatCurrency(invoice.totalAmount, invoice.currency)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            // Close the window after printing or canceling
            setTimeout(function() {
              window.close();
            }, 100);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
