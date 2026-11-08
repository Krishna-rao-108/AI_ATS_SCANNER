import { createFileRoute, Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ATS Analyzer" },
      { name: "description", content: "Profile, theme and preferences." },
      { property: "og:title", content: "Settings — ATS Analyzer" },
      { property: "og:description", content: "Profile, theme and preferences." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell title="Settings">
      <PageHeader title="Settings" description="Profile, theme and preferences." />
      <EmptyState
        icon={Construction}
        title="This page is still being built"
        description="This screen isn't finished yet."
        action={<Button asChild><Link to="/analyze">Analyze a resume</Link></Button>}
      />
    </AppShell>
  );
}
