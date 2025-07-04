import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  standalone: false,
})
export class ResetPasswordComponent {
  email = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private router: Router, private snackBar: MatSnackBar) {}

  async sendResetLink() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    try {
      await firebase.auth().sendPasswordResetEmail(this.email);
      this.successMessage = 'Correo enviado con éxito';
      this.snackBar.open('🔗 Enlace enviado. Revisa tu correo.', 'Cerrar', {
        duration: 5000,
      });
      this.router.navigate(['/login']);
    } catch (err: any) {
      this.errorMessage = err.message || 'Ocurrió un error.';
    } finally {
      this.isLoading = false;
    }
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
