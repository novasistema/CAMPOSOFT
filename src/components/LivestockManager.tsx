/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Scale, 
  Trash2, 
  Calendar, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  PlusCircle,
  FileText,
  Weight
} from 'lucide-react';
import { Animal, AnimalCategory, AnimalStatus, AnimalGender, FeedInventory, FeedAssignment, Partner } from '../types';

interface LivestockManagerProps {
  animals: Animal[];
  feeds: FeedInventory[];
  feedAssignments: FeedAssignment[];
  partners: Partner[];
  onAddAnimal: (animal: Animal) => void;
  onUpdateAnimalWeight: (animalId: string, newWeight: number, date: string) => void;
  onAddFeedAssignment: (assignment: FeedAssignment) => void;
  onRemoveAnimal: (animalId: string) => void;
  onUpdateAnimalStatus: (animalId: string, status: AnimalStatus) => void;
}

export default function LivestockManager({
  animals,
  feeds,
  feedAssignments,
  partners,
  onAddAnimal,
  onUpdateAnimalWeight,
  onAddFeedAssignment,
  onRemoveAnimal,
  onUpdateAnimalStatus,
}: LivestockManagerProps) {
  // Navigation & details states
  const [expandedAnimalId, setExpandedAnimalId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<AnimalStatus | 'Todos'>('Activo');
  const [partnerFilter, setPartnerFilter] = useState<string>('Todos');

  // New Animal Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCaravana, setNewCaravana] = useState('');
  const [newBreed, setNewBreed] = useState('Aberdeen Angus');
  const [newGender, setNewGender] = useState<AnimalGender>('Macho');
  const [newCategory, setNewCategory] = useState<AnimalCategory>('Novillo');
  const [newBirthDate, setNewBirthDate] = useState('2024-11-15');
  const [newInitialWeight, setNewInitialWeight] = useState(180);
  const [newNotes, setNewNotes] = useState('');
  const [newPartnerId, setNewPartnerId] = useState('');

  // Add Weight dialog state
  const [activeWeightId, setActiveWeightId] = useState<string | null>(null);
  const [newWeightVal, setNewWeightVal] = useState<number>(200);
  const [newWeightDate, setNewWeightDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Feed distribution block state
  const [activeFeedAnimalId, setActiveFeedAnimalId] = useState<string | null>(null);
  const [selectedFeedId, setSelectedFeedId] = useState<string>(feeds[0]?.id || '');
  const [feedAmountKg, setFeedAmountKg] = useState<number>(5);

  // Filter animals list
  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.caravana.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          animal.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || animal.category === categoryFilter;
    const matchesStatus = statusFilter === 'Todos' || animal.status === statusFilter;
    const matchesPartner = partnerFilter === 'Todos' || 
                           (partnerFilter === 'Sin Asignar' && !animal.partnerId) || 
                           animal.partnerId === partnerFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesPartner;
  });

  const categories: AnimalCategory[] = ['Ternero', 'Ternera', 'Novillo', 'Vaquillona', 'Vaca', 'Toro'];
  const breedsList = ['Aberdeen Angus', 'Hereford', 'Brangus', 'Braford', 'Holando Argentino', 'Cruza'];

  // Handler for adding animal
  const handleSubmitAnimal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaravana.trim()) return;

    // Build new animal object
    const createdAnimal: Animal = {
      id: `an-${Date.now()}`,
      caravana: newCaravana.toUpperCase().trim(),
      breed: newBreed,
      gender: newGender,
      category: newCategory,
      birthDate: newBirthDate,
      initialWeight: Number(newInitialWeight),
      currentWeight: Number(newInitialWeight),
      weightHistory: [
        { date: newBirthDate, weight: Number(newInitialWeight) }
      ],
      status: 'Activo',
      notes: newNotes,
      partnerId: newPartnerId || undefined
    };

    onAddAnimal(createdAnimal);
    // Reset Form
    setNewCaravana('');
    setNewNotes('');
    setNewPartnerId('');
    setShowAddForm(false);
  };

  // Handler for registration of weights
  const handleSubmitWeight = (animalId: string) => {
    if (!newWeightVal || newWeightVal <= 0) return;
    onUpdateAnimalWeight(animalId, Number(newWeightVal), newWeightDate);
    setActiveWeightId(null);
  };

  // Handler for feeding log
  const handleFeeding = (animalId: string) => {
    if (!selectedFeedId || feedAmountKg <= 0) return;
    const assignment: FeedAssignment = {
      id: `feed-as-${Date.now()}`,
      animalId,
      date: new Date().toISOString().split('T')[0],
      feedId: selectedFeedId,
      amountKg: Number(feedAmountKg),
    };
    onAddFeedAssignment(assignment);
    setActiveFeedAnimalId(null);
  };

  // Draw Weight Progress Line Chart manually in raw SVG!
  const renderWeightChart = (animal: Animal) => {
    const history = [...animal.weightHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (history.length < 2) {
      return (
        <div className="h-32 flex flex-col justify-center items-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Scale className="h-5 w-5 text-slate-400 mb-1" />
          <p className="text-xs text-slate-500">Se necesitan al menos 2 registros de peso para armar el gráfico.</p>
        </div>
      );
    }

    const margin = 24;
    const width = 360;
    const height = 120;
    
    const minWeight = Math.min(...history.map(h => h.weight)) * 0.9;
    const maxWeight = Math.max(...history.map(h => h.weight)) * 1.1;
    const weightRange = maxWeight - minWeight;

    const firstTime = new Date(history[0].date).getTime();
    const lastTime = new Date(history[history.length - 1].date).getTime();
    const timeRange = lastTime - firstTime || 1;

    // Map each weight record to X,Y coordinates
    const points = history.map(item => {
      const t = new Date(item.date).getTime();
      const x = margin + ((t - firstTime) / timeRange) * (width - 2 * margin);
      const y = height - margin - ((item.weight - minWeight) / weightRange) * (height - 2 * margin);
      return { x, y, weight: item.weight, date: item.date };
    });

    // Create SVG path string
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    return (
      <div className="space-y-2">
        <span className="text-xs font-mono text-slate-400">Curva de Crecimiento (kg acumulados)</span>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-center">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-md h-auto overflow-visible">
            {/* Horizontal Grid lines */}
            <line x1={margin} y1={margin} x2={width - margin} y2={margin} stroke="#e2e8f0" strokeDasharray="4" />
            <line x1={margin} y1={height/2} x2={width - margin} y2={height/2} stroke="#e2e8f0" strokeDasharray="4" />
            <line x1={margin} y1={height - margin} x2={width - margin} y2={height - margin} stroke="#cbd5e1" />

            {/* Line connecting the weights */}
            <path d={pathD} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Accent Circle markers */}
            {points.map((pt, i) => (
              <g key={i} className="group cursor-pointer">
                <circle cx={pt.x} cy={pt.y} r="4" fill="#0d9488" stroke="white" strokeWidth="1.5" />
                <text x={pt.x} y={pt.y - 8} textAnchor="middle" className="text-[9px] font-mono font-bold fill-teal-800">
                  {pt.weight}kg
                </text>
                <text x={pt.x} y={height - 6} textAnchor="middle" className="text-[7px] font-mono fill-slate-400">
                  {pt.date.substring(5)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Title & Add Action Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold text-slate-800">Control Unitario de Hacienda</h2>
          <p className="text-xs text-slate-500 mt-1">Identifica animales por caravana, registra pesadas y suministra raciones diarias de silaje o balanceados.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-xs"
        >
          {showAddForm ? 'Cancelar Registro' : 'Registrar Nuevo Animal'}
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Add New Animal Form Block */}
      {showAddForm && (
        <form onSubmit={handleSubmitAnimal} className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-slideDown">
          <h3 className="text-sm font-sans font-bold text-slate-800 border-b border-slate-200 pb-2">Formulario de Ingreso de Hacienda</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Caravana Identificación */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">N° Caravana *</label>
              <input
                type="text"
                placeholder="Ej: AR-9502"
                value={newCaravana}
                onChange={e => setNewCaravana(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 font-mono uppercase"
                required
              />
            </div>

            {/* Breed / Raza */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Raza</label>
              <select
                value={newBreed}
                onChange={e => setNewBreed(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500"
              >
                {breedsList.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Class Category */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Categoría</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as AnimalCategory)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sex / Gender */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Sexo / Género</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setNewGender('Macho')}
                  className={`flex-1 text-center py-1.5 rounded-md font-sans text-xs font-bold transition ${newGender === 'Macho' ? 'bg-white text-slate-800' : 'text-slate-500'}`}
                >
                  Macho
                </button>
                <button
                  type="button"
                  onClick={() => setNewGender('Hembra')}
                  className={`flex-1 text-center py-1.5 rounded-md font-sans text-xs font-bold transition ${newGender === 'Hembra' ? 'bg-white text-slate-800' : 'text-slate-500'}`}
                >
                  Hembra
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
            {/* Birth Date */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Fecha Nacimiento / Entrada</label>
              <input
                type="date"
                value={newBirthDate}
                onChange={e => setNewBirthDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 font-mono"
              />
            </div>

            {/* Initial Weight */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-slate-600">Peso de Entrada / Inicial (kg)</label>
              <input
                type="number"
                value={newInitialWeight}
                onChange={e => setNewInitialWeight(Number(e.target.value))}
                min="20"
                max="1000"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 font-mono"
              />
            </div>

            {/* Comments */}
            <div className="space-y-1 sm:col-span-2 md:col-span-1">
              <label className="text-xs font-mono font-medium text-slate-600">Anotaciones Adicionales</label>
              <input
                type="text"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Ej. Comprado a cabaña Don Luis"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500"
              />
            </div>

            {/* Socio / Dueño dropdown */}
            <div className="space-y-1 sm:col-span-2 md:col-span-1">
              <label className="text-xs font-mono font-medium text-slate-600">Socio Titular / Dueño</label>
              <select
                value={newPartnerId}
                onChange={e => setNewPartnerId(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500"
              >
                <option value="">Sin asignar / Hacienda Común</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-sans text-xs font-bold rounded-lg transition"
            >
              Confirmar Alta Animal
            </button>
          </div>
        </form>
      )}

      {/* Database Filters & Quick Search Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center">
        {/* Search Feed */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar por caravana (ej. AR-3012) o raza..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200/80 pl-10 pr-4 py-2.5 rounded-lg focus:outline-teal-500 font-sans"
          />
        </div>

        {/* Category Selective Filter */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 shrink-0 font-sans font-medium text-slate-700"
          >
            <option value="Todos">Todas las Categorías</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status filter button */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as AnimalStatus | 'Todos')}
            className="text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 shrink-0 font-sans font-medium text-slate-700"
          >
            <option value="Activo">Solo Activos</option>
            <option value="Vendido">Vendidos</option>
            <option value="Baja">Baja Técnica</option>
            <option value="Todos">Todos los Estados</option>
          </select>

          {/* Partner filter selective */}
          <select
            value={partnerFilter}
            onChange={e => setPartnerFilter(e.target.value)}
            className="text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-teal-500 shrink-0 font-sans font-medium text-slate-700"
          >
            <option value="Todos">Todos los Socios</option>
            <option value="Sin Asignar">Sin Asignar / Común</option>
            {partners.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Animals Table/Cards Render */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <span className="text-xs font-mono font-bold text-slate-500">Mostrando {filteredAnimals.length} cabezas filtradas</span>
          <span className="text-xs text-slate-400">Haga clic en la fila para ver historial de peso y raciones</span>
        </div>

        {filteredAnimals.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Scale className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-sans">No se encontraron animales con los filtros activos.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAnimals.map((animal) => {
              const isExpanded = expandedAnimalId === animal.id;
              
              // Calculate individual animal kilos increase
              const kilosIncrease = animal.currentWeight - animal.initialWeight;
              
              // Filter feeding occurrences linked to this animal
              const animalFeedHistory = feedAssignments.filter(as => as.animalId === animal.id);

              return (
                <div key={animal.id} className="transition" id={`animal-row-${animal.id}`}>
                  
                  {/* Summary Bar */}
                  <div 
                    onClick={() => setExpandedAnimalId(isExpanded ? null : animal.id)}
                    className="p-4 hover:bg-slate-50/50 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                  >
                    <div className="flex items-center gap-4">
                      {/* Caravana ID badge */}
                      <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-100/60 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-mono leading-tight text-teal-500">N°</span>
                        <span className="font-mono text-xs font-bold leading-none text-teal-800">{animal.caravana.substring(3)}</span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{animal.caravana}</span>
                          <span className="text-[10px] text-slate-600 font-sans bg-slate-100 px-2 py-0.5 rounded-full font-medium">{animal.breed}</span>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${animal.gender === 'Macho' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                            {animal.gender}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-sans mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span>Categoría: <span className="font-semibold text-slate-700">{animal.category}</span></span>
                          <span className="text-slate-350">•</span>
                          <span>Nacimiento: <span className="font-mono">{animal.birthDate}</span></span>
                          {animal.partnerId && (
                            <>
                              <span className="text-slate-350">•</span>
                              <span className="px-2 py-0.5 bg-teal-50 text-teal-850 rounded-md font-bold text-[10px] border border-teal-100">
                                Dueño: {partners.find(p => p.id === animal.partnerId)?.name || 'Socio'}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-2.5 md:pt-0">
                      {/* Weight stats summarized */}
                      <div className="flex gap-4 sm:gap-6 text-xs text-slate-500">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono leading-none text-slate-400">Ingreso</span>
                          <p className="font-mono font-bold text-slate-600">{animal.initialWeight} kg</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono leading-none text-slate-400">Actual</span>
                          <p className="font-mono font-bold text-teal-700">{animal.currentWeight} kg</p>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <span className="text-[10px] font-mono leading-none text-slate-400">Aumento (Diferencia)</span>
                          <p className="font-mono font-bold text-emerald-600">+{kilosIncrease} kg</p>
                        </div>
                      </div>

                      {/* Expand Chevron Icon */}
                      <div className="p-1 rounded-full bg-slate-50 text-slate-400 group-hover:text-slate-600">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                      
                      {/* Left: Weight progression Curve & Register weight */}
                      <div className="lg:col-span-7 space-y-5">
                        {renderWeightChart(animal)}

                        {/* Register weight logs list & quick entry */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h4 className="text-xs font-sans font-bold text-slate-800 flex items-center gap-1.5">
                              <Scale className="h-4 w-4 text-slate-500" />
                              Registrar nuevo control de peso
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">Total pesajes: {animal.weightHistory.length}</span>
                          </div>
                          
                          {activeWeightId === animal.id ? (
                            <div className="flex items-end gap-3 flex-wrap">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-medium text-slate-500">Peso en kg</span>
                                <input
                                  type="number"
                                  value={newWeightVal}
                                  onChange={e => setNewWeightVal(Number(e.target.value))}
                                  className="text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono w-24"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-medium text-slate-500">Fecha del Pesaje</span>
                                <input
                                  type="date"
                                  value={newWeightDate}
                                  onChange={e => setNewWeightDate(e.target.value)}
                                  className="text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono w-36"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSubmitWeight(animal.id)}
                                  className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-sans font-bold shadow-xs"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setActiveWeightId(null)}
                                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-sans font-medium"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-slate-500 font-sans">Introduce la última medición para recalcular la ganancia acumulada del animal.</p>
                              <button
                                onClick={() => {
                                  setNewWeightVal(animal.currentWeight + 5);
                                  setActiveWeightId(animal.id);
                                }}
                                className="flex items-center gap-1 text-teal-600 hover:text-teal-500 font-sans text-xs font-bold"
                              >
                                <PlusCircle className="h-4 w-4" /> Registrar Peso
                              </button>
                            </div>
                          )}

                          {/* Historical Weight logs */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400">Historial de registros:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {animal.weightHistory.map((reg, idx) => (
                                <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                                  <div className="text-xs font-mono font-bold text-slate-700">{reg.weight} kg</div>
                                  <div className="text-[9px] font-mono text-slate-400">{reg.date}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Raciones alimentarias logs & distribution feed */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs space-y-4">
                          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                            <h4 className="text-xs font-sans font-bold text-slate-800 flex items-center gap-1.5">
                              <Utensils className="h-4 w-4 text-slate-500" />
                              Asignación de Ración Diaria
                            </h4>
                          </div>

                          {activeFeedAnimalId === animal.id ? (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-medium text-slate-500">Seleccionar Alimento del Stock</label>
                                <select
                                  value={selectedFeedId}
                                  onChange={e => setSelectedFeedId(e.target.value)}
                                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                >
                                  {feeds.map(f => (
                                    <option key={f.id} value={f.id}>{f.name} (Disp: {f.stockKg.toLocaleString()} kg)</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-3">
                                <div className="space-y-1 flex-1">
                                  <label className="text-[10px] font-mono font-medium text-slate-500">Cantidad diaria (kg)</label>
                                  <input
                                    type="number"
                                    value={feedAmountKg}
                                    onChange={e => setFeedAmountKg(Number(e.target.value))}
                                    min="0.1"
                                    step="0.1"
                                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                                  />
                                </div>
                                <div className="flex items-end gap-2 shrink-0">
                                  <button
                                    onClick={() => handleFeeding(animal.id)}
                                    className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold"
                                  >
                                    Asignar
                                  </button>
                                  <button
                                    onClick={() => setActiveFeedAnimalId(null)}
                                    className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs"
                                  >
                                    Atrás
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-slate-500 font-sans">Administra la ración que consume este animal diariamente para calcular la eficiencia de engorde.</p>
                              <button
                                onClick={() => {
                                  if (feeds.length > 0) setSelectedFeedId(feeds[0].id);
                                  setActiveFeedAnimalId(animal.id);
                                }}
                                className="flex items-center gap-1 text-teal-600 hover:text-teal-500 font-sans text-xs font-bold shrink-0"
                              >
                                <PlusCircle className="h-4 w-4" /> Dar Alimento
                              </button>
                            </div>
                          )}

                          {/* Feeding items assigned summary */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400">Raciones Asignadas Hoy:</span>
                            {animalFeedHistory.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic">No se han registrado raciones de engorde para hoy.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {animalFeedHistory.map((item, idAs) => {
                                  const feedName = feeds.find(f => f.id === item.feedId)?.name || 'Alimento Desconocido';
                                  return (
                                    <div key={idAs} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100 font-sans">
                                      <span className="font-medium text-slate-700">{feedName}</span>
                                      <span className="font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{item.amountKg} kg/día</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Change animal Status panel (Baja / Vendido) */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400">Estado del Animal:</span>
                            <div className="text-xs font-semibold text-slate-700 mt-0.5">En producción activa</div>
                          </div>
                          
                          <div className="flex gap-2">
                            {animal.status === 'Activo' && (
                              <>
                                <button
                                  onClick={() => onUpdateAnimalStatus(animal.id, 'Vendido')}
                                  className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-sans font-bold transition"
                                >
                                  Marcar Vendido
                                </button>
                                <button
                                  onClick={() => onRemoveAnimal(animal.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition"
                                  title="Remover / Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {animal.status !== 'Activo' && (
                              <span className="text-xs text-slate-400 italic bg-slate-50 px-3 py-1 rounded">
                                Registro de estado de salida: {animal.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
