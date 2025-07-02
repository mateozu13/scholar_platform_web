// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.currentUser$.pipe(
      take(1),
      map((user: User | null) => {
        // Permite sólo si hay usuario y es admin
        if (user?.rol === 'admin') {
          return true;
        }
        // Si no, devuelve UrlTree para /login
        return this.router.createUrlTree(['/login']);
      })
    );
  }
}
