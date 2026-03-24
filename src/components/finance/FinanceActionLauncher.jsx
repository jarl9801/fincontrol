import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  FileDown,
  FileUp,
  Loader2,
  WalletCards,
  X,
} from 'lucide-react';
import { usePayables } from '../../hooks/usePayables';
import { useProjects } from '../../hooks/useProjects';
import { useReceivables } from '../../hooks/useReceivables';
import { useBankMovements } from '../../hooks/useBankMovements';
import { useToast } from '../../contexts/ToastContext';

const ACTIONS = [
  {
    id: 'register-collection',
    title: 'Registrar cobro',
    description: 'Entrada real de dinero, con o sin factura CXC asociada.',
    icon: ArrowUpRight,
    accent: '#30d158',
    family: 'Caja real',
  },
  {
    id: 'register-payment',
    title: 'Registrar pago',
    description: 'Salida real de dinero, con o sin factura CXP asociada.',
    icon: ArrowDownLeft,
    accent: '#ff453a',
    family: 'Caja real',
  },
  {
    id: 'create-receivable',
    title: 'Crear factura CXC',
    description: 'Documento pendiente por cobrar que aun no afecta caja.',
    icon: FileUp,
    accent: '#64d2ff',
    family: 'Documento',
  },
  {
    id: 'create-payable',
    title: 'Crear factura CXP',
    description: 'Documento pendiente por pagar que aun no afecta caja.',
    icon: FileDown,
    accent: '#ff9f0a',
    family: 'Documento',
  },
  {
    id: 'bank-adjustment',
    title: 'Ajuste bancario',
    description: 'Movimiento directo de tesoreria no ligado a CXC o CXP.',
    icon: WalletCards,
    accent: '#5e5ce6',
    family: 'Tesorería',
  },
];

const DEFAULT_ACTION_MAP = {
  income: 'create-receivable',
  expense: 'create-payable',
};

const initialIssueDate = () => new Date().toISOString().slice(0, 10);

const resolveProjectName = (projects, projectId) => {
  const project = projects.find((entry) => entry.id === projectId);
  return project?.name || project?.displayName || project?.code || '';
};

const Field = ({ label, children, optional = false }) => (
  <label className="block">
    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6980ac]">
      {label}
      {optional ? '' : ' *'}
    </span>
    {children}
  </label>
);

const inputClassName =
  'w-full rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/88 px-4 py-3 text-sm text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]';

const accentButtonMap = {
  'register-collection': 'bg-[#0f9f6e] hover:bg-[#0c875d] shadow-[0_16px_34px_rgba(15,159,110,0.24)]',
  'register-payment': 'bg-[#d04c36] hover:bg-[#b8412f] shadow-[0_16px_34px_rgba(208,76,54,0.24)]',
  'create-receivable': 'bg-[#1990cc] hover:bg-[#127ab0] shadow-[0_16px_34px_rgba(25,144,204,0.24)]',
  'create-payable': 'bg-[#c98717] hover:bg-[#a86f12] shadow-[0_16px_34px_rgba(201,135,23,0.24)]',
  'bank-adjustment': 'bg-[#5e5ce6] hover:bg-[#4d49d8] shadow-[0_16px_34px_rgba(94,92,230,0.24)]',
};

