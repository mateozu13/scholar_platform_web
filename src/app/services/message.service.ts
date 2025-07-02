import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MessageService {
  // Conteo de mensajes por día en los últimos `days` días
  getDailyMessageCounts(days: number): Observable<number[]> {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days + 1);

    return from(
      firebase
        .firestore()
        .collection('messages')
        .where('timestamp', '>=', startDate)
        .get()
    ).pipe(
      map((snapshot) => {
        const counts = Array(days).fill(0);
        snapshot.docs.forEach((doc) => {
          const data = doc.data() as any;
          // `data.timestamp` es un Timestamp de Firestore
          const date: Date = data.timestamp.toDate();
          const diff = Math.floor(
            (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diff < days) {
            // Índice: 0 = hace days-1 días, último = hoy
            counts[days - diff - 1]++;
          }
        });
        return counts;
      })
    );
  }
}
