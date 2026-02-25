import { AnnouncementBar } from '@/components/landing/announcement-bar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      {children}
    </>
  );
}
