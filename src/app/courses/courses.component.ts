import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Course } from '../models/course.model';
import { CourseService } from '../services/course.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { CourseDialogComponent } from '../dialogs/course-dialog/course-dialog.component';
import { AssignProfessorDialogComponent } from '../dialogs/assign-professor-dialog/assign-professor-dialog.component';
import { AssignStudentsDialogComponent } from '../dialogs/assign-students-dialog/assign-students-dialog.component';

@Component({
  selector: 'app-course-list',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss'],
  standalone: false,
})
export class CoursesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'name',
    'profesor',
    'estudiantes',
    'nivel',
    'estado',
    'acciones',
  ];
  dataSource: MatTableDataSource<Course> = new MatTableDataSource<Course>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private courseService: CourseService,
    private dialog: MatDialog,
    private authService: AuthService,
    private storageService: StorageService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Suscribirse a la lista de cursos desde Firestore a través del servicio
    this.courseService.getCourses().subscribe((courses) => {
      // Asegurar que cada curso tenga el campo estudiantesCount y activo inicializado
      courses.forEach((c) => {
        c.estudiantesCount = c.estudiantes ? c.estudiantes.length : 0;
        if (c.activo === undefined) {
          c.activo = true; // asumir activo por defecto si no está establecido
        }
      });
      this.dataSource.data = courses;
    });
  }

  ngAfterViewInit(): void {
    // Configurar paginador y ordenamiento una vez que la vista está inicializada
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configurar la lógica de ordenamiento para columnas personalizadas
    this.dataSource.sortingDataAccessor = (
      course: Course,
      property: string
    ) => {
      switch (property) {
        case 'profesor':
          return course.profesor.nombre
            ? course.profesor.nombre.toLowerCase()
            : '';
        case 'estudiantes':
          return course.estudiantesCount || 0;
        case 'estado':
          return course.activo ? 1 : 0; // Inactivo (0) antes que Activo (1)
        default:
          // Por defecto ordenar por la propiedad directamente (asumiendo string/number)
          const value = (course as any)[property];
          return typeof value === 'string' ? value.toLowerCase() : value;
      }
    };

    // Configurar filtro de búsqueda (buscará en nombre, descripción, nivel y nombre de profesor)
    this.dataSource.filterPredicate = (data: Course, filter: string) => {
      const term = filter.trim().toLowerCase();
      return (
        data.titulo.toLowerCase().includes(term) ||
        data.descripcion.toLowerCase().includes(term) ||
        (data.profesor.nombre || '').toLowerCase().includes(term) ||
        (data.nivel || '').toLowerCase().includes(term)
      );
    };
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateCourse(): void {
    this.dialog.open(CourseDialogComponent, {
      width: '600px',
      data: {}, // sin curso en los datos significa creación
    });
  }

  openEditCourse(course: Course): void {
    this.dialog.open(CourseDialogComponent, {
      width: '600px',
      data: { course: course },
    });
  }

  openAssignProfessor(course: Course) {
    this.dialog.open(AssignProfessorDialogComponent, {
      width: '400px',
      data: { course },
    });
  }

  openAssignStudents(course: Course) {
    this.dialog.open(AssignStudentsDialogComponent, {
      width: '800px',
      data: { course },
    });
  }

  deleteCourse(course: Course): void {
    // Verificar si se puede eliminar (curso inactivo o sin estudiantes)
    if (course.activo && (course.estudiantesCount || 0) > 0) {
      // Si está activo y tiene estudiantes, no permitir eliminar
      this.snackBar.open(
        'No se puede eliminar un curso activo con estudiantes.',
        'Cerrar',
        {
          duration: 5000,
        }
      );
      return;
    }
    const confirmacion = confirm(`¿Eliminar el curso "${course.titulo}"?`);
    if (confirmacion) {
      this.courseService
        .deleteCourse(course.id)
        .then(() => {
          // Si el curso tiene una imagen, eliminarla de Storage
          if (course.imagenUrl) {
            this.storageService
              .deleteFile(course.imagenUrl)
              .catch((err) => console.error('Error eliminando imagen:', err));
          }
          this.snackBar.open('Curso eliminado correctamente.', 'Cerrar', {
            duration: 3000,
          });
        })
        .catch((error) => {
          console.error('Error eliminando curso:', error);
          this.snackBar.open(
            'Ocurrió un error al eliminar el curso.',
            'Cerrar',
            { duration: 3000 }
          );
        });
    }
  }

  logout(): void {
    // Cierra sesión utilizando el servicio de autenticación
    this.authService.logout();
  }
}
