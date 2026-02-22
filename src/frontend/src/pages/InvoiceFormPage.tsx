import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useCreateInvoice, useUpdateInvoice, useGetInvoice } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { LineItem, CustomerDetails, Variant_finalized_draft } from '../backend';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const invoiceId = params?.id ? BigInt(params.id) : undefined;
  
  const { data: existingInvoice, isLoading: loadingInvoice } = useGetInvoice(invoiceId);
  const { mutate: createInvoice, isPending: isCreating } = useCreateInvoice();
  const { mutate: updateInvoice, isPending: isUpdating } = useUpdateInvoice();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [lineItems, setLineItems] = useState<Array<{ description: string; quantity: string; unitPrice: string }>>([
    { description: '', quantity: '1', unitPrice: '0' },
  ]);
  const [taxRate, setTaxRate] = useState('0');
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState<'draft' | 'finalized'>('draft');

  useEffect(() => {
    if (existingInvoice) {
      setInvoiceNumber(existingInvoice.invoiceNumber);
      setCustomerName(existingInvoice.customer.name);
      setCustomerEmail(existingInvoice.customer.email);
      setCustomerAddress(existingInvoice.customer.address);
      setLineItems(
        existingInvoice.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: (Number(item.unitPrice) / 100).toString(),
        }))
      );
      setTaxRate(existingInvoice.taxRate.toString());
      setCurrency(existingInvoice.currency);
      setStatus(existingInvoice.status === 'finalized' ? 'finalized' : 'draft');
    }
  }, [existingInvoice]);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: '1', unitPrice: '0' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: string, value: string) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const rate = parseFloat(taxRate) || 0;
    return (subtotal * rate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNumber.trim()) {
      toast.error('Please enter an invoice number');
      return;
    }

    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error('Please enter customer name and email');
      return;
    }

    if (lineItems.some((item) => !item.description.trim())) {
      toast.error('Please fill in all line item descriptions');
      return;
    }

    const customer: CustomerDetails = {
      name: customerName.trim(),
      email: customerEmail.trim(),
      address: customerAddress.trim(),
    };

    const items: LineItem[] = lineItems.map((item) => ({
      description: item.description.trim(),
      quantity: BigInt(Math.max(1, parseInt(item.quantity) || 1)),
      unitPrice: BigInt(Math.round((parseFloat(item.unitPrice) || 0) * 100)),
    }));

    const rate = BigInt(Math.max(0, parseInt(taxRate) || 0));

    if (invoiceId && existingInvoice) {
      updateInvoice(
        {
          id: invoiceId,
          invoiceNumber: invoiceNumber.trim(),
          customer,
          lineItems: items,
          taxRate: rate,
          currency,
          status: status as Variant_finalized_draft,
        },
        {
          onSuccess: () => {
            toast.success('Invoice updated successfully');
            navigate({ to: '/invoice/$id', params: { id: invoiceId.toString() } });
          },
          onError: (error) => {
            toast.error(`Failed to update invoice: ${error.message}`);
          },
        }
      );
    } else {
      createInvoice(
        {
          invoiceNumber: invoiceNumber.trim(),
          customer,
          lineItems: items,
          taxRate: rate,
          currency,
        },
        {
          onSuccess: (id) => {
            toast.success('Invoice created successfully');
            navigate({ to: '/invoice/$id', params: { id: id.toString() } });
          },
          onError: (error) => {
            toast.error(`Failed to create invoice: ${error.message}`);
          },
        }
      );
    }
  };

  if (invoiceId && loadingInvoice) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-muted-foreground">Loading invoice...</div>
      </div>
    );
  }

  const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '$';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            {invoiceId ? 'Edit Invoice' : 'Create New Invoice'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {invoiceId ? 'Update invoice details' : 'Fill in the details to create a new invoice'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Basic information about the invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="INV-001"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.name} ({curr.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {invoiceId && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(val) => setStatus(val as 'draft' | 'finalized')}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="finalized">Finalized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Details about the customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Customer Address</Label>
                <Input
                  id="customerAddress"
                  placeholder="123 Main St, City, Country"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>Products or services</CardDescription>
                </div>
                <Button type="button" onClick={addLineItem} size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`description-${index}`}>Description *</Label>
                    <Input
                      id={`description-${index}`}
                      placeholder="Product or service description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`unitPrice-${index}`}>Unit Price ({currencySymbol})</Label>
                      <Input
                        id={`unitPrice-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    Amount: {currencySymbol}
                    {((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax & Total</CardTitle>
              <CardDescription>Tax rate and calculated totals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    {currencySymbol}
                    {calculateSubtotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({taxRate}%):</span>
                  <span className="font-medium">
                    {currencySymbol}
                    {calculateTax().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>Total:</span>
                  <span>
                    {currencySymbol}
                    {calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate({ to: '/' })}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'Saving...' : invoiceId ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
