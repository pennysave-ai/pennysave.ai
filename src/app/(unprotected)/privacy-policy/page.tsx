import PrivacyPolicyContent from "@/components/common/privacy-policy-content";
export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto max-w-5xl flex-grow px-6">
      <div className="mt-8 w-full pb-24 md:mt-14 lg:mt-22">
        <h1 className="text-2xl text-primary">Privacy Policy</h1>
        <div className="text-default-400 border-dotted border-0 border-b-2 text-sm border-default-300">
          Effective Date: Feb 11, 2025
        </div>
        <PrivacyPolicyContent />
      </div>
    </div>
  );
}
