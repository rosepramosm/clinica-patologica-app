import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

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
        ...(formData?.clinical_summary || 'No se proporcionan datos clínicos.')
          .split('\n')
          .map((line: string, index: number) => {
            const formattedLine = line.replace(/\t/g, '\u00A0\u00A0\u00A0\u00A0').replace(/^ +/, m => '\u00A0'.repeat(m.length)).replace(/  +/g, m => '\u00A0'.repeat(m.length));
            return new TextRun({ text: formattedLine, break: index > 0 ? 1 : 0 });
          }),
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
        ...(formData?.macroscopic_diagnosis || '')
          .split('\n')
          .map((line: string, index: number) => {
            const formattedLine = line.replace(/\t/g, '\u00A0\u00A0\u00A0\u00A0').replace(/^ +/, m => '\u00A0'.repeat(m.length)).replace(/  +/g, m => '\u00A0'.repeat(m.length));
            return new TextRun({ text: formattedLine, break: index > 0 ? 1 : 0 });
          }),
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
        ...(formData?.microscopic_diagnosis || '')
          .split('\n')
          .map((line: string, index: number) => {
            const formattedLine = line.replace(/\t/g, '\u00A0\u00A0\u00A0\u00A0').replace(/^ +/, m => '\u00A0'.repeat(m.length)).replace(/  +/g, m => '\u00A0'.repeat(m.length));
            return new TextRun({ text: formattedLine, break: index > 0 ? 1 : 0 });
          }),
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
