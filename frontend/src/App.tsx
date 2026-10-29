import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import RequireIps from './components/RequireIps';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Usuarios from './pages/Usuarios';
import Ambulancias from './pages/Ambulancias';
import Solicitudes from './pages/Solicitudes';
import HistoriaClinica from './pages/HistoriaClinica';
import Consentimientos from './pages/Consentimientos';
import Reportes from './pages/Reportes';
import ListIps from './pages/ListIps';
import CreateIps from './pages/CreateIps';
import Agenda from './pages/Agenda';
import ConfigCorreo from './pages/ConfigCorreo';
import Auditoria from './pages/Auditoria';
import Plantillas from './pages/Plantillas';
import { useEffect } from 'react';
import { processPendingQueue } from './utils/offlineQueue';
import { historiaClinicaService, consentimientoService } from './services/rest';
import Notificaciones from './pages/Notificaciones';

function AppRoutes() {
  const { token } = useAuth();
  if (!token) return <Login />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR','TECNICO','CALIDAD','MEDICO']}><Dashboard /></PrivateRoute>} />
        <Route path="/agenda" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR','MEDICO']}><RequireIps><Agenda /></RequireIps></PrivateRoute>} />
        <Route path="/pacientes" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR','MEDICO']}><RequireIps><Pacientes /></RequireIps></PrivateRoute>} />
        <Route path="/usuarios" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','RADIOPERADOR']}><Usuarios /></PrivateRoute>} />
        <Route path="/ambulancias" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','TECNICO','RADIOPERADOR']}><RequireIps><Ambulancias /></RequireIps></PrivateRoute>} />
        <Route path="/solicitudes" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','RADIOPERADOR','AUXILIAR','MEDICO']}><RequireIps><Solicitudes /></RequireIps></PrivateRoute>} />
        <Route path="/historias-clinicas" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','AUXILIAR','MEDICO','RADIOPERADOR','CALIDAD']}><RequireIps><HistoriaClinica /></RequireIps></PrivateRoute>} />
        <Route path="/consentimientos" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','AUXILIAR','MEDICO','RADIOPERADOR','CALIDAD']}><RequireIps><Consentimientos /></RequireIps></PrivateRoute>} />
        <Route path="/reportes" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','CALIDAD','RADIOPERADOR']}><RequireIps><Reportes /></RequireIps></PrivateRoute>} />
        <Route path="/ips" element={<PrivateRoute roles={['SUPERADMIN']}><ListIps /></PrivateRoute>} />
        <Route path="/ips/create" element={<PrivateRoute roles={['SUPERADMIN']}><CreateIps /></PrivateRoute>} />
        <Route path="/config" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','RADIOPERADOR']}><RequireIps><ConfigCorreo /></RequireIps></PrivateRoute>} />
        <Route path="/auditoria" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','CALIDAD','MEDICO','RADIOPERADOR']}><RequireIps><Auditoria /></RequireIps></PrivateRoute>} />
        <Route path="/plantillas" element={<PrivateRoute roles={['SUPERADMIN']}><RequireIps><Plantillas /></RequireIps></PrivateRoute>} />
        <Route path="/notificaciones" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR','TECNICO','CALIDAD','MEDICO']}><RequireIps><Notificaciones /></RequireIps></PrivateRoute>} />
      </Routes>
    </Layout>
  );
}

function OfflineSync() {
  const { token } = useAuth();
  useEffect(() => {
    if (!token) return;
    const sync = async () => {
      if (!navigator.onLine) return;
      const enviados = await processPendingQueue(
        (data) => historiaClinicaService.crear(data),
        (data) => consentimientoService.crear(data)
      );
      if (enviados > 0) {
        alert(`✓ Conexión restaurada\n\nSe enviaron ${enviados} documento(s) pendientes correctamente.\n\nLos documentos ya están disponibles en CliniSign.`);
      }
    };
    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [token]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <OfflineSync />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}