import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly collection = 'Users';
  private db = firebase.firestore();

  // getUsersCountByRole(): Observable<{
  //   admin: number;
  //   profesor: number;
  //   estudiante: number;
  // }> {
  //   return from(firebase.firestore().collection('Users').get()).pipe(
  //     map((snapshot) => {
  //       const counts = { admin: 0, profesor: 0, estudiante: 0 };
  //       snapshot.docs.forEach((doc) => {
  //         const u = doc.data() as User;
  //         counts[u.rol] = (counts[u.rol] || 0) + 1;
  //       });
  //       return counts;
  //     })
  //   );
  // }

  // getRecentUsers(limitCount: number): Observable<User[]> {
  //   return from(
  //     firebase
  //       .firestore()
  //       .collection('Users')
  //       .orderBy('lastLogin', 'desc')
  //       .limit(limitCount)
  //       .get()
  //   ).pipe(
  //     map((snapshot) =>
  //       snapshot.docs.map((doc) => {
  //         const u = doc.data() as User;
  //         u.id = doc.id;
  //         return u;
  //       })
  //     )
  //   );
  // }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const doc = await this.db.collection(this.collection).doc(userId).get();
      return doc.exists ? ({ id: doc.id, ...doc.data() } as User) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async createUser(user: User): Promise<void> {
    await this.db.collection(this.collection).doc(user.id).set(user);
  }

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      await firebase
        .firestore()
        .collection(this.collection)
        .doc(userId)
        .update(data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    const snapshot = await firebase
      .firestore()
      .collection(this.collection)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
  }

  async getUsersByRole(role: User['rol']): Promise<User[]> {
    const snapshot = await this.db
      .collection(this.collection)
      .where('rol', '==', role)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
  }

  async deleteUser(userId: string): Promise<void> {
    await this.db.collection(this.collection).doc(userId).delete();
  }

  getUsersCountByRole(): Observable<{
    admin: number;
    profesor: number;
    estudiante: number;
  }> {
    return from(this.db.collection('Users').get()).pipe(
      map((snapshot) => {
        const counts = { admin: 0, profesor: 0, estudiante: 0 };
        snapshot.docs.forEach((doc) => {
          const user = doc.data() as User;
          if (user.rol === 'admin') counts.admin++;
          else if (user.rol === 'profesor') counts.profesor++;
          else if (user.rol === 'estudiante') counts.estudiante++;
        });
        return counts;
      })
    );
  }

  getRecentUsers(limit: number): Observable<User[]> {
    return from(
      this.db
        .collection('Users')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get()
    ).pipe(
      map((snapshot) =>
        snapshot.docs.map((doc) => {
          const data = doc.data() as User;
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
          } as User;
        })
      )
    );
  }
}
