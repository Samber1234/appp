// ============================================================================
// TechNova Store Perú - Catálogo Tecnológico B2C (6 Categorías / 72 Productos)
// Integrado al 100% con el SDK Predictivo de Ofertas con IA (GRU + XGBoost)
// ============================================================================

let cart = [];
let appliedDiscount = 0;
let appliedCouponCode = null;
let couponUsedInSession = sessionStorage.getItem('tn_coupon_redeemed_RT-001') === 'true';
let currentCategoryFilter = 'ALL';
let currentSearchQuery = '';

const CATALOG_ITEMS = [
  // ==========================================================================
  // CATEGORÍA 1: Laptops & Ultrabooks (12 Productos)
  // ==========================================================================
  { sku: 'LENOVO-G5', name: 'Laptop Lenovo Gamer i5 13va Gen', category: 'Laptops & Ultrabooks', price: 4199.00, stock: 15, aiRecommended: true, spec1: 'NVIDIA RTX 4060 8GB GDDR6', spec2: '16GB DDR5 | 512GB SSD | 15.6" 144Hz', desc: 'Equilibrio superior para gaming competitivo y creación de contenido con arquitectura Intel Core de 13va generación.' },
  { sku: 'ASUS-ROG', name: 'Laptop ASUS ROG Strix G16 Intel i7', category: 'Laptops & Ultrabooks', price: 5899.00, stock: 9, aiRecommended: false, spec1: 'NVIDIA RTX 4070 8GB GDDR6', spec2: '16GB DDR5 | 1TB SSD | 16" 165Hz', desc: 'Chasis deportivo ROG con refrigeración líquida de metal Conductonaut Extreme y pantalla Nebula Display.' },
  { sku: 'HP-VICTUS', name: 'Laptop HP Victus 15 AMD Ryzen 5', category: 'Laptops & Ultrabooks', price: 3249.00, stock: 22, aiRecommended: false, spec1: 'NVIDIA RTX 3050 6GB', spec2: '16GB RAM | 512GB SSD | 15.6" FHD', desc: 'Diseño sobrio y térmico mejorado OMEN Gaming Hub ideal para estudios de ingeniería y gaming en 1080p.' },
  { sku: 'MSI-CYBORG', name: 'Laptop MSI Cyborg 15 Intel Core i5', category: 'Laptops & Ultrabooks', price: 3899.00, stock: 14, aiRecommended: true, spec1: 'NVIDIA RTX 4050 6GB DLSS 3', spec2: '16GB DDR5 | 512GB NVMe | 144Hz', desc: 'Chasis translúcido ciberpunk ultraligero de 1.98 kg con aceleración por IA NVIDIA DLSS 3.' },
  { sku: 'MACBOOK-M3-PRO', name: 'Apple MacBook Pro 14" Chip M3 Pro', category: 'Laptops & Ultrabooks', price: 8499.00, stock: 8, aiRecommended: true, spec1: 'Apple M3 Pro (11 CPU / 14 GPU)', spec2: '18GB Memoria Unificada | 512GB SSD', desc: 'Pantalla Liquid Retina XDR ProMotion de 120Hz y autonomía de hasta 18 horas para desarrollo profesional.' },
  { sku: 'DELL-XPS-15', name: 'Ultrabook Dell XPS 15 OLED Core Ultra 7', category: 'Laptops & Ultrabooks', price: 7299.00, stock: 6, aiRecommended: false, spec1: 'Intel Core Ultra 7 155H + NPU IA', spec2: '32GB LPDDR5x | 1TB SSD | OLED 3.5K', desc: 'Construida en aluminio mecanizado CNC y fibra de carbono con pantalla InfinityEdge OLED táctil.' },
  { sku: 'ACER-PREDATOR-16', name: 'Laptop Acer Predator Helios Neo 16 i7', category: 'Laptops & Ultrabooks', price: 5499.00, stock: 11, aiRecommended: false, spec1: 'NVIDIA RTX 4060 8GB 140W TGP', spec2: '16GB DDR5 | 1TB SSD | 16" WQXGA', desc: 'Ventiladores metálicos AeroBlade 3D de 5ta generación para sesiones intensivas sin throttling.' },
  { sku: 'LENOVO-LEGION-7I', name: 'Laptop Lenovo Legion Pro 7i Gen 9 i9', category: 'Laptops & Ultrabooks', price: 9699.00, stock: 5, aiRecommended: false, spec1: 'Intel Core i9-14900HX + RTX 4080', spec2: '32GB DDR5 5600MHz | 2TB SSD RAID', desc: 'Estación de batalla portátil impulsada por el chip dedicado Lenovo LA-2Q AI para ajuste dinámico de energía.' },
  { sku: 'ASUS-ZENBOOK-DUO', name: 'Ultrabook ASUS Zenbook OLED 14 Ultra 7', category: 'Laptops & Ultrabooks', price: 4799.00, stock: 17, aiRecommended: false, spec1: 'Intel Core Ultra 7 + Gráficos Arc', spec2: '16GB RAM | 1TB SSD | 14" 2.8K OLED', desc: 'Solo 1.2 kg de peso y 14.9 mm de grosor con certificación militar MIL-STD-810H.' },
  { sku: 'HP-OMEN-14', name: 'Laptop HP OMEN Transcend 14 OLED', category: 'Laptops & Ultrabooks', price: 6499.00, stock: 7, aiRecommended: false, spec1: 'NVIDIA RTX 4060 + Core Ultra 7', spec2: '16GB RAM | 1TB SSD | OLED 120Hz', desc: 'La laptop gamer de 14 pulgadas más ligera del mercado con teclado RGB HyperX.' },
  { sku: 'RAZER-BLADE-16', name: 'Laptop Razer Blade 16 Dual-Mode MiniLED', category: 'Laptops & Ultrabooks', price: 10899.00, stock: 4, aiRecommended: false, spec1: 'NVIDIA RTX 4080 12GB + i9-14900HX', spec2: '32GB DDR5 | 1TB SSD | UHD+ 120Hz', desc: 'Cuerpo unibody de aluminio anodizado con pantalla conmutable entre 4K 120Hz y FHD+ 240Hz.' },
  { sku: 'GIGABYTE-AORUS-15', name: 'Laptop Gigabyte AORUS 15 BKF i7', category: 'Laptops & Ultrabooks', price: 4999.00, stock: 12, aiRecommended: false, spec1: 'NVIDIA RTX 4060 8GB + i7-13700H', spec2: '16GB DDR5 | 1TB SSD | QHD 165Hz', desc: 'Tecnología de enfriamiento WINDFORCE Infinity y conmutador MUX integrado.' },

  // ==========================================================================
  // CATEGORÍA 2: Smartphones & Tablets (12 Productos)
  // ==========================================================================
  { sku: 'IPHONE-15-PM', name: 'Apple iPhone 15 Pro Max 256GB Titanio', category: 'Smartphones & Tablets', price: 5399.00, stock: 18, aiRecommended: true, spec1: 'Chip A17 Pro 3nm | Cámara 48MP 5x', spec2: '256GB | Pantalla Super Retina XDR 6.7"', desc: 'Estructura en titanio de grado aeroespacial con botón de Acción configurable y puerto USB-C 3.0.' },
  { sku: 'GALAXY-S24-ULTRA', name: 'Samsung Galaxy S24 Ultra 512GB 5G IA', category: 'Smartphones & Tablets', price: 5199.00, stock: 20, aiRecommended: false, spec1: 'Snapdragon 8 Gen 3 for Galaxy + Galaxy AI', spec2: '12GB RAM | 512GB | Cámara 200MP + S-Pen', desc: 'Integra traducción simultánea por IA, pantalla plana Gorilla Armor antirreflejo y marco de titanio.' },
  { sku: 'XIAOMI-14-ULTRA', name: 'Xiaomi 14 Ultra 512GB Óptica Leica', category: 'Smartphones & Tablets', price: 4699.00, stock: 10, aiRecommended: false, spec1: 'Lente Leica Summilux Apertura Variable', spec2: '16GB RAM | 512GB | Carga HyperCharge 90W', desc: 'Sensor principal Sony LYT-900 de 1 pulgada para fotografía móvil de nivel profesional.' },
  { sku: 'IPAD-PRO-M4-13', name: 'Apple iPad Pro 13" Chip M4 Ultra Retina', category: 'Smartphones & Tablets', price: 5699.00, stock: 9, aiRecommended: false, spec1: 'Chip Apple M4 (Motor Neural 38 TOPS)', spec2: '256GB | Pantalla Tandem OLED 120Hz', desc: 'Diseño ultradelgado de 5.1 mm con doble capa OLED de brillo extremo.' },
  { sku: 'GALAXY-TAB-S9U', name: 'Tablet Samsung Galaxy Tab S9 Ultra 14.6"', category: 'Smartphones & Tablets', price: 4499.00, stock: 8, aiRecommended: false, spec1: 'Dynamic AMOLED 2X 14.6" IP68', spec2: '12GB RAM | 512GB | Incluye S-Pen + Teclado', desc: 'Resistencia al agua IP68 y multitarea Samsung DeX para reemplazar tu laptop.' },
  { sku: 'PIXEL-8-PRO', name: 'Google Pixel 8 Pro 256GB Obsidian', category: 'Smartphones & Tablets', price: 3799.00, stock: 11, aiRecommended: false, spec1: 'Procesador Google Tensor G3 + IA Gemini', spec2: '12GB RAM | 256GB | Super Actua OLED 120Hz', desc: 'Fotografía computacional avanzada con Editor Mágico y 7 años de actualizaciones.' },
  { sku: 'HONOR-MAGIC6-PRO', name: 'Honor Magic6 Pro 5G 512GB Falcon Camera', category: 'Smartphones & Tablets', price: 3999.00, stock: 13, aiRecommended: false, spec1: 'Teleobjetivo Periscópico 180MP + SD 8 Gen 3', spec2: '12GB RAM | 512GB | Batería Silicio-Carbono 5600mAh', desc: 'Batería de ultra larga duración y escudo NanoCrystal resistente a caídas.' },
  { sku: 'MOTO-EDGE-50U', name: 'Motorola Edge 50 Ultra 512GB Madera/Vegan', category: 'Smartphones & Tablets', price: 3499.00, stock: 15, aiRecommended: false, spec1: 'Snapdragon 8s Gen 3 | Carga TurboPower 125W', spec2: '16GB RAM | 512GB | Pantalla pOLED 144Hz', desc: 'Colores validados por Pantone en cámara y pantalla con carga completa en 19 minutos.' },
  { sku: 'IPAD-AIR-M2', name: 'Apple iPad Air 11" Chip M2 Wi-Fi 256GB', category: 'Smartphones & Tablets', price: 3199.00, stock: 19, aiRecommended: false, spec1: 'Chip Apple M2 de 8 núcleos', spec2: '256GB | Liquid Retina True Tone', desc: 'Compatible con Apple Pencil Pro y Magic Keyboard para diseño y toma de apuntes.' },
  { sku: 'ONEPLUS-12-5G', name: 'OnePlus 12 5G 512GB Hasselblad', category: 'Smartphones & Tablets', price: 3699.00, stock: 10, aiRecommended: false, spec1: 'Snapdragon 8 Gen 3 + Cámara Hasselblad 4ta Gen', spec2: '16GB LPDDR5X | 512GB UFS 4.0 | 100W SUPERVOOC', desc: 'Pantalla ProXDR 2K 120Hz con brillo pico de 4500 nits y cámara de vapor Dual Cryo-Velocity.' },
  { sku: 'REALME-GT6', name: 'Smartphone Realme GT 6 5G 512GB AI Flagship', category: 'Smartphones & Tablets', price: 2499.00, stock: 24, aiRecommended: false, spec1: 'Snapdragon 8s Gen 3 + Sensor Sony LYT-808', spec2: '16GB RAM | 512GB | Carga 120W SuperVOOC', desc: 'Visión nocturna por IA y pantalla hiperbrillante de 6000 nits.' },
  { sku: 'REDMI-PAD-PRO', name: 'Tablet Xiaomi Redmi Pad Pro 12.1" 2.5K', category: 'Smartphones & Tablets', price: 1299.00, stock: 30, aiRecommended: false, spec1: 'Snapdragon 7s Gen 2 | Pantalla 120Hz Dolby Vision', spec2: '8GB RAM | 256GB | Batería 10,000 mAh', desc: 'Cuatro altavoces estéreo Dolby Atmos e interconectividad Xiaomi HyperOS.' },

  // ==========================================================================
  // CATEGORÍA 3: Componentes PC & GPUs (12 Productos)
  // ==========================================================================
  { sku: 'GPU-RTX-4090', name: 'Tarjeta de Video ASUS ROG Strix RTX 4090 24GB', category: 'Componentes PC & GPUs', price: 8999.00, stock: 4, aiRecommended: false, spec1: '16,384 núcleos CUDA | 24GB GDDR6X', spec2: 'DLSS 3.5 Ray Reconstruction | Triple Fan Axial', desc: 'La GPU definitiva para entrenamiento local de modelos LLM, renderizado 3D y gaming en 4K/8K.' },
  { sku: 'GPU-RTX-4070TIS', name: 'Tarjeta de Video MSI Gaming X Slim RTX 4070 Ti Super', category: 'Componentes PC & GPUs', price: 3999.00, stock: 12, aiRecommended: false, spec1: '16GB GDDR6X (Bus 256-bit) | Arquitectura Ada', spec2: 'TRI FROZR 3 | PCIe 4.0 | HDMI 2.1a', desc: 'Excelente rendimiento en 1440p y 4K con 16GB de VRAM ideales para edición y gaming moderno.' },
  { sku: 'CPU-RYZEN-7800X3D', name: 'Procesador AMD Ryzen 7 7800X3D AM5 3D V-Cache', category: 'Componentes PC & GPUs', price: 1849.00, stock: 16, aiRecommended: false, spec1: '8 Núcleos / 16 Hilos hasta 5.0 GHz', spec2: '104MB Caché Total (3D V-Cache) | Socket AM5', desc: 'El procesador para gaming más eficiente y veloz del mercado con tecnología AMD 3D V-Cache.' },
  { sku: 'CPU-I9-14900K', name: 'Procesador Intel Core i9-14900K 6.0GHz LGA1700', category: 'Componentes PC & GPUs', price: 2499.00, stock: 10, aiRecommended: false, spec1: '24 Núcleos (8P + 16E) / 32 Hilos', spec2: 'Frecuencia Turbo 6.0 GHz | 36MB Intel Smart Cache', desc: 'Potencia bruta multitarea para compilación de código, virtualización y streaming.' },
  { sku: 'MB-ROG-Z790', name: 'Placa Madre ASUS ROG Maximus Z790 Dark Hero', category: 'Componentes PC & GPUs', price: 2599.00, stock: 7, aiRecommended: false, spec1: 'Socket LGA1700 | 20+1+2 Fases de Poder 90A', spec2: 'DDR5 8000+ MT/s | PCIe 5.0 | Wi-Fi 7 integrado', desc: 'Overclocking por IA, conectividad Thunderbolt 4 dual y disipadores M.2 masivos.' },
  { sku: 'RAM-CORSAIR-64', name: 'Memoria RAM Corsair Vengeance RGB 64GB (2x32GB) DDR5', category: 'Componentes PC & GPUs', price: 1099.00, stock: 25, aiRecommended: false, spec1: '6000MHz CL30 | Perfiles Intel XMP 3.0 y AMD EXPO', spec2: 'Disipador Aluminio Anodizado | 10 LEDs RGB dinámicos', desc: 'Baja latencia CL30 optimizada para plataformas de última generación Intel y AMD.' },
  { sku: 'SSD-990-PRO-2TB', name: 'SSD M.2 NVMe Samsung 990 PRO 2TB PCIe 4.0', category: 'Componentes PC & GPUs', price: 799.00, stock: 32, aiRecommended: false, spec1: 'Lectura 7,450 MB/s | Escritura 6,900 MB/s', spec2: '2TB NVMe M.2 2280 | Controlador recubierto en níquel', desc: 'Velocidad máxima en carga de texturas DirectStorage y transferencia de datasets pesados.' },
  { sku: 'AIO-NZXT-360', name: 'Refrigeración Líquida NZXT Kraken Elite 360 RGB', category: 'Componentes PC & GPUs', price: 1199.00, stock: 11, aiRecommended: false, spec1: 'Pantalla LCD IPS 2.36" personalizable (GIFs/Temp)', spec2: 'Radiador 360mm | Bomba Asetek 7ma Gen', desc: 'Mantén temperaturas bajo control con telemetría térmica en tiempo real en la pantalla del bloque.' },
  { sku: 'PSU-CORSAIR-1000', name: 'Fuente de Poder Corsair RM1000e 1000W 80+ Gold ATX 3.0', category: 'Componentes PC & GPUs', price: 749.00, stock: 19, aiRecommended: false, spec1: 'Certificación ATX 3.0 y PCIe 5.0 (Cable 12VHPWR)', spec2: '100% Modular | Condensadores 105°C | Modo Zero RPM', desc: 'Lista para soportar picos de energía de tarjetas gráficas serie RTX 4000 sin adaptadores.' },
  { sku: 'CASE-LIANLI-O11', name: 'Case Gamer Lian Li O11 Dynamic EVO RGB Cristal Templado', category: 'Componentes PC & GPUs', price: 729.00, stock: 14, aiRecommended: false, spec1: 'Diseño Doble Cámara Panorámico sin pilar frontal', spec2: 'Soporta hasta 3 radiadores de 360mm | Chasis Reversible', desc: 'Exhibición limpia de componentes con gestión oculta de cables y flujo de aire vertical.' },
  { sku: 'GPU-RX-7900XTX', name: 'Tarjeta de Video Sapphire NITRO+ AMD Radeon RX 7900 XTX', category: 'Componentes PC & GPUs', price: 4599.00, stock: 6, aiRecommended: false, spec1: '24GB GDDR6 | Arquitectura AMD RDNA 3', spec2: 'Cámara de Vapor Tri-X | Dual BIOS | ARGB', desc: '24GB de memoria dedicada con alto ancho de banda y salidas DisplayPort 2.1.' },
  { sku: 'SSD-WD-BLACK-4TB', name: 'SSD M.2 WD_BLACK SN850X 4TB NVMe con Disipador', category: 'Componentes PC & GPUs', price: 1499.00, stock: 9, aiRecommended: false, spec1: 'Lectura 7,300 MB/s | Game Mode 2.0', spec2: '4TB Capacidad | Compatible con PC y PS5', desc: 'Almacenamiento masivo de ultra velocidad con disipador térmico de perfil bajo.' },

  // ==========================================================================
  // CATEGORÍA 4: Monitores & Gaming (12 Productos)
  // ==========================================================================
  { sku: 'MON-LG-OLED27', name: 'Monitor Gamer LG UltraGear OLED 27" QHD 240Hz 0.03ms', category: 'Monitores & Gaming', price: 3499.00, stock: 10, aiRecommended: false, spec1: 'Panel OLED QHD (2560x1440) | 240Hz | 0.03ms GtG', spec2: 'NVIDIA G-SYNC Compatible | HDR10 |Contraste 1.5M:1', desc: 'Negros puros y tiempo de respuesta instantáneo de 0.03 ms para eSports.' },
  { sku: 'MON-ODYSSEY-G9', name: 'Monitor Curvo Samsung Odyssey OLED G9 49" Dual QHD', category: 'Monitores & Gaming', price: 5499.00, stock: 5, aiRecommended: false, spec1: '49" Super UltraWide 32:9 (5120x1440) 240Hz', spec2: 'Procesador Neo Quantum Pro | Curvatura 1800R', desc: 'Equivalente a dos monitores QHD de 27 pulgadas sin bordes intermedios.' },
  { sku: 'MON-ROG-PG32', name: 'Monitor ASUS ROG Swift OLED PG32UCDM 32" 4K 240Hz', category: 'Monitores & Gaming', price: 4999.00, stock: 6, aiRecommended: false, spec1: 'QD-OLED 3ra Gen 4K UHD | 240Hz | 0.03ms', spec2: 'Disipador personalizado con grafeno | USB-C 90W PD', desc: 'Calibración de color Delta E < 2 y protección inteligente ASUS OLED Care.' },
  { sku: 'CON-PS5-SLIM', name: 'Consola Sony PlayStation 5 Slim 1TB Edición Lectora', category: 'Monitores & Gaming', price: 2399.00, stock: 28, aiRecommended: false, spec1: 'SSD Ultra Rápido 1TB | Ray Tracing 4K 120Hz', spec2: 'Incluye mando inalámbrico DualSense con gatillos hápticos', desc: 'Nuevo diseño 30% más compacto con almacenamiento ampliado a 1TB.' },
  { sku: 'CON-XBOX-SX', name: 'Consola Microsoft Xbox Series X 1TB 4K 120FPS', category: 'Monitores & Gaming', price: 2299.00, stock: 15, aiRecommended: false, spec1: '12 Teraflops RDNA 2 | 1TB SSD NVMe personalizado', spec2: 'Quick Resume | Dolby Vision y Dolby Atmos', desc: 'Arquitectura Xbox Velocity para cambio instantáneo entre múltiples juegos.' },
  { sku: 'CON-SWITCH-OLED', name: 'Consola Nintendo Switch Modelo OLED 64GB Blanco', category: 'Monitores & Gaming', price: 1499.00, stock: 34, aiRecommended: false, spec1: 'Pantalla OLED vibrante de 7 pulgadas', spec2: 'Base con puerto LAN por cable | 64GB internos', desc: 'Juega en modo televisor, semiportátil con soporte ancho ajustable o portátil.' },
  { sku: 'CON-STEAM-OLED', name: 'Consola Portátil Valve Steam Deck OLED 1TB', category: 'Monitores & Gaming', price: 3199.00, stock: 8, aiRecommended: false, spec1: 'APU AMD Zen 2 + RDNA 2 en 6nm | Pantalla HDR OLED 90Hz', spec2: '1TB NVMe | Wi-Fi 6E | Batería 50Wh extendida', desc: 'Toda tu biblioteca de PC Steam en formato portátil con pantalla HDR OLED.' },
  { sku: 'VR-QUEST-3', name: 'Visor Realidad Mixta Meta Quest 3 512GB 4K+', category: 'Monitores & Gaming', price: 2699.00, stock: 12, aiRecommended: false, spec1: 'Chip Snapdragon XR2 Gen 2 | Lentes Pancake 4K+ Infinite', spec2: '512GB | Passthrough a todo color de alta resolución', desc: 'Realidad virtual y realidad mixta sin cables con mandos Touch Plus.' },
  { sku: 'MON-ALIENWARE-34', name: 'Monitor Curvo Alienware AW3423DWF 34" QD-OLED 165Hz', category: 'Monitores & Gaming', price: 3799.00, stock: 9, aiRecommended: false, spec1: 'WQHD (3440x1440) Curvo 1800R | 99.3% DCI-P3', spec2: 'AMD FreeSync Premium Pro | VESA DisplayHDR TrueBlack 400', desc: 'Inmersión cinematográfica 21:9 con tecnología de puntos cuánticos OLED.' },
  { sku: 'MON-ZOWIE-360', name: 'Monitor eSports BenQ ZOWIE XL2566K 24.5" 360Hz DyAc+', category: 'Monitores & Gaming', price: 2699.00, stock: 11, aiRecommended: false, spec1: 'Panel Fast TN 360Hz nativos | Tecnología DyAc+', spec2: 'Viseras laterales incluidas | S Switch de perfiles', desc: 'El monitor oficial de torneos internacionales de Counter-Strike y Valorant.' },
  { sku: 'CHAIR-SECRETLAB', name: 'Silla Ergonómica Gamer Secretlab TITAN Evo 2026', category: 'Monitores & Gaming', price: 2199.00, stock: 14, aiRecommended: false, spec1: 'Soporte lumbar L-ADAPT de 4 direcciones', spec2: 'Almohada magnética de espuma viscoelástica con gel frío', desc: 'Tapizado híbrido NEO resistente a 12 veces más desgaste que el cuero convencional.' },
  { sku: 'PAD-XBOX-ELITE2', name: 'Mando Inalámbrico Xbox Elite Wireless Controller Series 2', category: 'Monitores & Gaming', price: 699.00, stock: 21, aiRecommended: false, spec1: 'Palancas de tensión ajustable y 4 paletas traseras', spec2: 'Batería recargable 40h | Estuche de carga USB-C', desc: 'Bloqueo de gatillos de recorrido corto para disparos más rápidos en juegos FPS.' },

  // ==========================================================================
  // CATEGORÍA 5: Audio & Periféricos (12 Productos)
  // ==========================================================================
  { sku: 'AUD-SONY-XM5', name: 'Audífonos Inalámbricos Sony WH-1000XM5 Cancelación Ruido', category: 'Audio & Periféricos', price: 1399.00, stock: 26, aiRecommended: false, spec1: '8 Micrófonos + Doble Procesador ANC QN1 y V1', spec2: 'Audio Hi-Res LDAC | Batería 30h | Conexión Multipunto', desc: 'La cancelación activa de ruido líder de la industria con diseño ultraligero.' },
  { sku: 'MOU-LOGI-SUPER2', name: 'Mouse Gamer Inalámbrico Logitech G PRO X Superlight 2', category: 'Audio & Periféricos', price: 599.00, stock: 35, aiRecommended: false, spec1: 'Sensor HERO 2 32,000 DPI | Peso pluma 60 gramos', spec2: 'Switches híbridos óptico-mecánicos LIGHTFORCE | 2000Hz', desc: 'Desarrollado junto a profesionales de eSports para precisión absoluta sin cables.' },
  { sku: 'KB-RAZER-HUNTSMAN', name: 'Teclado Analógico Óptico Razer Huntsman V3 Pro TKL', category: 'Audio & Periféricos', price: 899.00, stock: 16, aiRecommended: false, spec1: 'Switches Ópticos Analógicos Gen-2 con Modo Rapid Trigger', spec2: 'Actuación ajustable 0.1mm a 4.0mm | Reposamuñecas magnético', desc: 'Modo Rapid Trigger para restablecimiento instantáneo de teclas en juegos competitivos.' },
  { sku: 'AUD-AIRPODS-PRO2', name: 'Apple AirPods Pro (2da Generación) con Estuche MagSafe USB-C', category: 'Audio & Periféricos', price: 999.00, stock: 40, aiRecommended: false, spec1: 'Chip Apple H2 | Audio Adaptativo y Espacial Personalizado', spec2: 'Resistencia IP54 al polvo y sudor | Hasta 30h con estuche', desc: 'Doble de cancelación activa de ruido y detección automática de conversación.' },
  { sku: 'AUD-HYPERX-CLOUD3', name: 'Headset Gamer Inalámbrico HyperX Cloud III Wireless', category: 'Audio & Periféricos', price: 629.00, stock: 22, aiRecommended: false, spec1: 'Hasta 120 horas de batería continua con una sola carga', spec2: 'Drivers angulados de 53mm | DTS Headphone:X Spatial Audio', desc: 'Comodidad legendaria HyperX con micrófono desmontable de 10mm con filtro de malla.' },
  { sku: 'SPK-JBL-CHARGE5', name: 'Parlante Portátil JBL Charge 5 Wi-Fi y Bluetooth IP67', category: 'Audio & Periféricos', price: 799.00, stock: 18, aiRecommended: false, spec1: 'Sonido JBL Original Pro con AirPlay, Alexa y Chromecast', spec2: '20 horas de reproducción | Powerbank integrado | IP67', desc: 'Conectividad dual Wi-Fi y Bluetooth sin interrupciones por llamadas.' },
  { sku: 'MIC-SHURE-MV7P', name: 'Micrófono Dinámico Shure MV7+ Podcast USB-C y XLR', category: 'Audio & Periféricos', price: 1149.00, stock: 12, aiRecommended: false, spec1: 'Salidas híbridas USB-C y XLR profesional | DSP integrado', spec2: 'Eliminador de ruido en tiempo real + Filtro Pop Digital', desc: 'Aislamiento de voz de estudio para streaming, conferencias ejecutivas y grabación.' },
  { sku: 'CAM-LOGI-BRIO4K', name: 'Webcam Profesional Logitech Brio 4K Ultra HD HDR', category: 'Audio & Periféricos', price: 729.00, stock: 19, aiRecommended: false, spec1: 'Resolución 4K UHD a 30fps o 1080p a 60fps | RightLight 3', spec2: 'Sensores infrarrojos para desbloqueo facial Windows Hello', desc: 'Campo visual ajustable de 65°, 78° o 90° con zoom digital HD 5x.' },
  { sku: 'KB-KEYCHRON-Q1P', name: 'Teclado Mecánico Custom Keychron Q1 Pro QMK/VIA Aluminio', category: 'Audio & Periféricos', price: 849.00, stock: 10, aiRecommended: false, spec1: 'Cuerpo completo en Aluminio CNC 6063 | Montaje Doble Junta', spec2: 'Hot-Swappable | Bluetooth 5.1 + Cableado | Teclas PBT', desc: 'Experiencia acústica premium totalmente programable mediante QMK y VIA.' },
  { sku: 'MOU-RAZER-VIPER3', name: 'Mouse Gamer Razer Viper V3 Pro Ultraligero 54g', category: 'Audio & Periféricos', price: 649.00, stock: 17, aiRecommended: false, spec1: 'Sensor Óptico Focus Pro 35K Gen-2 | HyperPolling 8000Hz', spec2: '54 gramos de peso | Hasta 95 horas de autonomía', desc: 'Incluye dongle inalámbrico Razer HyperPolling de 8000 Hz reales.' },
  { sku: 'AUD-BOSE-QCU', name: 'Audífonos Inalámbricos Bose QuietComfort Ultra Audio Inmersivo', category: 'Audio & Periféricos', price: 1599.00, stock: 9, aiRecommended: false, spec1: 'Tecnología CustomTune que calibra el sonido a tus oídos', spec2: 'Modo Inmersivo Espacial | Bluetooth 5.3 Snapdragon Sound', desc: 'Acabados de lujo y silencio absoluto para viajes y trabajo remoto.' },
  { sku: 'CTRL-STREAMDECK', name: 'Controlador de Estudio Elgato Stream Deck MK.2 15 Teclas LCD', category: 'Audio & Periféricos', price: 679.00, stock: 14, aiRecommended: false, spec1: '15 teclas LCD personalizables para macros y flujos de trabajo', spec2: 'Carátula intercambiable | Soporte desmontable 45 grados', desc: 'Automatiza escenas en OBS, atajos de programación, Zoom y control multimedia con un toque.' },

  // ==========================================================================
  // CATEGORÍA 6: Smart Home & Redes (12 Productos)
  // ==========================================================================
  { sku: 'NET-ROG-WIFI7', name: 'Router Gaming Cuatribanda ASUS ROG Rapture GT-BE98 Wi-Fi 7', category: 'Smart Home & Redes', price: 2699.00, stock: 6, aiRecommended: false, spec1: 'Estándar Wi-Fi 7 (802.11be) hasta 25,000 Mbps | Canales 320MHz', spec2: 'Doble puerto 10G + Cuatro puertos 2.5G | Aceleración Triple Nivel', desc: 'Red de latencia ultrabaja con modulación 4K-QAM y operación Multi-Link (MLO).' },
  { sku: 'NET-DECO-WIFI7', name: 'Sistema Mesh TP-Link Deco BE85 Wi-Fi 7 BE22000 (Pack x2)', category: 'Smart Home & Redes', price: 3299.00, stock: 8, aiRecommended: false, spec1: 'Cobertura total sin cortes hasta 600 m2 | Conecta +200 equipos', spec2: 'Backhaul combinado inalámbrico y cableado 10 Gbps / Fibra SFP+', desc: 'Roaming inteligente impulsado por IA que mantiene la máxima velocidad en toda la casa u oficina.' },
  { sku: 'SH-ECHO-SHOW10', name: 'Pantalla Inteligente Amazon Echo Show 10 (3ra Gen) Giro Automático', category: 'Smart Home & Redes', price: 999.00, stock: 15, aiRecommended: false, spec1: 'Pantalla HD de 10.1" con seguimiento silencioso de movimiento', spec2: 'Cámara 13MP con encuadre automático + Hub Zigbee integrado', desc: 'La pantalla gira automáticamente hacia ti durante videollamadas o al consultar recetas y cámaras.' },
  { sku: 'SH-ARLO-ULTRA2', name: 'Kit 2 Cámaras de Seguridad Inalámbricas Arlo Ultra 2 Spotlight 4K', category: 'Smart Home & Redes', price: 1899.00, stock: 10, aiRecommended: false, spec1: 'Video 4K UHD con HDR y Visión Nocturna a Color', spec2: 'Ángulo ultra amplio de 180° | Sirena inteligente integrada', desc: 'Detección por IA de personas, vehículos y paquetes con resistencia climática total.' },
  { sku: 'SH-ROBOROCK-S8', name: 'Robot Aspiradora y Trapeadora Roborock S8 Pro Ultra Autolavado', category: 'Smart Home & Redes', price: 4299.00, stock: 7, aiRecommended: false, spec1: 'Succión HyperForce 6000Pa + Doble cepillo DuoRoller Riser', spec2: 'Base RockDock Ultra: vacía polvo, lava mopa y seca con aire caliente', desc: 'Navegación láser LiDAR PreciSense y evasión reactiva de obstáculos 3D.' },
  { sku: 'SH-YALE-WIFI', name: 'Cerradura Digital Inteligente Yale YMC 420D Biometría + Wi-Fi', category: 'Smart Home & Redes', price: 1249.00, stock: 16, aiRecommended: false, spec1: '5 modos de apertura: Huella, Código, Tarjeta, Llave y App Yale', spec2: 'Incluye Hub Yale Connect Wi-Fi para apertura remota desde el celular', desc: 'Registro de accesos en tiempo real y códigos temporales para visitas.' },
  { sku: 'SH-HUE-STARTER', name: 'Kit de Inicio Iluminación Inteligente Philips Hue White & Color x3', category: 'Smart Home & Redes', price: 749.00, stock: 20, aiRecommended: false, spec1: '3 Focos LED E27 de 16 millones de colores + Hue Bridge', spec2: 'Sincronización con música, películas y juegos ( Razer Chroma / Spotify )', desc: 'Compatible con Apple HomeKit, Alexa, Google Assistant y Matter.' },
  { sku: 'NAS-SYNOLOGY-923', name: 'Servidor NAS Synology DiskStation DS923+ 4 Bahías AMD Ryzen', category: 'Smart Home & Redes', price: 2899.00, stock: 9, aiRecommended: false, spec1: 'Procesador AMD Ryzen R1600 Dual-Core | 4GB DDR4 ECC (ampliable a 32GB)', spec2: '4 Bahías SATA + 2 ranuras M.2 NVMe caché | Red actualizable a 10GbE', desc: 'Nube privada empresarial para copias de seguridad automatizadas y contenedores Docker.' },
  { sku: 'UPS-APC-1500', name: 'UPS Interactivo APC Back-UPS Pro 1500VA / 865W Pantalla LCD', category: 'Smart Home & Redes', price: 1199.00, stock: 18, aiRecommended: false, spec1: 'Capacidad 1500VA / 865W | Regulación Automática de Voltaje (AVR)', spec2: '10 Salidas protegidas contra sobretensiones | Puertos USB-C y USB-A', desc: 'Protege servidores, PCs gamer y routers manteniendo internet activo durante cortes eléctricos.' },
  { sku: 'NET-UNIFI-24POE', name: 'Switch Administrable Ubiquiti UniFi Standard 24 PoE (USW-24-PoE)', category: 'Smart Home & Redes', price: 1799.00, stock: 8, aiRecommended: false, spec1: '24 Puertos Gigabit Ethernet (16 con PoE+ 802.3at) + 2 SFP', spec2: 'Pantalla táctil LCM de 1.3" | Diseño silencioso sin ventiladores', desc: 'Gestión centralizada en UniFi Network para puntos de acceso Wi-Fi y cámaras IP.' },
  { sku: 'SH-FREESTYLE-2', name: 'Proyector Portátil Smart Samsung The Freestyle 2da Gen Con Gaming Hub', category: 'Smart Home & Redes', price: 2499.00, stock: 11, aiRecommended: false, spec1: 'Proyección Smart Tizen OS de 30" a 100" con giro de 180 grados', spec2: 'Enfoque y nivelación trapezoidal 100% automáticos | Sonido 360°', desc: 'Convierte cualquier pared o techo en una pantalla Smart TV con acceso a juegos en la nube.' },
  { sku: 'SH-TAPO-P110', name: 'Pack x4 Enchufes Inteligentes Wi-Fi TP-Link Tapo P110 Monitoreo Energía', category: 'Smart Home & Redes', price: 219.00, stock: 45, aiRecommended: false, spec1: 'Medidor de consumo eléctrico en tiempo real (kWh y costo)', spec2: 'Programación horaria, temporizador y Modo Ausente antirrobo', desc: 'Controla electrodomésticos desde cualquier lugar sin necesidad de Hub adicional.' }
];

