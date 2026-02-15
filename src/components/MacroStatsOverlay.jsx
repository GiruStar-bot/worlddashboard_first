import React, { useState, useEffect } from 'react';
import { X, Zap, Pickaxe, Cpu, DollarSign, ChevronRight } from 'lucide-react';

import macroData from '../data/macro_stats_master.json';

import EnergyMixChart from './macro/EnergyMixChart';
import HydrogenGrowthChart from './macro/HydrogenGrowthChart';
import CriticalMineralsChart from './macro/CriticalMineralsChart';
import FoodSecurityRadar from './macro/FoodSecurityRadar';
import UnicornDensityChart from './macro/UnicornDensityChart';
import RDInvestmentChart from './macro/RDInvestmentChart';
import FDIFlowChart from './macro/FDIFlowChart';

const CATEGORIES = [
  {
    id: 'energy',
    label: 'Energy Transition',
    shortLabel: 'Energy',
    icon: Zap,
    gradient: 'from-cyan-500 to-blue-500',
    accentColor: '#06b6d4',
  },
  {
    id: 'resources',
    label: 'Strategic Resources',
    shortLabel: 'Resources',
    icon: Pickaxe,
    gradient: 'from-amber-500 to-yellow-500',
    accentColor: '#f59e0b',
  },
  {
    id: 'innovation',
    label: 'Innovation & Tech',
    shortLabel: 'Innovation',
    icon: Cpu,
    gradient: 'from-emerald-500 to-lime-500',
    accentColor: '#10b981',
  },
  {
    id: 'capital',
    label: 'Global Capital Flow',
    shortLabel: 'Capital',
    icon: DollarSign,
    gradient: 'from-rose-500 to-orange-500',
    accentColor: '#f43f5e',
  },
];

const SECTION_DESCRIPTIONS = {
  energy: 'Tracking the global shift from fossil fuels to clean energy sources. Monitoring the speed and scale of the energy transition.',
  resources: 'Mapping monopoly risks in critical supply chains. Identifying concentration risks in minerals and food security.',
  innovation: 'Tracking the rise of non-Western tech hubs and R&D investment intensity across major economies.',
  capital: 'Following global investment flows. Analyzing FDI patterns between the Global North and Global South.',
};

export default function MacroStatsOverlay({ isOpen, onClose }) {
  const [activeCategory, setActiveCategory] = useState('energy');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  const renderContent = () => {
    switch (activeCategory) {
      case 'energy':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <EnergyMixChart data={macroData.energy_transition.global_energy_mix} />
            <HydrogenGrowthChart data={macroData.energy_transition.clean_hydrogen} />
          </div>
        );
      case 'resources':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <CriticalMineralsChart data={macroData.strategic_resources.critical_minerals} />
            <FoodSecurityRadar data={macroData.strategic_resources.food_security} />
          </div>
        );
      case 'innovation':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <UnicornDensityChart data={macroData.innovation_tech.unicorn_density} />
            <RDInvestmentChart data={macroData.innovation_tech.rd_investment} />
          </div>
        );
      case 'capital':
        return (
          <div className="grid grid-cols-1 gap-5">
            <FDIFlowChart data={macroData.global_capital_flow.fdi_flows} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[1000] flex transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-sm" onClick={onClose} />

      {/* Main Container */}
      <div
        className={`relative flex w-full h-full transition-transform duration-500 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-4'
        }`}
      >
        {/* Sidebar */}
        <nav className="relative w-[72px] lg:w-[220px] flex-shrink-0 border-r border-white/[0.06] bg-[#0f172a]/80 backdrop-blur-xl flex flex-col">
          {/* Logo area */}
          <div className="h-14 flex items-center px-4 border-b border-white/[0.06]">
            <span className="hidden lg:block text-xs font-semibold text-slate-300 font-['Inter'] tracking-widest uppercase">
              Macro Analytics
            </span>
            <span className="lg:hidden text-xs font-bold text-slate-300 font-['Inter'] mx-auto">MA</span>
          </div>

          {/* Nav items */}
          <div className="flex-1 py-3 flex flex-col gap-1 px-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-white/[0.06]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Active indicator - glowing left border */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                      style={{
                        backgroundColor: cat.accentColor,
                        boxShadow: `0 0 8px ${cat.accentColor}60, 0 0 16px ${cat.accentColor}30`,
                      }}
                    />
                  )}
                  <Icon
                    size={18}
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                    style={isActive ? { color: cat.accentColor } : undefined}
                  />
                  <span
                    className={`hidden lg:block text-[12px] font-['Inter'] transition-colors ${
                      isActive ? 'text-slate-100 font-medium' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Source badge */}
          <div className="px-3 py-3 border-t border-white/[0.06]">
            <p className="hidden lg:block text-[9px] text-slate-600 font-['Inter'] leading-relaxed">
              Data: IMF, IEA, USGS, WIPO
              <br />
              Updated: {macroData.metadata.updated}
            </p>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#0f172a]/60 backdrop-blur-xl">
          {/* Header */}
          <header className="sticky top-0 z-10 h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${activeCat.gradient}`} />
              <h1 className="text-sm font-semibold text-slate-100 font-['Inter']">
                {activeCat.label}
              </h1>
              <ChevronRight size={12} className="text-slate-600" />
              <p className="text-[11px] text-slate-500 font-['Inter'] max-w-lg truncate hidden sm:block">
                {SECTION_DESCRIPTIONS[activeCategory]}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-colors group"
            >
              <X size={14} className="text-slate-500 group-hover:text-slate-300" />
            </button>
          </header>

          {/* Content area */}
          <div className="p-5 lg:p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
