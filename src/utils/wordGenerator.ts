import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export const generateWordDocument = async (patient: any, formData: any) => {
  const date = patient?.created_at ? new Date(patient.created_at).toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }) : new Date().toLocaleDateString('es-VE');

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
        children: [
          // Logo placeholder or skip since images in docx are complex to load from local file in browser easily without converting to base64. 
          // We can just put a header or leave space. Let's just put a bold header for now.
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
              new TextRun({ text: formData?.clinical_summary || 'No se proporcionan datos clínicos.' }),
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
              new TextRun({ text: formData?.macroscopic_diagnosis || '' }),
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
              new TextRun({ text: formData?.microscopic_diagnosis || '' }),
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
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Resultado_${patient?.sample_code}_${patient?.patient_name.replace(/\s+/g, '_')}.docx`;
  saveAs(blob, fileName);
};
