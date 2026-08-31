import api, { apiOrigin } from './api';

export const ipsService = {
  listar: () => api.get('/ips/list'),
  listarAdmin: () => api.get('/ips/admin'),
  crear: (dto: any) => api.post('/ips/create', dto),
  actualizar: (id: number, dto: any) => api.put(`/ips/${id}`, dto),
  config: (id: number) => api.get(`/ips/${id}/config`),
  guardarConfig: (id: number, dto: any) => api.put(`/ips/${id}/config`, dto),
};

export const citaService = {
  listar: () => api.get('/citas'),
  hoy: () => api.get('/citas/hoy'),
  proximas: () => api.get('/citas/proximas'),
  resumen: () => api.get('/citas/resumen'),
  crear: (data: any) => api.post('/citas', data),
  actualizar: (id: number, data: any) => api.put(`/citas/${id}`, data),
  eliminar: (id: number) => api.delete(`/citas/${id}`),
  recordatorio: (id: number) => api.post(`/citas/${id}/recordatorio`),
};

export const superadminService = {
  usuarios: (ipsId: number) => api.get(`/superadmin/ips/${ipsId}/usuarios`),
  crearUsuario: (ipsId: number, data: any) => api.post(`/superadmin/ips/${ipsId}/usuarios`, data),
  actualizarUsuario: (ipsId: number, userId: number, data: any) =>
    api.put(`/superadmin/ips/${ipsId}/usuarios/${userId}`, data),
  toggleUsuario: (ipsId: number, userId: number, activo: boolean) =>
    api.put(`/superadmin/ips/${ipsId}/usuarios/${userId}/activo?activo=${activo}`),
  eliminarUsuario: (ipsId: number, userId: number) =>
    api.delete(`/superadmin/ips/${ipsId}/usuarios/${userId}`),
  resumen: (ipsId: number) => api.get(`/superadmin/ips/${ipsId}/resumen`),
};

export const pacienteService = {
  listar: () => api.get('/pacientes'),
  crear: (data: any) => api.post('/pacientes', data),
  actualizar: (id: number, data: any) => api.put(`/pacientes/${id}`, data),
  eliminar: (id: number) => api.delete(`/pacientes/${id}`),
  exportExcel: () => api.get('/pacientes/export/excel', { responseType: 'blob' }),
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pacientes/import/excel', formData);
  },
};

export const ambulanciaService = {
  listar: () => api.get('/ambulancias'),
  crear: (data: any) => api.post('/ambulancias', data),
  actualizar: (id: number, data: any) => api.put(`/ambulancias/${id}`, data),
  eliminar: (id: number) => api.delete(`/ambulancias/${id}`),
};

export const solicitudService = {
  listar: () => api.get('/solicitudes'),
  crear: (data: any) => api.post('/solicitudes', data),
  actualizar: (id: number, data: any) => api.put(`/solicitudes/${id}`, data),
  eliminar: (id: number) => api.delete(`/solicitudes/${id}`),
};

export const historiaClinicaService = {
  listar: () => api.get('/historias-clinicas'),
  crear: (data: any) => api.post('/historias-clinicas', data),
  eliminar: (id: number) => api.delete(`/historias-clinicas/${id}`),
};

export const consentimientoService = {
  listar: () => api.get('/consentimientos'),
  crear: (data: any) => api.post('/consentimientos', data),
  eliminar: (id: number) => api.delete(`/consentimientos/${id}`),
  pdfUrl: (id: number) =>
    `${apiOrigin()}/api/consentimientos/${id}/pdf?token=${localStorage.getItem('token')}`,
};

export const reporteService = {
  estadisticas: () => api.get('/reportes/estadisticas'),
  pdfUrl: () =>
    `${apiOrigin()}/api/reportes/pdf/general?token=${localStorage.getItem('token')}`,
};

export const usuarioService = {
  listar: () => api.get('/usuarios'),
  crear: (data: any) => api.post('/usuarios', data),
  actualizar: (id: number, data: any) => api.put(`/usuarios/${id}`, data),
  toggleActivo: (id: number, activo: boolean) => api.put(`/usuarios/${id}/activo?activo=${activo}`),
  eliminar: (id: number) => api.delete(`/usuarios/${id}`),
};
