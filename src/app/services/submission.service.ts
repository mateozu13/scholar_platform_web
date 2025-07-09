import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  private db = firebase.firestore();

  constructor() {}

  getPendingSubmissionsCount(): Observable<number> {
    return from(
      this.db
        .collection('submissions')
        .where('calificacion', '==', null) // Entregas sin calificar
        .get()
    ).pipe(map((snapshot) => snapshot.size));
  }
}
