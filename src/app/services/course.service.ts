// src/app/services/course.service.ts
import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Course } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CourseService {
  // Referencia a la colección de cursos
  private coursesCol = firebase.firestore().collection('courses');

  /**
   * Devuelve un Observable que emite en tiempo real la lista de cursos.
   */
  getCourses(): Observable<Course[]> {
    return new Observable<Course[]>((subscriber) => {
      const unsubscribe = this.coursesCol.onSnapshot(
        (snapshot) => {
          const courses = snapshot.docs.map((doc) => {
            const course = doc.data() as Course;
            return course;
          });
          subscriber.next(courses);
        },
        (error) => subscriber.error(error)
      );
      // teardown logic
      return () => unsubscribe();
    });
  }

  /**
   * Trae todos los cursos **una sola vez** (no en tiempo real).
   */
  getAllCourses(): Observable<Course[]> {
    return from(this.coursesCol.get()).pipe(
      map((snapshot) =>
        snapshot.docs.map((doc) => {
          const c = doc.data() as any;
          return {
            id: doc.id,
            titulo: c.titulo,
            descripcion: c.descripcion,
            profesorId: c.profesorId,
            profesorNombre: c.profesorNombre,
            estudiantes: c.estudiantes || [],
            estudiantesCount: c.estudiantes?.length ?? c.estudiantesCount ?? 0,
            fechaInicio: c.fechaInicio?.toDate?.() ?? c.fechaInicio ?? null,
            fechaFin: c.fechaFin?.toDate?.() ?? c.fechaFin ?? null,
            nivel: c.nivel,
            imagenUrl: c.imagenUrl,
            assignmentsCount: c.assignmentsCount ?? 0,
            completedAssignments: c.completedAssignments ?? 0,
            deliveredSubmissions: c.deliveredSubmissions ?? 0,
            pendingSubmissions: c.pendingSubmissions ?? 0,
            avgGrade: c.avgGrade ?? 0,
            activo: c.activo ?? true,
          } as Course;
        })
      )
    );
  }

  /**
   * Devuelve los N cursos con mayor número de estudiantes.
   */
  getTopCoursesByStudents(limitCount: number): Observable<Course[]> {
    return from(
      this.coursesCol
        .orderBy('estudiantesCount', 'desc')
        .limit(limitCount)
        .get()
    ).pipe(
      map((snapshot) =>
        snapshot.docs.map((doc) => {
          const c = doc.data() as any;
          return {
            id: doc.id,
            titulo: c.titulo,
            estudiantes: c.estudiantes || [],
            estudiantesCount: c.estudiantes?.length ?? c.estudiantesCount ?? 0,
          } as Course;
        })
      )
    );
  }

  /**
   * Crea un nuevo curso.
   * Asigna un ID automático y lo devuelve con la promesa.
   */
  async createCourse(course: Course): Promise<void> {
    const docRef = this.coursesCol.doc(); // ID generado por Firestore
    course.id = docRef.id;
    return docRef.set(course);
  }

  /**
   * Actualiza un curso existente (solo los campos parciales que pases).
   */
  async updateCourse(id: string, data: Partial<Course>): Promise<void> {
    return this.coursesCol.doc(id).update(data);
  }

  /**
   * Elimina un curso por su ID.
   */
  async deleteCourse(id: string): Promise<void> {
    return this.coursesCol.doc(id).delete();
  }
}
