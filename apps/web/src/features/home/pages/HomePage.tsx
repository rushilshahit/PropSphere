import { AgentFinderTeaser } from '../components/AgentFinderTeaser';
import { FeaturedListings } from '../components/FeaturedListings';
import { FinanceCTA } from '../components/FinanceCTA';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { MarketNews } from '../components/MarketNews';
import { MarketSnapshot } from '../components/MarketSnapshot';
import { RecentListings } from '../components/RecentListings';
import { SuburbExplorer } from '../components/SuburbExplorer';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <MarketSnapshot />
      <RecentListings />
      <SuburbExplorer />
      <FeaturedListings />
      <HowItWorks />
      <FinanceCTA />
      <AgentFinderTeaser />
      <MarketNews />
    </main>
  );
}
