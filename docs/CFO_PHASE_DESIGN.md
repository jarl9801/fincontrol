# FinControl — Fase CFO (Diseño)

> Plan para que Claude Code (o cualquier agente) implemente la "capa CFO" sobre la base operacional ya construida (DATEV, bankMovements, classifier, rules, alerts).
>
> Autor: Hermes · Fecha: 2026-04-28 · Stack: React 19 + Vite + Firebase + Recharts · Tema: NEXUS.OS

---

## 0. Contexto y supuestos

**Lo que YA existe (post-sesión 27 abr):**
- `bankMovements` como fuente de verdad (importado de DATEV)
- Classifier semanal (link/categorize)
- Reglas: CXC/CXP requieren link a `bankMovement` para cambiar status
- Forward-looking cashflow panel en Dashboard
- Operational alerts dashboard
- Asset management: employees, properties, vehicles, insurances, recurring costs
- Backup completo (incluye bankMovements)

**Lo que FALTA para ser "herramienta CFO":**
- Vista única, condensada, accionable (no 40 sub-páginas)
- Forecast 13 semanas (rolling) con escenarios
- Margen por proyecto (NE3, NE4, Soplado, Fusión) con costos directos vs indirectos
- AR/AP aging real con riesgo de cobro
- Runway + burn rate visibles
- Variance: presupuesto vs real, mes a mes
- Reporte ejecutivo mensual exportable (PDF para tío Juan / Beatriz)

**Restricción crítica detectada hoy:** Firestore quota EXCEEDED (Spark plan).
→ Cualquier panel CFO debe leer **una sola vez** y cachear en estado, no múltiples queries por widget. Considerar Blaze upgrade antes de prod intensiva.

---

## 1. Principios de diseño (no negociables)

1. **Una pantalla, una decisión.** El CFO no entra a "explorar" — entra a saber: ¿estamos vivos? ¿llegamos a fin de mes? ¿qué proyecto sangra?
2. **Cash es oxígeno.** Toda vista CFO arranca con: efectivo hoy + runway + próximos 30 días.
3. **Read-mostly.** La capa CFO **no edita** datos operacionales — solo lee, agrega, alerta.
4. **Single-fetch.** Cada vista hace UN snapshot de Firestore al montarse, deriva todo en memoria.
5. **Exportable.** Todo lo que se ve en pantalla se baja como PDF/CSV en un click.
6. **NEXUS.OS estricto.** Sin colores nuevos, sin pesos nuevos. Solo orange `#FF4D2E` para alertas críticas.

---

## 2. Arquitectura de la fase CFO

### 2.1 Nuevos features (carpetas en `src/features/`)

```
src/features/
  cfo/                        ← nuevo paquete CFO
    CFODashboard.jsx          ← entrada principal /cfo
    panels/
      CashPositionPanel.jsx   ← efectivo hoy + runway + burn
      Forecast13WPanel.jsx    ← 13-week rolling cashflow
      ProjectMarginPanel.jsx  ← margen por proyecto (NE3/NE4/...)
      ARAPagingPanel.jsx      ← aging CXC/CXP con riesgo
      VarianceMTDPanel.jsx    ← presupuesto vs real (mes en curso)
      AlertsCFOPanel.jsx      ← top 5 alertas que mueven la aguja
    reports/
      MonthlyExecutiveReport.jsx  ← PDF mensual
      WeeklyCashReport.jsx        ← PDF semanal
    hooks/
      useCFOSnapshot.js       ← single-fetch de todas las colecciones
      useForecast13W.js       ← cálculo forecast (puro, testeable)
      useProjectMargin.js     ← agregación por proyecto
      useAging.js             ← aging CXC/CXP
      useRunway.js            ← runway + burn rate
    lib/
      forecast.js             ← lógica pura de proyección
      margin.js               ← cálculo de margen
      aging.js                ← buckets aging (0-30, 31-60, 61-90, >90)
      pdfExport.js            ← jspdf wrappers
```

### 2.2 Nuevas rutas

```
/cfo                ← Dashboard CFO (default)
/cfo/forecast       ← Forecast 13W full-screen
/cfo/projects       ← Margen por proyecto detallado
/cfo/aging          ← Aging CXC/CXP detallado
/cfo/reports        ← Lista de reportes generables
/cfo/reports/monthly?month=YYYY-MM   ← Reporte ejecutivo mensual
```