// Mapa rápido por SKU para consulta O(1)
const PRODUCTS = {};
CATALOG_ITEMS.forEach(item => {
  PRODUCTS[item.sku] = item;
});

function createProductSvgDataUri(item) {
  const catColors = {
    'Laptops & Ultrabooks': ['#0d6efd', '#1e40af', 'LAPTOP / ULTRABOOK'],
    'Smartphones & Tablets': ['#7c3aed', '#4c1d95', 'MOBILE / TABLET 5G'],
    'Componentes PC & GPUs': ['#059669', '#065f46', 'PC HARDWARE / GPU'],
    'Monitores & Gaming': ['#dc2626', '#991b1b', 'DISPLAY / GAMING'],
    'Audio & Periféricos': ['#d97706', '#92400e', 'AUDIO & PERIPHERALS'],
    'Smart Home & Redes': ['#0891b2', '#155e75', 'SMART HOME / WIFI 7']
  };
  const palette = catColors[item.category] || ['#0d6efd', '#1e3a8a', 'TECH PRODUCT'];
  const shortTitle = item.name.length > 28 ? item.name.substring(0, 28) + '...' : item.name;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette[0]}" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="${palette[1]}" stop-opacity="0.24"/>
      </linearGradient>
    </defs>
    <rect width="360" height="220" rx="12" fill="url(#g)"/>
    <rect x="24" y="22" width="312" height="132" rx="10" fill="#ffffff" stroke="${palette[0]}" stroke-width="2" stroke-opacity="0.45"/>
    <text x="180" y="54" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="${palette[0]}" text-anchor="middle" letter-spacing="1">${palette[2]}</text>
    <text x="180" y="88" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">${shortTitle.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}</text>
    <text x="180" y="114" font-family="Arial, sans-serif" font-size="11" fill="#475569" text-anchor="middle">SKU: ${item.sku}</text>
    <rect x="115" y="126" width="130" height="18" rx="9" fill="${palette[0]}" fill-opacity="0.15"/>
    <text x="180" y="139" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${palette[1]}" text-anchor="middle">GARANTIA OFICIAL</text>
    <text x="180" y="188" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#198754" text-anchor="middle">S/ ${item.price.toLocaleString('es-PE', {minimumFractionDigits: 2})}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function renderAIRecommendations() {
  const recGrid = document.getElementById('ai-recommendations-grid');
  if (!recGrid) return;

  // Mostrar 4 productos recomendados por IA (priorizando la categoría actual si se filtró)
  let recs = CATALOG_ITEMS.filter(p => p.aiRecommended && (currentCategoryFilter === 'ALL' || p.category === currentCategoryFilter));
  if (recs.length < 4) {
    const extras = CATALOG_ITEMS.filter(p => p.aiRecommended && !recs.includes(p));
    recs = recs.concat(extras).slice(0, 4);
  } else {
    recs = recs.slice(0, 4);
  }

  recGrid.innerHTML = recs.map(prod => `
    <div class="product-card featured" data-sku="${prod.sku}" data-name="${prod.name}" data-price="${prod.price.toFixed(2)}">
      <span class="ai-badge">Recomendado por IA</span>
      <img src="${createProductSvgDataUri(prod)}" alt="${prod.name}" class="product-img" onclick="openDetails('${prod.sku}')" style="cursor:pointer;">
      <span class="cat-mini-tag">${prod.category}</span>
      <h3 class="product-title" style="font-size: 0.98rem;">${prod.name}</h3>
      <p class="specs-mini">${prod.spec1}</p>
      <div class="price-row">
        <span class="price-val">S/ ${prod.price.toLocaleString('es-PE', {minimumFractionDigits: 2})}</span>
      </div>
      <div class="card-actions">
        <button class="btn-detail" onclick="openDetails('${prod.sku}')">Ver Detalles</button>
        <button class="btn-add-cart" onclick="addToCart('${prod.sku}')">Añadir</button>
      </div>
    </div>
  `).join('');
}

