import { Component } from '@angular/core';

@Component({
  selector: 'app-configuracion',
  imports: [],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion {
// Método demostrativo para mostrar interacción en los botones
  mostrarMensaje(accion: string) {
    alert(`[Dashboard Administrativo]: ${accion}. `);
  }
}
