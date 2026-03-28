import { Component, ReactNode, useCallback } from "react";
import { ConnectWalletCard } from "./cards/ConnectWalletCard";
import { BuyTonCard } from "./cards/BuyTonCard";
import { SwapActionCard } from "./cards/SwapActionCard";
import { AddLiquidityCard } from "./cards/AddLiquidityCard";
import { SetAlertCard } from "./cards/SetAlertCard";
import { TokenInfoCard } from "./cards/TokenInfoCard";
import { PortfolioCard } from "./cards/PortfolioCard";
import { PoolRecommendCard } from "./cards/PoolRecommendCard";
import { EducationCard } from "./cards/EducationCard";
import { ConfirmActionCard } from "./cards/ConfirmActionCard";

export interface ActionCardData {
  type: string;
  data: Record<string, any>;
}

interface ActionCardProps {
  action: ActionCardData;
  onComplete: () => void;
}

class CardErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function ActionCard({ action, onComplete }: ActionCardProps) {
  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  let card: ReactNode = null;

  switch (action.type) {
    case "connect_wallet":
      card = <ConnectWalletCard />;
      break;
    case "buy_ton":
      card = <BuyTonCard />;
      break;
    case "swap":
    case "swap_suggestion":
      card = <SwapActionCard data={action.data} onComplete={handleComplete} />;
      break;
    case "add_liquidity":
    case "liquidity":
      card = <AddLiquidityCard data={action.data} />;
      break;
    case "set_alert":
    case "price_alert":
      card = <SetAlertCard data={action.data} onComplete={handleComplete} />;
      break;
    case "token_info":
    case "token":
      card = <TokenInfoCard data={action.data} />;
      break;
    case "portfolio":
    case "portfolio_summary":
      card = <PortfolioCard data={action.data} />;
      break;
    case "pool_recommend":
    case "pool_recommendation":
    case "recommended_pool":
      card = <PoolRecommendCard data={action.data} />;
      break;
    case "education":
    case "education_step":
    case "learn":
      card = <EducationCard data={action.data} onComplete={handleComplete} />;
      break;
    case "confirm":
    case "confirm_action":
      card = <ConfirmActionCard data={action.data} onComplete={handleComplete} />;
      break;
    default:
      return null;
  }

  return <CardErrorBoundary>{card}</CardErrorBoundary>;
}