function renderCatalogGrid() {
  const grid = document.getElementById('products-grid');
  const titleEl = document.getElementById('catalog-section-title');
  const countEl = document.getElementById('catalog-count-subtitle');
  const sortVal = (document.getElementById('sort-select') || {}).value || 'featured';
  if (!grid) return;

  let filtered = CATALOG_ITEMS.filter(item => {
    const matchCat = (currentCategoryFilter === 'ALL') || (item.category === currentCategoryFilter);
    if (!matchCat) return false;
    if (!currentSearchQuery) return true;
    const q = currentSearchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.spec1.toLowerCase().includes(q) ||
      item.spec2.toLowerCase().includes(q)
    );
  });

  if (sortVal === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortVal === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortVal === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    filtered.sort((a, b) => (b.aiRecommended ? 1 : 0) - (a.aiRecommended ? 1 : 0));
  }

  if (titleEl) {
    titleEl.textContent = currentCategoryFilter === 'ALL'
      ? 'Catálogo Completo por Categorías'
      : `Categoría: ${currentCategoryFilter}`;
  }
  if (countEl) {
    countEl.textContent = `Mostrando ${filtered.length} de ${CATALOG_ITEMS.length} productos tecnológicos disponibles en stock`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 12px; border: 1px solid #dee2e6;">
        <h3 style="color: #495057;">No se encontraron productos para "${currentSearchQuery}"</h3>
        <p style="color: #6c757d; margin-top: 8px;">Prueba con otro término o selecciona "Todas las Categorías (72)".</p>
        <button class="btn-add-cart" style="margin-top: 12px;" onclick="resetCatalogFilters()">Ver los 72 Productos</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(prod => `
    <div class="product-card" data-sku="${prod.sku}" data-name="${prod.name}" data-price="${prod.price.toFixed(2)}">
      <img src="${createProductSvgDataUri(prod)}" alt="${prod.name}" class="product-img" onclick="openDetails('${prod.sku}')" style="cursor:pointer;">
      <span class="cat-mini-tag">${prod.category}</span>
      <h3 class="product-title">${prod.name}</h3>
      <p class="specs-mini">${prod.spec1}<br>${prod.spec2}</p>
      <div class="price-row" style="display:flex; justify-content:space-between; align-items:center;">
        <span class="price-val">S/ ${prod.price.toLocaleString('es-PE', {minimumFractionDigits: 2})}</span>
        <small style="color:#198754; font-weight:600; font-size:0.76rem;">Stock: ${prod.stock}</small>
      </div>
      <div class="card-actions">
        <button class="btn-detail" onclick="openDetails('${prod.sku}')">Ver Ficha</button>
        <button class="btn-add-cart" onclick="addToCart('${prod.sku}')">Añadir</button>
      </div>
    </div>
  `).join('');
}

