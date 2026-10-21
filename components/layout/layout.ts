import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive], // Necesario para la navegación interna
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class Layout {}