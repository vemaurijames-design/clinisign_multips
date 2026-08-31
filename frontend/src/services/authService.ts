import api from './api';

export interface LoginRequest { email: string; password: string; ipsId?: number | null; }
export interface AuthResponse {
  token: string; rol: string; email: string; nombre: string;
  ipsId?: number | null; ipsNombre?: string;
}

export const authService = {
  login: async (req: LoginRequest): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', req);
    localStorage.setItem('token', data.token);
    localStorage.setItem('rol', data.rol);
    localStorage.setItem('email', data.email);
    localStorage.setItem('nombre', data.nombre);
    localStorage.setItem('ipsId', data.ipsId?.toString() ?? 'null');
    localStorage.setItem('ipsNombre', data.ipsNombre ?? '');
    return data;
  },
  logout: () => localStorage.clear(),
};
