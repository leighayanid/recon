import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports | OSINT Web App',
  description: 'View and manage your investigation reports',
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
