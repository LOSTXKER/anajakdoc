import { requireOrganization } from "@/server/auth";
import { getNotifications } from "@/server/actions/notification";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export default async function NotificationsPage() {
  const session = await requireOrganization();
  
  // Get all notifications (including read)
  const notifications = await getNotifications(100, true);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">การแจ้งเตือน</h1>
        <p className="text-muted-foreground mt-1">
          ประวัติการแจ้งเตือนทั้งหมด
        </p>
      </div>

      <NotificationCenter 
        initialNotifications={notifications} 
        currentUserId={session.id}
      />
    </div>
  );
}
