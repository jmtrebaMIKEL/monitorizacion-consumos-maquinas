import { getAlarmRules, createAlarm, getAlarms, resolveAlarm, ConsumptionRecord, Alarm, getMachineById } from '../db/store';

export async function evaluateConsumptionAlarms(record: ConsumptionRecord): Promise<Alarm[]> {
  const machine = await getMachineById(record.machine_id);
  const machineName = machine?.name || record.machine_id;
  const triggeredAlarms: Alarm[] = [];

  const rules = await getAlarmRules(record.machine_id);

  for (const rule of rules) {
    if (rule.rule_type === 'MAX_DAILY_KWH') {
      if (record.kwh > rule.threshold) {
        const exceso = Number((record.kwh - rule.threshold).toFixed(2));
        const porcExceso = Number(((exceso / rule.threshold) * 100).toFixed(1));
        const alarm = await createAlarm({
          machine_id: record.machine_id,
          rule_id: rule.id,
          date: record.date,
          value_measured: record.kwh,
          threshold_exceeded: rule.threshold,
          severity: rule.severity,
          message: `Consumo excesivo en ${machineName}: ${record.kwh} kWh (estándar: ${rule.threshold} kWh/día, +${porcExceso}% de sobreconsumo)`
        });
        triggeredAlarms.push(alarm);
      }
    } else if (rule.rule_type === 'MAX_PEAK_KW') {
      if (record.peak_power_kw > rule.threshold) {
        const alarm = await createAlarm({
          machine_id: record.machine_id,
          rule_id: rule.id,
          date: record.date,
          value_measured: record.peak_power_kw,
          threshold_exceeded: rule.threshold,
          severity: rule.severity,
          message: `Pico de potencia superado en ${machineName}: ${record.peak_power_kw} kW (máximo permitido: ${rule.threshold} kW)`
        });
        triggeredAlarms.push(alarm);
      }
    }
  }

  return triggeredAlarms;
}

export { getAlarms, resolveAlarm };
