import ical from 'ical-generator';
import { CalendarPlus } from 'lucide-react';
import type { Inspection } from '@propsphere/types';
import { Button } from '@/components/ui';

function formatDay(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function formatTimeRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const ampm = end.getHours() < 12 ? 'AM' : 'PM';
  return `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())} ${ampm}`;
}

function downloadICS(inspection: Inspection, address: string) {
  const cal = ical({ name: 'PropSphere Inspection' });
  cal.createEvent({
    start: new Date(inspection.starts_at),
    end: new Date(inspection.ends_at),
    summary: `Property Inspection — ${address}`,
    location: address,
    description: `${inspection.type === 'open_home' ? 'Open home' : 'Private inspection'} at ${address}`,
  });

  const blob = new Blob([cal.toString()], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inspection.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface InspectionTimesProps {
  inspections: Inspection[];
  address: string;
}

export function InspectionTimes({ inspections, address }: InspectionTimesProps) {
  if (!inspections.length) return null;

  return (
    <div className="bg-white border border-neutral-200 rounded-card p-5">
      <h3 className="text-base font-semibold text-neutral-900 mb-3">Inspection times</h3>
      <ul className="space-y-3">
        {inspections.map((inspection) => (
          <li
            key={inspection.id}
            className="flex items-center justify-between gap-4 py-2 border-b border-neutral-100 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-neutral-900">{formatDay(inspection.starts_at)}</p>
              <p className="text-sm text-neutral-500">{formatTimeRange(inspection.starts_at, inspection.ends_at)}</p>
              <p className="text-xs text-neutral-400 mt-0.5 capitalize">
                {inspection.type === 'open_home' ? 'Open home' : 'Private inspection'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadICS(inspection, address)}
              className="shrink-0"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Add to calendar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
