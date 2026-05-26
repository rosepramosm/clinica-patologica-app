
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingLeft: 60,
    paddingRight: 60,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },
  logo: {
    width: 450, // Aumentado para que ocupe casi todo el ancho de la página
    height: 'auto',
    marginBottom: 30,
    alignSelf: 'center'
  },
  section: {
    marginBottom: 8,
  },
  textNormal: {
    fontSize: 11,
    color: '#000000',
    lineHeight: 1.5,
  },
  textBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Helvetica-Bold'
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#000000',
    textAlign: 'justify'
  },
  spacer: {
    marginBottom: 15
  },
  signatureContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  signatureLine: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginBottom: 5,
  }
});

interface ResultPDFProps {
  patient: any;
  formData: any;
}

const ResultPDF = ({ patient, formData }: ResultPDFProps) => {
  // Fecha formateada DD/MM/YYYY
  const date = new Date().toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* LOGO */}
        <Image src="/logo1.png" style={styles.logo} />

        {/* HEADER INFO (Usando Text anidados para que no se superpongan ni rompan el layout) */}
        <View style={[styles.section, { textAlign: 'center', marginBottom: 15 }]}>
          <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold' }}>
            BIOPSIA N°: {patient.sample_code}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.textNormal}>
            <Text style={styles.textBold}>NOMBRE: </Text>
            {patient.patient_name}    <Text style={styles.textBold}>PROCEDENCIA: </Text>
            {formData.origin || '---'}    <Text style={styles.textBold}>FECHA: </Text>
            {date}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.textNormal}>
            <Text style={styles.textBold}>C.I: </Text>
            {patient.patient_id_card || '---'}    <Text style={styles.textBold}>EDAD: </Text>
            {formData.age || '---'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.textNormal}>
            <Text style={styles.textBold}>DR(a): </Text>
            {formData.referring_doctor || '---'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.textNormal}>
            <Text style={styles.textBold}>MUESTRA DE: </Text>
            {formData.sample_origin || '---'}
          </Text>
        </View>
        
        <View style={styles.spacer}></View>

        {/* CLINICAL DATA */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            <Text style={styles.textBold}>RESUMEN CLÍNICO: </Text>
            {formData.clinical_summary ? formData.clinical_summary.split('\n')[0] : 'No se proporcionan datos clínicos.'}
          </Text>
          {formData.clinical_summary && formData.clinical_summary.split('\n').slice(1).map((line: string, i: number) => (
            <Text key={i} style={styles.paragraph}>{line}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.paragraph}>
            <Text style={styles.textBold}>DIAGNÓSTICO CLÍNICO: </Text>
            {formData.clinical_diagnosis || 'No proporcionado.'}
          </Text>
        </View>
        
        <View style={styles.spacer}></View>

        {/* MACROSCOPIC */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            <Text style={styles.textBold}>DIAGNÓSTICO MACROSCÓPICO: </Text>
            {formData.macroscopic_diagnosis ? formData.macroscopic_diagnosis.split('\n')[0] : ''}
          </Text>
          {formData.macroscopic_diagnosis && formData.macroscopic_diagnosis.split('\n').slice(1).map((line: string, i: number) => (
            <Text key={i} style={styles.paragraph}>{line}</Text>
          ))}
        </View>
        
        <View style={styles.spacer}></View>

        {/* MICROSCOPIC */}
        <View style={styles.section}>
          <Text style={styles.textBold}>DIAGNÓSTICO MICROSCÓPICO</Text>
          <View style={{ marginTop: 5 }}>
            {formData.microscopic_diagnosis ? formData.microscopic_diagnosis.split('\n').map((line: string, i: number) => (
              <Text key={i} style={styles.paragraph}>{line}</Text>
            )) : <Text style={styles.paragraph}> </Text>}
          </View>
        </View>

        {/* SIGNATURE */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureLine}></View>
          <Text style={styles.textBold}>Dr. Audin Ramos</Text>
          <Text style={styles.textNormal}>Médico patólogo</Text>
        </View>

      </Page>
    </Document>
  );
};

export default ResultPDF;
