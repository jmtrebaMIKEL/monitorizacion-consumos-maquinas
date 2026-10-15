# Spec Delta

## Purpose

Calcula agregados estadísticos, medias de consumo y comparativas entre máquinas para detectar tendencias y desviaciones energéticas.

## ADDED Requirements

### Requirement: Cálculo de estadísticas de consumo
El sistema DEBE calcular el consumo medio, acumulado y máximo diario para cada máquina y para el conjunto de las 4 máquinas.

#### Scenario: Consulta de resumen diario
- **WHEN** el usuario solicita el análisis de consumo de una fecha o rango de fechas
- **THEN** el sistema devuelve el total de kWh consumidos, el promedio por máquina y el pico máximo registrado

#### Scenario: Comparativa entre máquinas
- **WHEN** se solicita el desglose porcentual de consumo
- **THEN** el sistema devuelve la distribución del consumo total atribuido a cada una de las 4 máquinas

### Requirement: Detección de desviaciones estadísticas
El sistema DEBE identificar si el consumo de una máquina se desvía más de un 20% respecto a su media histórica de los últimos 30 días.

#### Scenario: Detección de desviación inusual
- **WHEN** una máquina registra un consumo significativamente superior a su media móvil histórica
- **THEN** el sistema etiqueta el registro como desviación estadística para análisis posterior
