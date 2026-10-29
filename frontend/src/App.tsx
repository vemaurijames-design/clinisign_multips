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
import { useEffect, useState } from 'react';
import { processPendingQueue, countPending, migrateOldPendingKeys, onlineSuccessMessage } from './utils/offlineQueue';
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

/** Sincronización central de borradores offline */
function OfflineSync() {
  const { token } = useAuth();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!token) return;

    migrateOldPendingKeys();

    const sync = async () => {
      if (!navigator.onLine || syncing) return;
      const pendientes = countPending();
      if (pendientes === 0) return;

      setSyncing(true);
      try {
        const { enviados } = await processPendingQueue(
          (data) => historiaClinicaService.crear(data),
          (data) => consentimientoService.crear(data)
        );
        if (enviados > 0) {
          alert(onlineSuccessMessage(enviados));
        }
      } catch (e) {
        console.warn('Error sincronizando cola offline', e);
      } finally {
        setSyncing(false);
      }
    };

    sync();
    window.addEventListener('online', sync);

    // Reintento cada 30 segundos (útil en móviles)
    const interval = setInterval(() => {
      if (navigator.onLine && countPending() > 0) sync();
    }, 30000);

    return () => {
      window.removeEventListener('online', sync);
      clearInterval(interval);
    };
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