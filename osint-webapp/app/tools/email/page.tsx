'use client';

import { useState } from 'react';
import { EmailSearchForm } from '@/components/tools/EmailSearchForm';
import { EmailResults } from '@/components/tools/EmailResults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function EmailSearchPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchSubmit = async (email: string, options: any) => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/tools/email/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          ...options,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.data.id);
      } else {
        alert(`Error: ${data.error}`);
        setIsSearching(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to start search');
      setIsSearching(false);
    }
  };

  const handleSearchComplete = () => {
    setIsSearching(false);
  };

  const handleNewSearch = () => {
    setJobId(null);
    setIsSearching(false);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Investigation</h1>
        <p className="text-muted-foreground">
          Check if an email is attached to an account on over 120 websites
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Form */}
        <div className="lg:col-span-1">
          <EmailSearchForm onSubmit={handleSearchSubmit} disabled={isSearching} />

          {/* Info Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                About Holehe
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Holehe checks if an email is attached to an account on various platforms.
              </p>
              <p>
                It can discover:
              </p>
              <ul className="list-disc list-inside ml-2">
                <li>Account existence</li>
                <li>Email recovery addresses</li>
                <li>Associated phone numbers</li>
                <li>Platform-specific data</li>
              </ul>
              <p className="text-xs mt-4">
                <strong>Tip:</strong> Use valid email addresses for accurate results
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {jobId ? (
            <EmailResults
              jobId={jobId}
              onComplete={handleSearchComplete}
              onNewSearch={handleNewSearch}
            />
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center text-muted-foreground">
                <p>Enter an email address to start investigation</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
