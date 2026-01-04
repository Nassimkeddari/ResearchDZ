
import React, { useEffect, useRef } from 'react';

interface MermaidRendererProps {
  chart: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && chart) {
      const container = containerRef.current;
      container.innerHTML = `<pre class="mermaid">${chart}</pre>`;
      
      // Initialize mermaid and render
      try {
        // @ts-ignore
        if (window.mermaid) {
          // @ts-ignore
          window.mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
          // @ts-ignore
          window.mermaid.contentLoaded();
        }
      } catch (e) {
        console.error("Mermaid rendering error", e);
      }
    }
  }, [chart]);

  return <div ref={containerRef} className="my-4 overflow-x-auto" />;
};

export default MermaidRenderer;
