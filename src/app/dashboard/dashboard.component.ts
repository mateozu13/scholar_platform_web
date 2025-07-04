import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { CourseService } from '../services/course.service';
import { SubmissionService } from '../services/submission.service';
import { MessageService } from '../services/message.service';

import { ChartData, ChartOptions } from 'chart.js';
import { take } from 'rxjs/operators';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false,
})
export class DashboardComponent implements OnInit {
  totalCourses: number = 0;
  userCounts = { admin: 0, profesor: 0, estudiante: 0 };
  lateSubmissionsCount: number = 0;
  avgMessagesPerDay7d: number = 0;

  topCourses: Course[] = [];
  recentUsers: User[] = [];

  tasksStackedOptions!: ChartOptions<'bar'>;
  messagesLineOptions!: ChartOptions<'line'>;
  rolesPieData!: ChartData<'pie', number[], string>;
  studentsBarData!: ChartData<'bar', number[], string>;
  tasksStackedData!: ChartData<'bar', number[], string>;
  gradesBarData!: ChartData<'bar', number[], string>;
  messagesLineData!: ChartData<'line', number[], string>;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private courseService: CourseService,
    private submissionService: SubmissionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.courseService
      .getAllCourses()
      .pipe(take(1))
      .subscribe((courses) => {
        this.totalCourses = courses.length;
        // Top 5 cursos con más estudiantes
        this.topCourses = [...courses]
          .sort((a, b) => b.estudiantesCount - a.estudiantesCount)
          .slice(0, 5);
        // Gráfico de barras: número de estudiantes por curso (top 5)
        const topNames = this.topCourses.map((c) => c.titulo);
        const topCounts = this.topCourses.map((c) => c.estudiantesCount);
        this.studentsBarData = {
          labels: topNames,
          datasets: [{ label: 'Estudiantes', data: topCounts }],
        };
        // Gráfico de barras apiladas: entregas vs pendientes por curso
        const courseNames = courses.map((c) => c.titulo);
        const delivered = courses.map((c) => c.deliveredSubmissions || 0);
        const pending = courses.map((c) => c.pendingSubmissions || 0);
        this.tasksStackedData = {
          labels: courseNames,
          datasets: [
            { label: 'Entregadas', data: delivered, stack: 'total' },
            { label: 'Pendientes', data: pending, stack: 'total' },
          ],
        };
        this.tasksStackedOptions = {
          responsive: true,
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true },
          },
        };
        // Gráfico de barras: promedio de calificaciones por curso
        const avgGrades = courses.map((c) => c.avgGrade || 0);
        this.gradesBarData = {
          labels: courseNames,
          datasets: [{ label: 'Promedio', data: avgGrades }],
        };
      });

    this.userService
      .getUsersCountByRole()
      .pipe(take(1))
      .subscribe((counts) => {
        this.userCounts = counts;
        // Gráfico de pastel: proporción de usuarios por rol
        this.rolesPieData = {
          labels: ['Administradores', 'Profesores', 'Estudiantes'],
          datasets: [
            { data: [counts.admin, counts.profesor, counts.estudiante] },
          ],
        };
      });

    // Cargar lista de últimos 5 usuarios logueados
    this.userService
      .getRecentUsers(5)
      .pipe(take(1))
      .subscribe((users) => {
        this.recentUsers = users;
      });

    // Cargar cantidad de entregas tardías
    this.submissionService
      .getLateSubmissionsCount()
      .pipe(take(1))
      .subscribe((count) => {
        this.lateSubmissionsCount = count;
      });

    // Cargar datos de mensajes de los últimos 7 días
    this.messageService
      .getDailyMessageCounts(7)
      .pipe(take(1))
      .subscribe((counts) => {
        const totalMessages = counts.reduce((sum, num) => sum + num, 0);
        this.avgMessagesPerDay7d = counts.length
          ? Number((totalMessages / counts.length).toFixed(2))
          : 0;
        // Gráfico de línea: mensajes por día (últimos 7 días)
        const today = new Date();
        const labels = counts.map((_, i) => {
          const date = new Date();
          date.setDate(today.getDate() - (counts.length - 1 - i));
          return date.toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric',
          });
        });
        this.messagesLineData = {
          labels: labels,
          datasets: [
            { label: 'Mensajes', data: counts, fill: false, tension: 0.3 },
          ],
        };
        this.messagesLineOptions = {
          responsive: true,
          scales: { y: { beginAtZero: true } },
        };
      });
  }

  logout(): void {
    this.authService.logout();
  }

  formatDate(date: any): string {
    if (!date) {
      return 'No disponible';
    }

    let jsDate: Date;

    if (date.seconds !== undefined && date.nanoseconds !== undefined) {
      const millis = date.seconds * 1000 + Math.floor(date.nanoseconds / 1e6);
      jsDate = new Date(millis);
    } else {
      jsDate = new Date(date);
    }

    if (isNaN(jsDate.getTime())) {
      return 'No disponible';
    }

    return jsDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
  }
}
