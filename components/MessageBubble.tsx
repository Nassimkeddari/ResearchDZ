
import React from 'react';
import { Message } from '../types';
import { 
  UserIcon, 
  AcademicCapIcon, 
  LinkIcon, 
  ArrowTopRightOnSquareIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import MermaidRenderer from './MermaidRenderer';
import ChartRenderer from './ChartRenderer';

interface MessageBubbleProps {
  message: Message;
  onQuickExport?: (msg: Message) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onQuickExport }) => {
  const isModel = message.role === 'model';

  const renderContent = () => {
    if (message.isThinking) {
      return (
        <div className="flex items-center space-x-2 text-slate-400">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
          <span className="text-sm font-medium ml-2 italic">Synthesizing research data...</span>
        </div>
      );
    }

    // Split by both Mermaid and Chart blocks
    const segments = message.content.split(/(```mermaid[\s\S]*?```|```json-chart[\s\S]*?```)/);
    
    return segments.map((segment, index) => {
      if (segment.startsWith('```mermaid')) {
        const chart = segment.replace('```mermaid', '').replace('```', '').trim();
        return <MermaidRenderer key={index} chart={chart} />;
      }
      
      if (segment.startsWith('```json-chart')) {
        const config = segment.replace('```json-chart', '').replace('```', '').trim();
        return <ChartRenderer key={index} config={config} />;
      }
      
      return (
        <div key={index} className="prose prose-slate max-w-none prose-sm md:prose-base whitespace-pre-wrap">
          {segment.split('\n').map((line, i) => {
             if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
               return <li key={i} className="ml-4 list-disc mb-1">{line.trim().substring(2)}</li>;
             }
             if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
               return <div key={i} className="font-mono text-[10px] md:text-xs bg-slate-50 border-x border-slate-200 px-2 py-0.5">{line}</div>;
             }
             const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
             return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
          })}
        </div>
      );
    });
  };

  return (
    <div className={`flex gap-4 mb-6 animate-fade-in ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className={`flex-none w-10 h-10 rounded-xl flex items-center justify-center shadow-md
        ${isModel ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
        {isModel ? <AcademicCapIcon className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
      </div>
      
      <div className={`flex-1 max-w-[85%] space-y-3 ${!isModel ? 'text-right' : ''}`}>
        <div className={`relative group inline-block p-4 rounded-2xl shadow-sm text-left
          ${isModel ? 'bg-white border border-slate-200' : 'bg-indigo-600 text-white'}`}>
          
          {isModel && onQuickExport && (
            <button 
              onClick={() => onQuickExport(message)}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100 shadow-sm z-10"
              title="Export this module"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
            </button>
          )}

          {renderContent()}
        </div>

        {isModel && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {message.sources.map((source, idx) => (
              <a 
                key={idx}
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-medium transition-colors border border-slate-200"
              >
                <LinkIcon className="w-3 h-3" />
                Article Source {idx + 1}
                <ArrowTopRightOnSquareIcon className="w-3 h-3 opacity-50" />
              </a>
            ))}
          </div>
        )}

        <div className={`flex items-center gap-2 text-[10px] text-slate-400 font-medium ${!isModel ? 'justify-end mr-1' : 'ml-1'}`}>
          {isModel && message.mode && (
            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter font-bold">
              {message.mode.replace('_', ' ')}
            </span>
          )}
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