### 2.3 Permisos

Solo `jromero` y `bsandoval` ven `/cfo`. Validar en `App.jsx` router guard usando `useAuth()` existente.

---

## 3. Fases de implementación (para Claude Code)

Cada fase es un PR independiente, mergeable, deployable.

### Fase A — Foundation (1 sesión, ~2h)
**Goal:** crear la entrada `/cfo` con layout vacío + single-fetch snapshot funcionando.

- [ ] Crear `src/features/cfo/CFODashboard.jsx` con grid 2x3 placeholder
- [ ] Crear `src/features/cfo/hooks/useCFOSnapshot.js`:
  - Lee 1 vez: `bankMovements`, `cxc`, `cxp`, `projects`, `recurringCosts`, `employees`, `categories`
  - Devuelve `{ snapshot, loading, error, refetch, fetchedAt }`
  - Usa `Promise.all` con `getDocs` (no listeners)
- [ ] Añadir ruta `/cfo` con guard de rol (admin/manager only)
- [ ] Añadir item en sidebar con label "CFO" y badge `.OS`
- [ ] Tests: snapshot devuelve estructura esperada (mock Firestore)

**DoD:** entras a `/cfo`, ves grid con 6 paneles "Coming soon" + timestamp del snapshot.

### Fase B — Cash Position + Runway (1 sesión, ~2h)
**Goal:** el CFO entra y sabe en 3s si la empresa está viva.

- [ ] `lib/runway.js` puro:
  - Input: `bankMovements`, `recurringCosts`, fecha hoy
  - Output: `{ cashToday, burn30d, burn90d, runwayMonths, runwayDate }`
- [ ] `panels/CashPositionPanel.jsx`:
  - KPI grande: cash hoy (Banco + IVA según `balances2025`)
  - KPI: burn rate 30d (rojo si > X)
  - KPI: runway en meses + fecha estimada de quiebre
  - Sparkline 90 días saldo banco
- [ ] Tests unitarios de `runway.js` con fixtures

**DoD:** panel renderiza con datos reales, runway se calcula correctamente.

### Fase C — Forecast 13 semanas (1 sesión, ~3h)
**Goal:** ver proyección semanal de caja con escenarios.

- [ ] `lib/forecast.js` puro:
  - Input: cash inicial, CXC pendientes (con probabilidad de cobro), CXP pendientes, recurring costs, payroll
  - Output: array de 13 semanas `[{week, inflow, outflow, ending, breach?}]`
- [ ] Toggle escenarios: Base / Optimista (CXC +20% antes) / Pesimista (CXC -20% después)
- [ ] `panels/Forecast13WPanel.jsx`:
  - Tabla 13 columnas + chart Recharts area
  - Resaltar semanas con saldo proyectado < umbral (rojo NEXUS)
- [ ] Test: verificar suma de inflows/outflows = expected

**DoD:** se ve el forecast, los 3 escenarios cambian la curva, alerta si hay quiebre.

### Fase D — Margen por proyecto (1 sesión, ~2h)
**Goal:** cuál de NE3/NE4/Soplado/Fusión está sangrando.

- [ ] `lib/margin.js`:
  - Para cada `project`: ingresos (movimientos taggeados) - costos directos (CXP linkeados) - asignación de overhead
  - Output: `{ projectId, revenue, directCost, indirectCost, margin, marginPct }`
- [ ] `panels/ProjectMarginPanel.jsx`:
  - Tabla ordenada por margen ascendente (peor arriba)
  - Sparkline margen últimos 6 meses por proyecto
- [ ] Drilldown click → `/cfo/projects/:id`

**DoD:** se identifican proyectos con margen negativo o decreciente.

### Fase E — AR/AP Aging (1 sesión, ~1.5h)
**Goal:** cuánto nos deben y cuánto debemos, agrupado por antigüedad.

- [ ] `lib/aging.js`: buckets 0-30, 31-60, 61-90, >90
- [ ] `panels/ARAPagingPanel.jsx`:
  - 2 columnas: CXC (cobrar) | CXP (pagar)
  - Buckets con totales + count
  - Click en bucket → drilldown lista
- [ ] Resaltar >90d en orange NEXUS

