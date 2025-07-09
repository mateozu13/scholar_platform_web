export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'estudiante' | 'profesor' | 'admin';
  cursosInscritos?: string[]; // IDs de cursos (para estudiantes)
  cursosDictados?: string[]; // IDs de cursos (para profesores)
  fotoPerfil?: string;
  telefono?: string;
  bio?: string;
  createdAt: Date | any;
  lastLogin?: Date;
  active: boolean;

  cursosInscritosCount?: number;
  cursosDictadosCount?: number;
  progresoGlobal?: number;
  promedioCalificaciones?: number;
  tareasCompletadas?: number;
}

export type UserRole = User['rol'];
