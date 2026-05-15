import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Plus, Trash2 } from 'lucide-react';

const SampleTypesConfig = () => {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const loadTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('sample_types').select('*').order('name');
    if (!error && data) {
      setTypes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const { error } = await supabase.from('sample_types').insert([
      { name, price_usd: parseFloat(price) }
    ]);

    if (!error) {
      setName('');
      setPrice('');
      loadTypes();
    } else {
      alert('Error al agregar el tipo de muestra.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este tipo de muestra?')) {
      const { error } = await supabase.from('sample_types').delete().eq('id', id);
      if (!error) {
        loadTypes();
      } else {
        alert('Error: es posible que este tipo ya esté asignado a pacientes antiguos.');
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={36} color="var(--primary)" />
          Configuración de Tipos de Muestra
        </h1>
        <p className="text-muted mb-4">Administra los tipos de biopsias/citologías y su precio base en dólares ($).</p>

        <form onSubmit={handleAdd} className="flex gap-4 items-center" style={{ marginBottom: '2rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ flex: 2 }}>
            <label className="form-label" style={{ fontSize: '1rem' }}>Nombre de la Muestra</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej. Biopsia de Piel"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ fontSize: '1rem' }}>Precio ($)</label>
            <input 
              type="number" 
              step="0.01"
              className="form-input" 
              placeholder="Ej. 30.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
            />
          </div>
          <div style={{ paddingTop: '1.8rem' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>
              <Plus size={20} /> Añadir
            </button>
          </div>
        </form>

        {loading ? (
          <p>Cargando lista...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#eff6ff', borderBottom: '2px solid var(--primary)' }}>
                <th style={{ padding: '1rem' }}>Tipo de Muestra</th>
                <th style={{ padding: '1rem' }}>Precio Base ($)</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{t.name}</td>
                  <td style={{ padding: '1rem', color: '#166534', fontWeight: 'bold' }}>${Number(t.price_usd).toFixed(2)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDelete(t.id)}
                      className="btn" 
                      style={{ padding: '0.5rem', backgroundColor: '#fee2e2', color: '#991b1b' }}
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {types.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay tipos de muestra registrados. Añade uno arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SampleTypesConfig;
