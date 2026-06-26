/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Utensils, 
  Layers, 
  Wheat, 
  TrendingDown, 
  Coins, 
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { FeedInventory, FeedAssignment, Animal } from '../types';

interface FeedManagerProps {
  feeds: FeedInventory[];
  feedAssignments: FeedAssignment[];
  animals: Animal[];
  onAddFeed: (feed: FeedInventory) => void;
  onUpdateFeedStock: (feedId: string, additionalKg: number, costUSD?: number) => void;
  exchangeRate: number;
}

export default function FeedManager({
  feeds,
  feedAssignments,
  animals,
  onAddFeed,
  onUpdateFeedStock,
  exchangeRate,
}: FeedManagerProps) {
  // New Feed entry Form state
  const [showAddFeedForm, setShowAddFeedForm] = useState(false);
  const [feedName, setFeedName] = useState('');
  const [feedStock, setFeedStock] = useState<number>(5000);
  const [feedCostKg, setFeedCostKg] = useState<number>(0.15);
  const [feedSource, setFeedSource] = useState<'Producido' | 'Comprado'>('Comprado');
  const [feedNotes, setFeedNotes] = useState('');

  // Quick Restock dialog state
  const [activeRestockId, setActiveRestockId] = useState<string | null>(null);
  const [restockAmountKg, setRestockAmountKg] = useState<number>(2000);
  const [restockCostKg, setRestockCostKg] = useState<number>(0.12);

  const handleSubmitFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedName.trim()) return;

    const newFeed: FeedInventory = {
      id: `fd-${Date.now()}`,
      name: feedName.trim(),
      stockKg: Number(feedStock),
      costPerKgUSD: Number(feedCostKg),
      source: feedSource,
      notes: feedNotes,
    };

    onAddFeed(newFeed);

    // Reset fields
    setFeedName('');
    setFeedStock(5000);
    setFeedCostKg(0.15);
    setFeedNotes('');
    setShowAddFeedForm(false);
  };

  const handleRestockSubmit = (feedId: string) => {
    if (restockAmountKg <= 0) return;
    onUpdateFeedStock(feedId, Number(restockAmountKg), Number(restockCostKg));
    setActiveRestockId(null);
  };

  // List of formatted distribution history
  const recentAssignmentsLog = [...feedAssignments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Title & Add Action Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold text-slate-800">Almacenamiento de Alimento y Silos</h2>
          <p className="text-xs text-slate-500 mt-1">Monitorea kg de fibras, raciones concentradas e insumos forrajeros producidos frente a los comprados.</p>
        </div>
        <button
          onClick={() => setShowAddFeedForm(!showAddFeedForm)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-xs"
        >
          {showAddFeedForm ? 'Cancelar Alimento' : 'Registrar Nuevo Forraje'}
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Reg Feed Form */}
      {showAddFeedForm && (
        <form onSubmit={handleSubmitFeed} className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-slideDown">
          <h3 className="text-sm font-sans font-bold text-slate-800 border-b border-slate-200 pb-2">Registro de Tipo de Alimento</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Nombre del Alimento *</label>
              <input
                type="text"
                placeholder="Ej. Silo de Alfalfa, Balanceado"
                value={feedName}
                onChange={e => setFeedName(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Stock Inicial (kg)</label>
              <input
                type="number"
                value={feedStock}
                onChange={e => setFeedStock(Number(e.target.value))}
                min="0"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600 flex justify-between">
                <span>Costo Equivalente por kg (USD)</span>
                <span className="text-teal-600 font-bold text-[11px]">≈ ${(feedCostKg * exchangeRate).toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS</span>
              </label>
              <input
                type="number"
                value={feedCostKg}
                onChange={e => setFeedCostKg(Number(e.target.value))}
                min="0.001"
                step="0.001"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Origen / Procedencia</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFeedSource('Producido')}
                  className={`flex-1 text-center py-1.5 rounded-md font-sans text-xs font-bold transition ${feedSource === 'Producido' ? 'bg-white text-slate-800' : 'text-slate-500'}`}
                >
                  Producido propio
                </button>
                <button
                  type="button"
                  onClick={() => setFeedSource('Comprado')}
                  className={`flex-1 text-center py-1.5 rounded-md font-sans text-xs font-bold transition ${feedSource === 'Comprado' ? 'bg-white text-slate-800' : 'text-slate-500'}`}
                >
                  Comprado
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Fichas de identificación / Comentarios</label>
              <input
                type="text"
                placeholder="Ej. Excelentes condiciones de almacenamiento en galpón 2"
                value={feedNotes}
                onChange={e => setFeedNotes(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-sans text-xs font-bold rounded-lg transition"
            >
              Confirmar Alta de Alimento
            </button>
          </div>
        </form>
      )}

      {/* Grid of Feed stocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {feeds.map((feed) => {
          // Calculate stock indicators
          const percentMax = Math.min(100, (feed.stockKg / 50000) * 100);
          const needsRestock = feed.stockKg < 2000;
          
          return (
            <div key={feed.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col space-y-4 justify-between" id={`feed-card-${feed.id}`}>
              <div className="space-y-3">
                
                {/* Header title */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600 border border-teal-100/50">
                      <Wheat className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-sans font-bold text-slate-800 text-sm leading-tight">{feed.name}</h3>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${feed.source === 'Producido' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {feed.source}
                      </span>
                    </div>
                  </div>
                  
                  {/* Indicators */}
                  {needsRestock && (
                    <div className="flex items-center gap-1 text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded text-[9px] font-mono font-bold leading-none animate-pulse">
                      <AlertTriangle className="h-3 w-3" /> CRITICO
                    </div>
                  )}
                </div>

                {/* Main weight stock kgs */}
                <div>
                  <div className="text-2xl font-bold font-mono text-slate-800">{feed.stockKg.toLocaleString()} kg</div>
                  <span className="text-xs text-slate-400 font-sans">Disponible de fibra / grano</span>
                </div>

                {/* Progress bar visual indicating stock quantity fill */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${needsRestock ? 'bg-red-500' : feed.source === 'Producido' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${percentMax}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>Mín: 2k kg</span>
                    <span>Capacidad ref: 50k kg</span>
                  </div>
                </div>

                {/* Expense tag and notes */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">Costo Kilo Ref:</span>
                    <p className="font-mono font-bold text-slate-700 leading-none">${feed.costPerKgUSD.toFixed(3)} USD</p>
                    <p className="text-[10px] text-teal-600 font-mono leading-none mt-1">≈ ${(feed.costPerKgUSD * exchangeRate).toFixed(2)} ARS</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">Inversión Equiv:</span>
                    <p className="font-mono font-bold text-slate-700 leading-none">${(feed.stockKg * feed.costPerKgUSD).toLocaleString(undefined, {maximumFractionDigits: 0})} USD</p>
                    <p className="text-[10px] text-teal-600 font-mono leading-none mt-1">≈ ${(feed.stockKg * feed.costPerKgUSD * exchangeRate).toLocaleString('es-AR', {maximumFractionDigits: 0})} ARS</p>
                  </div>
                </div>

                {feed.notes && (
                  <p className="text-[10.5px] italic text-slate-400 font-sans pt-1 border-t border-dashed border-slate-100">{feed.notes}</p>
                )}

              </div>

              {/* Action restock panel */}
              {activeRestockId === feed.id ? (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 block">Ingreso de Suministro manual</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400">Kg a sumar:</span>
                      <input
                        type="number"
                        value={restockAmountKg}
                        onChange={e => setRestockAmountKg(Number(e.target.value))}
                        className="w-full p-1 bg-white border border-slate-300 font-mono text-xs rounded"
                      />
                    </div>
                    {feed.source === 'Comprado' && (
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400">Costo USD/kg:</span>
                        <input
                          type="number"
                          value={restockCostKg}
                          onChange={e => setRestockCostKg(Number(e.target.value))}
                          className="w-full p-1 bg-white border border-slate-300 font-mono text-xs rounded"
                          step="0.001"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => handleRestockSubmit(feed.id)}
                      className="px-2.5 py-1 bg-teal-600 font-bold text-white rounded text-[10.5px] shadow-xs"
                    >
                      Añadir Stock
                    </button>
                    <button
                      onClick={() => setActiveRestockId(null)}
                      className="px-2.5 py-1 bg-slate-200 text-slate-600 rounded text-[10.5px]"
                    >
                      Volver
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setRestockAmountKg(5000);
                    setRestockCostKg(feed.costPerKgUSD);
                    setActiveRestockId(feed.id);
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-bold rounded-xl transition shadow-xs mt-2"
                >
                  Abastecer o Sumar Forraje
                </button>
              )}

            </div>
          );
        })}
      </div>

      {/* Distribution history assignments log list */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <h3 className="font-sans font-bold text-sm text-slate-700">Bitácora de Reparto e Ingesta Diaria</h3>
          <p className="text-[11px] text-slate-400">Listado de porciones dadas a cada animal con identificación activa.</p>
        </div>

        {recentAssignmentsLog.length === 0 ? (
          <p className="text-xs text-slate-400 text-center p-8 italic font-sans">No se han registrado suministros alimentarios.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {recentAssignmentsLog.map((item) => {
              const animalRef = animals.find(a => a.id === item.animalId);
              const feedRef = feeds.find(f => f.id === item.feedId);
              
              return (
                <div key={item.id} className="p-3.5 flex justify-between items-center text-xs font-sans hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-100/50 flex items-center justify-center font-mono font-bold text-teal-600">
                      R
                    </div>
                    <div>
                      <p className="font-sans text-slate-700">
                        Se le proporcionó <strong className="font-sans">{item.amountKg} kg</strong> de <span className="font-semibold text-slate-800">{feedRef?.name || 'Alimento'}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-mono">
                        Caravana destino: <strong className="text-teal-700">{animalRef?.caravana || 'Eliminado'}</strong> ({animalRef?.breed || 'S/D'}) • Fecha: {item.date}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md text-[10px]">
                      Costo: ${(item.amountKg * (feedRef?.costPerKgUSD || 0)).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
