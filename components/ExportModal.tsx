
import React, { useState, useEffect } from 'react';
import { Message, IMRADSection, ResearchMode, ExportSelection } from '../types';
import { 
  XMarkIcon, 
  DocumentArrowDownIcon, 
  CheckCircleIcon, 
  InformationCircleIcon, 
  ClipboardDocumentListIcon,
  PlusIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { getDefaultSection } from '../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (selected: ExportSelection[]) => void;
  messages: Message[];
  topic: string;
  focusedId?: string | null;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, messages, topic, focusedId }) => {
  const modelMessages = messages.filter(m => m.role === 'model' && !m.isThinking);
  
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; section: string }>>({});
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [newSectionName, setNewSectionName] = useState('');

  const findingsSummary = modelMessages.find(m => m.mode === ResearchMode.Retreive)?.content
    .split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, 3)
    .join(' ')
    .replace(/[#*`]/g, '') || "No summary available for this topic.";

  useEffect(() => {
    if (isOpen) {
      setSelectedItems(prev => {
        const next = { ...prev };
        let changed = false;
        
        modelMessages.forEach(msg => {
          if (!next[msg.id]) {
            // If focusedId exists, only select that one. Otherwise select all new.
            const isSelected = focusedId ? msg.id === focusedId : true;
            next[msg.id] = { 
              selected: isSelected, 
              section: getDefaultSection(msg) 
            };
            changed = true;
          } else if (focusedId) {
            // If we are specifically focusing an item, update its selection
            next[msg.id] = { ...next[msg.id], selected: msg.id === focusedId };
            changed = true;
          }
        });
        
        return changed ? next : prev;
      });
    }
  }, [messages, isOpen, modelMessages, focusedId]);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    setSelectedItems(prev => {
      const item = prev[id] || { selected: false, section: IMRADSection.Uncategorized };
      return {
        ...prev,
        [id]: { ...item, selected: !item.selected }
      };
    });
  };

  const handleSectionChange = (id: string, section: string) => {
    setSelectedItems(prev => {
      const item = prev[id] || { selected: true, section: IMRADSection.Uncategorized };
      return {
        ...prev,
        [id]: { ...item, section }
      };
    });
  };

  const addCustomSection = () => {
    const trimmed = newSectionName.trim();
    if (trimmed && !customSections.includes(trimmed) && !Object.values(IMRADSection).includes(trimmed as IMRADSection)) {
      setCustomSections(prev => [...prev, trimmed]);
      setNewSectionName('');
    }
  };

  const handleExportClick = () => {
    const exportData: ExportSelection[] = modelMessages
      .filter(m => selectedItems[m.id]?.selected)
      .map(m => ({
        message: m,
        section: selectedItems[m.id]?.section || IMRADSection.Uncategorized
      }));
    onExport(exportData);
  };

  const availableSections = [...Object.values(IMRADSection), ...customSections];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
        
        <div className="flex items-center justify-between p-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Export Module Designer</h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <InformationCircleIcon className="w-3.5 h-3.5" />
                Specialized formatting for academic sections
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 bg-indigo-50/20 border-b border-slate-100 space-y-4">
            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-indigo-100 shadow-sm">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <ClipboardDocumentListIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Project Context</h3>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-indigo-700">{topic || "Research Synthesis"}</p>
                  <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-1">
                    "{findingsSummary}"
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TagIcon className="w-4 h-4 text-indigo-500" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom Headings</h4>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g., Literature Review, Technical Spec..."
                  className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && addCustomSection()}
                />
                <button 
                  onClick={addCustomSection}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Research Modules Selection</h4>
              <button 
                onClick={() => {
                  // Fix: Using modelMessages instead of Object.values(selectedItems) to avoid TS unknown type errors
                  const allSelected = modelMessages.length > 0 && modelMessages.every(m => selectedItems[m.id]?.selected === true);
                  const next = { ...selectedItems };
                  modelMessages.forEach(m => {
                    if (next[m.id]) {
                      next[m.id].selected = !allSelected;
                    }
                  });
                  setSelectedItems(next);
                }}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
              >
                {/* Fix: Using modelMessages instead of Object.values(selectedItems) to avoid TS unknown type errors */}
                {modelMessages.length > 0 && modelMessages.every(m => selectedItems[m.id]?.selected === true) ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {modelMessages.map((msg) => {
              const itemState = selectedItems[msg.id] || { selected: false, section: IMRADSection.Uncategorized };
              const isFocused = msg.id === focusedId;
              const hasTable = msg.content.includes('|');
              const hasMermaid = msg.content.includes('mermaid');

              return (
                <div 
                  key={msg.id} 
                  className={`group relative flex gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer
                    ${itemState.selected 
                      ? 'border-indigo-600 bg-indigo-50/30 shadow-md ring-4 ring-indigo-50' 
                      : 'border-slate-100 bg-white hover:border-slate-200'}
                    ${isFocused ? 'ring-2 ring-indigo-400' : ''}`}
                  onClick={() => handleToggle(msg.id)}
                >
                  <div className={`mt-1 flex-none w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                    ${itemState.selected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                    {itemState.selected && <CheckCircleIcon className="w-5 h-5 text-white" />}
                  </div>

                  <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {msg.mode?.replace('_', ' ') || 'General Analysis'}
                        </span>
                        {hasTable && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Table Detected</span>}
                        {hasMermaid && <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Diagram Detected</span>}
                      </div>
                      
                      <select 
                        disabled={!itemState.selected}
                        value={itemState.section}
                        onChange={(e) => handleSectionChange(msg.id, e.target.value)}
                        className="text-xs font-black py-1.5 px-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm disabled:opacity-50 appearance-none pr-8 relative"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                      >
                        {availableSections.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                      {msg.content.replace(/[#*`]/g, '').substring(0, 160)}...
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-200">
          <button 
            disabled={modelMessages.filter(m => selectedItems[m.id]?.selected).length === 0}
            onClick={handleExportClick}
            className="w-full group flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-indigo-200 transition-all disabled:opacity-40 disabled:grayscale transform active:scale-[0.98]"
          >
            <DocumentArrowDownIcon className="w-6 h-6 group-hover:animate-bounce" />
            Download Professional Academic Manuscript (.docx)
          </button>
          <div className="mt-4 flex items-center justify-center gap-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              IMRAD Compliant
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              High-Precision Formatting
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
