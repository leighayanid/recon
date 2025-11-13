'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Download, RefreshCw } from 'lucide-react';

interface PhoneResultsProps {
  jobId: string;
  onComplete: () => void;
  onNewSearch: () => void;
}

export function PhoneResults({ jobId, onComplete, onNewSearch }: PhoneResultsProps) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const data = await response.json();

        if (data.success) {
          setJob(data.data);

          if (data.data.status === 'completed' || data.data.status === 'failed') {
            setLoading(false);
            onComplete();
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Failed to fetch job status:', err);
        setError('Failed to fetch results');
        clearInterval(interval);
      }
    };

    fetchJobStatus();
    interval = setInterval(fetchJobStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  const exportJSON = () => {
    const dataStr = JSON.stringify(job.output_data?.parsed, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phone_${job.output_data?.parsed?.phoneNumber}_${Date.now()}.json`;
    link.click();
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <XCircle className="h-12 w-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const results = job.output_data?.parsed;

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {job.status === 'running' && <Loader2 className="h-5 w-5 animate-spin" />}
            {job.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {job.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
            Status: {job.status}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {job.status === 'running' && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <p className="text-sm text-center">{job.progress}%</p>
            </div>
          )}
          {job.status === 'failed' && (
            <p className="text-red-500">{job.error_message}</p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {job.status === 'completed' && results && (
        <>
          {/* Phone Info */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Phone Information</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={exportJSON} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button onClick={onNewSearch} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New Search
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-semibold">{results.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valid</p>
                  <Badge variant={results.valid ? 'default' : 'destructive'}>
                    {results.valid ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {results.internationalFormat && (
                  <div>
                    <p className="text-sm text-muted-foreground">International Format</p>
                    <p className="font-semibold">{results.internationalFormat}</p>
                  </div>
                )}
                {results.localFormat && (
                  <div>
                    <p className="text-sm text-muted-foreground">Local Format</p>
                    <p className="font-semibold">{results.localFormat}</p>
                  </div>
                )}
                {results.country && (
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="font-semibold">{results.country}</p>
                  </div>
                )}
                {results.carrier && (
                  <div>
                    <p className="text-sm text-muted-foreground">Carrier</p>
                    <p className="font-semibold">{results.carrier}</p>
                  </div>
                )}
                {results.lineType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Line Type</p>
                    <p className="font-semibold">{results.lineType}</p>
                  </div>
                )}
                {results.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold">{results.location}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
