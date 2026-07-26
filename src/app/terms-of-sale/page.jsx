import LegalPolicyPage, {
  createLegalPolicyMetadata,
} from "../../components/legal/LegalPolicyPage";

export const dynamic =
  "force-dynamic";

const POLICY_KEY =
  "terms-of-sale";

export async function generateMetadata() {
  return createLegalPolicyMetadata(
    POLICY_KEY
  );
}

export default function Page() {
  return (
    <LegalPolicyPage
      policyKey={POLICY_KEY}
    />
  );
}
