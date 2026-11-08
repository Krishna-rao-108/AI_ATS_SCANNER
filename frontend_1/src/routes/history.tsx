import { createFileRoute, Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Analysis History — ATS Analyzer" },
      { name: "description", content: "Your previous analyses." },
      { property: "og:title", content: "Analysis History — ATS Analyzer" },
      { property: "og:description", content: "Your previous analyses." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell title="Analysis History">
      <PageHeader title="Analysis History" description="Your previous analyses." />
      <EmptyState
        icon={Construction}
        title="This page is still being built"
        description="This screen isn't finished yet."
        action={<Button asChild><Link to="/analyze">Analyze a resume</Link></Button>}
      />
    </AppShell>
  );
}
