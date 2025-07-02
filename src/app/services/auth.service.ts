// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Subject interno que mantiene tu User o null
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  // Observable público que usarán guards y componentes
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    // Escucha cambios de autenticación
    firebase.auth().onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        // Si hay usuario de Firebase, carga su perfil en Firestore
        const doc = await firebase
          .firestore()
          .collection('Users')
          .doc(fbUser.uid)
          .get();
        if (doc.exists) {
          const data = doc.data() as User;
          // Emite tu interfaz User
          this.currentUserSubject.next(data);
        } else {
          // No encontró perfil en Firestore
          this.currentUserSubject.next(null);
        }
      } else {
        // No hay usuario logueado
        this.currentUserSubject.next(null);
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    const cred = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    if (!cred.user) throw new Error('Falló autenticación');
    // lastLogin lo actualiza onAuthStateChanged al leer el perfil
  }

  logout(): Promise<any> {
    return firebase
      .auth()
      .signOut()
      .then(() => this.router.navigate(['/login']));
  }
}
