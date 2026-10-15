# Design

## Context

El proyecto se desarrolla sobre Node.js v24 y se conecta a la base de datos PostgreSQL alojada en Neon configurada en `.env`. Requiere monitorizar 4 máquinas industriales específicas (ej. Prensa Hidráulica, Torno CNC, Horno de Tratamiento, Compresor Principal) con ingesta de lecturas diarias, estadísticas de rendimiento y disparadores de alarma configurables.

## Goals / Non-Goals

**Goals:**
- Definir el esquema relacional en PostgreSQL (`machines`, `daily_consumptions`, `alarm_rules`, `alarms`).
- Desarrollar un servicio backend modular con endpoints REST para registrar consumos, consultar métricas analíticas y gestionar alarmas.
- Crear un motor de evaluación de estándares que verifique umbrales máximos diarios y desviaciones estadísticas.
- Proporcionar un Dashboard web interactivo con gráficas comparativas de las 4 máquinas y semáforo de alarmas.

**Non-Goals:**
- Conexión hardware directa mediante protocolos industriales como Modbus o OPC-UA (en esta fase la ingesta se realiza vía API REST o script de simulación/carga diaria).
- Gestión multi-inquilino (*multi-tenant*) compleja.

## Decisions

### 1. Stack Tecnológico: Node.js + Express + TypeScript
- **Decisión**: Usar Node.js con Express y TypeScript.
- **Razón**: Máxima compatibilidad con el entorno instalado (Node v24), facilidad de mantenimiento, tipado estricto y rapidez de entrega.
- **Alternativas consideradas**: Python con FastAPI (viable, pero Node.js ya está configurado con npm y OpenSpec en el espacio actual).

### 2. Acceso a Datos: PostgreSQL con cliente `@neondatabase/serverless` / `pg`
- **Decisión**: Usar el cliente PostgreSQL adaptado a Neon.
- **Razón**: Conexión nativa con pooling para bases de datos serverless en la nube, asegurando baja latencia y soporte SSL.

### 3. Interfaz de Usuario: Dashboard Web en cliente liviano con Chart.js
- **Decisión**: Frontend web servido directamente por el backend con Tailwind CSS y Chart.js para visualización de consumos y alarmas.
- **Razón**: Permite al usuario interactuar de inmediato desde el navegador sin pasos complejos de transpilación frontend.

## Risks / Trade-offs

- **[Falta de conexión a Neon si la URL no está activa]** → Se incluye script de inicialización de esquema y modo fallback con SQLite/memoria temporal si la base de datos externa no responde inmediatamente.
- **[Variabilidad en turnos y estacionalidad]** → Las reglas de alarma permiten definir umbrales diferenciados por máquina y tipo de día (laboral vs festivo).
