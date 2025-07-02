import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false,
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.errorMessage = '';
    this.authService
      .login(this.email, this.password)
      .then(() => {
        // Si la autenticación es exitosa, navega al dashboard de administrador
        this.router.navigate(['/dashboard']);
      })
      .catch((error) => {
        // Muestra el mensaje de error en caso de fallo
        this.errorMessage = error.message;
      });
  }
}
