'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Download, RefreshCw } from 'lucide-react';

interface EmailResultsProps {
  jobId: string;
  onComplete: () => void;
  onNewSearch: () => void;
}

export function EmailResults({ jobId, onComplete, onNewSearch }: EmailResultsProps) {
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
    link.download = `email_${job.output_data?.parsed?.email}_${Date.now()}.json`;
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
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Email</CardDescription>
                <CardTitle className="text-lg break-all">{results.email}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Found Sites</CardDescription>
                <CardTitle className="text-2xl">{results.foundSites || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Checked</CardDescription>
                <CardTitle className="text-2xl">{results.totalSites || 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Accounts */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Found Accounts</CardTitle>
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
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.accounts?.filter((acc: any) => acc.exists).map((account: any, idx: number) => (
                  <Card key={idx} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{account.site}</h3>
                        {account.emailRecovery && (
                          <p className="text-sm text-muted-foreground">Recovery: {account.emailRecovery}</p>
                        )}
                        {account.phoneNumber && (
                          <p className="text-sm text-muted-foreground">Phone: {account.phoneNumber}</p>
                        )}
                      </div>
                      <Badge variant={account.exists ? 'default' : 'secondary'}>
                        {account.exists ? 'Found' : 'Not Found'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
