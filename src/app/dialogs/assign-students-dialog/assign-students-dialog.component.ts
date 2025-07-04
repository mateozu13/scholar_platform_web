import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { User } from '../../models/user.model';
import { Course } from '../../models/course.model';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-assign-students-dialog',
  templateUrl: './assign-students-dialog.component.html',
  styleUrls: ['./assign-students-dialog.component.scss'],
  standalone: false,
})
export class AssignStudentsDialogComponent implements OnInit {
  displayedColumns = ['select', 'nombre', 'email'];
  dataSource = new MatTableDataSource<User>();
  selection = new SelectionModel<User>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialogRef: MatDialogRef<AssignStudentsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { course: Course },
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    const db = firebase.firestore();
    db.collection('Users')
      .where('rol', '==', 'estudiante')
      .get()
      .then((snapshot) => {
        const students = snapshot.docs.map((doc) => {
          const u = doc.data() as User;
          return { id: doc.id, ...u };
        });
        this.dataSource.data = students;

        if (this.data.course.estudiantes) {
          students.forEach((s) => {
            if (this.data.course.estudiantes!.find((e) => e.id === s.id)) {
              this.selection.select(s);
            }
          });
        }

        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
      .catch((err) => console.error('Error cargando estudiantes:', err));
  }

  /** Filtro de búsqueda */
  applyFilter(event: Event): void {
    const term = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = term;
  }

  /** Si todas las filas están seleccionadas */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selecciona o deselecciona todo */
  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  async save(): Promise<void> {
    const selected = this.selection.selected;
    const updateData: Partial<Course> = {
      estudiantes: selected,
      estudiantesCount: selected.length,
    };
    try {
      await this.courseService.updateCourse(this.data.course.id, updateData);
      this.dialogRef.close(true);
    } catch (err) {
      console.error('Error asignando estudiantes:', err);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
