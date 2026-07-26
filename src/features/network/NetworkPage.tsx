import { Reveal, RevealItem } from '@/components/motion/Motion';
import { NetworkMap } from './NetworkMap';

// Live Map — the map is the whole page now. Routes / Stops / Fares moved to the Routes section.
export function NetworkPage() {
  return (
    <Reveal className="space-y-6">
      <RevealItem><NetworkMap /></RevealItem>
    </Reveal>
  );
}
