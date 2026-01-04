
// Fix: Import React to resolve the 'React' namespace for React.ReactNode
import React from 'react';

export enum ResearchMode {
  Retreive = 'retreive',
  Methodology = 'methodology',
  Framework = 'framework',
  DesignMap = 'design_map',
  Bibliometric = 'bibliometric',
  Gaps = 'gaps'
}

export enum IMRADSection {
  Introduction = 'Introduction',
  Methods = 'Methods',
  Results = 'Results',
  Discussion = 'Discussion',
  Conclusion = 'Conclusion',
  Uncategorized = 'Uncategorized'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  sources?: string[];
  mode?: ResearchMode;
}

export interface QuickAction {
  label: string;
  mode: ResearchMode;
  prompt: string;
  icon: React.ReactNode;
}

export interface GeminiResponse {
  text: string;
  sources?: string[];
}

export interface ExportSelection {
  message: Message;
  section: string; // Changed from IMRADSection to string to support custom sections
}
