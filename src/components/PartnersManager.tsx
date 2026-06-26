/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Trash2, 
  Search, 
  Grid, 
  FileText, 
  Smartphone, 
  Percent, 
  Wheat, 
  Calendar, 
  Tag, 
  AlertCircle,
  FileDown
} from 'lucide-react';
import { Partner, PartnerTransaction, Animal, CropField } from '../types';

interface PartnersManagerProps {
  partners: Partner[];
  transactions: PartnerTransaction[];
  animals: Animal[];
  fields: CropField[];
  onAddPartner: (newPartner: Partner) => Promise<void> | void;
  onRemovePartner: (partnerId: string) => Promise<void> | void;
  onAddTransaction: (newTx: PartnerTransaction) => Promise<void> | void;
  onRemoveTransaction: (txId: string) => Promise<void> | void;
  exchangeRate: number;
}

export default function PartnersManager({
  partners,
  transactions,
  animals,
  fields,
  onAddPartner,
  onRemovePartner,
  onAddTransaction,
  onRemoveTransaction,
  exchangeRate
}: PartnersManagerProps) {
  // Tabs inside partners section
  const [partnersTab, setPartnersTab] = useState<'overview' | 'ledger' | 'cattle'>('overview');

  // Partner Form State
  const [partnerName, setPartnerName] = useState('');
  const [partnerShare, setPartnerShare] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerNotes, setPartnerNotes] = useState('');
  const [showAddPartnerForm, setShowAddPartnerForm] = useState(false);

  // Transaction Form State
  const [txPartnerId, setTxPartnerId] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txType, setTxType] = useState<'Aporte' | 'Retiro' | 'Gasto Asociado'>('Aporte');
  const [txCategory, setTxCategory] = useState<'Hacienda' | 'Agrícola' | 'General'>('General');
  const [txConcept, setTxConcept] = useState('');
  const [showAddTxForm, setShowAddTxForm] = useState(false);

  // Search/Filters State
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState('');
  const [selectedTxTypeFilter, setSelectedTxTypeFilter] = useState('');
  const [cattleSearchQuery, setCattleSearchQuery] = useState('');

  // Handle Add Partner
  const handleSubmitPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) return;

    const newPartner: Partner = {
      id: 'part-' + Math.random().toString(36).substr(2, 9),
      name: partnerName.trim(),
      quotaShare: partnerShare ? parseFloat(partnerShare) : undefined,
      phone: partnerPhone.trim() || undefined,
      email: partnerEmail.trim() || undefined,
      notes: partnerNotes.trim() || undefined
    };

    onAddPartner(newPartner);
    setPartnerName('');
    setPartnerShare('');
    setPartnerPhone('');
    setPartnerEmail('');
    setPartnerNotes('');
    setShowAddPartnerForm(false);
  };

  // Handle Add Transaction (Investment / Expense / Withdrawal)
  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txPartnerId || !txAmount || !txConcept.trim()) return;

    const newTx: PartnerTransaction = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      partnerId: txPartnerId,
      amountUSD: parseFloat(txAmount),
      date: txDate,
      type: txType,
      category: txCategory,
      concept: txConcept.trim()
    };

    onAddTransaction(newTx);
    setTxPartnerId('');
    setTxAmount('');
    setTxType('Aporte');
    setTxCategory('General');
    setTxConcept('');
    setShowAddTxForm(false);
  };

  // FINANCIAL CALCULATIONS by Partner
  const getPartnerMetrics = (partnerId: string) => {
    const partnerTxs = transactions.filter(t => t.partnerId === partnerId);
    
    const totalAportes = partnerTxs
      .filter(t => t.type === 'Aporte')
      .reduce((sum, t) => sum + t.amountUSD, 0);

    const totalGastosAsoc = partnerTxs
      .filter(t => t.type === 'Gasto Asociado')
      .reduce((sum, t) => sum + t.amountUSD, 0);

    const totalRetiros = partnerTxs
      .filter(t => t.type === 'Retiro')
      .reduce((sum, t) => sum + t.amountUSD, 0);

    // Net capital remaining in the firm
    const netInvestment = (totalAportes + totalGastosAsoc) - totalRetiros;

    // Cattle owned count
    const partnerCattle = animals.filter(a => a.partnerId === partnerId && a.status === 'Activo');

    // Agricultural expenses paid by this partner
    // Sum of crop expenses assigned to this partner across all fields
    let fieldExpensesTotal = 0;
    fields.forEach(f => {
      f.expenses.forEach(exp => {
        if (exp.partnerId === partnerId) {
          fieldExpensesTotal += exp.amountUSD;
        }
      });
    });

    return {
      totalAportes,
      totalGastosAsoc,
      totalRetiros,
      netInvestment,
      cattleCount: partnerCattle.length,
      fieldExpensesTotal,
      txs: partnerTxs
    };
  };

  const handleExportPartnerLedger = (partner: Partner, metrics: any) => {
    const headers = [
      'ID Transaccion',
      'Fecha',
      'Tipo de Movimiento',
      'Concepto/Detalle',
      'Categoria',
      'Monto USD',
      'Monto ARS (Cotizacion: ' + exchangeRate + ')'
    ];

    const rows = [
      ['RESUMEN DE CUENTA CORRIENTE - SOCIO/INVERSOR'],
      ['Socio/Inversor:', partner.name],
      ['Telefono:', partner.phone || 'No registrado'],
      ['Email:', partner.email || 'No registrado'],
      ['Participacion:', partner.quotaShare ? `${partner.quotaShare}%` : 'No registrado'],
      [],
      ['INDICADORES FINANCIEROS Y FISICOS'],
      ['Total Aportes Realizados (USD):', metrics.totalAportes],
      ['Total Retiros Efectuados (USD):', metrics.totalRetiros],
      ['Total Gastos Directos Pagados (USD):', metrics.totalGastosAsoc],
      ['Inversion Neta Activa (USD):', metrics.netInvestment],
      ['Stock Bovinos Propiedad (Cabezas):', metrics.cattleCount],
      ['Aportes en Lotes Agricolas (USD):', metrics.fieldExpensesTotal],
      [],
      ['DETALLE HISTORICO DE MOVIMIENTOS'],
      headers
    ];

    metrics.txs.forEach((tx: any) => {
      rows.push([
        tx.id,
        tx.date,
        tx.type,
        tx.concept,
        tx.category,
        tx.amountUSD,
        tx.amountUSD * exchangeRate
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + rows.map(e => e.map(val => {
          if (typeof val === 'string') {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val === null || val === undefined ? '' : val;
        }).join(";")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Cuenta_Socio_${partner.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // GENERAL STATISTICS
  const totalFirmInvesmentUSD = transactions
    .filter(t => t.type === 'Aporte')
    .reduce((sum, t) => sum + t.amountUSD, 0) + 
    transactions.filter(t => t.type === 'Gasto Asociado').reduce((sum, t) => sum + t.amountUSD, 0);

  const totalFirmWithdrawalsUSD = transactions
    .filter(t => t.type === 'Retiro')
    .reduce((sum, t) => sum + t.amountUSD, 0);

  const netFirmCapitalUSD = totalFirmInvesmentUSD - totalFirmWithdrawalsUSD;

  // Filter Transaction History
  const filteredTxs = transactions.filter(t => {
    const matchesPartner = selectedPartnerFilter ? t.partnerId === selectedPartnerFilter : true;
    const matchesType = selectedTxTypeFilter ? t.type === selectedTxTypeFilter : true;
    return matchesPartner && matchesType;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Cattle filter
  const filteredCattle = animals.filter(a => {
    const partnerNameObj = partners.find(p => p.id === a.partnerId);
    const partnerNameStr = partnerNameObj ? partnerNameObj.name : 'Sin Asignar/Común';
    
    const term = cattleSearchQuery.toLowerCase();
    const queryMatches = a.caravana.toLowerCase().includes(term) || 
                         a.breed.toLowerCase().includes(term) || 
                         a.category.toLowerCase().includes(term) ||
                         partnerNameStr.toLowerCase().includes(term);

    const matchesPartner = selectedPartnerFilter ? a.partnerId === selectedPartnerFilter : true;
    return queryMatches && matchesPartner;
  });

  return (
    <div className="space-y-8 animate-fadeIn" id="partners-manager-container">
      
      {/* Visual Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-slate-900 rounded-2xl text-white shadow-sm border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-sans font-bold tracking-tight">Cuentas y Control de Socios</h1>
            <p className="text-slate-400 mt-1 font-sans text-xs">
              Mapee inversiones de capital, asigne la propiedad de cabezas vacunas e identifique gastos agrícolas por integrante.
            </p>
          </div>
        </div>
        <div className="mt-2 md:mt-0 flex gap-2">
          <button
            onClick={() => setShowAddPartnerForm(true)}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 cursor-pointer text-white font-sans text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Nuevo Socio
          </button>
          <button
            onClick={() => setShowAddTxForm(true)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 cursor-pointer text-slate-200 font-sans text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
          >
            <DollarSign className="h-3.5 w-3.5 text-teal-400" /> Registrar Movimiento
          </button>
        </div>
      </div>

      {/* Global Financial Brief Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Socios Registrados</p>
            <p className="text-xl font-bold text-slate-800 font-sans">{partners.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Total Capital Invertido</p>
            <p className="text-base font-bold text-slate-800 font-sans leading-none">
              USD {totalFirmInvesmentUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] font-mono font-bold text-teal-650">
              ≈ ${(totalFirmInvesmentUSD * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Retiros de Capital</p>
            <p className="text-base font-bold text-slate-800 font-sans leading-none">
              USD {totalFirmWithdrawalsUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] font-mono font-bold text-teal-650">
              ≈ ${(totalFirmWithdrawalsUSD * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Capital Neto Activo</p>
            <p className="text-base font-bold text-blue-700 font-sans leading-none">
              USD {netFirmCapitalUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] font-mono font-bold text-teal-650">
              ≈ ${(netFirmCapitalUSD * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
            </p>
          </div>
        </div>

      </div>

      {/* MODAL - Add Partner Form */}
      {showAddPartnerForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="add-partner-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-sans font-bold text-slate-800">Agregar Nuevo Socio</h3>
              <button 
                onClick={() => setShowAddPartnerForm(false)} 
                className="text-slate-400 hover:text-slate-650 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            
            <form onSubmit={handleSubmitPartner} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Daniel Alberto Novas"
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-hidden focus:border-teal-500 focus:bg-white text-slate-850"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Participación (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Ej: 50"
                    value={partnerShare}
                    onChange={e => setPartnerShare(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-hidden focus:border-teal-500 focus:bg-white text-slate-850"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: +54 9 11..."
                    value={partnerPhone}
                    onChange={e => setPartnerPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-hidden focus:border-teal-500 focus:bg-white text-slate-850"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Email de Contacto</label>
                <input
                  type="email"
                  placeholder="socioconex@correo.com"
                  value={partnerEmail}
                  onChange={e => setPartnerEmail(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-hidden focus:border-teal-500 focus:bg-white text-slate-850"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Notas Operativas</label>
                <textarea
                  placeholder="Detalles sobre responsabilidad, convenios o aportes especiales..."
                  value={partnerNotes}
                  onChange={e => setPartnerNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-hidden focus:border-teal-500 focus:bg-white text-slate-850"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddPartnerForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 cursor-pointer text-white text-xs font-bold rounded-lg transition"
                >
                  Guardar Socio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL - Add Transaction Form */}
      {showAddTxForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="add-transaction-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-sans font-bold text-slate-800 font-sans">Registrar Inversión o Movimiento</h3>
              <button 
                onClick={() => setShowAddTxForm(false)} 
                className="text-slate-400 hover:text-slate-650 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            
            <form onSubmit={handleSubmitTransaction} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Socio que realiza el aporte *</label>
                <select
                  required
                  value={txPartnerId}
                  onChange={e => setTxPartnerId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-hidden focus:border-teal-500 focus:bg-white text-slate-850"
                >
                  <option value="">-- Seleccionar Socio --</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono flex justify-between pr-1">
                    <span>Monto (USD) *</span>
                    <span className="text-teal-650 font-bold">≈ ${(parseFloat(txAmount || '0') * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Monto USD"
                    value={txAmount}
                    onChange={e => setTxAmount(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-hidden focus:border-teal-500 focus:bg-white text-slate-850"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Fecha del Aporte</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={e => setTxDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-hidden focus:border-teal-500 focus:bg-white text-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Tipo de Transacción</label>
                  <select
                    value={txType}
                    onChange={e => setTxType(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-hidden focus:border-teal-500 focus:bg-white text-slate-850"
                  >
                    <option value="Aporte">Aporte de Capital</option>
                    <option value="Retiro">Retiro / Dividendo</option>
                    <option value="Gasto Asociado">Pago de Gasto Directo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Destino del Capital</label>
                  <select
                    value={txCategory}
                    onChange={e => setTxCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-hidden focus:border-teal-500 focus:bg-white text-slate-850"
                  >
                    <option value="General">General / Común</option>
                    <option value="Hacienda">Livestock / Hacienda (Vacunos)</option>
                    <option value="Agrícola">Crop / Agrícola (Lotes)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Concepto / Descripción *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Aporte para compra de terneras Angus"
                  value={txConcept}
                  onChange={e => setTxConcept(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-hidden focus:border-teal-500 focus:bg-white text-slate-850"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddTxForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 cursor-pointer text-white text-xs font-bold rounded-lg transition"
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Navigation Tabs inside Partner */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 md:space-x-8" aria-label="Tabs">
          <button
            onClick={() => setPartnersTab('overview')}
            className={`pb-4 px-1 border-b-2 font-medium text-xs cursor-pointer transition whitespace-nowrap ${
              partnersTab === 'overview'
                ? 'border-teal-600 text-teal-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Resumen General y Carteras
          </button>
          <button
            onClick={() => setPartnersTab('ledger')}
            className={`pb-4 px-1 border-b-2 font-medium text-xs cursor-pointer transition whitespace-nowrap ${
              partnersTab === 'ledger'
                ? 'border-teal-600 text-teal-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Libro Diario (Inversiones y Gastos)
          </button>
          <button
            onClick={() => setPartnersTab('cattle')}
            className={`pb-4 px-1 border-b-2 font-medium text-xs cursor-pointer transition whitespace-nowrap ${
              partnersTab === 'cattle'
                ? 'border-teal-600 text-teal-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Hacienda Asignada a cada Socio
          </button>
        </nav>
      </div>

      {/* Tab CONTENT 1: Overview */}
      {partnersTab === 'overview' && (
        <div className="space-y-6">
          {partners.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-4">
              <Users className="h-12 w-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">Sin socios registrados</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Agregue socios para poder identificar de forma independiente las inversiones, los gastos agrícolas del campo y la cantidad de hacienda de cada uno.
                </p>
              </div>
              <button
                onClick={() => setShowAddPartnerForm(true)}
                className="mt-2 text-xs font-bold leading-5 text-white bg-teal-600 hover:bg-teal-500 py-1.5 px-4 rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Registrar mi Primer Socio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {partners.map(partner => {
                const metrics = getPartnerMetrics(partner.id);
                return (
                  <div key={partner.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
                    
                    {/* Partner Details Block */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-sans font-bold text-slate-800 flex items-center gap-1.5 leading-6">
                            <span>{partner.name}</span>
                            {partner.quotaShare && (
                              <span className="text-[10px] bg-slate-100 font-mono text-slate-600 px-1.5 py-0.5 rounded-md flex items-center font-semibold">
                                <Percent className="h-2.5 w-2.5" />{partner.quotaShare} Participación
                              </span>
                            )}
                          </h3>
                          {partner.notes && (
                            <p className="text-xs text-slate-500 italic mt-1 leading-relaxed">
                              "{partner.notes}"
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleExportPartnerLedger(partner, metrics)}
                            className="text-slate-400 hover:text-teal-650 p-1.5 rounded-lg hover:bg-slate-50 transition"
                            title="Exportar Cuenta Corriente (CSV)"
                          >
                            <FileDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Está seguro de eliminar al socio "${partner.name}"? Los registros históricos de transacciones no se borrarán pero perderán la referencia de este socio.`)) {
                                onRemovePartner(partner.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-55 transition"
                            title="Eliminar Socio"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Contact items */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-mono text-slate-400">
                        {partner.phone && (
                          <span className="flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-slate-350" /> Tel: {partner.phone}
                          </span>
                        )}
                        {partner.email && (
                          <span className="flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-slate-350" /> Email: {partner.email}
                          </span>
                        )}
                      </div>
                              {/* Financial Ledger Metric Card */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs grid grid-cols-2 gap-y-3 gap-x-4">
                      
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Aportes Brutos</p>
                        <p className="font-bold text-emerald-600 font-mono text-xs leading-none">
                          USD {metrics.totalAportes.toLocaleString()}
                        </p>
                        <p className="text-[9.5px] text-teal-600 font-mono font-medium leading-tight mt-0.5">
                          ≈ ${(metrics.totalAportes * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Retiros Realizados</p>
                        <p className="font-bold text-amber-600 font-mono text-xs leading-none">
                          USD {metrics.totalRetiros.toLocaleString()}
                        </p>
                        <p className="text-[9.5px] text-teal-600 font-mono font-medium leading-tight mt-0.5">
                          ≈ ${(metrics.totalRetiros * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Gastos Dir. Pagados</p>
                        <p className="font-bold text-indigo-500 font-mono text-xs leading-none">
                          USD {metrics.totalGastosAsoc.toLocaleString()}
                        </p>
                        <p className="text-[9.5px] text-teal-600 font-mono font-medium leading-tight mt-0.5">
                          ≈ ${(metrics.totalGastosAsoc * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Inversión Neta Activa</p>
                        <p className="font-extrabold text-blue-700 font-mono text-xs leading-none bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/40 inline-block font-bold">
                          USD {metrics.netInvestment.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-teal-700 font-mono font-bold leading-tight mt-1">
                          ≈ ${(metrics.netInvestment * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                        </p>
                      </div>

                    </div>

                    {/* Livestock Owned and Crop contribution summary */}
                    <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                      <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl flex items-center gap-2.5">
                        <Tag className="h-5 w-5 text-teal-600 shrink-0" />
                        <div>
                          <p className="text-[9px] text-slate-450 uppercase font-bold font-mono">Bovinos Propios</p>
                          <p className="text-xs font-bold text-slate-800 pr-1 shrink-0">{metrics.cattleCount} Cabezas</p>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-2.5">
                        <Wheat className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-[9px] text-slate-450 uppercase font-bold font-mono">Copagos Semilla/Lote</p>
                          <p className="text-xs font-bold text-slate-800 leading-none">USD {metrics.fieldExpensesTotal.toLocaleString()}</p>
                          <p className="text-[9.5px] text-teal-650 font-mono leading-tight mt-1">
                            ≈ ${(metrics.fieldExpensesTotal * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                          </p>
                        </div>
                      </div>
                    </div>             </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab CONTENT 2: Ledger Transaction history */}
      {partnersTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Internal filters header */}
          <div className="p-5 border-b border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
            <h3 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5 mr-auto">
              <FileText className="h-4.5 w-4.5 text-slate-450" /> Historial de Movimientos de Capital
            </h3>
            
            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
              <select
                value={selectedPartnerFilter}
                onChange={e => setSelectedPartnerFilter(e.target.value)}
                className="text-[11px] p-2 bg-white border border-slate-250 rounded-lg outline-hidden text-slate-650"
              >
                <option value="">Todos los socios</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <select
                value={selectedTxTypeFilter}
                onChange={e => setSelectedTxTypeFilter(e.target.value)}
                className="text-[11px] p-2 bg-white border border-slate-250 rounded-lg outline-hidden text-slate-650"
              >
                <option value="">Todos los tipos</option>
                <option value="Aporte">Solo Aportes</option>
                <option value="Retiro">Solo Retiros</option>
                <option value="Gasto Asociado">Solo Gastos Directos</option>
              </select>
            </div>
          </div>

          {/* Table list */}
          {filteredTxs.length === 0 ? (
            <div className="p-12 text-center text-slate-450 text-xs">
              Ninguna transacción coincide con los criterios de búsqueda o no se han cargado movimientos.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Socio</th>
                    <th className="p-4">Concepto / Destino</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Área / Destino</th>
                    <th className="p-4 text-right">Monto</th>
                    <th className="p-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTxs.map(tx => {
                    const partner = partners.find(p => p.id === tx.partnerId);
                    
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 whitespace-nowrap text-slate-450 font-mono">
                          {tx.date}
                        </td>
                        <td className="p-4 font-bold text-slate-700">
                          {partner ? partner.name : <span className="text-slate-400 italic">Socio Eliminado</span>}
                        </td>
                        <td className="p-4 text-slate-600 max-w-xs truncate">
                          {tx.concept}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {tx.type === 'Aporte' && (
                            <span className="p-1 px-2.5 font-semibold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                              Aporte
                            </span>
                          )}
                          {tx.type === 'Retiro' && (
                            <span className="p-1 px-2.5 font-semibold text-[10px] bg-amber-50 text-amber-700 border border-amber-100 rounded-full">
                              Retiro
                            </span>
                          )}
                          {tx.type === 'Gasto Asociado' && (
                            <span className="p-1 px-2.5 font-semibold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
                              Pago Gasto
                            </span>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-500 font-mono flex items-center gap-1 mt-1.5">
                          {tx.category === 'Hacienda' ? (
                            <span className="flex items-center gap-1 text-teal-600">
                              <Tag className="h-3 w-3" /> Hacienda
                            </span>
                          ) : tx.category === 'Agrícola' ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Wheat className="h-3 w-3" /> Agrícola
                            </span>
                          ) : (
                            <span className="text-slate-400">General</span>
                          )}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap font-mono text-xs">
                          <p className="font-bold text-slate-800">{tx.type === 'Retiro' ? '-' : '+'} USD {tx.amountUSD.toLocaleString()}</p>
                          <p className="text-[10px] text-teal-600 font-bold leading-tight">
                            {tx.type === 'Retiro' ? '-' : '+'} ${(tx.amountUSD * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                          </p>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm('¿Está seguro de eliminar esta transacción de aportes?')) {
                                onRemoveTransaction(tx.id);
                              }
                            }}
                            className="text-slate-350 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition"
                            title="Eliminar Registro"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* Tab CONTENT 3: Cattle owned by partner */}
      {partnersTab === 'cattle' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
            
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por Caravana, Raza, Categoría..."
                value={cattleSearchQuery}
                onChange={e => setCattleSearchQuery(e.target.value)}
                className="w-full text-xs p-2.5 pl-9 bg-slate-50 border border-slate-250 rounded-xl outline-hidden focus:border-teal-500 focus:bg-white text-slate-850"
              />
            </div>

            <div className="flex gap-2.5 w-full md:w-auto">
              <select
                value={selectedPartnerFilter}
                onChange={e => setSelectedPartnerFilter(e.target.value)}
                className="text-[11px] p-2 bg-white border border-slate-250 rounded-lg outline-hidden text-slate-650 flex-1 md:flex-initial"
              >
                <option value="">Filtrar: Todos los socios</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="unassigned">Por definir / Sin asignar</option>
              </select>
            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredCattle.length === 0 ? (
              <div className="p-12 text-center text-slate-450 text-xs">
                Ninguna cabeza bovina activa coincide con los filtros seleccionados o no hay animales registrados asignados a este socio.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-450 font-mono text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                      <th className="p-4">Caravana Ear Tag</th>
                      <th className="p-4">Dueño / Socio</th>
                      <th className="p-4">Raza</th>
                      <th className="p-4">Categoría / Sexo</th>
                      <th className="p-4">Peso Actual</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCattle.map(animal => {
                      const owner = partners.find(p => p.id === animal.partnerId);
                      
                      return (
                        <tr key={animal.id} className="hover:bg-slate-50 transition">
                          <td className="p-4 whitespace-nowrap font-mono font-bold text-slate-800">
                            <span className="p-1.5 px-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-150">
                              {animal.caravana}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-slate-700 whitespace-nowrap">
                            {owner ? (
                              <span className="text-teal-750 font-bold hover:underline cursor-default">
                                {owner.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Común o Sin Asignar</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-600">
                            {animal.breed}
                          </td>
                          <td className="p-4 whitespace-nowrap text-slate-500">
                            {animal.category} • <span className="text-[10px] italic">{animal.gender}</span>
                          </td>
                          <td className="p-4 whitespace-nowrap font-mono text-slate-700">
                            <span className="font-bold">{animal.currentWeight} kg</span>
                            <span className="text-[10px] text-slate-400 block">Inicial: {animal.initialWeight} kg</span>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`p-1 px-2.5 rounded-full text-[10px] font-semibold border ${
                              animal.status === 'Activo' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {animal.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 italic max-w-xs truncate">
                            {animal.notes || 'Sin anotaciones.'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
