import { Routes } from '@angular/router';
import { App } from './app';
import { InicioComponent } from './pages/inicio/inicio';
import { SalaComponent } from './pages/sala/sala';
import { LlamadaComponent } from './pages/llamada/llamada';
import { DatasetComponent } from './pages/dataset/dataset';
import { LoginComponent } from './pages/login/login';
import { RegistroComponent } from './pages/registro/registro';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'inicio'
  },
  {
    path: 'inicio',
    component: InicioComponent,
    title: 'SignaText | Inicio'
  },
  {
    path: 'traductor',
    component: App,
    title: 'SignaText | Traductor local'
  },
  {
    path: 'sala',
    component: SalaComponent,
    title: 'SignaText | Sala privada'
  },
  {
    path: 'llamada',
    component: LlamadaComponent,
    title: 'SignaText | Videollamada'
  },
  {
    path: 'dataset',
    component: DatasetComponent,
    title: 'SignaText | Recolección de dataset'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'SignaText | Iniciar sesión'
  },
  {
    path: 'registro',
    component: RegistroComponent,
    title: 'SignaText | Crear cuenta'
  },
  {
    path: '**',
    redirectTo: 'inicio'
  }
];
