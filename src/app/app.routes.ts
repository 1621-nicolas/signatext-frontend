import { Routes } from '@angular/router';
import { App } from './app';
import { InicioComponent } from './pages/inicio/inicio';
import { SalaComponent } from './pages/sala/sala';
import { LlamadaComponent } from './pages/llamada/llamada';

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
    path: '**',
    redirectTo: 'inicio'
  }
];
