import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // <-- ¡Aquí está la magia que faltaba!

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [FormsModule, CommonModule], // <-- Lo agregamos al arreglo de imports
  templateUrl: './alertas.html',
  styleUrls: ['./alertas.css']
})
export class Alertas {
  // Variables enlazadas al formulario
  titulo: string = '¡Oferta personalizada exclusiva para ti!';
  cuerpo: string = 'Hola {{user_name}}, detectamos interés en {{product_name}} y queremos ofrecerte un 30% de descuento en {{product_name}}';
  ctaTexto: string = 'Comprar ahora';
  colorAcento: string = '#198754'; // Verde por defecto
  tiempoMinimo: number = 200;
  interacciones: number = 3;
  frecuencia: number = 24;
  alertaActiva: boolean = true;

  // Esta función simula el motor de IA reemplazando las etiquetas
  get cuerpoPreview(): string {
    return this.cuerpo
      .replace(/\{\{user_name\}\}/g, 'Giancarlo')
      .replace(/\{\{product_name\}\}/g, 'Laptop Lenovo Gamer i5');
  }

  guardarPlantilla() {
    alert(`[Demo UI]: Plantilla "${this.titulo}" guardada y sincronizada con el canal Web B2C.`);
  }
}