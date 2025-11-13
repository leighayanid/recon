'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface PhoneSearchFormProps {
  onSubmit: (phoneNumber: string, options: any) => void;
  disabled?: boolean;
}

export function PhoneSearchForm({ onSubmit, disabled = false }: PhoneSearchFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate phone number (E.164 format recommended)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber.replace(/[\s-]/g, ''))) {
      setError('Please enter a valid phone number (E.164 format: +1234567890)');
      return;
    }

    const cleanedNumber = phoneNumber.replace(/[\s-]/g, '');
    onSubmit(cleanedNumber, {});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phone Search</CardTitle>
        <CardDescription>Enter a phone number to investigate</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              type="text"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={disabled}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use E.164 format for best results (e.g., +1234567890)
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

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
