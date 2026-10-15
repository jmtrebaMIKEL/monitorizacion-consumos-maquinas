# Tasks

## 1. Setup y Modelo de Datos

- [x] 1.1 Configurar el proyecto Node.js/TypeScript con dependencias (`express`, `dotenv`, `pg`, `cors`) y verificar compilación inicial
- [x] 1.2 Crear el script de migración SQL con las tablas `machines`, `daily_consumptions`, `alarm_rules` y `alarms`, y verificar creación en base de datos

## 2. Ingesta de Consumo y Catálogo

- [x] 2.1 Implementar el servicio de gestión de las 4 máquinas industriales e insertar sus datos iniciales
- [x] 2.2 Implementar el endpoint de ingesta de lecturas diarias de consumo (`POST /api/consumption`) con validaciones de rango y fecha

## 3. Motor de Análisis y Alarmas

- [x] 3.1 Implementar el motor de cálculo estadístico (medias diarias, acumulados y distribución comparativa entre las 4 máquinas)
- [x] 3.2 Implementar el evaluador de reglas de alarma que compare lecturas contra estándares definidos (umbral diario y picos)
- [x] 3.3 Implementar endpoints de consulta de alarmas activas e históricas (`GET /api/alarms`)

## 4. Dashboard Web y Verificación

- [x] 4.1 Diseñar la interfaz web interactiva (Dashboard) con selector de fechas, gráficas de consumo en Chart.js y monitor de alarmas
- [x] 4.2 Crear script de simulación/ingesta de datos de muestra para verificar el comportamiento de las 4 máquinas durante los últimos 14 días
- [x] 4.3 Ejecutar verificación completa de integración: comprobar que al superar los estándares se dispara y visualiza la alarma en el panel
