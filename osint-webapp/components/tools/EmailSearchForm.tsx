'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Settings } from 'lucide-react';

interface EmailSearchFormProps {
  onSubmit: (email: string, options: any) => void;
  disabled?: boolean;
}

export function EmailSearchForm({ onSubmit, disabled = false }: EmailSearchFormProps) {
  const [email, setEmail] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [onlyUsed, setOnlyUsed] = useState(true);
  const [timeout, setTimeout] = useState(30);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    const options = {
      onlyUsed,
      timeout,
    };

    onSubmit(email, options);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Search</CardTitle>
        <CardDescription>Enter an email address to investigate</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
              required
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
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
              {/* Only Used */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="onlyUsed"
                  checked={onlyUsed}
                  onCheckedChange={(checked) => setOnlyUsed(checked as boolean)}
                  disabled={disabled}
                />
                <Label htmlFor="onlyUsed" className="font-normal cursor-pointer">
                  Show only accounts where email is used
                </Label>
              </div>

              {/* Timeout */}
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="5"
                  max="120"
                  value={timeout}
                  onChange={(e) => setTimeout(parseInt(e.target.value))}
                  disabled={disabled}
                />
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