function filterByCategory(categoryName) {
  currentCategoryFilter = categoryName;
  const pills = document.querySelectorAll('.cat-pill');
  pills.forEach(btn => {
    if (btn.getAttribute('data-cat') === categoryName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  renderAIRecommendations();
  renderCatalogGrid();
}

function handleSearchInput() {
  const inputEl = document.getElementById('search-input');
  currentSearchQuery = inputEl ? inputEl.value.trim() : '';
  renderCatalogGrid();
}

function resetCatalogFilters() {
  const inputEl = document.getElementById('search-input');
  if (inputEl) inputEl.value = '';
  currentSearchQuery = '';
  filterByCategory('ALL');
}

function openDetails(sku) {
  const prod = PRODUCTS[sku];
  if (!prod) return;

  document.getElementById('detail-title').textContent = prod.name;
  document.getElementById('detail-desc').textContent = prod.desc;
  document.getElementById('detail-category-badge').textContent = prod.category.toUpperCase();
  document.getElementById('detail-sku-label').textContent = `SKU: ${prod.sku}`;
  document.getElementById('detail-spec-1').textContent = prod.spec1;
  document.getElementById('detail-spec-2').textContent = prod.spec2;
  document.getElementById('detail-stock').textContent = `Disponible (${prod.stock} unidades en almacén Lima)`;
  document.getElementById('detail-price').textContent = `S/ ${prod.price.toLocaleString('es-PE', {minimumFractionDigits: 2})}`;
  document.getElementById('detail-img-el').src = createProductSvgDataUri(prod);

  const aiBadge = document.getElementById('detail-ai-badge');
  if (aiBadge) {
    aiBadge.style.display = prod.aiRecommended ? 'inline-block' : 'none';
  }

  document.getElementById('btn-detail-add').onclick = () => {
    addToCart(prod.sku);
    closeDetails();
  };

  document.getElementById('detail-modal').style.display = 'flex';

  // Notificar al SDK de TechNova que el usuario está viendo la ficha técnica de este producto
  if (window.TechNova && window.TechNova.setViewingProduct) {
    window.TechNova.setViewingProduct(prod);
  }
}

function triggerProductOfferNow() {
  if (window.TechNova && window.TechNova.triggerTestAlert) {
    // 0003326 (CP042/CP072): No eliminar technova_dismissed_RT-001 para respetar la ventana de frecuencia de 24 horas
    window.TechNova.triggerTestAlert();
  }
}

function closeDetails() {
  document.getElementById('detail-modal').style.display = 'none';
  if (window.TechNova && window.TechNova.exitProductView) {
    window.TechNova.exitProductView();
  }
}

function addToCart(sku, customName, customPrice) {
  const prod = PRODUCTS[sku] || {
    sku: sku,
    name: customName || 'Producto Tecnológico',
    price: Number(customPrice) || 999.00
  };
  const existing = cart.find(i => i.sku === prod.sku);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ sku: prod.sku, name: prod.name, price: prod.price, qty: 1 });
  }
  updateCartUI();
  openCartDrawer();
}

