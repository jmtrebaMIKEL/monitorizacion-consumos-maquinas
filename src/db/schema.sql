-- Esquema de base de datos para monitorización de 4 máquinas industriales

CREATE TABLE IF NOT EXISTS machines (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  nominal_power_kw NUMERIC(10, 2) NOT NULL,
  location VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_consumptions (
  id SERIAL PRIMARY KEY,
  machine_id VARCHAR(50) NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  kwh NUMERIC(12, 2) NOT NULL CHECK (kwh >= 0),
  peak_power_kw NUMERIC(10, 2) NOT NULL CHECK (peak_power_kw >= 0),
  operating_hours NUMERIC(5, 2) DEFAULT 8.0 CHECK (operating_hours >= 0 AND operating_hours <= 24),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_machine_date UNIQUE (machine_id, date)
);

CREATE TABLE IF NOT EXISTS alarm_rules (
  id SERIAL PRIMARY KEY,
  machine_id VARCHAR(50) REFERENCES machines(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'MAX_DAILY_KWH', 'MAX_PEAK_KW', 'DEVIATION_PERCENT'
  threshold NUMERIC(10, 2) NOT NULL,
  severity VARCHAR(20) DEFAULT 'WARNING', -- 'INFO', 'WARNING', 'CRITICAL'
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alarms (
  id SERIAL PRIMARY KEY,
  machine_id VARCHAR(50) NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  rule_id INTEGER REFERENCES alarm_rules(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  value_measured NUMERIC(12, 2) NOT NULL,
  threshold_exceeded NUMERIC(12, 2) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserción del catálogo inicial de las 4 máquinas industriales
INSERT INTO machines (id, name, code, nominal_power_kw, location, description)
VALUES 
  ('MAQ-01', 'Prensa Hidráulica 500T', 'PRENSA-500', 45.0, 'Línea de Estampación', 'Prensa para conformado metálico de alta presión'),
  ('MAQ-02', 'Torno CNC UltraPrecision', 'CNC-T02', 30.0, 'Taller de Mecanizado', 'Torno de 5 ejes para piezas mecánicas de precisión'),
  ('MAQ-03', 'Horno de Tratamiento Térmico', 'HORNO-T01', 75.0, 'Planta Térmica', 'Horno continuo de inducción y temple'),
  ('MAQ-04', 'Compresor de Aire Industrial', 'COMP-04', 22.0, 'Sala de Compresores', 'Compresor de tornillo para alimentación neumática de planta')
ON CONFLICT (id) DO NOTHING;

-- Inserción de estándares de alarma por defecto para cada máquina
INSERT INTO alarm_rules (machine_id, name, rule_type, threshold, severity)
VALUES
  ('MAQ-01', 'Límite Máximo Diario Prensa 500T', 'MAX_DAILY_KWH', 250.0, 'CRITICAL'),
  ('MAQ-02', 'Límite Máximo Diario Torno CNC', 'MAX_DAILY_KWH', 180.0, 'WARNING'),
  ('MAQ-03', 'Límite Máximo Diario Horno Térmico', 'MAX_DAILY_KWH', 450.0, 'CRITICAL'),
  ('MAQ-04', 'Límite Máximo Diario Compresor Aire', 'MAX_DAILY_KWH', 140.0, 'WARNING')
ON CONFLICT DO NOTHING;
