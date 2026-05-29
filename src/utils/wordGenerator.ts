import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

const parseHtmlToParagraphs = (html: string) => {
  if (!html) return [new Paragraph({ children: [new TextRun('')] })];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const paragraphs: Paragraph[] = [];
  
  const extractRuns = (node: Node, options: any): TextRun[] => {
    let runs: TextRun[] = [];
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) {
        runs.push(new TextRun({
          text: node.textContent,
          bold: options.bold,
          italics: options.italics,
          underline: options.underline ? {} : undefined,
          size: options.size || 22, // 11pt default
        }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const newOptions = { ...options };
      if (el.tagName === 'B' || el.tagName === 'STRONG') newOptions.bold = true;
      if (el.tagName === 'I' || el.tagName === 'EM') newOptions.italics = true;
      if (el.tagName === 'U') newOptions.underline = true;
      
      if (el.classList.contains('ql-size-small')) newOptions.size = 16;
      if (el.classList.contains('ql-size-large')) newOptions.size = 32;
      if (el.classList.contains('ql-size-huge')) newOptions.size = 48;
      
      if (el.tagName === 'BR') {
        runs.push(new TextRun({ break: 1 }));
      }
      
      el.childNodes.forEach(child => {
        runs = runs.concat(extractRuns(child, newOptions));
      });
    }
    return runs;
  };

  const processBlockElement = (el: HTMLElement) => {
    const runs = extractRuns(el, {});
    
    // Determine indentation: 1 tab unit in docx is about 360 dxa
    let indent: any = undefined;
    for (let i = 1; i <= 8; i++) {
      if (el.classList.contains(`ql-indent-${i}`)) {
        indent = { left: i * 360 };
        break;
      }
    }
    
    if (el.tagName === 'LI') {
      runs.unshift(new TextRun({ text: "•  ", bold: true }));
      if (!indent) {
        indent = { left: 360 };
      }
    }
    
    paragraphs.push(new Paragraph({
      children: runs.length > 0 ? runs : [new TextRun('')],
      alignment: AlignmentType.JUSTIFIED,
      indent: indent,
      spacing: { after: 80 },
    }));
  };

  let inlineGroup: Node[] = [];
  
  const flushInlineGroup = () => {
    if (inlineGroup.length === 0) return;
    let runs: TextRun[] = [];
    inlineGroup.forEach(node => {
      runs = runs.concat(extractRuns(node, {}));
    });
    paragraphs.push(new Paragraph({
      children: runs.length > 0 ? runs : [new TextRun('')],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 80 },
    }));
    inlineGroup = [];
  };

  doc.body.childNodes.forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const isBlock = ['P', 'LI', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL'].includes(el.tagName);
      if (isBlock) {
        flushInlineGroup();
        if (el.tagName === 'UL' || el.tagName === 'OL') {
          el.childNodes.forEach(li => {
            if (li.nodeType === Node.ELEMENT_NODE && (li as HTMLElement).tagName === 'LI') {
              processBlockElement(li as HTMLElement);
            }
          });
        } else {
          processBlockElement(el);
        }
      } else {
        inlineGroup.push(child);
      }
    } else {
      inlineGroup.push(child);
    }
  });
  
  flushInlineGroup();
  
  return paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [new TextRun('')] })];
};

export const generateWordDocument = async (patient: any, formData: any) => {
  const date = new Date().toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  let logoImageRun = null;
  try {
    const response = await fetch('/logo1.png');
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    logoImageRun = new ImageRun({
      data: arrayBuffer,
      transformation: {
        width: 450,
        height: 103,
      },
      type: "png"
    });
  } catch (error) {
    console.warn("Could not load logo for Word document:", error);
  }

  const docChildren: any[] = [];
  
  if (logoImageRun) {
    docChildren.push(
      new Paragraph({
        children: [logoImageRun],
        alignment: AlignmentType.CENTER,
        spacing: { after: 150 },
      })
    );
  }

  docChildren.push(
    new Paragraph({
      text: `BIOPSIA N°: ${patient?.sample_code || '---'}`,
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "NOMBRE: ", bold: true }),
        new TextRun({ text: `${patient?.patient_name || '---'}    ` }),
        new TextRun({ text: "PROCEDENCIA: ", bold: true }),
        new TextRun({ text: `${formData?.origin || '---'}    ` }),
        new TextRun({ text: "FECHA: ", bold: true }),
        new TextRun({ text: date }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "C.I: ", bold: true }),
        new TextRun({ text: `${patient?.patient_id_card || '---'}    ` }),
        new TextRun({ text: "EDAD: ", bold: true }),
        new TextRun({ text: `${formData?.age || '---'}` }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "DR(a): ", bold: true }),
        new TextRun({ text: `${formData?.referring_doctor || '---'}` }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "MUESTRA DE: ", bold: true }),
        new TextRun({ text: `${formData?.sample_origin || '---'}` }),
      ],
      spacing: { after: 150 },
    }),
    
    // CLINICAL DATA
    new Paragraph({
      children: [
        new TextRun({ text: "RESUMEN CLÍNICO: ", bold: true })
      ],
      spacing: { before: 80, after: 40 },
    }),
    ...parseHtmlToParagraphs(formData?.clinical_summary || 'No se proporcionan datos clínicos.'),
    
    new Paragraph({
      children: [
        new TextRun({ text: "DIAGNÓSTICO CLÍNICO: ", bold: true }),
        new TextRun({ text: formData?.clinical_diagnosis || 'No proporcionado.' }),
      ],
      spacing: { before: 80, after: 150 },
      alignment: AlignmentType.JUSTIFIED,
    }),

    // MACROSCOPIC
    new Paragraph({
      children: [
        new TextRun({ text: "DIAGNÓSTICO MACROSCÓPICO: ", bold: true })
      ],
      spacing: { before: 80, after: 40 },
    }),
    ...parseHtmlToParagraphs(formData?.macroscopic_diagnosis || ''),

    // MICROSCOPIC
    new Paragraph({
      children: [
        new TextRun({ text: "DIAGNÓSTICO MICROSCÓPICO", bold: true }),
      ],
      spacing: { before: 80, after: 40 },
    }),
    ...parseHtmlToParagraphs(formData?.microscopic_diagnosis || ''),

    // SIGNATURE
    new Paragraph({
      children: [
        new TextRun({ text: "_________________________ " }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Dr. Audin Ramos", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Médico patólogo" }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );

  const doc = new Document({
    creator: "Clínica Patológica App",
    title: `Resultado Biopsia ${patient?.sample_code}`,
    description: "Resultado de Biopsia Generado por el Sistema",
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22, // 11pt
          },
          paragraph: {
            spacing: {
              line: 240, // 1.0 line spacing
              after: 80,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const docBlob = await Packer.toBlob(doc);
  const fileName = `Resultado_${patient?.sample_code}_${patient?.patient_name.replace(/\s+/g, '_')}.docx`;
  saveAs(docBlob, fileName);
};
