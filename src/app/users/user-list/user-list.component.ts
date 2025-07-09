import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { UserDialogComponent } from '../../dialogs/user-dialog/user-dialog.component';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: false,
})
export class UserListComponent implements OnInit {
  displayedColumns = [
    'creado',
    'nombre',
    'email',
    'rol',
    'cursosInscritos',
    'cursosDictados',
    'active',
    'acciones',
  ];
  dataSource = new MatTableDataSource<User>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private courseService: CourseService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      // 1) Carga todos los usuarios
      const users: User[] = await this.userService.getAllUsers();

      // 2) Extrae los IDs
      const userIds = users.map((u) => u.id);

      // 3) Llama al service para obtener dos arrays de counts
      this.courseService
        .getCourseCountsForUsers(userIds)
        .pipe(take(1))
        .subscribe(({ dictados, inscritos }) => {
          // 4) Asigna a cada usuario sus contadores
          users.forEach((u, idx) => {
            u.cursosDictadosCount = dictados[idx];
            u.cursosInscritosCount = inscritos[idx];
          });

          // 5) Ahora inicializa tu dataSource
          this.dataSource.data = users;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.dataSource.filterPredicate = (u: User, f: string) => {
            const term = f.trim().toLowerCase();
            return (
              u.nombre.toLowerCase().includes(term) ||
              u.email.toLowerCase().includes(term) ||
              u.rol.toLowerCase().includes(term)
            );
          };
        });
    } catch (err) {
      console.error(err);
    }
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  createUser() {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '400px',
      data: { user: null },
    });
    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) this.loadUsers();
    });
  }

  editUser(user: User) {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '400px',
      data: { user: { ...user } },
    });
    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) this.loadUsers();
    });
  }

  async changeUserStatus(user: User) {
    if (!confirm(`Eliminar usuario "${user.nombre}"?`)) return;
    try {
      await this.userService.updateUser(user.id, { active: !user.active });
      const state = user.active ? 'inactivado' : 'activado';
      this.snack.open(`Usuario ${state}`, '', { duration: 4000 });
      this.loadUsers();
    } catch (err) {
      console.error(err);
      this.snack.open('Error al eliminar', '', { duration: 4000 });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