function changeCartQty(sku, delta) {
  const idx = cart.findIndex(i => i.sku === sku);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) {
    cart.splice(idx, 1);
  }
  updateCartUI();
}

function updateCartUI() {
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');
  const itemsList = document.getElementById('cart-items-list');
  const subtotalEl = document.getElementById('cart-subtotal');
  const discountRow = document.getElementById('discount-row');
  const discountLabel = document.getElementById('discount-label-text');
  const discountEl = document.getElementById('cart-discount');
  const grandTotalEl = document.getElementById('cart-grand-total');

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  let discountAmount = 0;
  if (appliedDiscount > 0 && subtotal > 0 && !couponUsedInSession) {
    discountAmount = subtotal * (appliedDiscount / 100);
    discountRow.style.display = 'flex';
    if (discountLabel) {
      discountLabel.textContent = appliedCouponCode
        ? `Descuento IA ${appliedDiscount}% (Cupón 1 uso: ${appliedCouponCode}):`
        : `Descuento IA (${appliedDiscount}%):`;
    }
    discountEl.textContent = `-S/ ${discountAmount.toFixed(2)}`;
  } else {
    discountRow.style.display = 'none';
  }

  const grandTotal = Math.max(0, subtotal - discountAmount);

  countEl.textContent = totalItems;
  totalEl.textContent = `S/ ${grandTotal.toFixed(2)}`;
  subtotalEl.textContent = `S/ ${subtotal.toFixed(2)}`;
  grandTotalEl.textContent = `S/ ${grandTotal.toFixed(2)}`;

  if (cart.length === 0) {
    itemsList.innerHTML = '<div class="cart-empty">Tu carrito está vacío actualmente.</div>';
  } else {
    itemsList.innerHTML = cart.map(i => `
      <div class="cart-item-row" style="align-items: center;">
        <div style="flex: 1; padding-right: 8px;">
          <strong style="font-size: 0.88rem;">${i.name}</strong><br>
          <small style="color: #6c757d;">S/ ${i.price.toFixed(2)} c/u</small>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button onclick="changeCartQty('${i.sku}', -1)" style="border:1px solid #ced4da; background:#f8f9fa; width:24px; height:24px; border-radius:4px; cursor:pointer; font-weight:bold;">-</button>
          <span style="font-weight:bold; min-width:18px; text-align:center;">${i.qty}</span>
          <button onclick="changeCartQty('${i.sku}', 1)" style="border:1px solid #ced4da; background:#f8f9fa; width:24px; height:24px; border-radius:4px; cursor:pointer; font-weight:bold;">+</button>
          <strong style="min-width: 78px; text-align: right;">S/ ${(i.price * i.qty).toFixed(2)}</strong>
        </div>
      </div>
    `).join('');
  }
}

