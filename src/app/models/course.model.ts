import { User } from './user.model';

export interface Course {
  id: string;
  titulo: string;
  descripcion: string;
  profesorId: string;
  profesor?: User;
  estudiantes?: User[];
  estudiantesCount?: number;
  fechaInicio?: Date;
  fechaFin?: Date;
  nivel?: string;
  imagenUrl?: string;
  assignmentsCount?: number;
  completedAssignments?: number;
  deliveredSubmissions?: number;
  pendingSubmissions?: number;
  avgGrade?: number;
  activo?: boolean;
}
