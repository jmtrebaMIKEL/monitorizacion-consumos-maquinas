import fs from 'fs';
import path from 'path';
import { pool, useMemoryFallback } from './connection';

export interface Machine {
  id: string;
  name: string;
  code: string;
  nominal_power_kw: number;
  location: string;
  description: string;
  created_at?: Date;
}

export interface ConsumptionRecord {
  id?: number;
  machine_id: string;
  date: string; // YYYY-MM-DD
  kwh: number;
  peak_power_kw: number;
  operating_hours: number;
  created_at?: Date;
}

export interface AlarmRule {
  id: number;
  machine_id: string;
  name: string;
  rule_type: string;
  threshold: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  enabled: boolean;
}

export interface Alarm {
  id: number;
  machine_id: string;
  machine_name?: string;
  rule_id?: number;
  date: string;
  value_measured: number;
  threshold_exceeded: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  resolved: boolean;
  resolved_at?: Date | null;
  created_at?: Date;
}

// In-Memory store fallback
const memoryData = {
  machines: [
    { id: 'MAQ-01', name: 'Prensa Hidráulica 500T', code: 'PRENSA-500', nominal_power_kw: 45.0, location: 'Línea de Estampación', description: 'Prensa para conformado metálico de alta presión' },
    { id: 'MAQ-02', name: 'Torno CNC UltraPrecision', code: 'CNC-T02', nominal_power_kw: 30.0, location: 'Taller de Mecanizado', description: 'Torno de 5 ejes para piezas mecánicas de precisión' },
    { id: 'MAQ-03', name: 'Horno de Tratamiento Térmico', code: 'HORNO-T01', nominal_power_kw: 75.0, location: 'Planta Térmica', description: 'Horno continuo de inducción y temple' },
    { id: 'MAQ-04', name: 'Compresor de Aire Industrial', code: 'COMP-04', nominal_power_kw: 22.0, location: 'Sala de Compresores', description: 'Compresor de tornillo para alimentación neumática de planta' }
  ] as Machine[],
  consumptions: [] as ConsumptionRecord[],
  alarmRules: [
    { id: 1, machine_id: 'MAQ-01', name: 'Límite Máximo Diario Prensa 500T', rule_type: 'MAX_DAILY_KWH', threshold: 250.0, severity: 'CRITICAL', enabled: true },
    { id: 2, machine_id: 'MAQ-02', name: 'Límite Máximo Diario Torno CNC', rule_type: 'MAX_DAILY_KWH', threshold: 180.0, severity: 'WARNING', enabled: true },
    { id: 3, machine_id: 'MAQ-03', name: 'Límite Máximo Diario Horno Térmico', rule_type: 'MAX_DAILY_KWH', threshold: 450.0, severity: 'CRITICAL', enabled: true },
    { id: 4, machine_id: 'MAQ-04', name: 'Límite Máximo Diario Compresor Aire', rule_type: 'MAX_DAILY_KWH', threshold: 140.0, severity: 'WARNING', enabled: true }
  ] as AlarmRule[],
  alarms: [] as Alarm[]
};

