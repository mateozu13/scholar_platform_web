import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { initializeApp } from '@angular/fire/app';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.scss'],
  standalone: false,
})
export class UserDialogComponent implements OnInit {
  form!: FormGroup;
  editMode = false;

  roles: User['rol'][] = ['admin', 'profesor', 'estudiante'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User | null },
    private userService: UserService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rol: ['', Validators.required],
      telefono: [''],
      bio: [''],
      active: [true],
    });

    if (this.data.user) {
      this.editMode = true;
      const u = this.data.user;
      this.form.patchValue({
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        telefono: u.telefono || '',
        bio: u.bio || '',
        active: u.active,
      });
      this.form.controls.email.disable();
      this.form.controls.bio.disable();
      this.form.controls.rol.disable();
      this.form.controls.active.disable();
    }
  }

  async save() {
    if (this.form.invalid) return;
    const vals = this.form.value;
    try {
      if (this.editMode && this.data.user) {
        await this.userService.updateUser(this.data.user.id, {
          nombre: vals.nombre,
          rol: vals.rol,
          telefono: vals.telefono,
          bio: vals.bio,
          active: vals.active,
        });
        this.snack.open('Usuario actualizado', '', { duration: 2000 });
      } else {
        const secondApp = firebase.initializeApp(environment.firebase, 'user');
        const cred = await secondApp
          .auth()
          .createUserWithEmailAndPassword(vals.email, '12345678');
        if (!cred.user) throw Error('No se creó usuario Auth');
        const newUser: User = {
          id: cred.user.uid,
          nombre: vals.nombre,
          email: vals.email,
          rol: vals.rol,
          telefono: vals.telefono || '',
          bio: vals.bio || '',
          createdAt: new Date(),
          active: vals.active,
          cursosInscritos: [],
          cursosDictados: [],
        };
        // guardar en Firestore
        await this.userService.createUser(newUser);
        // await userCredential.user.sendEmailVerification();
        this.snack.open('Usuario creado', '', { duration: 4000 });
        secondApp.auth().signOut();
      }
      this.dialogRef.close(true);
    } catch (err) {
      console.error(err);
      this.snack.open('Error al guardar', '', { duration: 3000 });
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
