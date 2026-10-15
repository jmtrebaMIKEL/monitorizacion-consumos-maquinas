# Spec Delta

## Purpose

Permite configurar estándares y umbrales energéticos, evaluando automáticamente cada lectura para disparar alarmas ante consumos excesivos o anomalías.

## ADDED Requirements

### Requirement: Reglas y estándares de alarma
El sistema DEBE permitir configurar estándares de consumo (umbral máximo diario en kWh y potencia máxima en kW) por máquina.

#### Scenario: Configuración de umbral
- **WHEN** un administrador define un umbral máximo de 150 kWh/día para la Máquina 1
- **THEN** el sistema guarda la regla de alarma asociada a esa máquina

### Requirement: Evaluación automática de alarmas
El sistema DEBE evaluar cada nuevo registro de consumo frente a las reglas configuradas y generar una alarma si se superan los estándares.

#### Scenario: Disparo de alarma por exceso de consumo
- **WHEN** una máquina registra un consumo diario que supera su umbral estándar configurado
- **THEN** el sistema genera una alarma con severidad CRÍTICA o ADVERTENCIA, indicando la máquina, fecha y exceso registrado

#### Scenario: Alarma por consumo fuera de horario
- **WHEN** se detecta consumo activo significativo durante días festivos o turnos no productivos configurados
- **THEN** el sistema registra una alarma por consumo en modo reposo no programado
