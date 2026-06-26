/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Scale, 
  Sprout, 
  Coins, 
  TrendingUp, 
  Map, 
  Layers, 
  Activity, 
  Wheat 
} from 'lucide-react';
import { Animal, CropField, FeedInventory } from '../types';

interface DashboardProps {
  animals: Animal[];
  fields: CropField[];
  feeds: FeedInventory[];
  setActiveTab: (tab: string) => void;
  exchangeRate: number;
}

export default function Dashboard({ animals, fields, feeds, setActiveTab, exchangeRate }: DashboardProps) {
  // --- Cattle Calculations ---
  const activeAnimals = animals.filter(a => a.status === 'Activo');
  const totalCattleCount = activeAnimals.length;
  
  // Calculate average daily gain (GDP) in kg/day for the herd
  let totalGDP = 0;
  let gdpCount = 0;
  let totalKilosGained = 0;

  activeAnimals.forEach(animal => {
    const history = [...animal.weightHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const weightDiff = last.weight - first.weight;
      totalKilosGained += weightDiff;

      const date1 = new Date(first.date);
      const date2 = new Date(last.date);
      const diffTime = Math.abs(date2.getTime() - date1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      
      const animalGDP = weightDiff / diffDays;
      totalGDP += animalGDP;
      gdpCount++;
    } else {
      // Just single weight or entry weight
      totalKilosGained += (animal.currentWeight - animal.initialWeight);
    }
  });

  const herdAverageGDP = gdpCount > 0 ? (totalGDP / gdpCount) : 0;
  const totalHerdWeight = activeAnimals.reduce((acc, a) => acc + a.currentWeight, 0);
  const avgHerdWeight = totalCattleCount > 0 ? (totalHerdWeight / totalCattleCount) : 0;

  // --- Crop Calculations ---
  // Rented Fields count
  const totalFields = fields.length;
  const totalHectares = fields.reduce((acc, f) => acc + f.areaHectares, 0);
  
  // Expenses sum
  let totalCropExps = 0;
  let rentalCosts = 0;
  let seedCosts = 0;
  let fertCosts = 0;
  let machineryCosts = 0;
  let otherCosts = 0;
  let outstandingDebtAllFieldsUSD = 0;

  fields.forEach(f => {
    // Rental is already an expense or defined in f.rentalCostUSD. We tally all category expenses.
    f.expenses.forEach(e => {
      totalCropExps += e.amountUSD;
      if (e.category === 'Alquiler') rentalCosts += e.amountUSD;
      else if (e.category === 'Semilla') seedCosts += e.amountUSD;
      else if (e.category === 'Fertilizante') fertCosts += e.amountUSD;
      else if (e.category === 'Maquinaria') machineryCosts += e.amountUSD;
      else otherCosts += e.amountUSD;

      if (e.isCuentaCorriente && !e.isPaid) {
        outstandingDebtAllFieldsUSD += e.amountUSD;
      }
    });
  });

  const costPerHectare = totalHectares > 0 ? (totalCropExps / totalHectares) : 0;

  // --- Feed Stock KPI ---
  const totalFeedStock = feeds.reduce((acc, f) => acc + f.stockKg, 0);

  // --- Charts Visual Data Prep ---
  // Expense breakdown categories for beautiful SVG Chart
  const expenseChartData = [
    { label: 'Alquiler', value: rentalCosts, color: '#f59e0b' },
    { label: 'Semillas', value: seedCosts, color: '#10b981' },
    { label: 'Fertilizantes', value: fertCosts, color: '#3b82f6' },
    { label: 'Maquinaria y Trabajos', value: machineryCosts, color: '#8b5cf6' },
    { label: 'Otros Gastos', value: otherCosts, color: '#6b7280' },
  ].filter(d => d.value > 0);

  const maxExpenseVal = Math.max(...expenseChartData.map(d => d.value), 1);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-slate-900 rounded-2xl text-white shadow-sm border border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-sans font-bold tracking-tight">Estancia & Agronegocio</h1>
          <p className="text-slate-400 mt-1 font-sans text-sm md:text-base">
            Control de ganadería de precisión y balance consolidado de siembras.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3 text-xs font-mono text-slate-300">
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-slate-500">Local:</span> ARG ENT
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-slate-500 font-semibold text-teal-400">Cotización:</span> 1 USD = ${exchangeRate.toLocaleString('es-AR')} ARS
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div 
          onClick={() => setActiveTab('cattle')}
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
          id="kpi-cattle"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition">
              <Activity className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Activos</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-800">{totalCattleCount} Cabezas</h3>
            <p className="text-xs text-slate-500 mt-1 font-sans font-medium">Peso prom: {Math.round(avgHerdWeight)} kg/animal</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('cattle')}
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
          id="kpi-gdp"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Eficiencia</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-800">+{totalKilosGained.toLocaleString()} kg</h3>
            <p className="text-xs text-slate-500 mt-1 font-sans font-medium">Incremento total • Prom: {herdAverageGDP.toFixed(2)} kg/día</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('fields')}
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
          id="kpi-fields"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition">
              <Map className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Siembra</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-800">{totalHectares} Hectáreas</h3>
            <p className="text-xs text-slate-500 mt-1 font-sans font-medium">{totalFields} lotes arrendados en producción</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('fields')}
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
          id="kpi-expenses"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition">
              <Coins className="h-6 w-6 text-slate-700" />
            </div>
            <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Inversión Agrícola</span>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-800">${totalCropExps.toLocaleString()} USD</h3>
            <p className="text-xs font-mono font-bold text-teal-600">
              ≈ ${(totalCropExps * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
            </p>
            <p className="text-[10px] text-slate-450 font-sans font-medium">
              Prom: ${Math.round(costPerHectare)} USD/ha
            </p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('fields')}
          className="bg-amber-50/40 p-6 rounded-2xl border border-amber-250 hover:border-amber-300 shadow-xs hover:shadow-md transition cursor-pointer group"
          id="kpi-liabilities"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-100/60 rounded-xl group-hover:bg-amber-100 transition">
              <Activity className="h-6 w-6 text-amber-600" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Deuda Futura</span>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-amber-900">${outstandingDebtAllFieldsUSD.toLocaleString()} USD</h3>
            <p className="text-xs font-mono font-bold text-teal-650">
              ≈ ${(outstandingDebtAllFieldsUSD * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
            </p>
            <p className="text-[10px] text-amber-800 font-sans font-semibold">
              Pendiente Cuenta Corriente
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Layout Block: Split Visual Graphs & Crop Vs Animal Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Consolidated Expenses & Crop Distribution (7 columns) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-sans font-bold text-slate-800">Estructura de Gastos Agrícolas</h2>
            <p className="text-xs text-slate-500 mt-0.5">Distribución monetaria total invertida en maquinaria, semillas, fertilizante y campo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Custom SVG Donut / Segment Chart */}
            <div className="md:col-span-5 flex flex-col items-center justify-center relative py-4">
              <svg className="w-40 h-40 transform -rotate-90">
                {/* Simulated Segment calculation */}
                {(() => {
                  let cumulatedPercent = 0;
                  return expenseChartData.map((data, idx) => {
                    const percent = data.value / totalCropExps;
                    const strokeDasharray = `${percent * 100} ${100 - percent * 100}`;
                    const strokeDashoffset = -cumulatedPercent * 100;
                    cumulatedPercent += percent;
                    return (
                      <circle
                        key={idx}
                        cx="20"
                        cy="20"
                        r="15.915"
                        fill="transparent"
                        stroke={data.color}
                        strokeWidth="4"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                        transform="scale(1)"
                      />
                    );
                  });
                })()}
                {/* Gray center for donut */}
                <circle cx="20" cy="20" r="12" fill="white" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center leading-tight">
                <span className="text-[10px] font-sans font-medium text-slate-400">Total</span>
                <span className="text-base font-extrabold text-slate-800">${(totalCropExps / 1000).toFixed(1)}k <span className="text-[10px] font-normal text-slate-500">USD</span></span>
                <span className="text-[9px] font-mono text-teal-600 font-bold">≈ $ARS {((totalCropExps * exchangeRate) / 1000000).toFixed(2)}M</span>
              </div>
            </div>

            {/* Custom Bar Grid List */}
            <div className="md:col-span-7 space-y-3">
              {expenseChartData.map((item, idx) => {
                const percentage = (item.value / totalCropExps) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        {item.label}
                      </div>
                      <div className="font-mono text-slate-600 text-right leading-none space-y-0.5 animate-fadeIn">
                        <div className="text-xs font-semibold">${item.value.toLocaleString()} USD <span className="text-slate-400 text-[10px]">({percentage.toFixed(0)}%)</span></div>
                        <div className="text-[10px] text-teal-600 font-medium">≈ ${(item.value * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ backgroundColor: item.color, width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Block for Agriculture */}
          <div className="p-4 bg-slate-50 rounded-xl flex flex-wrap justify-between items-center gap-4 border border-slate-100">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Eficiencia del Alquiler</span>
              <p className="text-sm font-sans font-semibold text-slate-700">
                Alquiler: <span className="text-amber-600 font-bold">${rentalCosts.toLocaleString()} USD</span> <span className="text-xs text-slate-450">({((rentalCosts / totalCropExps)*100 || 0).toFixed(1)}%)</span>
              </p>
              <p className="text-[11px] text-teal-600 font-mono font-medium">≈ ${(rentalCosts * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Maquinaria y Labores</span>
              <p className="text-sm font-sans font-semibold text-slate-700">
                Labores: <span className="text-purple-600 font-bold">${(totalCropExps - rentalCosts).toLocaleString()} USD</span>
              </p>
              <p className="text-[11px] text-teal-600 font-mono font-medium">≈ ${((totalCropExps - rentalCosts) * exchangeRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</p>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Inventory & Animals ADG Ranking (5 columns) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-sans font-bold text-slate-800">Ganancia Diaria por Caravana</h2>
            <p className="text-xs text-slate-500 mt-0.5">Clasificación de eficiencia en base a la Ganancia Diaria Promedio (GDP).</p>
          </div>

          {/* Animal Ranking List */}
          <div className="space-y-4 flex-1">
            {activeAnimals.map((animal) => {
              const history = [...animal.weightHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              let adg = 0;
              if (history.length >= 2) {
                const first = history[0];
                const last = history[history.length - 1];
                const weightDiff = last.weight - first.weight;
                const daysDiff = Math.ceil(Math.abs(new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 3600 * 24)) || 1;
                adg = weightDiff / daysDiff;
              }

              // Color indicator based on gains
              const barColor = adg > 0.8 ? 'bg-emerald-500 text-emerald-700' : adg > 0.5 ? 'bg-amber-500 text-amber-700' : 'bg-rose-500 text-rose-700';
              const textBadgeColor = adg > 0.8 ? 'bg-emerald-50 text-emerald-800' : adg > 0.5 ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800';

              return (
                <div key={animal.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center font-mono font-bold text-teal-700">
                      ID
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">{animal.caravana}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{animal.breed}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans mt-0.5">
                        Peso inicial: {animal.initialWeight}kg → <span className="font-bold text-slate-600">{animal.currentWeight}kg</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold ${textBadgeColor}`}>
                      +{adg > 0 ? adg.toFixed(2) : '0.00'} kg/día
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">Ganado: +{animal.currentWeight - animal.initialWeight} kg</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-mono">Stock de Forraje General</span>
            <span className="font-mono font-bold text-slate-800">{totalFeedStock.toLocaleString()} kg</span>
          </div>
        </div>
      </div>

      {/* Production Integration Simulator Widget */}
      <div className="bg-gradient-to-tr from-slate-900 to-teal-950 text-white p-6 rounded-2xl shadow-md border border-teal-500/10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wheat className="text-teal-400 h-5 w-5" />
              <h3 className="font-sans font-bold text-lg">Integración Agroganadera Inteligente</h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Nuestros campos producen silaje de maíz y fardos de calidad. Calculamos el costo real del kilo producido para nutrir el corral sin depender de intermediarios.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('feeds')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-sans text-xs font-semibold rounded-lg transition-all shadow-sm shrink-0"
          >
            Ver Inventario de Alimentos
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-teal-300 font-mono uppercase tracking-wider text-[10px]">Costo Maíz Producido</span>
            <div className="text-lg font-bold font-mono">$0.08 USD <span className="text-[10px] font-normal text-slate-450">/ kg</span></div>
            <p className="text-[11px] font-mono text-teal-400">≈ ${(0.08 * exchangeRate).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARS/kg</p>
            <p className="text-[10px] text-slate-400">Calculado a partir de {totalHectares} Has cosechadas</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-teal-300 font-mono uppercase tracking-wider text-[10px]">Costo Concentrado Comprado</span>
            <div className="text-lg font-bold font-mono">$0.35 USD <span className="text-[10px] font-normal text-slate-450">/ kg</span></div>
            <p className="text-[11px] font-mono text-teal-400">≈ ${(0.35 * exchangeRate).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARS/kg</p>
            <p className="text-[10px] text-slate-400">Adquirido de proveedores comerciales</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-teal-300 font-mono uppercase tracking-wider text-[10px]">Ahorro Estimado</span>
            <div className="text-lg font-bold font-mono text-emerald-400">~77% menos costo</div>
            <p className="text-[10px] text-slate-400">Al autoabastecerse de fibra silera propia</p>
          </div>
        </div>
      </div>
    </div>
  );
}
