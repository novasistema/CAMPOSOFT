/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Map, 
  Coins, 
  Layers, 
  Sprout, 
  FileText, 
  PlusCircle, 
  DollarSign, 
  Check, 
  Activity,
  Calculator,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  Clipboard
} from 'lucide-react';
import { CropField, CropExpense, CropExpenseCategory, CropStatus, Partner } from '../types';

interface CropManagerProps {
  fields: CropField[];
  partners: Partner[];
  onAddField: (field: CropField) => void;
  onAddExpense: (fieldId: string, expense: CropExpense) => void;
  onRemoveExpense: (fieldId: string, expenseId: string) => void;
  onToggleExpensePaid?: (fieldId: string, expenseId: string) => void;
  onUpdateFieldStatus: (fieldId: string, status: CropStatus, actualYieldTon?: number) => void;
  onRemoveField: (fieldId: string) => void;
  exchangeRate: number;
}

export default function CropManager({
  fields,
  partners,
  onAddField,
  onAddExpense,
  onRemoveExpense,
  onToggleExpensePaid,
  onUpdateFieldStatus,
  onRemoveField,
  exchangeRate,
}: CropManagerProps) {
  // Navigation & accordion details
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  
  // New Field Form State
  const [showAddFieldForm, setShowAddFieldForm] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [fieldArea, setFieldArea] = useState<number>(30);
  const [fieldCropType, setFieldCropType] = useState('Maíz para Silo');
  const [isAddingCustomCrop, setIsAddingCustomCrop] = useState(false);
  const [customCropInput, setCustomCropInput] = useState('');

  const defaultCropTypes = [
    'Maíz para Silo',
    'Sorgo Forrajero',
    'Alfalfa para Fardos',
    'Pastura Mezcla',
    'Avena de invierno'
  ];

  const [customCropTypes, setCustomCropTypes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_crop_types');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allCropTypes = Array.from(new Set([
    ...defaultCropTypes,
    ...customCropTypes,
    ...fields.map(f => f.cropType).filter(Boolean)
  ]));

  const handleAddCustomCrop = () => {
    const trimmed = customCropInput.trim();
    if (!trimmed) return;
    
    if (!allCropTypes.includes(trimmed)) {
      const updated = [...customCropTypes, trimmed];
      setCustomCropTypes(updated);
      try {
        localStorage.setItem('custom_crop_types', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving custom crop types', err);
      }
    }
    
    setFieldCropType(trimmed);
    setIsAddingCustomCrop(false);
    setCustomCropInput('');
  };
  const [fieldRentalCost, setFieldRentalCost] = useState<number>(9000);
  const [fieldRentalTerm, setFieldRentalTerm] = useState('Campaña Verano');
  const [fieldEstimatedYield, setFieldEstimatedYield] = useState<number>(360);
  const [newFieldPartnerId, setNewFieldPartnerId] = useState('');
  const [fieldRentalIsCuentaCorriente, setFieldRentalIsCuentaCorriente] = useState(false);

  // New Expense Dialog State
  const [activeExpenseFieldId, setActiveExpenseFieldId] = useState<string | null>(null);
  const [expenseCategory, setExpenseCategory] = useState<CropExpenseCategory>('Semilla');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(500);
  const [newExpensePartnerId, setNewExpensePartnerId] = useState('');
  const [expenseIsCuentaCorriente, setExpenseIsCuentaCorriente] = useState(false);
  const [expenseIsPaid, setExpenseIsPaid] = useState(true);

  // Harvest Status Dialog State
  const [activeHarvestFieldId, setActiveHarvestFieldId] = useState<string | null>(null);
  const [harvestYield, setHarvestYield] = useState<number>(400);

  // Categories list
  const expenseCategories: CropExpenseCategory[] = [
    'Alquiler', 'Semilla', 'Fertilizante', 'Agroquímico', 'Maquinaria', 'Combustible', 'Mano de Obra', 'Otros'
  ];

  const handleSubmitField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) return;

    const partnerIdVal = newFieldPartnerId || undefined;

    const newField: CropField = {
      id: `fld-${Date.now()}`,
      name: fieldName.trim(),
      areaHectares: Number(fieldArea),
      cropType: fieldCropType,
      rentalCostUSD: Number(fieldRentalCost),
      rentalContractTerm: fieldRentalTerm,
      status: 'Planificado',
      estimatedYieldTon: Number(fieldEstimatedYield),
      partnerId: partnerIdVal,
      expenses: [
        // Automatically inject the initial Rental Expense
        {
          id: `e-${Date.now()}-rent`,
          category: 'Alquiler',
          description: `Alquiler Inicial - ${fieldRentalTerm}`,
          amountUSD: Number(fieldRentalCost),
          date: new Date().toISOString().split('T')[0],
          partnerId: partnerIdVal,
          isCuentaCorriente: fieldRentalIsCuentaCorriente,
          isPaid: !fieldRentalIsCuentaCorriente, // Unpaid if Cuenta Corriente
        }
      ],
    };

    onAddField(newField);
    
    // Reset Form
    setFieldName('');
    setFieldArea(30);
    setFieldRentalCost(9000);
    setFieldEstimatedYield(360);
    setFieldRentalTerm('Campaña Verano');
    setNewFieldPartnerId('');
    setFieldRentalIsCuentaCorriente(false);
    setShowAddFieldForm(false);
  };

  const handleAddExpenseSubmit = (fieldId: string) => {
    if (!expenseDescription.trim() || expenseAmount <= 0) return;

    const newExpense: CropExpense = {
      id: `e-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category: expenseCategory,
      description: expenseDescription.trim(),
      amountUSD: Number(expenseAmount),
      date: new Date().toISOString().split('T')[0],
      partnerId: newExpensePartnerId || undefined,
      isCuentaCorriente: expenseIsCuentaCorriente,
      isPaid: expenseIsCuentaCorriente ? expenseIsPaid : true,
    };

    onAddExpense(fieldId, newExpense);
    
    // Reset Expense States
    setExpenseDescription('');
    setExpenseAmount(500);
    setNewExpensePartnerId('');
    setExpenseIsCuentaCorriente(false);
    setExpenseIsPaid(true);
    setActiveExpenseFieldId(null);
  };

  const handleHarvestSubmit = (fieldId: string) => {
    onUpdateFieldStatus(fieldId, 'Cosechado', Number(harvestYield));
    setActiveHarvestFieldId(null);
  };

  // Clipboard copied status state
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);

  const exportToCSV = (field: CropField) => {
    const headers = ['Campo', 'Hectareas', 'Cultivo Destinado', 'Estado', 'Rendimiento Est (Ton)', 'Rendimiento Real (Ton)', 'Tipo de Cambio (ARS)', 'Inversion Total (USD)', 'Costo/Ha (USD)'];
    const rentalExpenseSum = field.expenses.reduce((acc, e) => acc + e.amountUSD, 0);
    const costPerHa = field.areaHectares > 0 ? (rentalExpenseSum / field.areaHectares) : 0;
    
    const generalData = [
      field.name,
      field.areaHectares,
      field.cropType,
      field.status,
      field.estimatedYieldTon,
      field.actualYieldTon || field.estimatedYieldTon,
      exchangeRate,
      rentalExpenseSum,
      Math.round(costPerHa)
    ];

    const expenseHeaders = ['Fecha', 'Categoria', 'Descripcion', 'Monto (USD)', 'Monto (ARS)', 'Socio Fondeador', 'Cuenta Corriente', 'Estado Pago'];
    const expenseRows = field.expenses.map(e => {
      const partnerName = partners.find(p => p.id === e.partnerId)?.name || 'Fondo Comun / Propio';
      return [
        e.date,
        e.category,
        e.description,
        e.amountUSD,
        Math.round(e.amountUSD * exchangeRate),
        partnerName,
        e.isCuentaCorriente ? 'SI' : 'NO',
        e.isCuentaCorriente ? (e.isPaid ? 'Pagado' : 'Pendiente') : 'Pagado'
      ];
    });

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "REGISTRO DE CONTROL EXTERNO Y AUDITORIA - LOTE: " + field.name.toUpperCase() + "\n";
    csvContent += "Exportado el: " + new Date().toLocaleDateString('es-AR') + "\n\n";
    csvContent += "RESUMEN DE DESEMPEÑO:\n";
    csvContent += headers.join(",") + "\n";
    csvContent += generalData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n\n";
    
    csvContent += "DETALLE DE INSUMOS, ARRENDAMIENTO Y LABORES REGISTRADAS:\n";
    csvContent += expenseHeaders.join(",") + "\n";
    expenseRows.forEach(row => {
      csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Auditoria_Lote_${field.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyFieldSummaryToClipboard = (field: CropField) => {
    const rentalExpenseSum = field.expenses.reduce((acc, e) => acc + e.amountUSD, 0);
    const costPerHa = field.areaHectares > 0 ? (rentalExpenseSum / field.areaHectares) : 0;
    const projectedYieldKg = field.estimatedYieldTon * 1000;
    const costPerKgProduced = projectedYieldKg > 0 ? (rentalExpenseSum / projectedYieldKg) : 0;

    let text = `📋 *REPORTE DE AUDITORÍA EXTERNA - LOTE ${field.name.toUpperCase()}*\n`;
    text += `🌾 *Cultivo:* ${field.cropType}\n`;
    text += `📐 *Superficie:* ${field.areaHectares} Ha\n`;
    text += `📈 *Estado:* ${field.status}\n`;
    text += `💰 *Inversión Total:* $${rentalExpenseSum.toLocaleString()} USD (≈ $${(rentalExpenseSum * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS)\n`;
    text += `💸 *Costo por Ha:* $${Math.round(costPerHa)} USD/Ha (≈ $${(costPerHa * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS/Ha)\n`;
    text += `⚖️ *Rendimiento Est:* ${field.estimatedYieldTon} Ton (${(field.estimatedYieldTon / field.areaHectares).toFixed(1)} Ton/Ha)\n`;
    if (field.status === 'Cosechado' && field.actualYieldTon) {
      text += `🎯 *Rendimiento Real:* ${field.actualYieldTon} Ton (${(field.actualYieldTon / field.areaHectares).toFixed(1)} Ton/Ha)\n`;
    }
    text += `🥛 *Costo de Alimento Producido:* $${costPerKgProduced.toFixed(3)} USD/kg (≈ $${(costPerKgProduced * exchangeRate).toFixed(2)} ARS/kg)\n\n`;

    text += `🔍 *Detalle de Transacciones (Egresos):*\n`;
    field.expenses.forEach(e => {
      const pName = partners.find(p => p.id === e.partnerId)?.name || 'Fondo Común';
      const cLabel = e.isCuentaCorriente ? `[Cta Cte - ${e.isPaid ? 'Pagado' : 'PENDIENTE'}]` : '';
      text += `- [${e.date}] ${e.category} | ${e.description}: $${e.amountUSD.toLocaleString()} USD (≈ $${(e.amountUSD * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS) - Fondeo: ${pName} ${cLabel}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopiedFieldId(field.id);
      setTimeout(() => setCopiedFieldId(null), 2500);
    }).catch(err => {
      console.error('Error al copiar', err);
    });
  };

  // Calculations for outstanding debts (Cuenta Corriente / Deferred liabilities)
  let totalInvestmentAllFieldsUSD = 0;
  let outstandingDebtAllFieldsUSD = 0;
  let paidDebtAllFieldsUSD = 0;

  const outstandingDebtsList: { fieldName: string; fieldId: string; expense: CropExpense }[] = [];

  fields.forEach(f => {
    f.expenses.forEach(e => {
      totalInvestmentAllFieldsUSD += e.amountUSD;
      if (e.isCuentaCorriente) {
        if (e.isPaid) {
          paidDebtAllFieldsUSD += e.amountUSD;
        } else {
          outstandingDebtAllFieldsUSD += e.amountUSD;
          outstandingDebtsList.push({ fieldName: f.name, fieldId: f.id, expense: e });
        }
      }
    });
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & Add Action Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold text-slate-800">Planificación y Costos Agrícolas</h2>
          <p className="text-xs text-slate-500 mt-1">Lleva los números finos de alquileres, insumos, diesel y contratistas de cuenta corriente para registrar y saber cuánto debemos pagar en un futuro.</p>
        </div>
        <button
          onClick={() => setShowAddFieldForm(!showAddFieldForm)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-xs"
        >
          {showAddFieldForm ? 'Cancelar Campo' : 'Arrendar Nuevo Campo / Lote'}
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Resumen De Cuenta Corriente (Obligaciones a Carga de Cosecha) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Investment */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg shrink-0">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Inversión Agrícola Registrada</p>
            <p className="text-base font-bold text-slate-800 font-sans leading-none">USD {totalInvestmentAllFieldsUSD.toLocaleString()}</p>
            <p className="text-[10px] font-mono text-slate-550 mt-1">≈ ${(totalInvestmentAllFieldsUSD * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</p>
          </div>
        </div>

        {/* Card 2: DEUDA EN CUENTA CORRIENTE (A PAGAR EN EL FUTURO) */}
        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-800">Deuda en Cuenta Corriente (Futuro)</p>
            <p className="text-base font-bold text-amber-900 font-sans leading-none">USD {outstandingDebtAllFieldsUSD.toLocaleString()}</p>
            <p className="text-[11px] font-mono font-bold text-teal-700 mt-1">≈ ${(outstandingDebtAllFieldsUSD * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</p>
          </div>
        </div>

        {/* Card 3: Deuda ya amortizada */}
        <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-100/60 text-emerald-700 rounded-lg shrink-0">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-800">Cta. Cte. Cancelada (Pagada)</p>
            <p className="text-base font-bold text-emerald-900 font-sans leading-none">USD {paidDebtAllFieldsUSD.toLocaleString()}</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1">≈ ${(paidDebtAllFieldsUSD * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</p>
          </div>
        </div>
      </div>

      {/* Detail list of pending payments if there are any */}
      {outstandingDebtsList.length > 0 && (
        <div className="bg-amber-50/25 border border-amber-200/50 rounded-xl p-4 text-xs animate-fadeIn">
          <h4 className="font-bold text-amber-900 mb-2.5 font-sans flex items-center gap-1.5 border-b border-amber-200/30 pb-1.5 w-full text-[10px] uppercase tracking-wider font-mono">
            <span>Insumos y Labores Pendientes de Pago en Cuenta Corriente ({outstandingDebtsList.length})</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {outstandingDebtsList.map((item, index) => (
              <div key={index} className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-3xs flex justify-between items-center transition hover:border-amber-300">
                <div>
                  <p className="font-semibold text-slate-700 flex items-center gap-2">{item.expense.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.fieldName} • <span className="font-bold text-slate-500">{item.expense.category}</span></p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-mono font-bold text-amber-700">${item.expense.amountUSD.toLocaleString()} USD</p>
                  <p className="text-[9px] font-mono text-slate-500">≈ ${(item.expense.amountUSD * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</p>
                  <button
                    onClick={() => onToggleExpensePaid && onToggleExpensePaid(item.fieldId, item.expense.id)}
                    className="mt-1 text-[8px] font-bold text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-sm hover:bg-teal-100 transition"
                    title="Liquidar pago de este insumo"
                  >
                    Marcar Pagado
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rented Field Entry Form */}
      {showAddFieldForm && (
        <form onSubmit={handleSubmitField} className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-slideDown">
          <h3 className="text-sm font-sans font-bold text-slate-800 border-b border-slate-200 pb-2">Registro de Arrendamiento Agrícola</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Field name description */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Nombre del Campo / Lote *</label>
              <input
                type="text"
                placeholder="Ej. Campo Sur - Lote Don Horacio"
                value={fieldName}
                onChange={e => setFieldName(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500"
                required
              />
            </div>

            {/* Total Hectares size */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Superficie (Silos / Hectáreas)</label>
              <input
                type="number"
                value={fieldArea}
                onChange={e => setFieldArea(Number(e.target.value))}
                min="1"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 font-mono"
              />
            </div>

            {/* Target crop planned */}
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-xs font-mono font-medium text-slate-600">Cultivo Destinado</label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomCrop(true)}
                  className="text-teal-650 hover:text-teal-700 text-[10px] font-bold flex items-center gap-1 bg-teal-50 hover:bg-teal-100/70 px-2 py-0.5 rounded transition cursor-pointer"
                  title="Registrar cultivo personalizado que no está en la lista"
                >
                  <Plus className="h-3 w-3" />
                  <span>+ Otro Cultivo</span>
                </button>
              </div>
              
              {isAddingCustomCrop ? (
                <div className="flex gap-1.5 animate-fadeIn">
                  <input
                    type="text"
                    placeholder="Ej. Trigo, Cebada, Centeno"
                    value={customCropInput}
                    onChange={e => setCustomCropInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomCrop();
                      }
                    }}
                    className="flex-1 text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCrop}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-2.5 rounded-lg transition cursor-pointer shrink-0"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomCrop(false);
                      setCustomCropInput('');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs px-2.5 rounded-lg transition cursor-pointer shrink-0"
                  >
                    X
                  </button>
                </div>
              ) : (
                <select
                  value={fieldCropType}
                  onChange={e => setFieldCropType(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 font-sans cursor-pointer"
                >
                  {allCropTypes.map(crop => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
            {/* Total Rental cost */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600 flex justify-between">
                <span>Costo Alquiler Total (USD)</span>
                <span className="text-teal-600 font-bold">≈ ${(fieldRentalCost * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</span>
              </label>
              <input
                type="number"
                value={fieldRentalCost}
                onChange={e => setFieldRentalCost(Number(e.target.value))}
                min="0"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 font-mono"
              />
            </div>

            {/* Contract terms */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Vencimiento / Plazo del Contrato</label>
              <input
                type="text"
                placeholder="Ej. 1 Año, Campaña Verano"
                value={fieldRentalTerm}
                onChange={e => setFieldRentalTerm(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500"
              />
            </div>

            {/* Projected yields in Tons */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Rendimiento Total Silaje (Toneladas)</label>
              <input
                type="number"
                value={fieldEstimatedYield}
                onChange={e => setFieldEstimatedYield(Number(e.target.value))}
                min="1"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 font-mono"
              />
            </div>

            {/* Partner selector for Field */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Socio Responsable / Financiador</label>
              <select
                value={newFieldPartnerId}
                onChange={e => setNewFieldPartnerId(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
              >
                <option value="">Comunidad de Socios (Común)</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-teal-50/50 border border-teal-100/80 p-3.5 rounded-xl text-xs">
            <input
              type="checkbox"
              id="fieldRentalIsCuentaCorriente"
              checked={fieldRentalIsCuentaCorriente}
              onChange={e => setFieldRentalIsCuentaCorriente(e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="fieldRentalIsCuentaCorriente" className="font-sans font-medium text-slate-700 cursor-pointer select-none">
              <strong className="text-teal-800">¿Alquiler en Cuenta Corriente?</strong> Registrar este arrendamiento de lote como una obligación de pago diferido (se pagará después de cosechado).
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-sans text-xs font-bold rounded-lg transition"
            >
              Dar de Alta Lote de Cultivo
            </button>
          </div>
        </form>
      )}

      {/* Rented fields dashboard view */}
      <div className="grid grid-cols-1 gap-6">
        {fields.map(field => {
          const isExpanded = expandedFieldId === field.id;
          
          // Math metrics
          const rentalExpenseSum = field.expenses.reduce((acc, e) => acc + e.amountUSD, 0);
          const costPerHa = field.areaHectares > 0 ? (rentalExpenseSum / field.areaHectares) : 0;
          
          // Cost per Kilo of feed produced
          const projectedYieldKg = field.estimatedYieldTon * 1000;
          const costPerKgProduced = projectedYieldKg > 0 ? (rentalExpenseSum / projectedYieldKg) : 0;

          // Split expenses categories for badges display
          const seedSum = field.expenses.filter(e => e.category === 'Semilla').reduce((acc, e) => acc + e.amountUSD, 0);
          const fertilizerSum = field.expenses.filter(e => e.category === 'Fertilizante').reduce((acc, e) => acc + e.amountUSD, 0);
          const machinerySum = field.expenses.filter(e => e.category === 'Maquinaria').reduce((acc, e) => acc + e.amountUSD, 0);
          const rentSum = field.expenses.filter(e => e.category === 'Alquiler').reduce((acc, e) => acc + e.amountUSD, 0);
          const othersSum = rentalExpenseSum - (seedSum + fertilizerSum + machinerySum + rentSum);

          // Render Crop status color badges
          let badgeColor = 'bg-slate-100 text-slate-700';
          if (field.status === 'Sembrado') badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
          else if (field.status === 'En Desarrollo') badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
          else if (field.status === 'Cosechado' || field.status === 'Completado' as any) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';

          return (
            <div key={field.id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs" id={`field-card-${field.id}`}>
              {/* Card top banner header */}
              <div 
                onClick={() => setExpandedFieldId(isExpanded ? null : field.id)}
                className="p-5 hover:bg-slate-50/50 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-teal-50 rounded-xl text-teal-700 shrink-0 border border-teal-100">
                    <Map className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-sans font-bold text-slate-800 text-base">{field.name}</h3>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                        {field.status}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg font-mono">
                        {field.cropType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-sans mt-1 flex flex-wrap items-center gap-x-2">
                      <span>Superficie: <span className="font-bold text-slate-700">{field.areaHectares} Ha</span></span>
                      <span className="text-slate-300">•</span>
                      <span>
                        Alquiler ref: <span className="font-mono text-slate-700">${field.rentalCostUSD.toLocaleString()} USD</span> 
                        <span className="text-[10px] text-teal-600 font-mono font-bold ml-1">
                          (≈ ${(field.rentalCostUSD * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS)
                        </span>
                      </span>
                      {field.partnerId && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-bold text-[10px] border border-blue-100/50">
                            Fondeo: {partners.find(p => p.id === field.partnerId)?.name || 'Socio'}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3 md:pt-0">
                  {/* Fine Cost Statistics Metrics */}
                  <div className="flex flex-wrap gap-4 sm:gap-6 text-xs text-slate-500 text-right justify-end">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono leading-none text-slate-400">Inversión Lograda</span>
                      <p className="font-mono font-bold text-slate-800 leading-none">${rentalExpenseSum.toLocaleString()} USD</p>
                      <p className="text-[9px] font-mono text-teal-600 font-medium">≈ ${(rentalExpenseSum * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono leading-none text-slate-400">Costo Hectárea</span>
                      <p className="font-mono font-bold text-slate-750 leading-none">${Math.round(costPerHa)} USD/Ha</p>
                      <p className="text-[9px] font-mono text-teal-600 font-medium">≈ ${(costPerHa * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS/Ha</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono leading-none text-slate-400">Costo Kilo Producido</span>
                      <p className="font-mono font-bold text-emerald-600 leading-none">${costPerKgProduced.toFixed(3)} USD/kg</p>
                      <p className="text-[9px] font-mono text-emerald-700 font-bold">≈ ${(costPerKgProduced * exchangeRate).toFixed(2)} ARS/kg</p>
                    </div>
                  </div>

                  {/* Accordion controls */}
                  <div className="p-1 rounded-full bg-slate-50 text-slate-400">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </div>

              {/* Collapsed view Categorized summary badges */}
              {!isExpanded && (
                <div className="bg-slate-50/50 px-5 py-3 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] font-mono text-slate-450">
                  <span>Alquiler: <strong className="text-slate-700">${rentSum.toLocaleString()} USD</strong> <span className="text-teal-600 font-bold">(≈ ${(rentSum * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS)</span></span>
                  <span className="text-slate-300">•</span>
                  <span>Semillas: <strong className="text-slate-700">${seedSum.toLocaleString()} USD</strong> <span className="text-teal-600 font-bold">(≈ ${(seedSum * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS)</span></span>
                  <span className="text-slate-300">•</span>
                  <span>Fertilizantes: <strong className="text-slate-700">${fertilizerSum.toLocaleString()} USD</strong> <span className="text-teal-600 font-bold">(≈ ${(fertilizerSum * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS)</span></span>
                  <span className="text-slate-300">•</span>
                  <span>Maquinarias: <strong className="text-slate-700">${machinerySum.toLocaleString()} USD</strong> <span className="text-teal-600 font-bold">(≈ ${(machinerySum * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS)</span></span>
                  {othersSum > 0 && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>Otros: <strong className="text-slate-700">${othersSum.toLocaleString()} USD</strong> <span className="text-teal-600 font-bold">(≈ ${(othersSum * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS)</span></span>
                    </>
                  )}
                </div>
              )}

              {/* Expanded details list of expenses and action tools */}
              {isExpanded && (
                <div className="p-6 bg-slate-50/40 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
                  
                  {/* Left Side: Adding & Managing Crop Expenses logs */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Historial de Transacciones / Egresos del Lote</h4>
                      <button
                        onClick={() => setActiveExpenseFieldId(field.id)}
                        className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-500 font-bold font-sans"
                      >
                        <PlusCircle className="h-4 w-4" /> Agregar Gasto / Laboreo
                      </button>
                    </div>

                    {/* Quick Expense Registration dialog */}
                    {activeExpenseFieldId === field.id && (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <div className="text-xs font-sans font-bold text-slate-800 border-b border-slate-100 pb-1.5">Registrar Compra / Labores mecánicas</div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-medium text-slate-500">Categoría</span>
                            <select
                              value={expenseCategory}
                              onChange={e => setExpenseCategory(e.target.value as CropExpenseCategory)}
                              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                            >
                              {expenseCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-[10px] font-mono font-medium text-slate-500">Concepto / Descripción del gasto</span>
                            <input
                              type="text"
                              value={expenseDescription}
                              onChange={e => setExpenseDescription(e.target.value)}
                              placeholder="Ej. Herbicida post-emergencia 120 litros"
                              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-slate-450 shrink-0">Socio Pagador:</span>
                            <select
                              value={newExpensePartnerId}
                              onChange={e => setNewExpensePartnerId(e.target.value)}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 font-sans"
                            >
                              <option value="">Por definir / Fondo Común</option>
                              {partners.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <div className="text-[10px] text-right font-sans shrink-0">
                              <span className="font-mono text-slate-400 block font-semibold">Monto USD:</span>
                              <span className="text-[9px] text-teal-600 block font-bold">≈ ${(expenseAmount * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</span>
                            </div>
                            <input
                              type="number"
                              value={expenseAmount}
                              onChange={e => setExpenseAmount(Number(e.target.value))}
                              className="text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono w-24 text-right"
                            />
                          </div>
                        </div>

                        {/* Cuenta Corriente check */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="expenseIsCuentaCorriente"
                              checked={expenseIsCuentaCorriente}
                              onChange={e => {
                                setExpenseIsCuentaCorriente(e.target.checked);
                                if (e.target.checked) {
                                  setExpenseIsPaid(false); // Default to unpaid if credit
                                } else {
                                  setExpenseIsPaid(true);
                                }
                              }}
                              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer"
                            />
                            <label htmlFor="expenseIsCuentaCorriente" className="font-sans font-medium text-slate-700 cursor-pointer select-none">
                              ¿Obtenido en <strong>Cuenta Corriente</strong>? (E.g. Semillas, fertilizante a pagar post-cosecha)
                            </label>
                          </div>
                          {expenseIsCuentaCorriente && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                              Pendiente de Pago
                            </span>
                          )}
                        </div>

                        <div className="flex justify-end pt-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddExpenseSubmit(field.id)}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold font-sans shadow-xs"
                            >
                              Registrar Gasto
                            </button>
                            <button
                              onClick={() => setActiveExpenseFieldId(null)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs"
                            >
                              Atrás
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actual list of expenses */}
                    <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
                      {field.expenses.length === 0 ? (
                        <p className="text-xs text-slate-400 p-4 italic text-center">No hay transacciones registradas.</p>
                      ) : (
                        field.expenses.map((expense) => (
                          <div key={expense.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50 font-sans transition">
                            <div className="flex gap-3">
                              {/* Small bullet indicator representing category color */}
                              <div className="h-8 px-2 bg-slate-150 rounded border border-slate-200 text-[10px] font-mono text-slate-555 flex items-center justify-center font-bold">
                                {expense.category}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 flex-wrap">
                                  <span>{expense.description}</span>
                                  {expense.partnerId && (
                                    <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200/55 text-slate-600 rounded font-bold text-[9px]">
                                      {partners.find(p => p.id === expense.partnerId)?.name || 'Socio'}
                                    </span>
                                  )}
                                  
                                  {/* Cuenta Corriente Badges and Actions */}
                                  {expense.isCuentaCorriente && (
                                    expense.isPaid ? (
                                      <button
                                        onClick={() => onToggleExpensePaid && onToggleExpensePaid(field.id, expense.id)}
                                        className="px-1.5 py-0.5 rounded font-mono font-bold text-[8.5px] bg-emerald-50 text-emerald-700 border border-emerald-250 hover:bg-emerald-100 transition flex items-center gap-0.5 shrink-0"
                                        title="Click para marcar como Pendiente (Deuda)"
                                      >
                                        <Check className="h-2.5 w-2.5" />
                                        Cta Cte Pagado
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => onToggleExpensePaid && onToggleExpensePaid(field.id, expense.id)}
                                        className="px-1.5 py-0.5 rounded font-mono font-bold text-[8.5px] bg-amber-50 text-amber-700 border border-amber-250 hover:bg-amber-100 transition flex items-center gap-1 shrink-0 animate-pulse"
                                        title="Click para pagar o liquidar"
                                      >
                                        <span className="h-1.5 w-1.5 bg-amber-500 rounded-full"></span>
                                        Cta Cte Pendiente (Pagar)
                                      </button>
                                    )
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono">{expense.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-mono font-bold text-slate-700 text-xs">${expense.amountUSD.toLocaleString()} USD</p>
                                <p className="text-[10px] font-mono text-teal-600 font-bold">≈ ${(expense.amountUSD * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</p>
                              </div>
                              <button
                                onClick={() => onRemoveExpense(field.id, expense.id)}
                                className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded border border-transparent hover:border-rose-100 transition"
                                title="Eliminar Gasto"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Side: Land Stats Yield Metrics (5 columns) */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Cultivation Efficiency Box with Simulator */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs space-y-4">
                      <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                        <Calculator className="h-4 w-4 text-slate-400" /> Estimados e Indicadores de Rendimiento
                      </h4>

                      <div className="space-y-4 text-xs font-sans">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Rendimiento proyectado:</span>
                          <span className="font-mono font-bold text-slate-800">{field.estimatedYieldTon} Toneladas</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Rendimiento Promedio / Hectárea:</span>
                          <span className="font-mono font-bold text-slate-800">{(field.estimatedYieldTon / field.areaHectares).toFixed(1)} Ton/Ha</span>
                        </div>

                        {field.status !== 'Cosechado' && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Acción Administrativa del Campo</span>
                            
                            {activeHarvestFieldId === field.id ? (
                              <div className="mt-2 space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <label className="text-[10px] font-mono font-bold text-slate-600 block">Kilos cosechados totales (en Toneladas)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    value={harvestYield}
                                    onChange={e => setHarvestYield(Number(e.target.value))}
                                    className="p-1.5 border border-slate-300 rounded font-mono text-xs w-24 bg-white"
                                  />
                                  <button
                                    onClick={() => handleHarvestSubmit(field.id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex-1 transition"
                                  >
                                    Cosechar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={() => onUpdateFieldStatus(field.id, 'En Desarrollo')}
                                  className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-xs font-bold transition"
                                >
                                  En Crecimiento
                                </button>
                                <button
                                  onClick={() => {
                                    setHarvestYield(field.estimatedYieldTon);
                                    setActiveHarvestFieldId(field.id);
                                  }}
                                  className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-bold transition"
                                >
                                  Marcar Cosechado
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {field.status === 'Cosechado' && (
                          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-1.5">
                            <div className="flex gap-1.5 items-center text-emerald-800 font-bold font-sans text-xs">
                              <Check className="h-4 w-4" /> ¡Lote Cosechado Exitosamente!
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                              <div>
                                <span className="text-slate-400">Rendimiento Real:</span>
                                <p className="font-mono font-bold text-slate-700">{field.actualYieldTon || field.estimatedYieldTon} Ton</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Rendimiento/Ha Real:</span>
                                <p className="font-mono font-bold text-slate-700">
                                  {(((field.actualYieldTon || field.estimatedYieldTon) / field.areaHectares)).toFixed(1)} Ton/ha
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* External Audit & Export Options */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs space-y-4">
                      <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                        <Share2 className="h-4 w-4 text-slate-400" /> Exportar para Control Externo
                      </h4>
                      <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                        Genera informes para tu contador, socios o control administrativo externo. Exporta el historial de egresos completo o copia la ficha simplificada.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => exportToCSV(field)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-teal-50 hover:bg-teal-100/80 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="Descargar archivo CSV compatible con Excel y Google Sheets"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Bajar CSV</span>
                        </button>

                        <button
                          onClick={() => copyFieldSummaryToClipboard(field)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg text-xs font-bold transition cursor-pointer ${
                            copiedFieldId === field.id
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-755 border-slate-200'
                          }`}
                          title="Copiar reporte con formato para enviar por WhatsApp"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                          <span>{copiedFieldId === field.id ? '¡Copiado!' : 'Copiar Ficha'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Dangerous Administrative Options */}
                    <div className="bg-slate-55 p-3.5 rounded-xl border border-slate-200/65 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-400 font-mono">Baja de contrato de lote</span>
                        <p className="text-[10px] text-slate-400">Solo aplicable ante rescisión de arrendamientos.</p>
                      </div>
                      <button
                        onClick={() => onRemoveField(field.id)}
                        className="px-2.5 py-1.5 bg-rose-55 hover:bg-rose-100 text-rose-500 border border-rose-200 rounded-lg font-bold font-sans transition"
                      >
                        Rescindir Campo
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
