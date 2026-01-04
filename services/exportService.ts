
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  PageNumber, 
  Header, 
  Footer,
  VerticalAlign,
  ShadingType
} from "docx";
import { Message, IMRADSection, ResearchMode, ExportSelection } from "../types";

/**
 * Maps ResearchMode enum values to standard IMRAD sections.
 * Used for organizing exported content in the Word document.
 */
export const mapModeToSection = (mode?: ResearchMode): string => {
  if (!mode) return IMRADSection.Uncategorized;
  
  const mapping: Record<ResearchMode, string> = {
    [ResearchMode.Retreive]: IMRADSection.Introduction,
    [ResearchMode.Methodology]: IMRADSection.Methods,
    [ResearchMode.DesignMap]: IMRADSection.Results,
    [ResearchMode.Bibliometric]: IMRADSection.Results,
    [ResearchMode.Framework]: IMRADSection.Discussion,
    [ResearchMode.Gaps]: IMRADSection.Discussion,
  };
  
  return mapping[mode] || IMRADSection.Uncategorized;
};

export const getDefaultSection = (message: Message): string => {
  return mapModeToSection(message.mode);
};

const parseTextRuns = (text: string, isCode: boolean): TextRun[] => {
  if (isCode) {
    return [new TextRun({ 
      text, 
      font: "Consolas", 
      size: 18, 
      color: "2D3748",
      italics: true 
    })];
  }

  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map(part => {
    const isBold = part.startsWith("**") && part.endsWith("**");
    const content = isBold ? part.slice(2, -2) : part;
    return new TextRun({
      text: content,
      bold: isBold,
      font: "Calibri",
      size: 22
    });
  });
};

const createTableFromMarkdown = (rows: string[]): Table => {
  const tableRows = rows.map((row, index) => {
    const cells = row.split('|').filter(cell => cell.trim() !== '' || (row.startsWith('|') && cell !== ""));
    const isHeader = index === 0;

    return new TableRow({
      children: cells.map(cell => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: cell.trim(), bold: isHeader, size: 20 })],
          alignment: AlignmentType.CENTER
        })],
        shading: isHeader ? { fill: "F8FAFC", type: ShadingType.CLEAR } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        }
      }))
    });
  });

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    spacing: { before: 200, after: 200 }
  });
};

