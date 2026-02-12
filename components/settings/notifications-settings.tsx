import { Bell } from "lucide-react";
import { SectionHeader } from "./section-header";

export function NotificationsSettings() {
  return (
    <>
      <SectionHeader
        title="Notifications"
        description="Manage how you receive notifications."
      />
      <div className="p-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Bell className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No notifications yet</h3>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          We'll let you know when something important happens with your
          bookmarks or account.
        </p>
      </div>
    </>
  );
}
