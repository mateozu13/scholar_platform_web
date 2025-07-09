import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MessageService {
  constructor() {}

  getDailyMessageCounts(days: number): Observable<number[]> {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    return from(
      firebase
        .firestore()
        .collectionGroup('messages')
        .where(
          'timestamp',
          '>=',
          firebase.firestore.Timestamp.fromDate(startDate)
        )
        .get()
    ).pipe(
      map((snapshot) => {
        const counts = new Array(days).fill(0);
        snapshot.docs.forEach((doc) => {
          const message = doc.data() as any;
          const date = message.timestamp.toDate();
          const dayIndex = Math.floor(
            (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (dayIndex >= 0 && dayIndex < days) {
            counts[dayIndex]++;
          }
        });
        return counts;
      })
    );
  }
}
