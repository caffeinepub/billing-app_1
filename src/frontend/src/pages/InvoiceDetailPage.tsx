import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetInvoice } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, Share2, Pencil } from 'lucide-react';
import InvoicePreview from '../components/InvoicePreview';
import DownloadButton from '../components/DownloadButton';
import ShareButton from '../components/ShareButton';

export default function InvoiceDetailPage() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const invoiceId = params?.id ? BigInt(params.id) : undefined;
  const { data: invoice, isLoading } = useGetInvoice(invoiceId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-muted-foreground">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Invoice not found</h2>
          <Button onClick={() => navigate({ to: '/' })}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate({ to: '/' })} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: '/edit/$id', params: { id: invoice.id.toString() } })}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <ShareButton invoiceId={invoice.id.toString()} />
            <DownloadButton invoice={invoice} />
          </div>
        </div>

        <Card className="p-8">
          <InvoicePreview invoice={invoice} />
        </Card>
      </div>
    </div>
  );
}
