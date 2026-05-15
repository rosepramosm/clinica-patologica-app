import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, FileText, Download, CheckCircle2, Save, Users } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ResultPDF from '../components/ResultPDF';

const DoctorDashboard = () => {
  const [searchCode, setSearchCode] = useState('');
  const [patientList, setPatientList] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [errorSearch, setErrorSearch] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    age: '',
    origin: '',
    referring_doctor: '',
    sample_origin: '',
    clinical_summary: '',
    clinical_diagnosis: '',
    macroscopic_diagnosis: '',
    microscopic_diagnosis: ''
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSearch(true);
    setErrorSearch('');
    setPatientList([]);
    setSelectedPatient(null);

    try {
      // Buscar por cédula
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_id_card', searchCode)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) throw new Error('No se encontraron pacientes con esa cédula.');

      setPatientList(data);
      
      // Si solo hay uno, seleccionarlo automáticamente
      if (data.length === 1) {
        selectPatient(data[0]);
      }
    } catch (err: any) {
      setErrorSearch(err.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  const selectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setSaveSuccess(false);
    // Cargar los datos existentes o dejarlos en blanco
    setFormData({
      age: patient.age || '',
      origin: patient.origin || '',
      referring_doctor: patient.referring_doctor || '',
      sample_origin: patient.sample_origin || '',
      clinical_summary: patient.clinical_summary || '',
      clinical_diagnosis: patient.clinical_diagnosis || '',
      macroscopic_diagnosis: patient.macroscopic_diagnosis || '',
      microscopic_diagnosis: patient.microscopic_diagnosis || ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaveSuccess(false); // Si edita algo, se quita el mensaje de éxito de guardado
  };

  const handleSaveProgress = async () => {
    if (!selectedPatient) return;
    setLoadingSave(true);
    
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          age: formData.age,
          origin: formData.origin,
          referring_doctor: formData.referring_doctor,
          sample_origin: formData.sample_origin,
          clinical_summary: formData.clinical_summary,
          clinical_diagnosis: formData.clinical_diagnosis,
          macroscopic_diagnosis: formData.macroscopic_diagnosis,
          microscopic_diagnosis: formData.microscopic_diagnosis
        })
        .eq('id', selectedPatient.id);

      if (error) throw error;
      
      setSaveSuccess(true);
      // Actualizamos el objeto en memoria para el PDF
      setSelectedPatient({ ...selectedPatient, ...formData });
      
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setLoadingSave(false);
    }
  };

  const isFormComplete = formData.macroscopic_diagnosis && formData.microscopic_diagnosis;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="card">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={36} color="var(--primary)" />
          Buscar Paciente
        </h1>
        <p className="text-muted mb-4">Ingrese la Cédula de Identidad del paciente para ver sus muestras y redactar el resultado.</p>

        <form onSubmit={handleSearch} className="flex gap-4">
          <input 
            type="text" 
            className="form-input" 
            placeholder="Cédula (Ej. V-12345678)..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            style={{ flex: 1, fontSize: '1.5rem', letterSpacing: '1px' }}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={loadingSearch}>
            {loadingSearch ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {errorSearch && (
          <div style={{ color: '#991b1b', backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '8px', marginTop: '1rem', fontWeight: 'bold' }}>{errorSearch}</div>
        )}
      </div>

      {patientList.length > 1 && !selectedPatient && (
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Users /> Múltiples Muestras Encontradas</h2>
          <p className="text-muted">Este paciente tiene varios registros. Seleccione cuál desea consultar o redactar:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
            {patientList.map(p => (
              <button 
                key={p.id} 
                onClick={() => selectPatient(p)}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '1rem' }}
              >
                <strong>Muestra: {p.sample_code}</strong> | Fecha: {new Date(p.created_at).toLocaleDateString()}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedPatient && (
        <div className="card" style={{ borderTop: '6px solid var(--primary)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, color: 'var(--primary)' }}>Paciente: {selectedPatient.patient_name}</h2>
              <div style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                <strong>C.I:</strong> {selectedPatient.patient_id_card} &nbsp;|&nbsp; 
                <strong>Muestra:</strong> <span style={{ color: '#166534', fontWeight: 'bold' }}>{selectedPatient.sample_code}</span>
              </div>
            </div>
            
            <button 
              onClick={handleSearch} // Simplemente rehace la búsqueda o limpia
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem' }}
            >
              Volver a Buscar
            </button>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>Datos Clínicos del Formulario</h3>
            
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Edad</label>
                <input type="text" name="age" className="form-input" placeholder="Ej. 46 Años" value={formData.age} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Procedencia (Estado / Ciudad)</label>
                <input type="text" name="origin" className="form-input" placeholder="Ej. Estado Trujillo" value={formData.origin} onChange={handleChange} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Dr(a) que remite</label>
                <input type="text" name="referring_doctor" className="form-input" placeholder="Ej. Croes" value={formData.referring_doctor} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Muestra de</label>
                <input type="text" name="sample_origin" className="form-input" placeholder="Ej. Útero más anexos" value={formData.sample_origin} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Resumen Clínico</label>
              <textarea name="clinical_summary" className="form-textarea" style={{ minHeight: '80px' }} placeholder="Paciente femenina de 46 años..." value={formData.clinical_summary} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Diagnóstico Clínico</label>
              <input type="text" name="clinical_diagnosis" className="form-input" placeholder="Ej. Miomatosis uterina" value={formData.clinical_diagnosis} onChange={handleChange} />
            </div>
          </div>

          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2rem', color: 'var(--primary)' }}>
            <FileText size={26} />
            Redacción de Hallazgos
          </h3>

          <div className="form-group">
            <label className="form-label">Diagnóstico Macroscópico</label>
            <textarea 
              name="macroscopic_diagnosis"
              className="form-textarea" 
              placeholder="Describa el tamaño, color, textura..."
              value={formData.macroscopic_diagnosis}
              onChange={handleChange}
              style={{ minHeight: '150px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Diagnóstico Microscópico (Final)</label>
            <textarea 
              name="microscopic_diagnosis"
              className="form-textarea" 
              placeholder="Describa los hallazgos microscópicos y conclusión..."
              value={formData.microscopic_diagnosis}
              onChange={handleChange}
              style={{ minHeight: '200px', border: '2px solid #166534' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <button 
              onClick={handleSaveProgress}
              className="btn" 
              style={{ flex: 1, backgroundColor: '#334155', color: 'white', fontSize: '1.2rem' }} 
              disabled={loadingSave}
            >
              <Save size={20} />
              {loadingSave ? 'Guardando...' : 'Guardar Progreso en BD'}
            </button>
            
            {saveSuccess && (
              <div style={{ width: '100%', color: '#166534', fontWeight: 'bold', textAlign: 'center', margin: '0.5rem 0' }}>
                <CheckCircle2 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                Progreso guardado correctamente. Ya puedes generar el PDF actualizado.
              </div>
            )}

            <div style={{ width: '100%' }}>
              {isFormComplete ? (
                <PDFDownloadLink
                  document={
                    <ResultPDF 
                      patient={selectedPatient} 
                      formData={formData}
                    />
                  }
                  fileName={`Resultado_${selectedPatient.sample_code}_${selectedPatient.patient_name.replace(/\s+/g, '_')}.pdf`}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '1.3rem', padding: '1.2rem', textDecoration: 'none' }}
                >
                  {/* @ts-ignore */}
                  {({ loading }) =>
                    loading ? 'Generando Documento Oficial...' : <><Download size={24} /> Descargar PDF Oficial</>
                  }
                </PDFDownloadLink>
              ) : (
                <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                  Llene los diagnósticos macro/micro para generar el PDF
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
