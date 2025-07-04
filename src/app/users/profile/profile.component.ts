import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: false,
})
export class ProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  currentUser!: User;
  profileImageUrl: string = '';
  isEditing = false;
  isPasswordEditing = false;
  isLoading = true;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  stats: any = {};

  constructor(
    private userSvc: UserService,
    private authService: AuthService,
    private storageSvc: StorageService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      const fbUser = firebase.auth().currentUser;
      if (!fbUser) {
        this.router.navigate(['/login']);
        return;
      }
      const user = await this.userSvc.getUserById(fbUser.uid);
      if (!user) throw new Error('Usuario no encontrado');
      this.currentUser = user;
      this.profileImageUrl = user.fotoPerfil || '';
      this.buildForms();
      this.loadStats();
    } catch (err) {
      console.error(err);
      this.snack.open('Error cargando perfil', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  getAvatarColor(): string {
    const colors = [
      '#3f51b5',
      '#673ab7',
      '#009688',
      '#ff5722',
      '#e91e63',
      '#2196f3',
    ];
    const index =
      (this.currentUser.nombre.charCodeAt(0) +
        (this.currentUser.nombre.length || 0)) %
      colors.length;
    return colors[index];
  }

  private buildForms() {
    this.profileForm = this.fb.group({
      telefono: [
        this.currentUser.telefono || '',
        Validators.pattern(/^[0-9\-\+\s]*$/),
      ],
      bio: [this.currentUser.bio || ''],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.matchPasswords }
    );
  }

  private matchPasswords(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null
      : { notSame: true };
  }

  private async loadStats() {
    const db = firebase.firestore();
    switch (this.currentUser.rol) {
      case 'estudiante':
        this.stats = {
          enrolledCourses: this.currentUser.cursosInscritos?.length || 0,
          completedAssignments: 0,
          averageGrade: 0,
        };
        break;
      case 'profesor':
        this.stats = {
          taughtCourses: this.currentUser.cursosDictados?.length || 0,
          createdAssignments: 0,
          studentsTaught: 0,
        };
        break;
      case 'admin':
        const totalUsers = (await db.collection('Users').get()).size;
        const totalCourses = (await db.collection('courses').get()).size;
        this.stats = { totalUsers, totalCourses };
        break;
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.match('image.*')) {
      this.snack.open('Por favor selecciona una imagen válida', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    try {
      this.isLoading = true;
      const url = await this.storageSvc.uploadFile(file, 'avatars');

      if (this.profileImageUrl) {
        await this.storageSvc.deleteFile(this.profileImageUrl);
      }

      await this.userSvc.updateUser(this.currentUser.id, { fotoPerfil: url });
      this.profileImageUrl = url;
      this.snack.open('Foto de perfil actualizada', 'Cerrar', {
        duration: 2000,
      });
    } catch (err) {
      console.error(err);
      this.snack.open('Error al actualizar la foto', 'Cerrar', {
        duration: 3000,
      });
    } finally {
      this.isLoading = false;
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) return;

    try {
      this.isLoading = true;
      const { telefono, bio } = this.profileForm.value;
      await this.userSvc.updateUser(this.currentUser.id, { telefono, bio });
      this.currentUser.telefono = telefono;
      this.currentUser.bio = bio;
      this.isEditing = false;
      this.snack.open('Perfil actualizado', 'Cerrar', { duration: 2000 });
    } catch (err) {
      console.error(err);
      this.snack.open('Error al guardar los cambios', 'Cerrar', {
        duration: 3000,
      });
    } finally {
      this.isLoading = false;
    }
  }

  async changePassword() {
    if (this.passwordForm.invalid) return;

    try {
      this.isLoading = true;
      const { currentPassword, newPassword } = this.passwordForm.value;
      const user = firebase.auth().currentUser;

      if (!user || !user.email) {
        throw new Error('No se pudo autenticar el usuario');
      }

      await firebase
        .auth()
        .signInWithEmailAndPassword(user.email, currentPassword);
      await user.updatePassword(newPassword);

      this.isPasswordEditing = false;
      this.passwordForm.reset();
      this.snack.open('Contraseña actualizada', 'Cerrar', { duration: 2000 });
    } catch (err: any) {
      console.error(err);
      const message =
        err.code === 'auth/wrong-password'
          ? 'La contraseña actual es incorrecta'
          : 'Error al cambiar la contraseña';
      this.snack.open(message, 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  formatDate(d: any) {
    const dt = d instanceof Date ? d : d.toDate();
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dt);
  }

  logout(): void {
    this.authService.logout();
  }
}