export async function initDatabase(): Promise<void> {
  if (pool && !useMemoryFallback) {
    try {
      const sqlPath = path.join(__dirname, 'schema.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      console.log('✅ Esquema y catálogo inicial creados correctamente en Neon PostgreSQL.');
      return;
    } catch (err: any) {
      console.warn('⚠️ No se pudo ejecutar el script en Neon:', err.message);
    }
  }
  console.log('✅ Esquema y catálogo inicial inicializados en memoria local.');
}

export async function getMachines(): Promise<Machine[]> {
  if (pool && !useMemoryFallback) {
    try {
      const res = await pool.query('SELECT * FROM machines ORDER BY id ASC');
      return res.rows;
    } catch (e) {}
  }
  return memoryData.machines;
}

export async function getMachineById(id: string): Promise<Machine | undefined> {
  const all = await getMachines();
  return all.find(m => m.id === id);
}

export async function saveConsumption(record: Omit<ConsumptionRecord, 'id'>): Promise<ConsumptionRecord> {
  if (pool && !useMemoryFallback) {
    try {
      const query = `
        INSERT INTO daily_consumptions (machine_id, date, kwh, peak_power_kw, operating_hours)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (machine_id, date) DO UPDATE 
        SET kwh = EXCLUDED.kwh, peak_power_kw = EXCLUDED.peak_power_kw, operating_hours = EXCLUDED.operating_hours
        RETURNING *;
      `;
      const res = await pool.query(query, [record.machine_id, record.date, record.kwh, record.peak_power_kw, record.operating_hours || 8.0]);
      return res.rows[0];
    } catch (e) {
      console.warn('Error guardando en Neon, guardando en almacén local:', e);
    }
  }

  // Memory fallback
  const existingIdx = memoryData.consumptions.findIndex(c => c.machine_id === record.machine_id && c.date === record.date);
  const newRecord: ConsumptionRecord = {
    id: existingIdx >= 0 ? memoryData.consumptions[existingIdx].id : memoryData.consumptions.length + 1,
    ...record,
    created_at: new Date()
  };

  if (existingIdx >= 0) {
    memoryData.consumptions[existingIdx] = newRecord;
  } else {
    memoryData.consumptions.push(newRecord);
  }

  return newRecord;
}

export async function getConsumptions(filters?: { machine_id?: string; startDate?: string; endDate?: string }): Promise<ConsumptionRecord[]> {
  if (pool && !useMemoryFallback) {
    try {
      let query = 'SELECT * FROM daily_consumptions WHERE 1=1';
      const params: any[] = [];
      if (filters?.machine_id) {
        params.push(filters.machine_id);
        query += ` AND machine_id = $${params.length}`;
      }
      if (filters?.startDate) {
        params.push(filters.startDate);
        query += ` AND date >= $${params.length}`;
      }
      if (filters?.endDate) {
        params.push(filters.endDate);
        query += ` AND date <= $${params.length}`;
      }
      query += ' ORDER BY date DESC, machine_id ASC';
      const res = await pool.query(query, params);
      return res.rows.map(r => ({ ...r, date: r.date.toISOString().split('T')[0] }));
    } catch (e) {}
  }

  let list = [...memoryData.consumptions];
  if (filters?.machine_id) list = list.filter(c => c.machine_id === filters.machine_id);
  if (filters?.startDate) list = list.filter(c => c.date >= filters.startDate!);
  if (filters?.endDate) list = list.filter(c => c.date <= filters.endDate!);
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getAlarmRules(machine_id?: string): Promise<AlarmRule[]> {
  if (pool && !useMemoryFallback) {
    try {
      const query = machine_id 
        ? 'SELECT * FROM alarm_rules WHERE machine_id = $1 AND enabled = true'
        : 'SELECT * FROM alarm_rules WHERE enabled = true';
      const res = await pool.query(query, machine_id ? [machine_id] : []);
      return res.rows;
    } catch (e) {}
  }
  return machine_id ? memoryData.alarmRules.filter(r => r.machine_id === machine_id && r.enabled) : memoryData.alarmRules;
}

export async function createAlarm(alarm: Omit<Alarm, 'id' | 'resolved' | 'created_at'>): Promise<Alarm> {
  if (pool && !useMemoryFallback) {
    try {
      const query = `
        INSERT INTO alarms (machine_id, rule_id, date, value_measured, threshold_exceeded, severity, message, resolved)
        VALUES ($1, $2, $3, $4, $5, $6, $7, false)
        RETURNING *;
      `;
      const res = await pool.query(query, [alarm.machine_id, alarm.rule_id || null, alarm.date, alarm.value_measured, alarm.threshold_exceeded, alarm.severity, alarm.message]);
      return res.rows[0];
    } catch (e) {}
  }

  const newAlarm: Alarm = {
    id: memoryData.alarms.length + 1,
    ...alarm,
    resolved: false,
    created_at: new Date()
  };
  memoryData.alarms.unshift(newAlarm);
  return newAlarm;
}

export async function getAlarms(resolved?: boolean): Promise<Alarm[]> {
  if (pool && !useMemoryFallback) {
    try {
      let query = `
        SELECT a.*, m.name as machine_name 
        FROM alarms a 
        JOIN machines m ON a.machine_id = m.id 
      `;
      const params: any[] = [];
      if (typeof resolved === 'boolean') {
        params.push(resolved);
        query += ` WHERE a.resolved = $1`;
      }
      query += ` ORDER BY a.created_at DESC`;
      const res = await pool.query(query, params);
      return res.rows;
    } catch (e) {}
  }

  const machines = memoryData.machines;
  let list = memoryData.alarms.map(a => ({
    ...a,
    machine_name: machines.find(m => m.id === a.machine_id)?.name || a.machine_id
  }));

  if (typeof resolved === 'boolean') {
    list = list.filter(a => a.resolved === resolved);
  }
  return list;
}

export async function resolveAlarm(id: number): Promise<boolean> {
  if (pool && !useMemoryFallback) {
    try {
      const res = await pool.query('UPDATE alarms SET resolved = true, resolved_at = NOW() WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (e) {}
  }

  const item = memoryData.alarms.find(a => a.id === id);
  if (item) {
    item.resolved = true;
    item.resolved_at = new Date();
    return true;
  }
  return false;
}
