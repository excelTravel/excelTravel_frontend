import { Reveal, RevealItem } from '@/components/motion/Motion';
import { NetworkMap } from './NetworkMap';

// Live Map — toolbar, map (with the bus list + selected route/zone overlays), and the Zones list
// live together inside NetworkMap since picking a zone draws its polygon on this same map.
export function NetworkPage() {
  return (
    <Reveal className="space-y-6">
      <RevealItem><NetworkMap /></RevealItem>
    </Reveal>
  );
}
