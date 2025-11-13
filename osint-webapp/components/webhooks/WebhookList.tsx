'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Check, X, TestTube, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { Webhook } from '@/types/webhooks';

interface WebhookListProps {
  webhooks: Webhook[];
  onRefresh: () => void;
  onEdit?: (webhook: Webhook) => void;
}

export function WebhookList({ webhooks, onRefresh, onEdit }: WebhookListProps) {
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleTest = async (webhookId: string) => {
    setLoading(webhookId);
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Test Successful',
          description: 'Webhook test delivery completed successfully',
        });
      } else {
        toast({
          title: 'Test Failed',
          description: result.error || 'Failed to test webhook',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to test webhook',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleToggle = async (webhook: Webhook) => {
    setLoading(webhook.id);
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !webhook.is_active }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: webhook.is_active ? 'Webhook Disabled' : 'Webhook Enabled',
          description: `Webhook has been ${webhook.is_active ? 'disabled' : 'enabled'}`,
        });
        onRefresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update webhook',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to update webhook',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      return;
    }

    setLoading(webhookId);
    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Webhook Deleted',
          description: 'Webhook has been deleted successfully',
        });
        onRefresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete webhook',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  if (webhooks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <p className="mb-2">No webhooks configured</p>
            <p className="text-sm">Create a webhook to receive event notifications</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {webhooks.map((webhook) => (
        <Card key={webhook.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg">{webhook.url}</CardTitle>
                  <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                    {webhook.is_active ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
                {webhook.description && (
                  <CardDescription>{webhook.description}</CardDescription>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={loading === webhook.id}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleTest(webhook.id)}>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Webhook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggle(webhook)}>
                    {webhook.is_active ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Enable
                      </>
                    )}
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(webhook)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(webhook.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Events */}
              <div>
                <div className="text-sm font-medium mb-2">Events</div>
                <div className="flex flex-wrap gap-2">
                  {(webhook.events as string[]).map((event) => (
                    <Badge key={event} variant="outline">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-gray-500">Total Deliveries</div>
                  <div className="text-2xl font-bold">{webhook.total_deliveries || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Successful</div>
                  <div className="text-2xl font-bold text-green-600">
                    {webhook.successful_deliveries || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Failed</div>
                  <div className="text-2xl font-bold text-red-600">
                    {webhook.failed_deliveries || 0}
                  </div>
                </div>
              </div>

              {/* Success Rate */}
              {webhook.total_deliveries > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Success Rate</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${
                            ((webhook.successful_deliveries || 0) / webhook.total_deliveries) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {(
                        ((webhook.successful_deliveries || 0) / webhook.total_deliveries) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              )}

              {/* Last Delivery */}
              {webhook.last_delivery_at && (
                <div className="text-sm text-gray-500">
                  Last delivery: {new Date(webhook.last_delivery_at).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
