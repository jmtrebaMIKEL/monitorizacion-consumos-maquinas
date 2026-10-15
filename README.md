# Sistema de Monitorización Energética Industrial (4 Máquinas)

Sistema integral de captura, análisis y generación de alarmas de consumo eléctrico para 4 máquinas industriales críticas, desarrollado con **OpenSpec**, **Node.js (TypeScript)**, **Express** y **PostgreSQL (Neon Serverless)**.

---

## 🏭 Catálogo de Máquinas Monitorizadas

| ID | Nombre de Máquina | Código | Potencia Nominal | Ubicación | Umbral Alarma Diario |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `MAQ-01` | Prensa Hidráulica 500T | `PRENSA-500` | 45.0 kW | Línea de Estampación | **250.0 kWh** (CRITICAL) |
| `MAQ-02` | Torno CNC UltraPrecision | `CNC-T02` | 30.0 kW | Taller de Mecanizado | **180.0 kWh** (WARNING) |
| `MAQ-03` | Horno de Tratamiento Térmico | `HORNO-T01` | 75.0 kW | Planta Térmica | **450.0 kWh** (CRITICAL) |
| `MAQ-04` | Compresor de Aire Industrial | `COMP-04` | 22.0 kW | Sala de Compresores | **140.0 kWh** (WARNING) |

---

## 🚀 Características Principales

* **Ingesta de lecturas vía API REST:** Registro individual o por lotes (Batch) de consumos diarios (kWh, picos de kW, horas de operación).
* **Motor de Análisis y Alarmas:** Detección automática de sobreconsumos comparados con los estándares de cada máquina.
* **Dashboard Web Interactivo:** Visualización en tiempo real de métricas acumuladas, gráficas de evolución temporal y panel de alertas.
* **Persistencia Dual:** Conexión nativa a **Neon PostgreSQL Cloud** con fallback transparente en memoria para desarrollo local.
* **Metodología OpenSpec:** Arquitectura guiada por especificaciones técnicas (`proposal.md`, `specs/`, `design.md`, `tasks.md`).

---

## 🛠️ Tecnologías Empleadas

* **Backend:** Node.js, Express, TypeScript, tsx
* **Base de Datos:** PostgreSQL / Neon Serverless (`pg` driver)
* **Frontend:** TailwindCSS, Chart.js, FontAwesome
* **Especificaciones:** OpenSpec CLI

---

## 📦 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/jmtrebaMIKEL/monitorizacion-consumos-maquinas.git
cd monitorizacion-consumos-maquinas
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia el archivo `.env.example` a `.env` y configura tu cadena de conexión de Neon:
```env
DATABASE_URL="postgresql://neondb_owner:TU_PASSWORD@ep-purple-glade-zau56m39.eu-west-2.aws.neon.tech/neondb?sslmode=require"
PORT=3000
```

### 4. Inicializar base de datos y arrancar el servidor
```bash
npm run dev
```

El servidor estará activo en:
* **Dashboard Web:** [http://localhost:3000](http://localhost:3000)
* **API Status:** [http://localhost:3000/api/status](http://localhost:3000/api/status)

---

## 📡 Endpoints de la API REST

* `GET /api/status` - Estado del servidor y conexión con Neon PostgreSQL.
* `GET /api/machines` - Catálogo completo de las 4 máquinas y sus estándares.
* `POST /api/consumption` - Subida de lectura diaria individual.
* `POST /api/consumption/batch` - Subida de lecturas en bloque.
* `GET /api/consumption` - Consulta de histórico de lecturas (soporta filtros por máquina y fechas).
* `GET /api/analytics` - Métricas agregadas, medias y picos de potencia.
* `GET /api/alarms` - Listado de alarmas e incidentes registrados.
* `PATCH /api/alarms/:id/resolve` - Marcar una alarma como resuelta.
* `POST /api/simulate` - Generación automática de datos de prueba simulados.

---

## 📄 Licencia
ISC
