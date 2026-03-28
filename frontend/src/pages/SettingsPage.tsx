import { PageTransition } from "../components/layout/PageTransition";
import { SettingsContent } from "../components/settings/SettingsPage";

export function SettingsPage() {
  return (
    <PageTransition>
      <SettingsContent />
    </PageTransition>
  );
}
