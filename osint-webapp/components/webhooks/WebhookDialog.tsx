'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { Webhook, WebhookEventType } from '@/types/webhooks';

interface WebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  webhook?: Webhook;
}

const AVAILABLE_EVENTS: { value: WebhookEventType; label: string; description: string }[] = [
  { value: 'job.created', label: 'Job Created', description: 'When a new job is created' },
  { value: 'job.started', label: 'Job Started', description: 'When a job starts processing' },
  { value: 'job.completed', label: 'Job Completed', description: 'When a job completes successfully' },
  { value: 'job.failed', label: 'Job Failed', description: 'When a job fails' },
  { value: 'investigation.created', label: 'Investigation Created', description: 'When a new investigation is created' },
  { value: 'investigation.updated', label: 'Investigation Updated', description: 'When an investigation is updated' },
  { value: 'investigation.deleted', label: 'Investigation Deleted', description: 'When an investigation is deleted' },
  { value: 'report.generated', label: 'Report Generated', description: 'When a report is generated' },
  { value: 'report.shared', label: 'Report Shared', description: 'When a report is shared' },
];

export function WebhookDialog({ open, onOpenChange, onSuccess, webhook }: WebhookDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    url: webhook?.url || '',
    description: webhook?.description || '',
    events: (webhook?.events as WebhookEventType[]) || [],
    secret: webhook?.secret || '',
  });

  const isEdit = !!webhook;

  const handleEventToggle = (event: WebhookEventType) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.url || !formData.events.length) {
      toast({
        title: 'Validation Error',
        description: 'URL and at least one event are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const url = isEdit ? `/api/webhooks/${webhook.id}` : '/api/webhooks';
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: isEdit ? 'Webhook Updated' : 'Webhook Created',
          description: `Webhook has been ${isEdit ? 'updated' : 'created'} successfully`,
        });
        onSuccess();
        onOpenChange(false);

        // Reset form if creating new
        if (!isEdit) {
          setFormData({
            url: '',
            description: '',
            events: [],
            secret: '',
          });
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || `Failed to ${isEdit ? 'update' : 'create'} webhook`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'create'} webhook`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Webhook' : 'Create Webhook'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update your webhook configuration'
              : 'Configure a webhook to receive event notifications'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Webhook URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/webhook"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
            />
            <p className="text-sm text-gray-500">The URL where webhook events will be sent</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for this webhook"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Events */}
          <div className="space-y-2">
            <Label>Events *</Label>
            <p className="text-sm text-gray-500 mb-3">
              Select which events should trigger this webhook
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
              {AVAILABLE_EVENTS.map((event) => (
                <div
                  key={event.value}
                  className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => handleEventToggle(event.value)}
                >
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event.value)}
                    onChange={() => handleEventToggle(event.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{event.label}</div>
                    <div className="text-sm text-gray-500">{event.description}</div>
                  </div>
                </div>
              ))}
            </div>
            {formData.events.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.events.map((event) => (
                  <Badge key={event} variant="secondary" className="flex items-center gap-1">
                    {AVAILABLE_EVENTS.find((e) => e.value === event)?.label}
                    <button
                      type="button"
                      onClick={() => handleEventToggle(event)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Secret */}
          <div className="space-y-2">
            <Label htmlFor="secret">Signing Secret</Label>
            <Input
              id="secret"
              type="password"
              placeholder="Optional secret for signature verification"
              value={formData.secret}
              onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
            />
            <p className="text-sm text-gray-500">
              Used to generate HMAC signature. Leave empty to auto-generate.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Webhook' : 'Create Webhook'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