export const exportToWord = async (
  topic: string,
  abstract: string,
  selectedMessages: ExportSelection[]
) => {
  const standardSections = [
    IMRADSection.Introduction,
    IMRADSection.Methods,
    IMRADSection.Results,
    IMRADSection.Discussion,
    IMRADSection.Conclusion,
  ];

  const grouped: Record<string, Message[]> = {};
  const allSources = new Set<string>();

  selectedMessages.forEach(({ message, section }) => {
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(message);
    message.sources?.forEach(s => allSources.add(s));
  });

  const allUsedSections = Object.keys(grouped);
  const customSections = allUsedSections.filter(s => 
    !standardSections.includes(s as IMRADSection) && s !== IMRADSection.Uncategorized
  );

  const finalOrder = [
    ...standardSections.filter(s => grouped[s]),
    ...customSections,
    ...(grouped[IMRADSection.Uncategorized] ? [IMRADSection.Uncategorized] : [])
  ];

  const docChildren: any[] = [
    new Paragraph({
      text: "ScholarSync Academic Analysis Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: topic.toUpperCase(), bold: true, size: 32, color: "1E293B" }),
        new TextRun({ text: `\nSubject Area: Systemic Review & Academic Synthesis`, size: 16, color: "64748B", italics: true }),
      ],
      spacing: { after: 800 }
    }),
  ];

  if (abstract) {
    docChildren.push(
      new Paragraph({
        text: "EXECUTIVE SUMMARY",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 }
      }),
      new Paragraph({
        children: [new TextRun({ text: abstract, italics: true, size: 22 })],
        alignment: AlignmentType.JUSTIFY,
        spacing: { after: 600 }
      })
    );
  }

  finalOrder.forEach(sectionName => {
    const sectionMessages = grouped[sectionName];
    if (sectionMessages && sectionMessages.length > 0) {
      docChildren.push(
        new Paragraph({
          text: sectionName.toUpperCase(),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 600, after: 300 },
          border: {
            bottom: { color: "1E293B", space: 1, style: BorderStyle.SINGLE, size: 12 }
          }
        })
      );

      sectionMessages.forEach(msg => {
        const segments = msg.content.split(/```/);
        segments.forEach((segment, idx) => {
          const isCode = idx % 2 === 1;
          const cleanSegment = segment.trim();
          
          if (cleanSegment) {
            if (isCode) {
              // Special formatting for Mermaid/Code blocks
              const isMermaid = cleanSegment.startsWith('mermaid');
              const codeText = isMermaid ? cleanSegment.replace('mermaid\n', '') : cleanSegment;
              
              docChildren.push(
                new Paragraph({
                  children: [new TextRun({ text: isMermaid ? "Visual Model Specification:" : "Source Code/Data:", bold: true, size: 18 })],
                  spacing: { before: 200 }
                }),
                new Table({
                  rows: [new TableRow({
                    children: [new TableCell({
                      children: [new Paragraph({ children: parseTextRuns(codeText, true) })],
                      shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
                      margins: { top: 200, bottom: 200, left: 200, right: 200 },
                      borders: {
                        top: { style: BorderStyle.DASH_DOT_STROKED, size: 2, color: "CBD5E1" },
                        bottom: { style: BorderStyle.DASH_DOT_STROKED, size: 2, color: "CBD5E1" },
                        left: { style: BorderStyle.DASH_DOT_STROKED, size: 2, color: "CBD5E1" },
                        right: { style: BorderStyle.DASH_DOT_STROKED, size: 2, color: "CBD5E1" },
                      }
                    })]
                  })],
                  width: { size: 100, type: WidthType.PERCENTAGE }
                })
              );
            } else {
              const lines = cleanSegment.split('\n');
              let tableBuffer: string[] = [];
              
              lines.forEach((line, lIdx) => {
                const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
                const isTableDivider = line.trim().match(/^\|[:\s-]+\|/);

                if (isTableRow && !isTableDivider) {
                  tableBuffer.push(line);
                  const nextLine = lines[lIdx + 1];
                  if (!nextLine || !(nextLine.trim().startsWith('|') && nextLine.trim().endsWith('|'))) {
                    docChildren.push(createTableFromMarkdown(tableBuffer));
                    tableBuffer = [];
                  }
                } else if (isTableDivider) {
                  // Skip
                } else {
                  const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
                  const textContent = isBullet ? line.trim().substring(2) : line;

                  // Handle sub-headings for Methodology/Frameworks if line starts with # or is bold-only
                  const isHeading = line.trim().startsWith('###') || (line.trim().startsWith('**') && line.trim().endsWith('**') && line.length < 100);

                  docChildren.push(
                    new Paragraph({
                      children: parseTextRuns(textContent, false),
                      heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
                      spacing: { before: isHeading ? 300 : 0, after: 120 },
                      bullet: isBullet ? { level: 0 } : undefined,
                    })
                  );
                }
              });
            }
          }
        });
      });
    }
  });

  if (allSources.size > 0) {
    docChildren.push(
      new Paragraph({
        text: "CITED REFERENCES",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 800, after: 300 }
      })
    );

    Array.from(allSources).forEach((source, idx) => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${idx + 1}] `, bold: true, size: 20 }),
            new TextRun({ text: source, size: 18, color: "2563EB", underline: {} })
          ],
          spacing: { after: 120 },
          indent: { left: 360, hanging: 360 }
        })
      );
    });
  }

  const doc = new Document({
    sections: [{
      headers: {
        default: new Header({
          children: [new Paragraph({ 
            children: [new TextRun({ text: `ScholarSync | ${topic} | Confidential Research Analysis`, size: 14, color: "94A3B8" })],
            alignment: AlignmentType.RIGHT
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Analysis Generated on ${new Date().toLocaleDateString()} | Page `, size: 14, color: "94A3B8" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "94A3B8" }),
              new TextRun({ text: " of ", size: 14, color: "94A3B8" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "94A3B8" }),
            ]
          })]
        })
      },
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins
        }
      },
      children: docChildren
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ScholarSync_Analysis_${topic.replace(/\s+/g, '_')}.docx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
