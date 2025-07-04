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
    this.courseService.getCourses().subscribe((courses) => {
      courses.forEach((c) => {
        c.estudiantesCount = c.estudiantes ? c.estudiantes.length : 0;
        if (c.activo === undefined) {
          c.activo = true;
        }
      });
      this.dataSource.data = courses;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

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
          return course.activo ? 1 : 0;
        default:
          const value = (course as any)[property];
          return typeof value === 'string' ? value.toLowerCase() : value;
      }
    };

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
      data: {},
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
    if (course.activo && (course.estudiantesCount || 0) > 0) {
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
    this.authService.logout();
  }
}
