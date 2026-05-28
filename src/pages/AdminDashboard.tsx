import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, CheckCircle2, DollarSign, Calculator, List } from 'lucide-react';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [sampleTypes, setSampleTypes] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Tasa de cambio global para la pantalla (se puede editar)
  const [exchangeRate, setExchangeRate] = useState<number>(40);

  // Formulario principal
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_id_card: '',
    payment_method: 'Efectivo Divisas',
    received_by: 'Yolanda',
    sample_code: '',
    sample_type_id: '',
    amount_usd: '',
    amount_bs: ''
  });

  // Modal de Abono
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [abonoData, setAbonoData] = useState({
    add_usd: '',
    add_bs: ''
  });

  const loadData = async () => {
    // Cargar tipos de muestra
    const { data: types } = await supabase.from('sample_types').select('*').order('name');
    if (types) {
      setSampleTypes(types);
      if (types.length > 0 && !formData.sample_type_id) {
        setFormData(f => ({ ...f, sample_type_id: types[0].id }));
      }
    }

    // Cargar pacientes recientes
    const { data: patients } = await supabase
      .from('patients')
      .select('*, sample_types(name, price_usd)')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (patients) {
      setRecentPatients(patients);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cálculos en tiempo real para el formulario principal
  const selectedType = sampleTypes.find(t => t.id === formData.sample_type_id);
  const priceUsd = selectedType ? Number(selectedType.price_usd) : 0;
  
  const usdInput = parseFloat(formData.amount_usd) || 0;
  const bsInput = parseFloat(formData.amount_bs) || 0;
  const currentPaidEquivalent = usdInput + (exchangeRate > 0 ? (bsInput / exchangeRate) : 0);
  const remainingUsd = Math.max(0, priceUsd - currentPaidEquivalent);
  const willBePaid = currentPaidEquivalent >= priceUsd - 0.05; // Margen de error por decimales

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (!editingPatientId) return;
    
    const timeoutId = setTimeout(() => {
      saveDataAutomatically();
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [formData, exchangeRate]);

  const saveDataAutomatically = async () => {
    if (!editingPatientId) return;
    setAutoSaving(true);
    
    const currentPaidEq = (parseFloat(formData.amount_usd) || 0) + (exchangeRate > 0 ? ((parseFloat(formData.amount_bs) || 0) / exchangeRate) : 0);
    const sType = sampleTypes.find(t => t.id === formData.sample_type_id);
    const pUsd = sType ? Number(sType.price_usd) : 0;
    const isPaid = currentPaidEq >= pUsd - 0.05;

    try {
      const { error } = await supabase
        .from('patients')
        .update({
          patient_name: formData.patient_name,
          patient_id_card: formData.patient_id_card,
          payment_method: formData.payment_method,
          received_by: formData.received_by,
          sample_code: formData.sample_code.toUpperCase(),
          sample_type_id: formData.sample_type_id,
          amount_usd: parseFloat(formData.amount_usd) || 0,
          amount_bs: parseFloat(formData.amount_bs) || 0,
          total_paid_usd_equivalent: currentPaidEq,
          status: isPaid ? 'Pagado' : 'Por Pagar'
        })
        .eq('id', editingPatientId);

      if (error) throw error;
      setLastSaved(new Date());
      loadData();
    } catch (err) {
      console.error('Error auto-guardado:', err);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleEditPatient = (p: any) => {
    setEditingPatientId(p.id);
    setSuccess('');
    setLastSaved(null);
    setFormData({
      patient_name: p.patient_name || '',
      patient_id_card: p.patient_id_card || '',
      payment_method: p.payment_method || 'Efectivo Divisas',
      received_by: p.received_by || 'Yolanda',
      sample_code: p.sample_code || '',
      sample_type_id: p.sample_type_id || '',
      amount_usd: (p.amount_usd || 0).toString(),
      amount_bs: (p.amount_bs || 0).toString()
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sample_type_id) {
      alert('Debe seleccionar un tipo de muestra.');
      return;
    }
    setLoading(true);
    setSuccess('');

    try {
      const finalStatus = willBePaid ? 'Pagado' : 'Por Pagar';

      const { error } = await supabase
        .from('patients')
        .insert([
          {
            patient_name: formData.patient_name,
            patient_id_card: formData.patient_id_card,
            payment_method: formData.payment_method,
            received_by: formData.received_by,
            sample_code: formData.sample_code.toUpperCase(),
            sample_type_id: formData.sample_type_id,
            amount_usd: usdInput,
            amount_bs: bsInput,
            total_paid_usd_equivalent: currentPaidEquivalent,
            status: finalStatus
          }
        ]);

      if (error) {
        if (error.code === '23505') throw new Error('Ese código de muestra ya existe en la base de datos.');
        throw error;
      }

      setSuccess(`¡Paciente registrado! Estatus: ${finalStatus}`);
      setFormData({ 
        ...formData, 
        patient_name: '', patient_id_card: '', sample_code: '', amount_usd: '', amount_bs: '' 
      });
      loadData();
      
    } catch (error: any) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ----- Lógica del Modal de Abono -----
  const openAbonoModal = (patient: any) => {
    setSelectedPatient(patient);
    setAbonoData({ add_usd: '', add_bs: '' });
    setShowAbonoModal(true);
  };

  const closeAbonoModal = () => {
    setShowAbonoModal(false);
    setSelectedPatient(null);
  };

  const handleAbonoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const usdAdd = parseFloat(abonoData.add_usd) || 0;
    const bsAdd = parseFloat(abonoData.add_bs) || 0;
    const newEquivalentAdded = usdAdd + (exchangeRate > 0 ? (bsAdd / exchangeRate) : 0);
    
    const newTotalEquivalent = Number(selectedPatient.total_paid_usd_equivalent) + newEquivalentAdded;
    const newTotalUsd = Number(selectedPatient.amount_usd) + usdAdd;
    const newTotalBs = Number(selectedPatient.amount_bs) + bsAdd;
    
    const isNowPaid = newTotalEquivalent >= (Number(selectedPatient.sample_types?.price_usd) - 0.05);

    try {
      const { error } = await supabase
        .from('patients')
        .update({
          amount_usd: newTotalUsd,
          amount_bs: newTotalBs,
          total_paid_usd_equivalent: newTotalEquivalent,
          status: isNowPaid ? 'Pagado' : 'Por Pagar'
        })
        .eq('id', selectedPatient.id);

      if (error) throw error;
      
      alert('Abono registrado con éxito.');
      closeAbonoModal();
      loadData();
    } catch (err: any) {
      alert('Error al procesar el abono: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Tasa de Cambio Global */}
      <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '1rem 2rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
          <Calculator size={24} color="#38bdf8" />
          Tasa de Cambio Actual (Bs por $):
        </div>
        <div>
          <input 
            type="number" 
            step="0.01"
            className="form-input"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
            style={{ width: '150px', fontSize: '1.2rem', textAlign: 'center', backgroundColor: '#334155', color: 'white', border: '2px solid #38bdf8' }}
          />
        </div>
      </div>

      <div className="card">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: editingPatientId ? '#d97706' : 'var(--primary)' }}>
          <UserPlus size={36} color={editingPatientId ? '#d97706' : 'var(--primary)'} />
          {editingPatientId ? `Editando Paciente: ${formData.patient_name}` : 'Nuevo Ingreso de Recepción'}
        </h1>

        {success && (
          <div className="success-msg mb-4">
            <CheckCircle2 size={24} />
            {success}
          </div>
        )}

        {sampleTypes.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '12px', fontWeight: 'bold' }}>
            Debe ir a "Tipos de Muestra" en el menú superior para registrar al menos un tipo de estudio.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Nombre del Paciente</label>
                <input type="text" name="patient_name" className="form-input" placeholder="Ej. Juan Pérez" value={formData.patient_name} onChange={handleChange} required />
              </div>
              
              <div className="form-group">
                <label className="form-label">Cédula del Paciente</label>
                <input type="text" name="patient_id_card" className="form-input" placeholder="Ej. V-12345678" value={formData.patient_id_card} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Tipo de Estudio</label>
                <select name="sample_type_id" className="form-select" value={formData.sample_type_id} onChange={handleChange} required style={{ fontWeight: 'bold' }}>
                  {sampleTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (${Number(t.price_usd).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--primary)' }}>Código de la Muestra</label>
                <input type="text" name="sample_code" className="form-input" placeholder="Ej. BIO-2023-01" value={formData.sample_code} onChange={handleChange} style={{ textTransform: 'uppercase', fontWeight: 'bold', border: '2px solid var(--primary)' }} required />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Método de Pago Principal</label>
                <select name="payment_method" className="form-select" value={formData.payment_method} onChange={handleChange}>
                  <option value="Efectivo Divisas">Efectivo Divisas</option>
                  <option value="Efectivo Bs">Efectivo Bs</option>
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Transferencias">Transferencias</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Recibido por</label>
                <select name="received_by" className="form-select" value={formData.received_by} onChange={handleChange}>
                  <option value="Yolanda">Yolanda</option>
                  <option value="Cristian">Cristian</option>
                  <option value="Angélica">Angélica</option>
                </select>
              </div>
            </div>

            {/* Panel de Pagos */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '2px dashed var(--primary)', marginBottom: '2rem' }}>
              <h3 style={{ marginTop: 0, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Registro de Cobro</span>
                <span style={{ fontSize: '1.5rem' }}>Costo Total: ${priceUsd.toFixed(2)}</span>
              </h3>
              
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ color: '#166534' }}>Entregado en Dólares ($)</label>
                  <input type="number" step="0.01" name="amount_usd" className="form-input" placeholder="0.00" value={formData.amount_usd} onChange={handleChange} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ color: '#1e40af' }}>Entregado en Bolívares (Bs)</label>
                  <input type="number" step="0.01" name="amount_bs" className="form-input" placeholder="0.00" value={formData.amount_bs} onChange={handleChange} />
                  <small style={{ color: '#64748b' }}>Equivale a: ${(bsInput / exchangeRate).toFixed(2)} a tasa de {exchangeRate}</small>
                </div>
              </div>

              {/* Barra de estado en vivo */}
              <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', backgroundColor: willBePaid ? '#dcfce7' : '#fef2f2', border: `1px solid ${willBePaid ? '#166534' : '#991b1b'}`, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Total Calculado: ${currentPaidEquivalent.toFixed(2)}</span>
                <span style={{ color: willBePaid ? '#166534' : '#991b1b' }}>
                  {willBePaid ? '¡PAGO COMPLETADO!' : `DEUDA RESTANTE: $${remainingUsd.toFixed(2)}`}
                </span>
              </div>
            </div>

            {editingPatientId ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingPatientId(null);
                    setFormData({ patient_name: '', patient_id_card: '', payment_method: 'Efectivo Divisas', received_by: 'Yolanda', sample_code: '', sample_type_id: sampleTypes.length > 0 ? sampleTypes[0].id : '', amount_usd: '', amount_bs: '' });
                    setLastSaved(null);
                  }}
                  className="btn btn-secondary" 
                  style={{ fontSize: '1.2rem', padding: '1rem' }}
                >
                  Cancelar Edición / Registrar Nuevo Ingreso
                </button>
                <div style={{ flex: 1, textAlign: 'right', minWidth: '300px' }}>
                  {autoSaving ? (
                    <span style={{ color: '#d97706', fontSize: '1.1rem', fontWeight: 'bold' }}>🔄 Guardando automáticamente...</span>
                  ) : lastSaved ? (
                    <span style={{ color: '#166534', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                      <CheckCircle2 size={20} /> Cambios autoguardados a las {lastSaved.toLocaleTimeString()}
                    </span>
                  ) : (
                    <span style={{ color: '#64748b', fontSize: '1.1rem' }}>Edite cualquier campo para autoguardar...</span>
                  )}
                </div>
              </div>
            ) : (
              <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.3rem', padding: '1.2rem' }} disabled={loading}>
                {loading ? 'Guardando...' : 'Registrar Nuevo Ingreso'}
              </button>
            )}
          </form>
        )}
      </div>

      {/* Lista de Pacientes Recientes */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <List size={28} color="var(--primary)" />
          Pacientes Recientes
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#eff6ff', borderBottom: '2px solid var(--primary)' }}>
              <th style={{ padding: '1rem' }}>Código / Fecha</th>
              <th style={{ padding: '1rem' }}>Paciente</th>
              <th style={{ padding: '1rem' }}>Estudio</th>
              <th style={{ padding: '1rem' }}>Estatus</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {recentPatients.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <strong>{p.sample_code}</strong><br/>
                  <small className="text-muted">{new Date(p.created_at).toLocaleDateString()}</small>
                </td>
                <td style={{ padding: '1rem' }}>
                  {p.patient_name}<br/>
                  <small className="text-muted">CI: {p.patient_id_card || 'N/A'}</small>
                </td>
                <td style={{ padding: '1rem' }}>
                  {p.sample_types?.name} <br/>
                  <small className="text-muted">${p.sample_types?.price_usd}</small>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold',
                    backgroundColor: p.status === 'Pagado' ? '#dcfce7' : '#fef2f2',
                    color: p.status === 'Pagado' ? '#166534' : '#991b1b'
                  }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => handleEditPatient(p)}
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                  >
                    ✏️ Editar
                  </button>
                  {p.status === 'Por Pagar' && (
                    <button 
                      onClick={() => openAbonoModal(p)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      <DollarSign size={16} /> Abonar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {recentPatients.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay registros recientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Abonos */}
      {showAbonoModal && selectedPatient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={closeAbonoModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            <h2 style={{ color: 'var(--primary)', marginTop: 0 }}>Registrar Abono</h2>
            <p><strong>Paciente:</strong> {selectedPatient.patient_name}</p>
            <p><strong>Costo del Estudio:</strong> ${Number(selectedPatient.sample_types?.price_usd).toFixed(2)}</p>
            <p><strong>Total Pagado Acumulado:</strong> ${Number(selectedPatient.total_paid_usd_equivalent).toFixed(2)}</p>
            
            <hr style={{ margin: '1rem 0', borderColor: 'var(--border-color)' }}/>
            
            <p className="text-muted mb-4">Ingrese el abono que está recibiendo ahora mismo (calculado a la tasa actual de {exchangeRate} Bs/$):</p>
            
            <form onSubmit={handleAbonoSubmit}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#166534' }}>Abono en Dólares ($)</label>
                <input 
                  type="number" step="0.01" className="form-input" 
                  value={abonoData.add_usd} onChange={(e) => setAbonoData({...abonoData, add_usd: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#1e40af' }}>Abono en Bolívares (Bs)</label>
                <input 
                  type="number" step="0.01" className="form-input" 
                  value={abonoData.add_bs} onChange={(e) => setAbonoData({...abonoData, add_bs: e.target.value})} 
                />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                {loading ? 'Procesando...' : 'Guardar Abono'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
