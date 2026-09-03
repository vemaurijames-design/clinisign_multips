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
import Notificaciones from './pages/Notificaciones';

function AppRoutes() {
  const { token } = useAuth();
  if (!token) return <Login />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agenda" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR']}><RequireIps><Agenda /></RequireIps></PrivateRoute>} />
        <Route path="/pacientes" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR']}><RequireIps><Pacientes /></RequireIps></PrivateRoute>} />
        <Route path="/usuarios" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS']}><Usuarios /></PrivateRoute>} />
        <Route path="/ambulancias" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','TECNICO','RADIOPERADOR']}><RequireIps><Ambulancias /></RequireIps></PrivateRoute>} />
        <Route path="/solicitudes" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','RADIOPERADOR','AUXILIAR']}><RequireIps><Solicitudes /></RequireIps></PrivateRoute>} />
        <Route path="/historias-clinicas" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','AUXILIAR']}><RequireIps><HistoriaClinica /></RequireIps></PrivateRoute>} />
        <Route path="/consentimientos" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','AUXILIAR']}><RequireIps><Consentimientos /></RequireIps></PrivateRoute>} />
        <Route path="/reportes" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','CALIDAD']}><RequireIps><Reportes /></RequireIps></PrivateRoute>} />
        <Route path="/ips" element={<PrivateRoute roles={['SUPERADMIN']}><ListIps /></PrivateRoute>} />
        <Route path="/ips/create" element={<PrivateRoute roles={['SUPERADMIN']}><CreateIps /></PrivateRoute>} />
        <Route path="/config" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS']}><RequireIps><ConfigCorreo /></RequireIps></PrivateRoute>} />
        <Route path="/auditoria" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','CALIDAD']}><RequireIps><Auditoria /></RequireIps></PrivateRoute>} />
        <Route path="/plantillas" element={<PrivateRoute roles={['SUPERADMIN']}><RequireIps><Plantillas /></RequireIps></PrivateRoute>} />
        <Route path="/notificaciones" element={<PrivateRoute roles={['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR','TECNICO','CALIDAD']}><RequireIps><Notificaciones /></RequireIps></PrivateRoute>} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
