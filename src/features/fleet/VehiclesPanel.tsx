import { useTranslation } from 'react-i18next';
import { MoreVertical, Bus } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';

// Stub vehicles (Rwanda). Wired later to /vehicles (+ /maintenance for next-service).
interface Vehicle {
  plate: string;
  model: string;
  type: string;
  status: string;
  driver: string | null;
  odometer: number;
  nextService: string;
  serviceDue: boolean;
}

const VEHICLES: Vehicle[] = [
  { plate: 'RAB-402', model: '2023 Executive Coach', type: 'Coach', status: 'active', driver: 'S. Uwase', odometer: 184320, nextService: '12,000 km', serviceDue: false },
  { plate: 'RAC-112', model: '2021 Toyota Hiace', type: 'Van', status: 'active', driver: 'P. Habimana', odometer: 246980, nextService: '1,200 km', serviceDue: true },
  { plate: 'RAD-88', model: '2022 Yutong Bus', type: 'Bus', status: 'active', driver: 'L. Ingabire', odometer: 132540, nextService: '9,400 km', serviceDue: false },
  { plate: 'RAE-27', model: '2020 Coaster', type: 'Bus', status: 'idle', driver: null, odometer: 301120, nextService: '400 km', serviceDue: true },
  { plate: 'RAF-51', model: '2023 Executive Coach', type: 'Coach', status: 'maintenance', driver: null, odometer: 98760, nextService: 'In service', serviceDue: false },
];

export function VehiclesPanel() {
  const { t } = useTranslation();
  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">{t('vehicles.colVehicle')}</th>
              <th className="px-5 py-3 font-medium">{t('vehicles.colType')}</th>
              <th className="px-5 py-3 font-medium">{t('vehicles.colStatus')}</th>
              <th className="px-5 py-3 font-medium">{t('vehicles.colDriver')}</th>
              <th className="px-5 py-3 font-medium">{t('vehicles.colOdometer')}</th>
              <th className="px-5 py-3 font-medium">{t('vehicles.colNextService')}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {VEHICLES.map((v) => (
              <tr key={v.plate} className="transition-colors hover:bg-secondary/40">
                <td className="whitespace-nowrap px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Bus className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold">{v.plate}</p>
                      <p className="text-xs text-muted-foreground">{v.model}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{v.type}</td>
                <td className="px-5 py-3">
                  <StatusPill status={v.status}>{t(`vehicles.status.${v.status}`)}</StatusPill>
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  {v.driver ?? <span className="text-muted-foreground">{t('vehicles.unassigned')}</span>}
                </td>
                <td className="whitespace-nowrap px-5 py-3 tabular-nums">{v.odometer.toLocaleString()} km</td>
                <td className="whitespace-nowrap px-5 py-3">
                  <span className={v.serviceDue ? 'font-medium text-warning' : 'text-muted-foreground'}>{v.nextService}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button type="button" aria-label={t('vehicles.actions')} className="text-muted-foreground hover:text-foreground">
                    <MoreVertical className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
