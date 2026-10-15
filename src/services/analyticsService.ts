import { getConsumptions, getMachines, ConsumptionRecord, Machine } from '../db/store';

export interface MachineAnalytics {
  machine_id: string;
  name: string;
  code: string;
  total_kwh: number;
  avg_daily_kwh: number;
  max_kwh: number;
  min_kwh: number;
  records_count: number;
  share_percentage: number;
}

export interface PlantSummary {
  period_start?: string;
  period_end?: string;
  total_plant_kwh: number;
  avg_plant_daily_kwh: number;
  highest_consuming_machine: string;
  machines_analysis: MachineAnalytics[];
  daily_timeline: Array<{
    date: string;
    total_kwh: number;
    by_machine: Record<string, number>;
  }>;
}

export async function getConsumptionAnalytics(filters?: { startDate?: string; endDate?: string }): Promise<PlantSummary> {
  const machines = await getMachines();
  const consumptions = await getConsumptions(filters);

  // Group by date
  const dateMap = new Map<string, Record<string, number>>();
  const machineMap = new Map<string, { total: number; max: number; min: number; count: number }>();

  machines.forEach(m => {
    machineMap.set(m.id, { total: 0, max: 0, min: Infinity, count: 0 });
  });

  let totalPlantKwh = 0;

  for (const c of consumptions) {
    const kwh = Number(c.kwh);
    totalPlantKwh += kwh;

    // Timeline
    if (!dateMap.has(c.date)) {
      dateMap.set(c.date, {});
    }
    dateMap.get(c.date)![c.machine_id] = kwh;

    // Machine aggregates
    const stat = machineMap.get(c.machine_id);
    if (stat) {
      stat.total += kwh;
      stat.count += 1;
      if (kwh > stat.max) stat.max = kwh;
      if (kwh < stat.min) stat.min = kwh;
    }
  }

  // Calculate per machine analytics
  const machinesAnalysis: MachineAnalytics[] = machines.map(m => {
    const s = machineMap.get(m.id)!;
    const avg = s.count > 0 ? Number((s.total / s.count).toFixed(2)) : 0;
    const share = totalPlantKwh > 0 ? Number(((s.total / totalPlantKwh) * 100).toFixed(1)) : 0;
    return {
      machine_id: m.id,
      name: m.name,
      code: m.code,
      total_kwh: Number(s.total.toFixed(2)),
      avg_daily_kwh: avg,
      max_kwh: s.max === 0 ? 0 : Number(s.max.toFixed(2)),
      min_kwh: s.min === Infinity ? 0 : Number(s.min.toFixed(2)),
      records_count: s.count,
      share_percentage: share
    };
  });

  // Sort timeline chronologically
  const dates = Array.from(dateMap.keys()).sort();
  const dailyTimeline = dates.map(d => {
    const byMachine = dateMap.get(d)!;
    const dayTotal = Object.values(byMachine).reduce((acc, val) => acc + val, 0);
    return {
      date: d,
      total_kwh: Number(dayTotal.toFixed(2)),
      by_machine: byMachine
    };
  });

  // Highest consuming machine
  const topMachine = [...machinesAnalysis].sort((a, b) => b.total_kwh - a.total_kwh)[0]?.name || 'N/A';

  return {
    period_start: dates[0] || undefined,
    period_end: dates[dates.length - 1] || undefined,
    total_plant_kwh: Number(totalPlantKwh.toFixed(2)),
    avg_plant_daily_kwh: dates.length > 0 ? Number((totalPlantKwh / dates.length).toFixed(2)) : 0,
    highest_consuming_machine: topMachine,
    machines_analysis: machinesAnalysis,
    daily_timeline: dailyTimeline
  };
}
