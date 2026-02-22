import { useParams } from '@tanstack/react-router';
import { useGetInvoice } from '../hooks/useQueries';
import { Card } from '@/components/ui/card';
import InvoicePreview from '../components/InvoicePreview';
import DownloadButton from '../components/DownloadButton';

export default function PublicInvoiceViewPage() {
  const params = useParams({ strict: false });
  const invoiceId = params?.id ? BigInt(params.id) : undefined;
  const { data: invoice, isLoading } = useGetInvoice(invoiceId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Invoice not found</h2>
          <p className="text-muted-foreground">The invoice you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Invoice Preview</h1>
            <DownloadButton invoice={invoice} />
          </div>

          <Card className="p-8">
            <InvoicePreview invoice={invoice} />
          </Card>
        </div>
      </div>
    </div>
  );
}
