import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    firebase.auth().onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        const doc = await firebase
          .firestore()
          .collection('Users')
          .doc(fbUser.uid)
          .get();
        if (doc.exists) {
          const data = doc.data() as User;

          this.currentUserSubject.next(data);
        } else {
          this.currentUserSubject.next(null);
        }
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    const cred = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    if (!cred.user) throw new Error('Falló autenticación');
  }

  logout(): Promise<any> {
    return firebase
      .auth()
      .signOut()
      .then(() => this.router.navigate(['/login']));
  }
}