function openCartDrawer() {
  document.getElementById('cart-drawer').classList.add('open');
}

function closeCartDrawer() {
  document.getElementById('cart-drawer').classList.remove('open');
}

function checkout() {
  if (cart.length === 0) {
    alert('Tu carrito está vacío.');
    return;
  }
  if (appliedDiscount > 0) {
    couponUsedInSession = true;
    sessionStorage.setItem('tn_coupon_redeemed_RT-001', 'true');
  }
  try {
    localStorage.setItem('tn_kpi_sync_trigger', JSON.stringify({ ts: Date.now(), source: 'checkout' }));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('technova_alert_sync');
      bc.postMessage({ type: 'CONVERSION_COMPLETED', ts: Date.now() });
    }
  } catch (e) {}
  alert('¡Compra finalizada exitosamente! Tu pedido ha sido procesado y registrado en las métricas de TechNova Store Perú.');
  cart = [];
  appliedDiscount = 0;
  appliedCouponCode = null;
  updateCartUI();
  closeCartDrawer();
}

// Escuchar la conversión disparada por el SDK de TechNova al aceptar la oferta personalizada (1 solo uso por sesión/cupón)
window.addEventListener('technova:conversion', (e) => {
  if (couponUsedInSession) {
    return;
  }
  const detail = e.detail || {};
  appliedDiscount = detail.discount_percent || 30;
  appliedCouponCode = detail.coupon_code || null;
  const targetSku = detail.sku || 'LENOVO-G5';
  const prod = PRODUCTS[targetSku] || {
    sku: targetSku,
    name: detail.product_name || 'Laptop Lenovo Gamer i5',
    price: Number(detail.original_price) || 4199.00
  };

  if (!cart.find(i => i.sku === prod.sku)) {
    cart.push({ sku: prod.sku, name: prod.name, price: prod.price, qty: 1 });
  }

  closeDetails();
  updateCartUI();
  openCartDrawer();
});

