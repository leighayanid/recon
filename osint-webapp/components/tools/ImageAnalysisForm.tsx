'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Settings } from 'lucide-react';

interface ImageAnalysisFormProps {
  onSubmit: (imagePath: string, options: any) => void;
  disabled?: boolean;
}

export function ImageAnalysisForm({ onSubmit, disabled = false }: ImageAnalysisFormProps) {
  const [imagePath, setImagePath] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [extractGPS, setExtractGPS] = useState(true);
  const [extractAll, setExtractAll] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!imagePath) {
      setError('Please provide an image path');
      return;
    }

    const options = {
      extractGPS,
      extractAll,
    };

    onSubmit(imagePath, options);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image Analysis</CardTitle>
        <CardDescription>Analyze image metadata and EXIF data</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Path Input */}
          <div className="space-y-2">
            <Label htmlFor="imagePath">Image Path *</Label>
            <Input
              id="imagePath"
              type="text"
              placeholder="/path/to/image.jpg"
              value={imagePath}
              onChange={(e) => setImagePath(e.target.value)}
              disabled={disabled}
              required
            />
            <p className="text-xs text-muted-foreground">
              Provide the path to the image file to analyze
            </p>
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
              {/* Extract GPS */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="extractGPS"
                  checked={extractGPS}
                  onCheckedChange={(checked) => setExtractGPS(checked as boolean)}
                  disabled={disabled}
                />
                <Label htmlFor="extractGPS" className="font-normal cursor-pointer">
                  Extract GPS coordinates
                </Label>
              </div>

              {/* Extract All */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="extractAll"
                  checked={extractAll}
                  onCheckedChange={(checked) => setExtractAll(checked as boolean)}
                  disabled={disabled}
                />
                <Label htmlFor="extractAll" className="font-normal cursor-pointer">
                  Extract all metadata
                </Label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={disabled}>
            <Search className="h-4 w-4 mr-2" />
            {disabled ? 'Analyzing...' : 'Start Analysis'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
