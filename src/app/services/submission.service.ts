import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  // Cantidad de entregas tardías
  getLateSubmissionsCount(): Observable<number> {
    return from(
      firebase
        .firestore()
        .collection('submissions')
        .where('late', '==', true)
        .get()
    ).pipe(map((snapshot) => snapshot.size));
  }
}