**DoD:** veo cuánto está vencido y a quién perseguir.

### Fase F — Variance MTD (1 sesión, ~1.5h)
**Goal:** mes en curso vs presupuesto/promedio.

- [ ] `lib/variance.js`:
  - Si hay presupuesto definido → real vs budget
  - Si no → real MTD vs promedio mismo período últimos 3 meses
- [ ] `panels/VarianceMTDPanel.jsx`:
  - Por categoría: real | esperado | delta | %
  - Resaltar deltas > 20%

**DoD:** veo desviaciones sin abrir spreadsheet.

### Fase G — Alertas CFO consolidadas (0.5h)
- [ ] `panels/AlertsCFOPanel.jsx` consume el sistema `alerts` existente
- [ ] Filtra solo alertas `severity: critical | high` con impacto financiero
- [ ] Top 5, ordenadas por impacto € desc

### Fase H — Reportes exportables (1 sesión, ~3h)
**Goal:** un click → PDF mensual para Beatriz / tío Juan.

- [ ] `reports/MonthlyExecutiveReport.jsx`:
  - 1 página: cash position, P&L resumido, top 5 ingresos, top 5 egresos, margen por proyecto, alertas
  - Export PDF con `jspdf` + `jspdf-autotable` (ya en deps)
- [ ] `reports/WeeklyCashReport.jsx`:
  - Forecast 13W + lista CXC/CXP semana
- [ ] Botón "Email a Beatriz" → mailto con PDF adjunto (o solo descarga inicial)

**DoD:** generar PDF mensual de marzo 2026 que sirva como informe real.

---

## 4. Cosas que Claude Code DEBE respetar

Lista corta de no-romper (extiende el AGENTS.md existente):

1. **No tocar `sanitizeValue()` ni `viewedBy`** (ya documentado)
2. **No introducir Firestore listeners** en `/cfo` — quota está al límite. Solo `getDocs` puntual.
3. **No nuevos colores** — palette NEXUS.OS estricta
4. **No nuevas dependencias** — usar lo que ya está (Recharts, jspdf, lucide)
5. **Tests primero para `lib/*.js`** — son funciones puras, fáciles de testear y críticas (cálculos financieros)
6. **No editar datos desde `/cfo`** — solo lectura. Si necesitas editar, ir al feature original.
7. **Cada fase = 1 PR = 1 deploy verificable.** Nada de PRs gigantes.

---

## 5. Antes de arrancar — checklist humano (Jarl)

- [ ] **Decidir sobre Firestore quota:** upgrade a Blaze plan (solo paga por uso, normalmente < €5/mes para esto) o reducir reads. Sin esto, `/cfo` no funcionará bien.
- [ ] **Confirmar lista de proyectos vivos** que entran a margin tracker (NE3, NE4, Soplado, Fusión, ¿algo más?)
- [ ] **Definir umbral de "cash crítico"** que dispara alerta en CashPositionPanel (¿€5k? ¿€10k?)
- [ ] **Confirmar quién recibe el reporte mensual** (Beatriz, tío Juan, Isabelle)
- [ ] **¿Hay presupuesto formal** para que VarianceMTD compare contra él? Si no, usa promedios.

---

## 6. Orden sugerido de PRs

```
Fase A (foundation)
  ↓
Fase B (cash position) ← entregable mínimo viable de valor real
  ↓
Fase C (forecast 13W) ← entregable que ya justifica todo
  ↓
Fase E (aging)         ← rápido, alto valor
  ↓
Fase D (margin)        ← más complejo, depende de tagging limpio
  ↓
Fase F (variance)
  ↓
Fase G (alerts)
  ↓
Fase H (reportes)      ← cierra el ciclo, exportable a humanos
```

Total estimado: ~15h de trabajo de Claude Code, distribuidas en 7-8 sesiones cortas.

---

## 7. Cómo lanzar a Claude Code

Comando sugerido para mañana:

```
cd ~/Dev/fincontrol
claude
```

Y le pasas:
> Lee `docs/CFO_PHASE_DESIGN.md` y arranca con **Fase A**. Crea branch `feat/cfo-foundation`, commits atómicos, abre PR cuando termine. No avances a Fase B sin que yo apruebe el merge.

---

_Fin del diseño. Editar según vaya cambiando el alcance._
