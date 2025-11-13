'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Settings } from 'lucide-react';

interface DomainSearchFormProps {
  onSubmit: (domain: string, options: any) => void;
  disabled?: boolean;
}

export function DomainSearchForm({ onSubmit, disabled = false }: DomainSearchFormProps) {
  const [domain, setDomain] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [limit, setLimit] = useState(100);
  const [sources, setSources] = useState('google,bing,linkedin');
  const [dns, setDns] = useState(true);
  const [takeover, setTakeover] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate domain
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domain || !domainRegex.test(domain)) {
      setError('Please enter a valid domain (e.g., example.com)');
      return;
    }

    const options = {
      sources: sources ? sources.split(',').map(s => s.trim()) : undefined,
      limit,
      dns,
      takeover,
    };

    onSubmit(domain, options);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain Search</CardTitle>
        <CardDescription>Enter a domain to investigate</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Domain Input */}
          <div className="space-y-2">
            <Label htmlFor="domain">Domain *</Label>
            <Input
              id="domain"
              type="text"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={disabled}
              required
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {/* Limit */}
          <div className="space-y-2">
            <Label htmlFor="limit">Result Limit</Label>
            <Input
              id="limit"
              type="number"
              min="1"
              max="500"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              disabled={disabled}
            />
          </div>

          {/* Advanced Options */}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 p-4 border rounded-md">
              {/* Sources */}
              <div className="space-y-2">
                <Label htmlFor="sources">Sources (comma-separated)</Label>
                <Input
                  id="sources"
                  type="text"
                  placeholder="google,bing,linkedin,twitter"
                  value={sources}
                  onChange={(e) => setSources(e.target.value)}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  Available: google, bing, linkedin, twitter, etc.
                </p>
              </div>

              {/* DNS Lookup */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dns"
                  checked={dns}
                  onCheckedChange={(checked) => setDns(checked as boolean)}
                  disabled={disabled}
                />
                <Label htmlFor="dns" className="font-normal cursor-pointer">
                  Perform DNS lookups
                </Label>
              </div>

              {/* Takeover Check */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="takeover"
                  checked={takeover}
                  onCheckedChange={(checked) => setTakeover(checked as boolean)}
                  disabled={disabled}
                />
                <Label htmlFor="takeover" className="font-normal cursor-pointer">
                  Check for subdomain takeover
                </Label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={disabled}>
            <Search className="h-4 w-4 mr-2" />
            {disabled ? 'Searching...' : 'Start Search'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
