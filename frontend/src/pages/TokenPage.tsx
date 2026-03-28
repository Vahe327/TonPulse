import { useParams } from "react-router-dom";
import { PageTransition } from "../components/layout/PageTransition";
import { TokenDetail } from "../components/market/TokenDetail";

export function TokenPage() {
  const { address } = useParams<{ address: string }>();

  if (!address) return null;

  return (
    <PageTransition>
      <TokenDetail address={decodeURIComponent(address)} />
    </PageTransition>
  );
}
