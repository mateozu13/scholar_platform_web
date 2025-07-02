import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { User } from '../../models/user.model';
import { CourseService } from '../../services/course.service';
import { Course } from '../../models/course.model';

@Component({
  selector: 'app-assign-professor-dialog',
  templateUrl: './assign-professor-dialog.component.html',
  styleUrls: ['./assign-professor-dialog.component.scss'],
  standalone: false,
})
export class AssignProfessorDialogComponent implements OnInit {
  form!: FormGroup;
  professors: User[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignProfessorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { course: Course },
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    // 1) construye form
    this.form = this.fb.group({
      profesor: [this.data.course.profesor || null, Validators.required],
    });

    // 2) carga usuarios con rol 'profesor' de la colección 'Users'
    const db = firebase.firestore();
    db.collection('Users')
      .where('rol', '==', 'profesor')
      .get()
      .then((snapshot) => {
        this.professors = snapshot.docs.map((doc) => {
          const u = doc.data() as User;
          return { id: doc.id, ...u };
        });
      })
      .catch((err) => console.error('Error cargando profesores:', err));
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    const profesor: User = this.form.value.profesor;
    // Prepara datos parciales del curso
    const updateData: Partial<Course> = {
      profesorId: profesor.id,
      profesor: profesor,
    };
    try {
      await this.courseService.updateCourse(this.data.course.id, updateData);
      this.dialogRef.close(true);
    } catch (err) {
      console.error('Error asignando profesor:', err);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
