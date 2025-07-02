import './polyfills';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
// import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

if (environment.production) {
  enableProdMode();
}

// Inicializa la App de Firebase con la config de environments
firebase.initializeApp(environment.firebase);

// bootstrapApplication(AppComponent, {
//   providers: [provideCharts(withDefaultRegisterables())],
// }).catch((err) => console.error(err));

// Arranca Angular
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
