/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SettingsManager Component.
 * Custom control center to wipe demo data, reload simulation data,
 * manage manual JSON backup imports/exports, and supervise cloud syncing.
 */

import React from 'react';
import { 
  Trash2, 
  Settings, 
  Database, 
  FileDown, 
  FileUp, 
  RefreshCw, 
  Sparkles, 
  CloudLightning,
  CheckCircle,
  LogOut,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface SettingsManagerProps {
  user: any;
  userLoading: boolean;
  animalsCount: number;
  fieldsCount: number;
  feedsCount: number;
  assignmentsCount: number;
  onClearAllData: () => Promise<void> | void;
  onResetData: () => Promise<void> | void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogin: () => void;
  onLogout: () => void;
}

export default function SettingsManager({
  user,
  userLoading,
  animalsCount,
  fieldsCount,
  feedsCount,
  assignmentsCount,
  onClearAllData,
  onResetData,
  onExportData,
  onImportData,
  onLogin,
  onLogout,
}: SettingsManagerProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Visual Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-slate-900 rounded-2xl text-white shadow-sm border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white">
            <Settings className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-sans font-bold tracking-tight">Panel de Configuración</h1>
            <p className="text-slate-400 mt-1 font-sans text-xs">
              Administración de bases de datos, borrado de demostración y sincronización con Google Firebase.
            </p>
          </div>
        </div>
        <span className="mt-2 md:mt-0 text-[10px] bg-slate-800 border border-slate-700 font-mono text-slate-350 px-3 py-1 rounded-lg">
          Datos Actuales: {animalsCount + fieldsCount + feedsCount} registros
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: Clear / Reset Data */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-600 font-sans font-bold text-sm">
              <Trash2 className="h-4.5 w-4.5 shrink-0" />
              <span>Limpieza de Datos de Simulación</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              ¿Listo para comenzar a registrar su propia hacienda real? Use esta sección para borrar por completo la demostración inicial y dejar el sistema en blanco.
            </p>
          </div>

          {/* Database metrics status */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 font-mono">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Database className="h-3 w-3" /> Estado de la Hacienda en Memoria:
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Animales registrados:</span>
              <span className="font-bold text-slate-700">{animalsCount} cabezas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lotes arrendados:</span>
              <span className="font-bold text-slate-700">{fieldsCount} lotes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tipos de alimentos:</span>
              <span className="font-bold text-slate-700">{feedsCount} raciones</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Servicios asignados hoy:</span>
              <span className="font-bold text-slate-700">{assignmentsCount} entregas</span>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 pt-2">
            {/* Clear button */}
            <button
              onClick={onClearAllData}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 cursor-pointer text-white font-sans text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Trash2 className="h-4 w-4" />
              Dejar en Cero (Vaciar Base de Datos)
            </button>

            {/* Restore / default button */}
            <button
              onClick={onResetData}
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-sans text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2"
              title="Cargar hacienda y lotes iniciales de prueba"
            >
              <RefreshCw className="h-4 w-4 text-slate-400" />
              Restaurar Datos de Demostración
            </button>
          </div>
        </div>

        {/* Card 2: Manual backup export / import */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-sans font-bold text-sm">
              <FileText className="h-4.5 w-4.5 shrink-0 text-slate-500" />
              <span>Copia de Seguridad Manual (JSON)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Descargue un respaldo completo de su hacienda en formato JSON. Podrá cargarlo en el futuro o transferirlo a cualquier otro navegador para mantener su control al día de forma autónoma.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 animate-pulse" />
            <p className="text-[10px] text-amber-900 leading-relaxed font-sans">
              <strong>Nota de Seguridad:</strong> Si trabaja de forma offline (icono gris), recuerde exportar un respaldo periódico. Al vaciar el historial de su navegador podría perder registros que aún no sincronizó con la nube.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-2">
            {/* Export click */}
            <button
              onClick={onExportData}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-white font-sans text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileDown className="h-4 w-4" />
              Exportar Copia
            </button>

            {/* Import label */}
            <label className="py-2.5 px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-sans text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center">
              <FileUp className="h-4 w-4 text-slate-400" />
              <span>Importar Respaldo</span>
              <input type="file" accept=".json" onChange={onImportData} className="hidden" />
            </label>
          </div>
        </div>

      </div>

      {/* Cloud Integration Banner */}
      <div className="bg-gradient-to-tr from-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-teal-500/10 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CloudLightning className="text-teal-400 h-5 w-5" />
              <h3 className="font-sans font-bold text-base">Sincronización Multidispositivo (Nube)</h3>
            </div>
            <p className="text-xs text-slate-350 max-w-2xl">
              Al conectar su cuenta, todos sus animales, raciones de comida y gastos de siembra se guardarán de forma encriptada en la nube para sincronizarse instantáneamente entre su móvil, tablet y PC.
            </p>
          </div>
          <div className="shrink-0">
            {userLoading ? (
              <span className="p-1 px-3 bg-teal-800/60 font-mono text-[10px] rounded-lg animate-pulse block">Validando...</span>
            ) : user ? (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 p-1 px-3.5 rounded-full text-emerald-400 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sincronización Conectada
              </span>
            ) : (
              <span className="text-xs text-rose-400 italic font-medium">Sincronización Inactiva</span>
            )}
          </div>
        </div>

        {/* User login / logout block */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs space-y-1">
            <p className="font-semibold text-slate-200">
              {user ? `Sesión Activa: ${user.displayName || user.email}` : "Trabajando en sesión local (Offline)"}
            </p>
            <p className="text-[10px] text-slate-400">
              {user 
                ? "Cada cambio que realice se guardará en su cuenta de Google en tiempo real de forma segura." 
                : "Se requiere ingresar credenciales para habilitar la transmisión satelital y el resguardo automático en internet."
              }
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-3">
            {user ? (
              <button
                onClick={onLogout}
                className="py-1.5 px-3.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 font-sans text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Desconectar Cuenta
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="py-2 px-4 bg-teal-600 hover:bg-teal-500 text-white font-sans text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Database className="h-3.5 w-3.5" />
                Registrar Cuenta con Google
              </button>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
