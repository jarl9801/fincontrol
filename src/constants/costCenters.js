// Centros de Costo predefinidos
export const COST_CENTERS = [
  {
    id: 'CC-001',
    name: 'Obra Civil',
    type: 'Costos',
    budget: 0,
    spent: 0,
    responsible: 'Por Asignar'
  },
  {
    id: 'CC-002',
    name: 'Instalaciones y Reparaciones',
    type: 'Costos',
    budget: 136488.00,
    spent: 5437.44,
    responsible: 'Andres Romero'
  },
  {
    id: 'CC-003',
    name: 'NE4',
    type: 'Costos',
    budget: 213257.00,
    spent: 747.67,
    responsible: 'Isabelle Hortsmann'
  },
  {
    id: 'CC-004',
    name: 'Administrativo',
    type: 'Costos',
    budget: 240000.00,
    spent: 2158.66,
    responsible: 'Beatriz Sandoval'
  },
  {
    id: 'CC-005',
    name: 'Despliegue',
    type: 'Costos',
    budget: 125172.00,
    spent: 0,
    responsible: 'Jeisson Romero'
  }
];

// Centros de Ingresos (vacío por defecto)
export const INCOME_CENTERS = [];

// Generar nuevo ID
export const generateCostCenterId = (centers) => {
  const maxNum = centers.reduce((max, cc) => {
    const num = parseInt(cc.id.replace('CC-', ''));
    return num > max ? num : max;
  }, 0);
  return `CC-${String(maxNum + 1).padStart(3, '0')}`;
};
