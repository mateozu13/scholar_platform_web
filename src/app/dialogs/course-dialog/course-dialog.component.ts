import { Component, OnInit, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ValidatorFn,
  FormGroupDirective,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Course } from '../../models/course.model';
import { CourseService } from '../../services/course.service';
import { StorageService } from '../../services/storage.service';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-course-dialog',
  templateUrl: './course-dialog.component.html',
  styleUrls: ['./course-dialog.component.scss'],
  standalone: false,
})
export class CourseDialogComponent implements OnInit {
  form!: FormGroup;
  editMode: boolean = false;
  course: Course | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CourseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private courseService: CourseService,
    private storageService: StorageService,

    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        titulo: ['', Validators.required],
        descripcion: ['', Validators.required],
        nivel: ['', Validators.required],
        fechaInicio: [''],
        fechaFin: [''],
        activo: [true],
      },
      { validators: this.dateRangeValidator }
    );

    if (this.data && this.data.course) {
      this.editMode = true;
      this.course = this.data.course as Course;

      this.form.patchValue({
        titulo: this.course.titulo,
        descripcion: this.course.descripcion,
        nivel: this.course.nivel,
        fechaInicio: this.course.fechaInicio
          ? this.course.fechaInicio instanceof Date
            ? this.course.fechaInicio
            : new Date(this.course.fechaInicio)
          : '',
        fechaFin: this.course.fechaFin
          ? this.course.fechaFin instanceof Date
            ? this.course.fechaFin
            : new Date(this.course.fechaFin)
          : '',
        activo: this.course.activo !== undefined ? this.course.activo : true,
      });

      if (this.course.imagenUrl) {
        this.imagePreview = this.course.imagenUrl;
      }
    }
  }

  dateRangeValidator: ValidatorFn = (group: FormGroup) => {
    const start = group.get('fechaInicio')?.value;
    const end = group.get('fechaFin')?.value;
    if (start && end && end < start) {
      return { dateRangeInvalid: true };
    }
    return null;
  };

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedFile = fileInput.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValues = this.form.value;
    let imageUrl = this.course ? this.course.imagenUrl || '' : '';

    try {
      if (this.selectedFile) {
        imageUrl = await this.storageService.uploadFile(
          this.selectedFile,
          'courses'
        );

        if (this.course && this.course.imagenUrl) {
          this.storageService
            .deleteFile(this.course.imagenUrl)
            .catch((err) =>
              console.error('Error eliminando imagen antigua:', err)
            );
        }
      }

      if (this.editMode && this.course) {
        const updateData: Partial<Course> = {
          titulo: formValues.titulo,
          descripcion: formValues.descripcion,
          nivel: formValues.nivel,
          fechaInicio: formValues.fechaInicio || null,
          fechaFin: formValues.fechaFin || null,
          imagenUrl: imageUrl,
          activo: formValues.activo,
        };
        await this.courseService.updateCourse(this.course.id, updateData);
        this.snackBar.open('Curso actualizado exitosamente.', 'Cerrar', {
          duration: 3000,
        });
      } else {
        const newId = firebase.firestore().collection('courses').id;
        const newCourse: Course = {
          id: newId,
          titulo: formValues.titulo,
          descripcion: formValues.descripcion,
          nivel: formValues.nivel,
          fechaInicio: formValues.fechaInicio || null,
          fechaFin: formValues.fechaFin || null,
          imagenUrl: imageUrl,
          profesorId: '',
          estudiantes: [],
          estudiantesCount: 0,
          assignmentsCount: 0,
          completedAssignments: 0,
          deliveredSubmissions: 0,
          pendingSubmissions: 0,
          avgGrade: 0,
          activo: formValues.activo,
        };
        await this.courseService.createCourse(newCourse);
        this.snackBar.open('Curso creado exitosamente.', 'Cerrar', {
          duration: 3000,
        });
      }

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error al guardar el curso:', error);
      this.snackBar.open('Ocurrió un error al guardar el curso.', 'Cerrar', {
        duration: 5000,
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
