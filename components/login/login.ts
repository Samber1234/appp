import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  constructor(private router: Router) {}

  ingresar() {
    // Redirige a la ruta hija definida en tu app.routes.ts
    this.router.navigate(['/app/inicio']);
  }

  irRecuperar() {
    this.router.navigate(['/recuperar']);
  }
}