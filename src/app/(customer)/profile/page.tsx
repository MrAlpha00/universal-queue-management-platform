import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { ProfileForm } from "@/components/profile/profile-form";
import { requireSession } from "@/services/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireSession();
  const profile = session.profile;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Account" title="Your profile" description="Keep your contact information up to date." />

      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <Avatar name={profile.full_name || profile.email || "User"} email={profile.email ?? undefined} src={profile.avatar_url} className="size-16 text-lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{profile.full_name || profile.email || "Customer"}</h2>
          <p className="mt-0.5 text-sm text-muted">{profile.email}</p>
          <div className="mt-2 flex gap-2">
            <Badge tone="violet">{profile.platform_role === "PLATFORM_ADMIN" ? "Platform admin" : "Customer"}</Badge>
            <Badge tone="neutral">Member since {new Date(profile.created_at).toLocaleDateString()}</Badge>
          </div>
        </div>
      </Card>

      <ProfileForm profile={profile} />
    </div>
  );
}
