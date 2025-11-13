'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Webhook as WebhookIcon } from 'lucide-react';
import { WebhookList } from '@/components/webhooks/WebhookList';
import { WebhookDialog } from '@/components/webhooks/WebhookDialog';
import type { Webhook } from '@/types/webhooks';

export function WebhooksPageClient() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | undefined>();

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks');
      const result = await response.json();

      if (result.success) {
        setWebhooks(result.data.webhooks);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingWebhook(undefined);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <WebhookIcon className="h-8 w-8" />
            Webhooks
          </h1>
          <p className="text-gray-500 mt-2">
            Manage webhooks to receive real-time event notifications
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {/* Statistics */}
      {webhooks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardDescription>Total Webhooks</CardDescription>
              <CardTitle className="text-3xl">{webhooks.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Active Webhooks</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {webhooks.filter((w) => w.is_active).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Total Deliveries (24h)</CardDescription>
              <CardTitle className="text-3xl">
                {webhooks.reduce((sum, w) => sum + (w.total_deliveries || 0), 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Webhooks List */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">Loading webhooks...</div>
          </CardContent>
        </Card>
      ) : (
        <WebhookList webhooks={webhooks} onRefresh={fetchWebhooks} onEdit={handleEdit} />
      )}

      {/* Create/Edit Dialog */}
      <WebhookDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onSuccess={fetchWebhooks}
        webhook={editingWebhook}
      />
    </div>
  );
}
