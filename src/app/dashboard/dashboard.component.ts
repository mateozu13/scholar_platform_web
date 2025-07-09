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
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false,
})
export class DashboardComponent implements OnInit {
  totalCourses: number = 0;
  totalUsers: number = 0;
  pendingSubmissions: number = 0;
  uploadedSubmissions: number = 0;
  activeCourses: number = 0;

  recentUsers: User[] = [];
  recentCourses: Course[] = [];

  rolesPieData!: ChartData<'pie', number[], string>;
  studentsBarData!: ChartData<'bar', number[], string>;
  tasksStackedData!: ChartData<'bar', number[], string>;
  messagesLineData!: ChartData<'line', number[], string>;

  tasksStackedOptions!: ChartOptions<'bar'>;
  messagesLineOptions!: ChartOptions<'line'>;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private courseService: CourseService,
    private submissionService: SubmissionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadSummaryData();
    this.loadCharts();
    this.loadRecentData();
  }

  loadSummaryData() {
    // Total de cursos
    this.courseService
      .getAllCourses()
      .pipe(take(1))
      .subscribe((courses) => {
        this.totalCourses = courses.length;
        this.activeCourses = courses.filter((c) => c.activo).length;
      });

    // Total de usuarios
    this.userService
      .getUsersCountByRole()
      .pipe(take(1))
      .subscribe((counts) => {
        this.totalUsers = counts.admin + counts.profesor + counts.estudiante;
      });

    // Entregas pendientes
    this.submissionService
      .getPendingSubmissionsCount()
      .pipe(take(1))
      .subscribe((count) => {
        this.pendingSubmissions = count;
      });

    // Entregas realizadas
    this.submissionService
      .getUploadedSubmissionsCount()
      .pipe(take(1))
      .subscribe((count) => {
        this.uploadedSubmissions = count;
      });
  }

  loadCharts() {
    // Gráfico de pastel: distribución de roles
    this.userService
      .getUsersCountByRole()
      .pipe(take(1))
      .subscribe((counts) => {
        this.rolesPieData = {
          labels: ['Administradores', 'Profesores', 'Estudiantes'],
          datasets: [
            {
              data: [counts.admin, counts.profesor, counts.estudiante],
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            },
          ],
        };
      });

    // Gráfico de barras: top cursos por estudiantes
    this.courseService
      .getTopCoursesByStudents(5)
      .pipe(take(1))
      .subscribe((courses) => {
        this.studentsBarData = {
          labels: courses.map((c) => c.titulo),
          datasets: [
            {
              label: 'Estudiantes',
              data: courses.map((c) => c.estudiantesCount),
              backgroundColor: '#4CAF50',
            },
          ],
        };
      });

    // Gráfico de barras apiladas: estado de tareas (entregadas vs pendientes)
    this.courseService
      .getAllCourses()
      .pipe(take(1))
      .subscribe((courses) => {
        const courseNames = courses.map((c) => c.titulo);
        const courseIds = courses.map((c) => c.id);

        // Obtenemos datos entregados y pendientes en paralelo
        forkJoin({
          delivered:
            this.submissionService.getDeliveredCountsByCourse(courseIds),
          pending: this.submissionService.getPendingCountsByCourse(courseIds),
        })
          .pipe(take(1))
          .subscribe(({ delivered, pending }) => {
            this.tasksStackedData = {
              labels: courseNames,
              datasets: [
                {
                  label: 'Entregadas',
                  data: delivered,
                  backgroundColor: '#36A2EB',
                },
                {
                  label: 'Pendientes',
                  data: pending,
                  backgroundColor: '#FF6384',
                },
              ],
            };
            this.tasksStackedOptions = {
              responsive: true,
              scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true },
              },
            };
          });
      });

    // Gráfico de línea: actividad de mensajes
    this.messageService
      .getDailyMessageCounts(7)
      .pipe(take(1))
      .subscribe((counts) => {
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
            {
              label: 'Mensajes',
              data: counts,
              fill: false,
              borderColor: '#FFCE56',
              tension: 0.3,
            },
          ],
        };

        this.messagesLineOptions = {
          responsive: true,
          scales: { y: { beginAtZero: true } },
        };
      });
  }

  loadRecentData() {
    // Últimos usuarios registrados
    this.userService
      .getRecentUsers(5)
      .pipe(take(1))
      .subscribe((users) => {
        this.recentUsers = users;
      });

    // Últimos cursos creados
    this.courseService
      .getRecentCourses(5)
      .pipe(take(1))
      .subscribe((courses) => {
        this.recentCourses = courses;
      });
  }

  logout(): void {
    this.authService.logout();
  }

  formatDate(date: any): string {
    if (!date) return 'No disponible';

    let jsDate: Date;
    if (date.seconds !== undefined && date.nanoseconds !== undefined) {
      jsDate = new Date(date.seconds * 1000 + date.nanoseconds / 1000000);
    } else if (date instanceof Date) {
      jsDate = date;
    } else {
      jsDate = new Date(date);
    }

    if (isNaN(jsDate.getTime())) return 'No disponible';

    return jsDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    return parts
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getAvatarColor(name: string): string {
    if (!name) return '#3f51b5'; // Color por defecto
    const colors = [
      '#3f51b5',
      '#673ab7',
      '#009688',
      '#ff5722',
      '#e91e63',
      '#2196f3',
    ];
    const index = (name.charCodeAt(0) + (name.length || 0)) % colors.length;
    return colors[index];
  }
}
