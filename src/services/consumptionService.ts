import { saveConsumption, getConsumptions, getMachineById, ConsumptionRecord, Alarm } from '../db/store';
import { evaluateConsumptionAlarms } from './alarmService';

export interface IngestResult {
  record: ConsumptionRecord;
  alarmsTriggered: Alarm[];
}

export async function ingestDailyReading(data: {
  machine_id: string;
  date: string;
  kwh: number;
  peak_power_kw?: number;
  operating_hours?: number;
}): Promise<IngestResult> {
  // Validations
  if (!data.machine_id) {
    throw new Error('El campo machine_id es obligatorio (ej. MAQ-01, MAQ-02, MAQ-03, MAQ-04).');
  }

  const machine = await getMachineById(data.machine_id);
  if (!machine) {
    throw new Error(`La máquina '${data.machine_id}' no existe en el catálogo de 4 máquinas.`);
  }

  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error('La fecha debe tener el formato YYYY-MM-DD (ej. 2026-10-13).');
  }

  if (typeof data.kwh !== 'number' || data.kwh < 0) {
    throw new Error('El valor de consumo en kWh debe ser un número positivo mayor o igual a 0.');
  }

  const peak_power_kw = typeof data.peak_power_kw === 'number' && data.peak_power_kw >= 0
    ? data.peak_power_kw
    : Number((data.kwh / (data.operating_hours || 8) * 1.3).toFixed(2));

  const operating_hours = typeof data.operating_hours === 'number' && data.operating_hours >= 0 && data.operating_hours <= 24
    ? data.operating_hours
    : 8.0;

  const saved = await saveConsumption({
    machine_id: data.machine_id,
    date: data.date,
    kwh: Number(data.kwh.toFixed(2)),
    peak_power_kw: Number(peak_power_kw.toFixed(2)),
    operating_hours: Number(operating_hours.toFixed(2))
  });

  // Evaluate alarms
  const alarms = await evaluateConsumptionAlarms(saved);

  return {
    record: saved,
    alarmsTriggered: alarms
  };
}

export async function ingestBatchReadings(records: Array<{
  machine_id: string;
  date: string;
  kwh: number;
  peak_power_kw?: number;
  operating_hours?: number;
}>): Promise<{ totalIngested: number; totalAlarms: number; results: IngestResult[] }> {
  const results: IngestResult[] = [];
  let totalAlarms = 0;

  for (const item of records) {
    const res = await ingestDailyReading(item);
    results.push(res);
    totalAlarms += res.alarmsTriggered.length;
  }

  return {
    totalIngested: results.length,
    totalAlarms,
    results
  };
}

export { getConsumptions };
