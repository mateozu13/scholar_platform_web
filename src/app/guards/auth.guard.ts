import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.currentUser$.pipe(
      take(1),
      map((user: User | null) => {
        if (user?.rol === 'admin') {
          if (user?.active) return true;
          this.snackBar.open(
            'No puede iniciar sesión, su cuenta no está activa',
            'Cerrar',
            {
              duration: 3000,
            }
          );
          return false;
        }

        return this.router.createUrlTree(['/login']);
      })
    );
  }
}
