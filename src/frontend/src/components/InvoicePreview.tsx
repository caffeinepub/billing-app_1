import type { Invoice } from '../backend';
import { formatCurrency, formatDate, getCurrencySymbol } from '../utils/formatters';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface InvoicePreviewProps {
  invoice: Invoice;
}

export default function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const currencySymbol = getCurrencySymbol(invoice.currency);

  return (
    <div className="space-y-8" id="invoice-preview">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">INVOICE</h1>
          <p className="text-lg text-muted-foreground mt-1">{invoice.invoiceNumber}</p>
        </div>
        <Badge variant={invoice.status === 'finalized' ? 'default' : 'secondary'} className="text-sm">
          {invoice.status === 'finalized' ? 'Finalized' : 'Draft'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">From</h3>
          <div className="text-foreground">
            <p className="font-medium">InvoiceHub</p>
            <p className="text-sm text-muted-foreground">Your Business Address</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Bill To</h3>
          <div className="text-foreground">
            <p className="font-medium">{invoice.customer.name}</p>
            <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
            {invoice.customer.address && (
              <p className="text-sm text-muted-foreground">{invoice.customer.address}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Invoice Date</h3>
        <p className="text-foreground">{formatDate(invoice.date)}</p>
      </div>

      <Separator />

      <div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 text-sm font-semibold text-muted-foreground uppercase">Description</th>
                <th className="text-right py-3 text-sm font-semibold text-muted-foreground uppercase">Qty</th>
                <th className="text-right py-3 text-sm font-semibold text-muted-foreground uppercase">Unit Price</th>
                <th className="text-right py-3 text-sm font-semibold text-muted-foreground uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, index) => {
                const amount = Number(item.quantity) * Number(item.unitPrice);
                return (
                  <tr key={index} className="border-b border-border">
                    <td className="py-3 text-foreground">{item.description}</td>
                    <td className="py-3 text-right text-foreground">{item.quantity.toString()}</td>
                    <td className="py-3 text-right text-foreground">
                      {formatCurrency(item.unitPrice, invoice.currency)}
                    </td>
                    <td className="py-3 text-right text-foreground">
                      {currencySymbol}
                      {(amount / 100).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-full md:w-1/2 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium text-foreground">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax ({invoice.taxRate.toString()}%):</span>
            <span className="font-medium text-foreground">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span className="text-foreground">Total:</span>
            <span className="text-foreground">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
