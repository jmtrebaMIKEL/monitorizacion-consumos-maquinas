# Proposal

## Why

Para optimizar costes y detectar fallos tempranos en planta, es necesario monitorizar de forma centralizada el consumo energético diario de 4 máquinas críticas, analizar sus desviaciones respecto a patrones estándar y alertar automáticamente al equipo técnico cuando se sobrepasen los límites definidos.

## What Changes

- **Registro de consumo diario**: Ingesta y almacenamiento histórico de las lecturas energéticas (kWh, potencia pico y horas de operación) de 4 máquinas industriales.
- **Motor de análisis de consumos**: Cálculo de estadísticas diarias, comparativas entre máquinas, consumo medio y detección de anomalías.
- **Sistema de alarmas y estándares**: Configuración de umbrales máximos, detección de consumo excesivo o fuera de horario laboral y registro de alertas.
- **Interfaz y API de consulta**: Panel y endpoints para consultar el estado en tiempo real, histórico y alertas activas.

## Capabilities

### New Capabilities
- `consumption-ingestion`: Ingesta, validación y persistencia de lecturas energéticas diarias para las 4 máquinas.
- `consumption-analytics`: Procesamiento estadístico, detección de desviaciones y métricas agregadas de consumo.
- `alarm-management`: Definición de umbrales estándar, evaluación automática de condiciones de alarma y gestión de alertas.

### Modified Capabilities
<!-- No modified capabilities (greenfield project) -->

## Impact

- **Base de datos**: Nuevas tablas en PostgreSQL (`machines`, `consumption_records`, `alarm_rules`, `alarms`).
- **Servicios**: Creación del backend para la ingesta, evaluación de reglas de alarma y consulta analítica.
- **Dependencias**: Drivers PostgreSQL (`pg` o `neon/serverless`), ORM / query builder y librerías de análisis y fechas.
