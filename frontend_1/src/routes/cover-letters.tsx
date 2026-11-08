import { createFileRoute, Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cover-letters")({
  head: () => ({
    meta: [
      { title: "Cover Letters — ATS Analyzer" },
      { name: "description", content: "Write a cover letter grounded in your experience." },
      { property: "og:title", content: "Cover Letters — ATS Analyzer" },
      { property: "og:description", content: "Write a cover letter grounded in your experience." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell title="Cover Letters">
      <PageHeader title="Cover Letters" description="Write a cover letter grounded in your experience." />
      <EmptyState
        icon={Construction}
        title="This page is still being built"
        description="This screen isn't finished yet."
        action={<Button asChild><Link to="/analyze">Analyze a resume</Link></Button>}
      />
    </AppShell>
  );
}