const FinanceActionLauncher = ({ isOpen, onClose, user, defaultAction }) => {
  const { showToast } = useToast();
  const { projects } = useProjects(user);
  const { receivables, registerPayment: registerReceivablePayment, createReceivable } = useReceivables(user);
  const { payables, registerPayment: registerPayablePayment, createPayable } = usePayables(user);
  const { createBankMovement } = useBankMovements(user);

  const [activeAction, setActiveAction] = useState(DEFAULT_ACTION_MAP[defaultAction] || defaultAction || ACTIONS[0].id);
  const [submitting, setSubmitting] = useState(false);

  const [receivableForm, setReceivableForm] = useState({
    invoiceNumber: '',
    client: '',
    description: '',
    amount: '',
    issueDate: initialIssueDate(),
    dueDate: initialIssueDate(),
    projectId: '',
  });
  const [payableForm, setPayableForm] = useState({
    invoiceNumber: '',
    vendor: '',
    description: '',
    amount: '',
    issueDate: initialIssueDate(),
    dueDate: initialIssueDate(),
    projectId: '',
  });
  const [collectionForm, setCollectionForm] = useState({
    receivableId: '',
    amount: '',
    date: initialIssueDate(),
    method: 'Transferencia',
    counterpartyName: '',
    description: '',
    projectId: '',
    note: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    payableId: '',
    amount: '',
    date: initialIssueDate(),
    method: 'Transferencia',
    counterpartyName: '',
    description: '',
    projectId: '',
    note: '',
  });
  const [adjustmentForm, setAdjustmentForm] = useState({
    direction: 'in',
    amount: '',
    date: initialIssueDate(),
    description: '',
    counterpartyName: '',
    projectId: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setActiveAction(DEFAULT_ACTION_MAP[defaultAction] || defaultAction || ACTIONS[0].id);
  }, [defaultAction, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const openReceivables = useMemo(
    () => receivables.filter((entry) => ['issued', 'partial', 'overdue'].includes(entry.status)),
    [receivables],
  );
  const openPayables = useMemo(
    () => payables.filter((entry) => ['issued', 'partial', 'overdue'].includes(entry.status)),
    [payables],
  );

  if (!isOpen) return null;

  const submitReceivable = async () => {
    const projectName = resolveProjectName(projects, receivableForm.projectId);
    const result = await createReceivable({
      ...receivableForm,
      projectName,
      amount: Number(receivableForm.amount),
    });
    if (!result.success) throw new Error('No se pudo crear la factura CXC');
    showToast('Factura CXC creada');
  };

  const submitPayable = async () => {
    const projectName = resolveProjectName(projects, payableForm.projectId);
    const result = await createPayable({
      ...payableForm,
      projectName,
      amount: Number(payableForm.amount),
    });
    if (!result.success) throw new Error('No se pudo crear la factura CXP');
    showToast('Factura CXP creada');
  };

  const submitCollection = async () => {
    const linkedReceivable = openReceivables.find((entry) => entry.id === collectionForm.receivableId);
    if (linkedReceivable) {
      const result = await registerReceivablePayment(linkedReceivable, {
        amount: Number(collectionForm.amount),
        date: collectionForm.date,
        method: collectionForm.method,
        note: collectionForm.note,
      });
      if (!result.success) throw new Error('No se pudo registrar el cobro');
    } else {
      const projectName = resolveProjectName(projects, collectionForm.projectId);
      const result = await createBankMovement({
        kind: 'collection',
        direction: 'in',
        amount: Number(collectionForm.amount),
        postedDate: collectionForm.date,
        description: collectionForm.description,
        counterpartyName: collectionForm.counterpartyName,
        projectId: collectionForm.projectId,
        projectName,
      });
      if (!result.success) throw new Error('No se pudo registrar el cobro');
    }
    showToast('Cobro registrado');
  };

  const submitPayment = async () => {
    const linkedPayable = openPayables.find((entry) => entry.id === paymentForm.payableId);
    if (linkedPayable) {
      const result = await registerPayablePayment(linkedPayable, {
        amount: Number(paymentForm.amount),
        date: paymentForm.date,
        method: paymentForm.method,
        note: paymentForm.note,
      });
      if (!result.success) throw new Error('No se pudo registrar el pago');
    } else {
      const projectName = resolveProjectName(projects, paymentForm.projectId);
      const result = await createBankMovement({
        kind: 'payment',
        direction: 'out',
        amount: Number(paymentForm.amount),
        postedDate: paymentForm.date,
        description: paymentForm.description,
        counterpartyName: paymentForm.counterpartyName,
        projectId: paymentForm.projectId,
        projectName,
      });
      if (!result.success) throw new Error('No se pudo registrar el pago');
    }
    showToast('Pago registrado');
  };

  const submitAdjustment = async () => {
    const projectName = resolveProjectName(projects, adjustmentForm.projectId);
    const result = await createBankMovement({
      kind: 'adjustment',
      direction: adjustmentForm.direction,
      amount: Number(adjustmentForm.amount),
      postedDate: adjustmentForm.date,
      description: adjustmentForm.description,
      counterpartyName: adjustmentForm.counterpartyName,
      projectId: adjustmentForm.projectId,
      projectName,
    });
    if (!result.success) throw new Error('No se pudo crear el ajuste bancario');
    showToast('Ajuste bancario registrado');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      if (activeAction === 'create-receivable') await submitReceivable();
      if (activeAction === 'create-payable') await submitPayable();
      if (activeAction === 'register-collection') await submitCollection();
      if (activeAction === 'register-payment') await submitPayment();
      if (activeAction === 'bank-adjustment') await submitAdjustment();
      onClose();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'No se pudo completar la operacion', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const activeMeta = ACTIONS.find((entry) => entry.id === activeAction);
  const submitLabel = activeMeta?.title || 'Guardar registro';
  const submitButtonClassName = accentButtonMap[activeAction] || 'bg-[#3156d3] hover:bg-[#2748b6] shadow-[0_16px_34px_rgba(49,86,211,0.24)]';

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-[rgba(20,27,42,0.34)] p-4 backdrop-blur-md">
      <div className="relative flex max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[30px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,248,255,0.94))] shadow-[0_36px_120px_rgba(93,117,161,0.22)]">
        <button
          type="button"
          aria-label="Cerrar panel de registro"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/84 p-2 text-[#6b7a96] transition-colors hover:text-[#101938]"
        >
          <X size={18} />
        </button>

        <aside className="hidden w-[360px] shrink-0 border-r border-[rgba(201,214,238,0.78)] bg-[radial-gradient(circle_at_top_left,_rgba(147,196,255,0.3),_transparent_36%),linear-gradient(180deg,rgba(250,252,255,0.96)_0%,rgba(242,247,255,0.94)_100%)] p-6 lg:block">
          <div className="mb-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6980ac]">
              Operación
            </p>
            <h3 className="text-[26px] font-semibold tracking-tight text-[#101938]">Centro operativo</h3>
            <p className="mt-2 text-sm leading-6 text-[#6b7a96]">
              Registra cobros, pagos, facturas y ajustes desde un solo panel, con una estructura clara para el equipo.
            </p>
          </div>

          <div className="space-y-3">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const isActive = action.id === activeAction;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setActiveAction(action.id)}
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition-all ${
                    isActive
                      ? 'border-[rgba(90,141,221,0.34)] bg-[linear-gradient(180deg,rgba(232,241,255,0.96),rgba(244,248,255,0.96))] shadow-[0_18px_32px_rgba(90,141,221,0.14)]'
                      : 'border-[rgba(201,214,238,0.72)] bg-white/74 hover:bg-white'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${action.accent}20`, color: action.accent }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#101938]">{action.title}</p>
                        <p className="text-xs text-[#6b7a96]">{action.description}</p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="rounded-full bg-[rgba(90,141,221,0.12)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3156d3]">
                        Activo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: action.accent }}
                    >
                    </div>
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#6f85b0]">{action.family}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-[760px] flex-1 flex-col overflow-y-auto">
          <div className="border-b border-[rgba(201,214,238,0.78)] px-6 py-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${activeMeta.accent}20`, color: activeMeta.accent }}
              >
                <activeMeta.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6980ac]">
                  Flujo activo
                </p>
                <h2 className="text-[24px] font-semibold tracking-tight text-[#101938]">{activeMeta.title}</h2>
                <p className="mt-1 text-sm text-[#6b7a96]">{activeMeta.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[rgba(90,141,221,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3156d3]">
                    {activeMeta.family}
                  </span>
                  <span className="rounded-full border border-[rgba(201,214,238,0.82)] bg-white/78 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#6b7a96]">
                    Registro guiado
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:hidden">
              {ACTIONS.map((action) => {
                const Icon = action.icon;
                const isActive = action.id === activeAction;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => setActiveAction(action.id)}
                    className={`rounded-[22px] border px-4 py-3 text-left transition-all ${
                      isActive
                        ? 'border-[rgba(90,141,221,0.34)] bg-[linear-gradient(180deg,rgba(232,241,255,0.96),rgba(244,248,255,0.96))] shadow-[0_16px_28px_rgba(90,141,221,0.12)]'
                        : 'border-[rgba(201,214,238,0.78)] bg-white/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${action.accent}20`, color: action.accent }}
                      >
                        <Icon size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#101938]">{action.title}</p>
                        <p className="mt-1 text-xs leading-5 text-[#6b7a96]">{action.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 px-6 py-6 lg:px-8">
            <div className="grid gap-5 xl:grid-cols-2">
              {activeAction === 'create-receivable' && (
                <>
                  <Field label="Cliente">
                    <input
                      required
                      className={inputClassName}
                      value={receivableForm.client}
                      onChange={(event) => setReceivableForm((state) => ({ ...state, client: event.target.value }))}
                    />
                  </Field>
                  <Field label="Factura" optional>
                    <input
                      className={inputClassName}
                      value={receivableForm.invoiceNumber}
                      onChange={(event) => setReceivableForm((state) => ({ ...state, invoiceNumber: event.target.value }))}
                    />
                  </Field>
                  <Field label="Descripcion">
                    <input
                      required
                      className={inputClassName}
                      value={receivableForm.description}
                      onChange={(event) => setReceivableForm((state) => ({ ...state, description: event.target.value }))}
                    />
                  </Field>
                  <Field label="Proyecto" optional>
                    <select
                      className={inputClassName}
                      value={receivableForm.projectId}
                      onChange={(event) => setReceivableForm((state) => ({ ...state, projectId: event.target.value }))}
                    >
                      <option value="">Sin proyecto</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name || project.displayName || project.code}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Importe">
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={inputClassName}
                      value={receivableForm.amount}
                      onChange={(event) => setReceivableForm((state) => ({ ...state, amount: event.target.value }))}
                    />
                  </Field>
                  <Field label="Fecha emision">
                    <input
                      required
                      type="date"
                      className={inputClassName}
                      value={receivableForm.issueDate}
                      onChange={(event) => setReceivableForm((state) => ({ ...state, issueDate: event.target.value }))}
                    />
                  </Field>
                  <Field label="Vencimiento">
                    <input
                      required
                      type="date"
                      className={inputClassName}
                      value={receivableForm.dueDate}
                      onChange={(event) => setReceivableForm((state) => ({ ...state, dueDate: event.target.value }))}
                    />
                  </Field>
                </>
              )}

              {activeAction === 'create-payable' && (
                <>
                  <Field label="Proveedor">
                    <input
                      required
                      className={inputClassName}
                      value={payableForm.vendor}
                      onChange={(event) => setPayableForm((state) => ({ ...state, vendor: event.target.value }))}
                    />
                  </Field>
                  <Field label="Factura" optional>
                    <input
                      className={inputClassName}
                      value={payableForm.invoiceNumber}
                      onChange={(event) => setPayableForm((state) => ({ ...state, invoiceNumber: event.target.value }))}
                    />
                  </Field>
                  <Field label="Descripcion">
                    <input
                      required
                      className={inputClassName}
                      value={payableForm.description}
                      onChange={(event) => setPayableForm((state) => ({ ...state, description: event.target.value }))}
                    />
                  </Field>
                  <Field label="Proyecto" optional>
                    <select
                      className={inputClassName}
                      value={payableForm.projectId}
                      onChange={(event) => setPayableForm((state) => ({ ...state, projectId: event.target.value }))}
                    >
                      <option value="">Sin proyecto</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name || project.displayName || project.code}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Importe">
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={inputClassName}
                      value={payableForm.amount}
                      onChange={(event) => setPayableForm((state) => ({ ...state, amount: event.target.value }))}
                    />
                  </Field>
                  <Field label="Fecha emision">
                    <input
                      required
                      type="date"
                      className={inputClassName}
                      value={payableForm.issueDate}
                      onChange={(event) => setPayableForm((state) => ({ ...state, issueDate: event.target.value }))}
                    />
                  </Field>
                  <Field label="Vencimiento">
                    <input
                      required
                      type="date"
                      className={inputClassName}
                      value={payableForm.dueDate}
                      onChange={(event) => setPayableForm((state) => ({ ...state, dueDate: event.target.value }))}
                    />
                  </Field>
                </>
              )}

              {activeAction === 'register-collection' && (
                <>
                  <Field label="Factura asociada" optional>
                    <select
                      className={inputClassName}
                      value={collectionForm.receivableId}
                      onChange={(event) => {
                        const receivableId = event.target.value;
                        const linked = openReceivables.find((entry) => entry.id === receivableId);
                        setCollectionForm((state) => ({
                          ...state,
                          receivableId,
                          counterpartyName: linked?.counterpartyName || state.counterpartyName,
                          description: linked?.description || state.description,
                          projectId: linked?.projectId || state.projectId,
                          amount: linked ? String(linked.openAmount) : state.amount,
                        }));
                      }}
                    >
                      <option value="">Cobro libre</option>
                      {openReceivables.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.counterpartyName} · {entry.documentNumber || 'Sin factura'} · {entry.openAmount.toFixed(2)} EUR
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Importe">
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={inputClassName}
                      value={collectionForm.amount}
                      onChange={(event) => setCollectionForm((state) => ({ ...state, amount: event.target.value }))}
                    />
                  </Field>
                  <Field label="Fecha">
                    <input
                      required
                      type="date"
                      className={inputClassName}
                      value={collectionForm.date}
                      onChange={(event) => setCollectionForm((state) => ({ ...state, date: event.target.value }))}
                    />
                  </Field>
                  <Field label="Metodo">
                    <select
                      className={inputClassName}
                      value={collectionForm.method}
                      onChange={(event) => setCollectionForm((state) => ({ ...state, method: event.target.value }))}
                    >
                      <option>Transferencia</option>
                      <option>Efectivo</option>
                      <option>Tarjeta</option>
                    </select>
                  </Field>
                  <Field label="Contraparte">
                    <input
                      required={!collectionForm.receivableId}
                      className={inputClassName}
                      value={collectionForm.counterpartyName}
                      onChange={(event) =>
                        setCollectionForm((state) => ({ ...state, counterpartyName: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Descripcion">
                    <input
                      required
                      className={inputClassName}
                      value={collectionForm.description}
                      onChange={(event) => setCollectionForm((state) => ({ ...state, description: event.target.value }))}
                    />
                  </Field>
                  <Field label="Proyecto" optional>
                    <select
                      className={inputClassName}
                      value={collectionForm.projectId}
                      onChange={(event) => setCollectionForm((state) => ({ ...state, projectId: event.target.value }))}
                    >
                      <option value="">Sin proyecto</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name || project.displayName || project.code}
                        </option>
                      ))}
                    </select>
                  </Field>
                </>
              )}

              {activeAction === 'register-payment' && (
                <>
                  <Field label="Factura asociada" optional>
                    <select
                      className={inputClassName}
                      value={paymentForm.payableId}
                      onChange={(event) => {
                        const payableId = event.target.value;
                        const linked = openPayables.find((entry) => entry.id === payableId);
                        setPaymentForm((state) => ({
                          ...state,
                          payableId,
                          counterpartyName: linked?.counterpartyName || state.counterpartyName,
                          description: linked?.description || state.description,
                          projectId: linked?.projectId || state.projectId,
                          amount: linked ? String(linked.openAmount) : state.amount,
                        }));
                      }}
                    >
                      <option value="">Pago libre</option>
                      {openPayables.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.counterpartyName} · {entry.documentNumber || 'Sin factura'} · {entry.openAmount.toFixed(2)} EUR
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Importe">
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={inputClassName}
                      value={paymentForm.amount}
                      onChange={(event) => setPaymentForm((state) => ({ ...state, amount: event.target.value }))}
                    />
                  </Field>
                  <Field label="Fecha">
                    <input
                      required
                      type="date"
                      className={inputClassName}
                      value={paymentForm.date}
                      onChange={(event) => setPaymentForm((state) => ({ ...state, date: event.target.value }))}
                    />
                  </Field>
                  <Field label="Metodo">
                    <select
                      className={inputClassName}
                      value={paymentForm.method}
                      onChange={(event) => setPaymentForm((state) => ({ ...state, method: event.target.value }))}
                    >
                      <option>Transferencia</option>
                      <option>Efectivo</option>
                      <option>Tarjeta</option>
                    </select>
                  </Field>
                  <Field label="Contraparte">
                    <input
                      required={!paymentForm.payableId}
                      className={inputClassName}
                      value={paymentForm.counterpartyName}
                      onChange={(event) => setPaymentForm((state) => ({ ...state, counterpartyName: event.target.value }))}
                    />
                  </Field>
                  <Field label="Descripcion">
                    <input
                      required
                      className={inputClassName}
                      value={paymentForm.description}
                      onChange={(event) => setPaymentForm((state) => ({ ...state, description: event.target.value }))}
                    />
                  </Field>
                  <Field label="Proyecto" optional>
                    <select
                      className={inputClassName}
                      value={paymentForm.projectId}
                      onChange={(event) => setPaymentForm((state) => ({ ...state, projectId: event.target.value }))}
                    >
                      <option value="">Sin proyecto</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name || project.displayName || project.code}
                        </option>
                      ))}
                    </select>
                  </Field>
                </>
              )}

              {activeAction === 'bank-adjustment' && (
                <>
                  <Field label="Direccion">
                    <select
                      className={inputClassName}
                      value={adjustmentForm.direction}
                      onChange={(event) => setAdjustmentForm((state) => ({ ...state, direction: event.target.value }))}
                    >
                      <option value="in">Entrada</option>
                      <option value="out">Salida</option>
                    </select>
                  </Field>
                  <Field label="Importe">
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={inputClassName}
                      value={adjustmentForm.amount}
                      onChange={(event) => setAdjustmentForm((state) => ({ ...state, amount: event.target.value }))}
                    />
                  </Field>
                  <Field label="Fecha">
                    <input
                      required
                      type="date"
                      className={inputClassName}
                      value={adjustmentForm.date}
                      onChange={(event) => setAdjustmentForm((state) => ({ ...state, date: event.target.value }))}
                    />
                  </Field>
                  <Field label="Descripcion">
                    <input
                      required
                      className={inputClassName}
                      value={adjustmentForm.description}
                      onChange={(event) => setAdjustmentForm((state) => ({ ...state, description: event.target.value }))}
                    />
                  </Field>
                  <Field label="Contraparte" optional>
                    <input
                      className={inputClassName}
                      value={adjustmentForm.counterpartyName}
                      onChange={(event) =>
                        setAdjustmentForm((state) => ({ ...state, counterpartyName: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Proyecto" optional>
                    <select
                      className={inputClassName}
                      value={adjustmentForm.projectId}
                      onChange={(event) => setAdjustmentForm((state) => ({ ...state, projectId: event.target.value }))}
                    >
                      <option value="">Sin proyecto</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name || project.displayName || project.code}
                        </option>
                      ))}
                    </select>
                  </Field>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[rgba(201,214,238,0.78)] bg-[linear-gradient(180deg,rgba(250,252,255,0.94),rgba(244,248,255,0.92))] px-4 py-4">
              <div className="flex items-center gap-3 text-[#6b7a96]">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(90,141,221,0.12)] text-[#3156d3]">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#101938]">Registro operativo</p>
                  <p className="text-xs">Confirma el flujo activo y guarda el registro con el botón principal.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/84 px-4 py-3 text-sm font-medium text-[#6b7a96] transition-colors hover:bg-white hover:text-[#101938]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 ${submitButtonClassName}`}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <BriefcaseBusiness size={16} />}
                  {submitting ? 'Guardando...' : submitLabel}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default FinanceActionLauncher;
