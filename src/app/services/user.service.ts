import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  // Cuenta usuarios por rol
  getUsersCountByRole(): Observable<{
    admin: number;
    profesor: number;
    estudiante: number;
  }> {
    return from(firebase.firestore().collection('Users').get()).pipe(
      map((snapshot) => {
        const counts = { admin: 0, profesor: 0, estudiante: 0 };
        snapshot.docs.forEach((doc) => {
          const u = doc.data() as User;
          counts[u.rol] = (counts[u.rol] || 0) + 1;
        });
        return counts;
      })
    );
  }

  // Últimos n usuarios por lastLogin
  getRecentUsers(limitCount: number): Observable<User[]> {
    return from(
      firebase
        .firestore()
        .collection('Users')
        .orderBy('lastLogin', 'desc')
        .limit(limitCount)
        .get()
    ).pipe(
      map((snapshot) =>
        snapshot.docs.map((doc) => {
          const u = doc.data() as User;
          u.id = doc.id;
          return u;
        })
      )
    );
  }
}
