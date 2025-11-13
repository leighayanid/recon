import { Suspense } from 'react';
import { WebhooksPageClient } from './WebhooksPageClient';

export const metadata = {
  title: 'Webhooks | OSINT Dashboard',
  description: 'Manage webhooks and event notifications',
};

export default function WebhooksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WebhooksPageClient />
    </Suspense>
  );
}
