import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { toast } from 'sonner';
import type { Invoice } from '../backend';

interface DownloadButtonProps {
  invoice: Invoice;
}

export default function DownloadButton({ invoice }: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateInvoicePDF(invoice);
      toast.success('Opening print dialog...');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isGenerating} size="sm" className="gap-2">
      <Download className="h-4 w-4" />
      {isGenerating ? 'Opening...' : 'Download PDF'}
    </Button>
  );
}
