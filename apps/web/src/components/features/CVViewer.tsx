"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Eye, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCV, useCVDownloadUrl, useDownloadCV } from '@/hooks/useCVs';
import type { CvDocument } from '@/types/api';

interface CVViewerProps {
  cvId: string;
}

export function CVViewer({ cvId }: CVViewerProps) {
  const [showPreview, setShowPreview] = useState(false);
  
  const { data: cv, isLoading: cvLoading } = useCV(cvId);
  const { data: downloadData, isLoading: urlLoading } = useCVDownloadUrl(showPreview ? cvId : undefined);
  const downloadMutation = useDownloadCV();

  const handleDownload = () => {
    downloadMutation.mutate(cvId);
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  if (cvLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </CardContent>
      </Card>
    );
  }

  if (!cv) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="w-12 h-12 text-zinc-400 mb-4" />
          <p className="text-zinc-400">CV not found</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AI_DONE':
        return (
          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Processed
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'UPLOADED':
      case 'TEXT_EXTRACTED':
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-zinc-500/20 text-zinc-400">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <FileText className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-lg">CV Document</CardTitle>
                <p className="text-sm text-zinc-400 mt-1">
                  Uploaded {new Date(cv.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {getStatusBadge(cv.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleDownload}
              disabled={downloadMutation.isPending}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {downloadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button
              onClick={handlePreview}
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>

          {cv.errorMessage && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400">
                <strong>Error:</strong> {cv.errorMessage}
              </p>
              {cv.failReason && (
                <p className="text-xs text-red-400/70 mt-1">
                  Reason: {cv.failReason}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showPreview && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">PDF Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {urlLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
              </div>
            ) : downloadData?.url ? (
              <div className="w-full h-[600px] bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                <iframe
                  src={downloadData.url}
                  className="w-full h-full"
                  title="CV Preview"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="w-12 h-12 text-zinc-400 mb-4" />
                <p className="text-zinc-400">Unable to load preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CVViewer;
