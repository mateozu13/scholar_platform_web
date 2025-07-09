import { NgModule, APP_INITIALIZER } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
// Firebase compat
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { LoginComponent } from './login/login.component';
import { NgChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

// Angular Material modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSelectModule } from '@angular/material/select';
import { CoursesComponent } from './courses/courses.component';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { CourseDialogComponent } from './dialogs/course-dialog/course-dialog.component';
import { AssignProfessorDialogComponent } from './dialogs/assign-professor-dialog/assign-professor-dialog.component';
import { AssignStudentsDialogComponent } from './dialogs/assign-students-dialog/assign-students-dialog.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserDialogComponent } from './dialogs/user-dialog/user-dialog.component';
import { ProfileComponent } from './users/profile/profile.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { TruncatePipe } from './pipes/truncate.pipe';

export function initFirebase(): () => void {
  return () => {
    if (!firebase.apps.length) {
      firebase.initializeApp(environment.firebase);
    }
  };
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    CoursesComponent,
    CourseDialogComponent,
    AssignProfessorDialogComponent,
    AssignStudentsDialogComponent,
    UserListComponent,
    UserDialogComponent,
    ProfileComponent,
    ResetPasswordComponent,
    TruncatePipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgChartsModule,
    ReactiveFormsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    AngularFirestoreModule,
    AngularFireAuthModule,

    // Angular Material modules
    MatCardModule,
    MatFormFieldModule,
    MatListModule,
    MatDialogModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatGridListModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatSelectModule,
    MatInputModule,
    MatChipsModule,
    MatTooltipModule,
    MatIconModule,
    MatToolbarModule,
    MatPaginatorModule,
    MatButtonModule,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initFirebase,
      multi: true,
    },
    provideClientHydration(withEventReplay()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
