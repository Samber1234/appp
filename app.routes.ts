import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { RecuperarPassword } from './components/recuperar-password/recuperar-password';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { Configuracion } from './components/configuracion/configuracion';
import { Alertas } from './components/alertas/alertas';
import { TiendaDemo } from './components/tienda-demo/tienda-demo';
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'recuperar', component: RecuperarPassword },
  { path: 'tienda', component: TiendaDemo },
  { 
    path: 'app', 
    component: Layout, // El layout contiene el menú superior
    children: [
      { path: 'inicio', component: Dashboard },
      { path: 'configuracion', component: Configuracion },
      { path: 'alertas', component: Alertas },
    ]
  }
];