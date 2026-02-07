# FinControl - Sistema de Control Financiero

Sistema de gestión financiera empresarial desarrollado con React y Firebase.

## 🚀 Características

### Dashboard Financiero
- KPIs en tiempo real (ingresos, gastos, balance)
- Gráficos de tendencia
- Métricas de rendimiento

### Gestión de Transacciones
- Registro de ingresos y gastos
- Ordenamiento por fecha y monto
- Filtros avanzados por tipo, categoría, proyecto

### Cuentas por Pagar/Cobrar
- Control de CXP y CXC
- Estados de pago (pendiente, parcial, pagado)
- Alertas de vencimiento

### Reportes Financieros
- **Resumen Ejecutivo**: KPIs, alertas, recomendaciones
- **Estado de Resultados**: Estructura contable profesional (EBIT, utilidad neta)
- **Ratios Financieros**: Liquidez, actividad, rentabilidad con indicadores visuales
- **Flujo de Caja**: Proyecciones y análisis

### Configuración
- **Proyectos**: Gestión de proyectos con presupuesto
- **Categorías**: Categorías de ingreso y gasto personalizables
- **Centros de Costo**: Presupuesto mensualizado con barras de progreso
- **Cuenta Bancaria**: Balance con línea de crédito

## 🛠️ Tecnologías

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS 4.x
- **Backend**: Firebase (Firestore, Auth)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Hosting**: Firebase Hosting

## 📦 Instalación

```bash
# Clonar repositorio
git clone https://github.com/jarl9801/fincontrol.git
cd fincontrol

# Instalar dependencias
npm install

# Configurar Firebase (crear .env con credenciales)
cp .env.example .env

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

## 🔐 Roles de Usuario

- **Admin**: Acceso completo (dashboard, reportes, configuración)
- **Editor**: Acceso limitado (transacciones)

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── layout/          # Sidebar, MobileMenu
│   └── ui/              # Card, Modal, Toast, etc.
├── features/
│   ├── auth/            # Login
│   ├── dashboard/       # Dashboard principal
│   ├── transactions/    # Lista de transacciones
│   ├── cxp/             # Cuentas por pagar
│   ├── cxc/             # Cuentas por cobrar
│   ├── reports/         # Reportes financieros
│   ├── cashflow/        # Flujo de caja
│   └── settings/        # Configuración
├── hooks/               # Custom hooks (useCategories, etc.)
├── services/            # Firebase config
├── utils/               # Utilidades (formatters)
└── constants/           # Configuración
```

## 🎨 Design System

Basado en HMR NEXUS Design System:
- Colores: Slate, Blue, Emerald, Amber, Red
- Tipografía: Inter
- Bordes redondeados: xl/2xl
- Sombras suaves

---

Desarrollado por **HMR NEXUS**
