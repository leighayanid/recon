'use client';

import { useState } from 'react';
import { ImageAnalysisForm } from '@/components/tools/ImageAnalysisForm';
import { ImageResults } from '@/components/tools/ImageResults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function ImageAnalysisPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalysisSubmit = async (imagePath: string, options: any) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/tools/image/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagePath,
          ...options,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.data.id);
      } else {
        alert(`Error: ${data.error}`);
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to start analysis');
      setIsAnalyzing(false);
    }
  };

  const handleAnalysisComplete = () => {
    setIsAnalyzing(false);
  };

  const handleNewAnalysis = () => {
    setJobId(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Image Metadata Analysis</h1>
        <p className="text-muted-foreground">
          Extract metadata and EXIF information from images
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analysis Form */}
        <div className="lg:col-span-1">
          <ImageAnalysisForm onSubmit={handleAnalysisSubmit} disabled={isAnalyzing} />

          {/* Info Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                About ExifTool
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                ExifTool is a powerful metadata extraction tool for images and other files.
              </p>
              <p>
                It can extract:
              </p>
              <ul className="list-disc list-inside ml-2">
                <li>Camera information</li>
                <li>GPS coordinates</li>
                <li>Date and time</li>
                <li>Software used</li>
                <li>Image dimensions</li>
              </ul>
              <p className="text-xs mt-4">
                <strong>Tip:</strong> GPS data can reveal where a photo was taken
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {jobId ? (
            <ImageResults
              jobId={jobId}
              onComplete={handleAnalysisComplete}
              onNewAnalysis={handleNewAnalysis}
            />
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center text-muted-foreground">
                <p>Upload or provide a path to an image to start analysis</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
