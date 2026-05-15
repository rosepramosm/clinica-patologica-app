
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, ClipboardList, LogOut, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Navbar = () => {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Stethoscope size={32} />
        Clínica Anatomo-Patológica
      </div>
      <div className="navbar-links" style={{ alignItems: 'center' }}>
        <Link 
          to="/admin" 
          className={`btn ${location.pathname === '/admin' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
        >
          <ClipboardList size={20} />
          Recepción
        </Link>
        <Link 
          to="/config" 
          className={`btn ${location.pathname === '/config' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
        >
          <Settings size={20} />
          Tipos de Muestra
        </Link>
        <Link 
          to="/doctor" 
          className={`btn ${location.pathname === '/doctor' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
        >
          <Stethoscope size={20} />
          Médico
        </Link>
        
        <div style={{ width: '2px', height: '30px', backgroundColor: 'var(--border-color)', margin: '0 10px' }}></div>
        
        <button 
          onClick={handleLogout}
          className="btn"
          style={{ padding: '0.8rem 1.5rem', fontSize: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none' }}
        >
          <LogOut size={20} />
          Salir
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