async function syncCatalogWithBackend() {
  try {
    const res = await fetch('/api/v1/store/catalog', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !Array.isArray(data.products)) return;
    let changed = false;
    data.products.forEach(remote => {
      const local = PRODUCTS[remote.sku];
      if (local) {
        if (
          local.stock !== remote.stock ||
          local.price !== remote.price ||
          local.name !== remote.name ||
          local.category !== remote.category
        ) {
          local.stock = remote.stock;
          local.price = remote.price;
          local.name = remote.name;
          local.category = remote.category;
          changed = true;
        }
      }
    });
    if (changed) {
      renderAIRecommendations();
      renderCatalogGrid();
    }
  } catch (e) {
    // mantener catálogo local
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderAIRecommendations();
  renderCatalogGrid();
  syncCatalogWithBackend();

  document.getElementById('cart-btn').addEventListener('click', openCartDrawer);
  document.getElementById('cart-close-btn').addEventListener('click', closeCartDrawer);

  const testBtn = document.getElementById('btn-force-test');
  if (testBtn) {
    testBtn.addEventListener('click', () => {
      // 0003326 (CP042/CP072): Respetar ventana de frecuencia de 24 horas sin borrar technova_dismissed_RT-001
      if (window.TechNova && window.TechNova.triggerTestAlert) {
        window.TechNova.triggerTestAlert();
      }
    });
  }
});
