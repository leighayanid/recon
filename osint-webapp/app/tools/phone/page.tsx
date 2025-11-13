'use client';

import { useState } from 'react';
import { PhoneSearchForm } from '@/components/tools/PhoneSearchForm';
import { PhoneResults } from '@/components/tools/PhoneResults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function PhoneSearchPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchSubmit = async (phoneNumber: string, options: any) => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/tools/phone/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
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
        <h1 className="text-3xl font-bold mb-2">Phone Number Investigation</h1>
        <p className="text-muted-foreground">
          Advanced information gathering & OSINT framework for phone numbers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Form */}
        <div className="lg:col-span-1">
          <PhoneSearchForm onSubmit={handleSearchSubmit} disabled={isSearching} />

          {/* Info Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                About PhoneInfoga
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                PhoneInfoga is one of the most advanced tools to scan international phone numbers.
              </p>
              <p>
                It can discover:
              </p>
              <ul className="list-disc list-inside ml-2">
                <li>Country and carrier</li>
                <li>Line type (mobile, landline)</li>
                <li>Location information</li>
                <li>Validation status</li>
              </ul>
              <p className="text-xs mt-4">
                <strong>Tip:</strong> Use E.164 format (+1234567890) for best results
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {jobId ? (
            <PhoneResults
              jobId={jobId}
              onComplete={handleSearchComplete}
              onNewSearch={handleNewSearch}
            />
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center text-muted-foreground">
                <p>Enter a phone number to start investigation</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
