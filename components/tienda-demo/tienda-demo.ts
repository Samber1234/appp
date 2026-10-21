import { Component, afterNextRender, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tienda-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tienda-demo.html',
  styleUrls: ['./tienda-demo.css'],
})
export class TiendaDemo {
  mostrarAlerta: boolean = false;
  verDetalles: boolean = false;
  logEventos: string[] = [];
  private timerIA: any; // Guardamos la referencia para controlarlo

  constructor(private cdr: ChangeDetectorRef) {
    afterNextRender(() => {
      this.logEventos.push("Motor IA: Sistema activo. Esperando actividad.");
    });
  }

  verDetallesLaptop() {
    this.verDetalles = true;
    this.logEventos.push("Motor IA: Usuario analizando ficha técnica.");
    this.cdr.detectChanges();

    // Lanzamos la IA al entrar a detalles
    this.iniciarMonitoreoIA();
  }

  iniciarMonitoreoIA() {
    // Si ya había un timer, lo limpiamos para no tener conflictos
    if (this.timerIA) clearTimeout(this.timerIA);

    this.logEventos.push("Motor IA: Monitoreo de inactividad iniciado (8s)...");
    
    this.timerIA = setTimeout(() => {
      // Forzamos la lógica: si estamos en detalles, disparamos
      if (this.verDetalles) {
        this.logEventos.push("Motor IA: ¡ALERTA! Riesgo de abandono detectado.");
        this.mostrarAlerta = true;
        this.cdr.detectChanges(); // <-- ¡Crucial para que Angular se entere!
      }
    }, 8000);
  }

  cerrarAlerta() { this.mostrarAlerta = false; }
  
  comprarOferta() {
    alert('¡Conversión exitosa!');
    this.mostrarAlerta = false;
  }
}