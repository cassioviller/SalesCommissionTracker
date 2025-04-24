import AddEditProposalForm from "@/components/proposal/add-edit-proposal-form";
import NavigationHeader from "@/components/navigation-header";

export default function AddProposalPage() {
  return (
    <div className="h-screen bg-neutral-100 overflow-auto">
      <NavigationHeader />
      <div className="py-6 px-4 md:px-6">
        <AddEditProposalForm />
      </div>
    </div>
  );
}