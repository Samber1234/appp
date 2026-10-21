import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.css',
})
export class RecuperarPassword {

  constructor(private router: Router) {}

  cancelar() {
    // Te devuelve al login sin hacer nada
    this.router.navigate(['/login']);
  }

  resetearPassword() {
    // Simula el envío del correo y te devuelve al login
    alert('[Demo UI]: Se ha enviado un enlace de recuperación a tu correo electrónico.');
    this.router.navigate(['/login']);
  }
}