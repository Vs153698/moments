import { PlaceholderScreen } from "../../src/screens/PlaceholderScreen";

/**
 * Support screen reached from suspended accounts or the account-restore sheet
 * (KAN-33). A real contact form lands with moderation/ops later work.
 */
export default function SupportScreen() {
  return (
    <PlaceholderScreen
      title="Support"
      description="Account suspended or scheduled for deletion. Contact support@moments.app for help."
    />
  );
}
