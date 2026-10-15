# Spec Delta

## Purpose

Permite el registro, validación y almacenamiento de las lecturas energéticas diarias de las 4 máquinas industriales para su monitorización continua.

## ADDED Requirements

### Requirement: Registro diario de consumo
El sistema DEBE permitir registrar las lecturas energéticas diarias para cada una de las 4 máquinas monitorizadas.

#### Scenario: Ingesta de lectura válida
- **WHEN** se envía una lectura con el identificador de máquina, fecha, consumo en kWh y potencia pico
- **THEN** el sistema valida los tipos de datos y almacena el registro en la base de datos con marca temporal

#### Scenario: Rechazo de valores inválidos
- **WHEN** se envía un consumo en kWh negativo o una máquina no registrada
- **THEN** el sistema rechaza la solicitud devolviendo un código de error explícito y no persiste el dato

### Requirement: Identificación de las 4 máquinas
El sistema DEBE mantener un catálogo inicial de las 4 máquinas con sus metadatos (nombre, modelo, ubicación y potencia nominal).

#### Scenario: Consulta del listado de máquinas
- **WHEN** un cliente solicita el inventario de máquinas
- **THEN** el sistema responde con la lista exacta de las 4 máquinas y sus características
