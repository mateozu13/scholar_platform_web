import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Observable, forkJoin, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Assignment } from '../models/assignment.model';
import { Submission } from '../models/submission.model';

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  private db = firebase.firestore();

  constructor() {}

  getPendingSubmissionsCount(): Observable<number> {
    // 1) Observable de snapshot de assignments
    const assignments$ = from(this.db.collection('assignments').get());

    // 2) Observable de snapshot de submissions
    const submissions$ = from(this.db.collection('submissions').get());

    // 3) Esperar a ambas peticiones y procesar en map()
    return forkJoin([assignments$, submissions$]).pipe(
      map(([assignSnap, subSnap]) => {
        // IDs de todos los assignments
        const allAssignmentIds = assignSnap.docs.map((doc) => doc.id);

        // IDs de assignment que ya tienen submission
        const submittedAssignmentIds = subSnap.docs.map((doc) => {
          const data = doc.data() as Submission;
          return data.assignmentId;
        });

        // Filtrar los assignments pendientes
        const pending = allAssignmentIds.filter(
          (aid) => !submittedAssignmentIds.includes(aid)
        );

        return pending.length;
      })
    );
  }

  getUploadedSubmissionsCount(): Observable<number> {
    // 1) Observable de snapshot de assignments
    const assignments$ = from(this.db.collection('assignments').get());

    // 2) Observable de snapshot de submissions
    const submissions$ = from(this.db.collection('submissions').get());

    // 3) Esperar a ambas peticiones y procesar en map()
    return forkJoin([assignments$, submissions$]).pipe(
      map(([assignSnap, subSnap]) => {
        // IDs de todos los assignments
        const allAssignmentIds = assignSnap.docs.map((doc) => doc.id);

        // IDs de assignment que ya tienen submission
        const submittedAssignmentIds = subSnap.docs.map((doc) => {
          const data = doc.data() as Submission;
          return data.assignmentId;
        });

        // Filtrar los assignments pendientes
        const pending = allAssignmentIds.filter((aid) =>
          submittedAssignmentIds.includes(aid)
        );

        return pending.length;
      })
    );
  }

  /**
   * (Opcional) Si también quieres la lista de assignments pendientes:
   */
  getPendingAssignments(): Observable<Assignment[]> {
    const assignments$ = from(this.db.collection('assignments').get());
    const submissions$ = from(this.db.collection('submissions').get());

    return forkJoin([assignments$, submissions$]).pipe(
      map(([assignSnap, subSnap]) => {
        const submittedIds = subSnap.docs.map(
          (d) => (d.data() as Submission).assignmentId
        );
        return assignSnap.docs
          .filter((doc) => !submittedIds.includes(doc.id))
          .map((doc) => ({ id: doc.id, ...(doc.data() as Assignment) }));
      })
    );
  }

  getDeliveredCountsByCourse(courseIds: string[]): Observable<number[]> {
    return this.computeCountsMap(courseIds).pipe(
      map((countsMap) => courseIds.map((cid) => countsMap[cid]?.delivered || 0))
    );
  }

  /**
   * Obtiene, para cada courseId dado, un array con el número de assignments pendientes (sin submissions).
   * @param courseIds Lista de IDs de cursos a consultar.
   */
  getPendingCountsByCourse(courseIds: string[]): Observable<number[]> {
    return this.computeCountsMap(courseIds).pipe(
      map((countsMap) => courseIds.map((cid) => countsMap[cid]?.pending || 0))
    );
  }

  /**
   * Lógica interna: lee assignments y submissions, agrupa por curso y calcula delivered/pending.
   */
  private computeCountsMap(courseIds: string[]): Observable<{
    [courseId: string]: { delivered: number; pending: number };
  }> {
    // 1. Leer todos los assignments de esos cursos
    const assignmentsQuery = this.db
      .collection('assignments')
      .where('courseId', 'in', courseIds)
      .get();

    // 2. Leer todas las submissions (no filtramos por curso para simplificar)
    const submissionsQuery = this.db.collection('submissions').get();

    return forkJoin([from(assignmentsQuery), from(submissionsQuery)]).pipe(
      map(([assignSnap, subSnap]) => {
        // Mapeo: courseId → lista de assignmentIds
        const assignmentsByCourse: Record<string, string[]> = {};
        assignSnap.docs.forEach((doc) => {
          const a = doc.data() as Assignment;
          assignmentsByCourse[a.courseId] =
            assignmentsByCourse[a.courseId] || [];
          assignmentsByCourse[a.courseId].push(doc.id);
        });

        // Conjunto de assignmentIds que ya tienen submission
        const submittedIds = new Set<string>();
        subSnap.docs.forEach((doc) => {
          const s = doc.data() as Submission;
          submittedIds.add(s.assignmentId);
        });

        // Construir el mapa de resultados
        const countsMap: Record<
          string,
          { delivered: number; pending: number }
        > = {};
        courseIds.forEach((cid) => {
          const aids = assignmentsByCourse[cid] || [];
          const delivered = aids.filter((id) => submittedIds.has(id)).length;
          const pending = aids.length - delivered;
          countsMap[cid] = { delivered, pending };
        });

        return countsMap;
      })
    );
  }
}
