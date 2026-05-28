import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

const parseHtmlToTextRuns = (html: string) => {
  if (!html) return [new TextRun({ text: '' })];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const textRuns: TextRun[] = [];
  
  let lastWasBreak = true;
  
  const processNode = (node: Node, options: any) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent && node.textContent !== '') {
        textRuns.push(new TextRun({
          text: node.textContent,
          bold: options.bold,
          italics: options.italics,
          underline: options.underline ? {} : undefined,
          size: options.size, // size in half-points
        }));
        lastWasBreak = false;
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
      
      if (el.tagName === 'P' || el.tagName === 'LI') {
        if (textRuns.length > 0 && !lastWasBreak) {
          textRuns.push(new TextRun({ break: 1 }));
          lastWasBreak = true;
        }
        if (el.tagName === 'LI') {
           textRuns.push(new TextRun({ text: "• " }));
           lastWasBreak = false;
        }
      }
      
      if (el.tagName === 'BR') {
        textRuns.push(new TextRun({ break: 1 }));
        lastWasBreak = true;
      }
      
      el.childNodes.forEach(child => processNode(child, newOptions));
    }
  };
  
  doc.body.childNodes.forEach(child => processNode(child, {}));
  return textRuns.length > 0 ? textRuns : [new TextRun({ text: ' ' })];
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
        spacing: { after: 400 },
      })
    );
  }

  docChildren.push(
    new Paragraph({
      text: `BIOPSIA N°: ${patient?.sample_code || '---'}`,
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
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
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "C.I: ", bold: true }),
        new TextRun({ text: `${patient?.patient_id_card || '---'}    ` }),
        new TextRun({ text: "EDAD: ", bold: true }),
        new TextRun({ text: `${formData?.age || '---'}` }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "DR(a): ", bold: true }),
        new TextRun({ text: `${formData?.referring_doctor || '---'}` }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "MUESTRA DE: ", bold: true }),
        new TextRun({ text: `${formData?.sample_origin || '---'}` }),
      ],
      spacing: { after: 400 },
    }),
    
    // CLINICAL DATA
    new Paragraph({
      children: [
        new TextRun({ text: "RESUMEN CLÍNICO: ", bold: true }),
        new TextRun({ break: 1 }),
        ...parseHtmlToTextRuns(formData?.clinical_summary || 'No se proporcionan datos clínicos.')
      ],
      spacing: { after: 200 },
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "DIAGNÓSTICO CLÍNICO: ", bold: true }),
        new TextRun({ text: formData?.clinical_diagnosis || 'No proporcionado.' }),
      ],
      spacing: { after: 400 },
      alignment: AlignmentType.JUSTIFIED,
    }),

    // MACROSCOPIC
    new Paragraph({
      children: [
        new TextRun({ text: "DIAGNÓSTICO MACROSCÓPICO: ", bold: true }),
        new TextRun({ break: 1 }),
        ...parseHtmlToTextRuns(formData?.macroscopic_diagnosis || '')
      ],
      spacing: { after: 400 },
      alignment: AlignmentType.JUSTIFIED,
    }),

    // MICROSCOPIC
    new Paragraph({
      children: [
        new TextRun({ text: "DIAGNÓSTICO MICROSCÓPICO", bold: true }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        ...parseHtmlToTextRuns(formData?.microscopic_diagnosis || '')
      ],
      spacing: { after: 600 },
      alignment: AlignmentType.JUSTIFIED,
    }),

    // SIGNATURE
    new Paragraph({
      children: [
        new TextRun({ text: "_________________________ " }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Dr. Audin Ramos", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
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
