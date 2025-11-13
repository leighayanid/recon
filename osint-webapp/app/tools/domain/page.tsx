'use client';

import { useState } from 'react';
import { DomainSearchForm } from '@/components/tools/DomainSearchForm';
import { DomainResults } from '@/components/tools/DomainResults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function DomainSearchPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchSubmit = async (domain: string, options: any) => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/tools/domain/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
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
        <h1 className="text-3xl font-bold mb-2">Domain Investigation</h1>
        <p className="text-muted-foreground">
          Gather emails, subdomains, hosts, and more from different public sources
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Form */}
        <div className="lg:col-span-1">
          <DomainSearchForm onSubmit={handleSearchSubmit} disabled={isSearching} />

          {/* Info Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                About theHarvester
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                theHarvester is a powerful tool for gathering OSINT on a company or domain.
              </p>
              <p>
                It collects:
              </p>
              <ul className="list-disc list-inside ml-2">
                <li>Email addresses</li>
                <li>Subdomains</li>
                <li>Hostnames</li>
                <li>IP addresses</li>
                <li>URLs</li>
              </ul>
              <p className="text-xs mt-4">
                <strong>Tip:</strong> Use multiple sources for better results
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {jobId ? (
            <DomainResults
              jobId={jobId}
              onComplete={handleSearchComplete}
              onNewSearch={handleNewSearch}
            />
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center text-muted-foreground">
                <p>Enter a domain to start investigation</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
