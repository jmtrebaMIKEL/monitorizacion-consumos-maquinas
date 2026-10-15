import { Router, Request, Response } from 'express';
import { testConnection } from '../db/connection';
import { getMachines, getMachineById, getAlarmRules } from '../db/store';
import { ingestDailyReading, ingestBatchReadings, getConsumptions } from '../services/consumptionService';
import { getConsumptionAnalytics } from '../services/analyticsService';
import { getAlarms, resolveAlarm } from '../services/alarmService';

const router = Router();

// 1. Estado y Conexión con Neon
router.get('/status', async (req: Request, res: Response) => {
  const status = await testConnection();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: status
  });
});

// 2. Catálogo de Máquinas
router.get('/machines', async (req: Request, res: Response) => {
  const machines = await getMachines();
  const rules = await getAlarmRules();
  const enriched = machines.map(m => ({
    ...m,
    alarm_standard_kwh: rules.find(r => r.machine_id === m.id && r.rule_type === 'MAX_DAILY_KWH')?.threshold || null
  }));
  res.json({ count: enriched.length, machines: enriched });
});

// 3. Subir lectura de consumo vía API (Individual)
router.post('/consumption', async (req: Request, res: Response) => {
  try {
    const { machine_id, date, kwh, peak_power_kw, operating_hours } = req.body;
    const result = await ingestDailyReading({
      machine_id,
      date,
      kwh: Number(kwh),
      peak_power_kw: peak_power_kw !== undefined ? Number(peak_power_kw) : undefined,
      operating_hours: operating_hours !== undefined ? Number(operating_hours) : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Lectura registrada correctamente.',
      data: result.record,
      alarmsGenerated: result.alarmsTriggered
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Subir lecturas por lotes vía API (Batch)
router.post('/consumption/batch', async (req: Request, res: Response) => {
  try {
    const records = req.body.records || req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, error: 'Se esperaba un array de lecturas en el cuerpo de la petición.' });
    }

    const result = await ingestBatchReadings(records);
    res.status(201).json({
      success: true,
      message: `Se han procesado ${result.totalIngested} lecturas.`,
      ...result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Consultar Histórico de Consumos
router.get('/consumption', async (req: Request, res: Response) => {
  const { machine_id, startDate, endDate } = req.query;
  const data = await getConsumptions({
    machine_id: machine_id as string | undefined,
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined
  });
  res.json({ count: data.length, consumptions: data });
});

// 6. Análisis y Estadísticas de Consumo
router.get('/analytics', async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const analytics = await getConsumptionAnalytics({
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined
  });
  res.json(analytics);
});

// 7. Alarmas y Alertas
router.get('/alarms', async (req: Request, res: Response) => {
  const resolvedParam = req.query.resolved !== undefined ? req.query.resolved === 'true' : undefined;
  const alarms = await getAlarms(resolvedParam);
  res.json({ count: alarms.length, alarms });
});

router.patch('/alarms/:id/resolve', async (req: Request, res: Response) => {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(idParam, 10);
  const ok = await resolveAlarm(id);
  if (ok) {
    res.json({ success: true, message: `Alarma #${id} marcada como resuelta.` });
  } else {
    res.status(404).json({ success: false, error: `Alarma #${id} no encontrada.` });
  }
});

// 8. Simulación automática de datos de prueba
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const daysRaw = req.body.days !== undefined ? String(req.body.days) : '14';
    const days = parseInt(daysRaw, 10) || 14;
    const machines = await getMachines();
    const rules = await getAlarmRules();
    const recordsToInsert = [];

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      for (const m of machines) {
        const standard = rules.find(r => r.machine_id === m.id)?.threshold || 200;
        // Generate values mostly normal, but occasionally exceeding the threshold
        const isAnomaly = (i === 1 || i === 4) && (m.id === 'MAQ-01' || m.id === 'MAQ-03');
        const kwh = isAnomaly 
          ? Number((standard * 1.25 + Math.random() * 20).toFixed(2)) 
          : Number((standard * 0.75 + Math.random() * (standard * 0.2)).toFixed(2));

        const peak = Number((kwh / 8 * 1.25).toFixed(2));

        recordsToInsert.push({
          machine_id: m.id,
          date: dateStr,
          kwh,
          peak_power_kw: peak,
          operating_hours: 8.0
        });
      }
    }

    const result = await ingestBatchReadings(recordsToInsert);
    res.json({
      success: true,
      message: `Simulación generada: ${result.totalIngested} lecturas de ${days} días para 4 máquinas. Alarmas generadas: ${result.totalAlarms}.`,
      result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
