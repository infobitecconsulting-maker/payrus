import PageHeader from "@/components/ui/page-header.tsx";
import OrganisationPanel from "./_components/organisation-panel.tsx";

export default function OrganisationPage() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      <PageHeader title="Organisation" className="mb-4 md:mb-6" />
      <div className="text-xs text-muted-foreground max-w-2xl">
        Run your organisation's internal profiles, customers, transactions and cases. What you see follows your position in the
        PayRus organisation tree; customers registered in another country show masked, and their sensitive KYC stays with their home country.
      </div>
      <OrganisationPanel />
    </div>
  );
}
