import { createFileRoute, Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/resumes")({
  head: () => ({
    meta: [
      { title: "My Resumes — ATS Analyzer" },
      { name: "description", content: "Your uploaded resume library." },
      { property: "og:title", content: "My Resumes — ATS Analyzer" },
      { property: "og:description", content: "Your uploaded resume library." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell title="My Resumes">
      <PageHeader title="My Resumes" description="Your uploaded resume library." />
      <EmptyState
        icon={Construction}
        title="This page is still being built"
        description="This screen isn't finished yet."
        action={<Button asChild><Link to="/analyze">Analyze a resume</Link></Button>}
      />
    </AppShell>
  );
}
