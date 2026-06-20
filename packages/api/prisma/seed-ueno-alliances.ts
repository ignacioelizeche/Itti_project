import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AllianceEntry {
  name: string;
  category: string;
  subcategory?: string;
  benefit?: string;
  exclusiveLocation?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ALLIANCES: AllianceEntry[] = [
  // XBRI
  { name: "XBRI", category: "Automotor", subcategory: "Neumáticos", benefit: "Financiación hasta 12 cuotas sin intereses" },

  // Gastronomía - Encarnación
  { name: "Alzza", category: "Gastronomía", subcategory: "Restaurante", exclusiveLocation: "Encarnación" },
  { name: "La Ruta 1 Grill", category: "Gastronomía", subcategory: "Restaurante", exclusiveLocation: "Encarnación" },
  { name: "Bistró del Centro", category: "Gastronomía", subcategory: "Restaurante", exclusiveLocation: "Encarnación" },
  { name: "Matalas", category: "Gastronomía", subcategory: "Restaurante", exclusiveLocation: "Encarnación" },
  { name: "Kala Poke", category: "Gastronomía", subcategory: "Restaurante", exclusiveLocation: "Encarnación" },
  { name: "Noi Sushi", category: "Gastronomía", subcategory: "Restaurante", exclusiveLocation: "Encarnación" },
  { name: "Porapinta", category: "Gastronomía", subcategory: "Restaurante", exclusiveLocation: "Encarnación" },
  { name: "Mordi", category: "Gastronomía", subcategory: "Restaurante", exclusiveLocation: "Encarnación" },
  { name: "Fusión Altitud Burger", category: "Gastronomía", subcategory: "Restaurante", exclusiveLocation: "Encarnación" },
  { name: "Fusión Chef Pizza & Terrazas", category: "Gastronomía", subcategory: "Restaurante", exclusiveLocation: "Encarnación" },

  // Gastronomía - General
  { name: "Taberna Española", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Bacon", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Pincer", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Pocket Pizza", category: "Gastronomía", subcategory: "Pizzería" },
  { name: "Smashed Burgers", category: "Gastronomía", subcategory: "Hamburguesería" },
  { name: "La Nutria", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Bully Smash", category: "Gastronomía", subcategory: "Hamburguesería" },
  { name: "+Mu", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "El Elegido", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Stilo Campo Grill", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Bori Bori", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Ecop X Grill", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Sushi Pop", category: "Gastronomía", subcategory: "Sushi" },
  { name: "Hanna", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Tu Sushi", category: "Gastronomía", subcategory: "Sushi" },
  { name: "Asia 360", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Nunas", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Pirata Sushi", category: "Gastronomía", subcategory: "Sushi" },
  { name: "Grosso", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "836", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Guay", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Takuaré'e", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Robinson Bakeshop", category: "Gastronomía", subcategory: "Panadería" },
  { name: "Ark Coffee", category: "Gastronomía", subcategory: "Cafetería" },
  { name: "Glacé", category: "Gastronomía", subcategory: "Cafetería" },
  { name: "Molas", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Nación Sushi", category: "Gastronomía", subcategory: "Sushi" },
  { name: "Närma", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Cope Market", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Upa!", category: "Gastronomía", subcategory: "Restaurante", benefit: "20 ŭpys por compra ≥ Gs. 30.000 (hasta 300 ŭpys)" },
  { name: "Sin Culpas", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Máximo", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Fontana Ribera", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Fontana Express", category: "Gastronomía", subcategory: "Restaurante" },
  { name: "Fontana Café", category: "Gastronomía", subcategory: "Cafetería" },
  { name: "Fontana Bar", category: "Gastronomía", subcategory: "Bar" },
  { name: "Canela Café", category: "Gastronomía", subcategory: "Cafetería" },
  { name: "Cervecería Popular", category: "Gastronomía", subcategory: "Cervecería" },
  { name: "Ueno Bank & Grill", category: "Gastronomía", subcategory: "Restaurante" },

  // Combustibles
  { name: "Copetrol", category: "Combustibles", subcategory: "Estación de Servicio" },
  { name: "Enex", category: "Combustibles", subcategory: "Estación de Servicio", benefit: "100 ŭpys por compra ≥ Gs. 200.000 vía app Mi enex (hasta 500 ŭpys)" },
  { name: "Petrobras", category: "Combustibles", subcategory: "Estación de Servicio" },
  { name: "3MG", category: "Combustibles", subcategory: "Estación de Servicio" },
  { name: "Puma", category: "Combustibles", subcategory: "Estación de Servicio" },
  { name: "Petrochaco", category: "Combustibles", subcategory: "Estación de Servicio" },
  { name: "Petropar Naciente", category: "Combustibles", subcategory: "Estación de Servicio", benefit: "Reintegros con tope de compra semanal" },

  // Hoteles
  { name: "Los Árboles", category: "Hoteles", subcategory: "Hotel" },
  { name: "Oasis Dream", category: "Hoteles", subcategory: "Hotel" },
  { name: "Canarias Suites San Bernardino", category: "Hoteles", subcategory: "Hotel" },
  { name: "Casablanca Hotel Boutique", category: "Hoteles", subcategory: "Hotel Boutique" },
  { name: "Alborada Posada Turística", category: "Hoteles", subcategory: "Posada" },
  { name: "Los Lapachos", category: "Hoteles", subcategory: "Hotel" },
  { name: "Quinta La Paloma", category: "Hoteles", subcategory: "Hotel" },
  { name: "Serpel Plaza Hotel", category: "Hoteles", subcategory: "Hotel" },

  // Entretenimiento
  { name: "Virtuality Social Arcade", category: "Entretenimiento", subcategory: "Arcade" },
  { name: "Mundo Aventura", category: "Entretenimiento", subcategory: "Aventura", exclusiveLocation: "Encarnación" },
  { name: "FlightNex", category: "Entretenimiento", subcategory: "Vuelos Panorámicos" },
  { name: "Ticketea", category: "Entretenimiento", subcategory: "Eventos", benefit: "Financiación hasta 12 cuotas sin intereses" },
  { name: "Tüti", category: "Entretenimiento", subcategory: "Tienda", benefit: "60 ŭpys por compra ≥ Gs. 100.000 (hasta 300 ŭpys)" },
  { name: "Feria Palmear", category: "Entretenimiento", subcategory: "Feria", benefit: "Exclusivo los sábados" },

  // Bares & Boliches
  { name: "Bar Nacional", category: "Gastronomía", subcategory: "Bar" },
  { name: "Las Mercedes Garden", category: "Gastronomía", subcategory: "Bar" },
  { name: "Bambuddha", category: "Gastronomía", subcategory: "Bar" },
  { name: "Capitão San Lorenzo", category: "Gastronomía", subcategory: "Bar" },
  { name: "Cover Singing Bar", category: "Gastronomía", subcategory: "Bar" },
  { name: "Faces", category: "Gastronomía", subcategory: "Bar" },
  { name: "Indigo", category: "Gastronomía", subcategory: "Bar" },
  { name: "La Esquinita", category: "Gastronomía", subcategory: "Bar" },
  { name: "Sacramento Brewing Co.", category: "Gastronomía", subcategory: "Cervecería" },

  // Supermercados
  { name: "Superseis", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Superseis Expréss", category: "Supermercados", subcategory: "Supermercado Express" },
  { name: "Stock", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Stock Expréss", category: "Supermercados", subcategory: "Supermercado Express" },
  { name: "Deli Market", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Gran Vía", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Salemma", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Plub", category: "Supermercados", subcategory: "Supermercado", benefit: "50 ŭpys por compra de Gs. 180.000 (hasta 300 ŭpys)" },
  { name: "Concentro", category: "Supermercados", subcategory: "Cooperativa" },
  { name: "Porkys", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Comercial Armín", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Molino Casagrande", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Lipetk", category: "Supermercados", subcategory: "Supermercado" },
  { name: "María's", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Colón", category: "Supermercados", subcategory: "Supermercado" },
  { name: "El Abasto", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Pronto", category: "Supermercados", subcategory: "Supermercado" },
  { name: "H&V Supermercados", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Reducto", category: "Supermercados", subcategory: "Supermercado" },
  { name: "El Norazo", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Kingo", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Metro", category: "Supermercados", subcategory: "Supermercado" },
  { name: "Hello Oven", category: "Supermercados", subcategory: "Panadería" },

  // Biggie
  { name: "Biggie Express", category: "Supermercados", subcategory: "Supermercado Express", benefit: "Exclusivo sábados y domingos, compra mínima Gs. 70.000" },

  // Cadena Real
  { name: "Cadena Real", category: "Supermercados", subcategory: "Supermercado", benefit: "Reintegro fijo, tope Gs. 1.000.000" },

  // Fortis
  { name: "Fortis Mayorista", category: "Supermercados", subcategory: "Mayorista", benefit: "30% reintegro, compra mínima Gs. 2.000.000" },

  // Vernier
  { name: "Vernier", category: "Moda", subcategory: "Tienda", benefit: "Financiación hasta 12 cuotas + 50 ŭpys por pago ≥ Gs. 300.000" },

  // Cuotas sin intereses - Deportes
  { name: "Cyclesport Tienda Multideporte", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Cerro Porteño Tienda", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Outdoors", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Sport House", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "CAT", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Merrell", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Kappa", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "RND", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Deport Center", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Iron Store", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Sport Center", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Ambros", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Bicicletería Cuyo", category: "Deportes", subcategory: "Bicicletas", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "KR Training & Gym", category: "Deportes", subcategory: "Gimnasio", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Federación Paraguaya de Pádel", category: "Deportes", subcategory: "Pádel", benefit: "Hasta 12 cuotas sin intereses" },

  // Cuotas sin intereses - Moda
  { name: "Hey Dude", category: "Moda", subcategory: "Calzado", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Forever 21", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Rondina", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Women's Secret", category: "Moda", subcategory: "Ropa Interior", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Eneache", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Marie Marie", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Nice", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Bruno Corsi", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Crocs", category: "Moda", subcategory: "Calzado", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "American Look", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Aéropostale", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Ecomm", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Brooksfield", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Guess", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Jeep", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Estilo Sur", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Wrangler", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Jack & Jones", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Patrol", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Springfield", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Lee", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Lupo", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Martel", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Cabure", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Magga", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Scala", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Cardón", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "María José", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Blumen", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses", exclusiveLocation: "Sardo" },
  { name: "La Bonita", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Dunia", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Gab", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Magavi", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses", exclusiveLocation: "Sardo" },
  { name: "Basic-in", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Bendita", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Benditta Style", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Dudalina", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Choice Importados", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Penina", category: "Moda", subcategory: "Ropa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Shoes 4 Less", category: "Moda", subcategory: "Calzado", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Baco", category: "Moda", subcategory: "Calzado", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Canela Zapatería", category: "Moda", subcategory: "Calzado", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Teju", category: "Moda", subcategory: "Calzado", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Manuela", category: "Moda", subcategory: "Calzado", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Eskala", category: "Moda", subcategory: "Calzado", benefit: "Hasta 12 cuotas sin intereses" },

  // Belleza & Cuidado personal
  { name: "Maybelline New York", category: "Belleza", subcategory: "Maquillaje", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Ombú Beauty Shop", category: "Belleza", subcategory: "Tienda de Belleza", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Gisele Stephanie", category: "Belleza", subcategory: "Tienda de Belleza", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Alteza Perfumería", category: "Belleza", subcategory: "Perfumería", benefit: "Hasta 12 cuotas sin intereses" },

  // Joyas & Accesorios
  { name: "Alusa Joyas", category: "Joyas", subcategory: "Joyería", benefit: "Hasta 12 cuotas sin intereses todos los días, sin tope" },
  { name: "Joyería Fernando", category: "Joyas", subcategory: "Joyería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Joyería G&A", category: "Joyas", subcategory: "Joyería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Todomoda", category: "Joyas", subcategory: "Accesorios", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Isadora", category: "Joyas", subcategory: "Accesorios", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Parfois", category: "Joyas", subcategory: "Accesorios", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Oscar Joyas", category: "Joyas", subcategory: "Joyería", benefit: "Hasta 12 cuotas sin intereses todos los días, sin tope" },

  // Infantil & Juguetería
  { name: "Philos Kids Clothes", category: "Infantil", subcategory: "Ropa Infantil", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "ToyManía", category: "Infantil", subcategory: "Juguetería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Desván de Anelis Juguetería", category: "Infantil", subcategory: "Juguetería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Piletas y Juguetes", category: "Infantil", subcategory: "Juguetería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Tía Katya Juguetería", category: "Infantil", subcategory: "Juguetería", benefit: "Hasta 12 cuotas sin intereses" },

  // Librerías & Educación
  { name: "Brick Almacén Educativo", category: "Educación", subcategory: "Librería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Utilpar Librería", category: "Educación", subcategory: "Librería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Arandu Service", category: "Educación", subcategory: "Librería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Librería Arandu", category: "Educación", subcategory: "Librería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Arandu Comercial", category: "Educación", subcategory: "Librería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Arandu Office", category: "Educación", subcategory: "Librería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Héroes Librería", category: "Educación", subcategory: "Librería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Librería Arandu Paper", category: "Educación", subcategory: "Librería", benefit: "Hasta 12 cuotas sin intereses" },

  // Multitiendas & Regalos
  { name: "África Design", category: "Multitiendas", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Alborada Superstore", category: "Multitiendas", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "JF Tienda de Regalos", category: "Multitiendas", subcategory: "Regalos", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "AII", category: "Multitiendas", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Minicuotas", category: "Multitiendas", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Musichall", category: "Multitiendas", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Termic", category: "Multitiendas", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },

  // Ópticas
  { name: "José A. Carrón", category: "Ópticas", subcategory: "Óptica", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Óptica Valemar", category: "Ópticas", subcategory: "Óptica", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Óptica Regal", category: "Ópticas", subcategory: "Óptica", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Universal Optical", category: "Ópticas", subcategory: "Óptica", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Fenicia", category: "Ópticas", subcategory: "Óptica", benefit: "Hasta 12 cuotas sin intereses" },

  // Oficina & Hogar
  { name: "GenZ", category: "Oficina & Hogar", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Atlantic Express", category: "Oficina & Hogar", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Casa Tramontina", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Gallo", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Mac Store", category: "Tecnología", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Laferré", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "L'Acerie", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Comfort House", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Semar", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "La Hora de las Compras", category: "Oficina & Hogar", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "America Shop", category: "Oficina & Hogar", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Nissei", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Sueñolar", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Koala", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "New Zone Importados", category: "Oficina & Hogar", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Luminotecnia", category: "Oficina & Hogar", subcategory: "Iluminación", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Essen", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Compu Market", category: "Tecnología", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Casa Americana", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Sanycer", category: "Oficina & Hogar", subcategory: "Baño", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Sanycer Boutique", category: "Oficina & Hogar", subcategory: "Baño", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Sara", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Visuar", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Compulandia", category: "Tecnología", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Sambrak", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Lever Store", category: "Oficina & Hogar", subcategory: "Hogar", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Lumina", category: "Oficina & Hogar", subcategory: "Iluminación", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Tienda Yankee", category: "Oficina & Hogar", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Office Design", category: "Oficina & Hogar", subcategory: "Oficina", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "GoStore", category: "Oficina & Hogar", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "24.7", category: "Oficina & Hogar", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },

  // Automotor
  { name: "CH Autocentro", category: "Automotor", subcategory: "Automotriz", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Garden", category: "Automotor", subcategory: "Servicio Posventa", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "ISC", category: "Automotor", subcategory: "Repuestos", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Automaq", category: "Automotor", subcategory: "Repuestos", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Tonina", category: "Automotor", subcategory: "Automotriz", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Tuned by DRS", category: "Automotor", subcategory: "Tuning", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Chacomer Automotores", category: "Automotor", subcategory: "Automotriz", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Sai Automotor", category: "Automotor", subcategory: "Automotriz", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Chacomer Repuestos", category: "Automotor", subcategory: "Repuestos", benefit: "Hasta 12 cuotas sin intereses" },

  // Florerías
  { name: "Estación de Flores", category: "Florerías", subcategory: "Florería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Florarte", category: "Florerías", subcategory: "Florería", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Serafina", category: "Florerías", subcategory: "Florería", benefit: "Hasta 12 cuotas sin intereses" },

  // Universidades y Salud
  { name: "Universidad San Lorenzo (UNISAL)", category: "Educación", subcategory: "Universidad", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Asismed", category: "Salud", subcategory: "Farmacia", benefit: "Exclusivo CIT" },

  // Isalú
  { name: "Isalú", category: "Bienestar", subcategory: "Tienda", benefit: "Financiación hasta 12 cuotas sin intereses todos los días" },

  // Farmacias
  { name: "Farmacenter", category: "Farmacias", subcategory: "Farmacia", benefit: "Web y sucursales" },
  { name: "Biggie Farma", category: "Farmacias", subcategory: "Farmacia" },
  { name: "Drugstore", category: "Farmacias", subcategory: "Farmacia" },
  { name: "Farmacias Vicente Scavone", category: "Farmacias", subcategory: "Farmacia" },
  { name: "Farmatotal", category: "Farmacias", subcategory: "Farmacia" },
  { name: "Maxifarma Encarnación", category: "Farmacias", subcategory: "Farmacia", exclusiveLocation: "Encarnación" },
  { name: "Maxifarma Asunción", category: "Farmacias", subcategory: "Farmacia" },

  // Bienestar
  { name: "Depilaser", category: "Bienestar", subcategory: "Estética" },
  { name: "Dino Villa Morra", category: "Bienestar", subcategory: "Estética" },
  { name: "Dino Home Spa", category: "Bienestar", subcategory: "Spa" },
  { name: "Airea", category: "Bienestar", subcategory: "Estética" },
  { name: "ZIC", category: "Bienestar", subcategory: "Estética" },
  { name: "Rizo Bomba", category: "Bienestar", subcategory: "Estética" },
  { name: "La Guardia", category: "Bienestar", subcategory: "Estética" },
  { name: "Depyless", category: "Bienestar", subcategory: "Estética" },
  { name: "Doxamed", category: "Bienestar", subcategory: "Salud" },
  { name: "G Estética", category: "Bienestar", subcategory: "Estética" },
  { name: "Nutrifit Spa & Wellness", category: "Bienestar", subcategory: "Spa" },
  { name: "Saona Skin Healthcare", category: "Bienestar", subcategory: "Skincare" },
  { name: "Piel + Sana", category: "Bienestar", subcategory: "Skincare" },
  { name: "Tissé Skin Care", category: "Bienestar", subcategory: "Skincare" },
  { name: "Tissé Spa", category: "Bienestar", subcategory: "Spa" },
  { name: "O Boticário", category: "Bienestar", subcategory: "Tienda" },
  { name: "ISDIN", category: "Bienestar", subcategory: "Skincare" },

  // Óptica Luce
  { name: "Óptica Luce", category: "Ópticas", subcategory: "Óptica", benefit: "Hasta 12 cuotas sin intereses + hasta 250 ŭpys por compra ≥ Gs. 1.000.000" },

  // Puka
  { name: "Puka", category: "Moda", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses + reintegro 12% (tope Gs. 10.000.000)" },

  // Conto
  { name: "Conto", category: "Tecnología", subcategory: "Software", benefit: "Reintegros por nivel" },

  // Muv
  { name: "Muv", category: "Transporte", subcategory: "App", benefit: "60 ŭpys por compra (hasta 300 ŭpys) + reintegros 30%" },

  // Consejo de la Magistratura
  { name: "Escuela Judicial - Consejo de la Magistratura", category: "Educación", subcategory: "Escuela", benefit: "Reintegros por nivel, tope Gs. 500.000" },

  // Deportes (alianza específica)
  { name: "Pilates", category: "Deportes", subcategory: "Pilates" },
  { name: "AF Peak Lab", category: "Deportes", subcategory: "Gimnasio" },
  { name: "No Rules", category: "Deportes", subcategory: "Gimnasio", exclusiveLocation: "AF Peak Lab" },
  { name: "Momentum", category: "Deportes", subcategory: "Gimnasio" },
  { name: "Ark", category: "Deportes", subcategory: "Gimnasio" },
  { name: "Fitway", category: "Deportes", subcategory: "Gimnasio" },
  { name: "Club Cerro Porteño", category: "Deportes", subcategory: "Club" },
  { name: "BT Body Training", category: "Deportes", subcategory: "Gimnasio" },
  { name: "Benjamín Hockin", category: "Deportes", subcategory: "Academia" },
  { name: "JS Academia", category: "Deportes", subcategory: "Academia" },

  // Débito Automático
  { name: "Club Olimpia", category: "Deportes", subcategory: "Club", benefit: "Débito automático +100 ŭpys por pago ≥ Gs. 45.000" },

  // Clubes
  { name: "Centro (Club de la Familia)", category: "Entretenimiento", subcategory: "Club", benefit: "Reintegro 20%, tope Gs. 2.000.000" },

  // Inter EXA
  { name: "Inter EXA Anualidad", category: "Educación", subcategory: "Universidad", benefit: "Tope Gs. 1.500.000" },
  { name: "Inter EXA Semestral", category: "Educación", subcategory: "Universidad", benefit: "Tope Gs. 1.000.000" },

  // Cuotas extendidas
  { name: "Alula", category: "Moda", subcategory: "Tienda", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Comdetur", category: "Viajes", subcategory: "Agencia", benefit: "Hasta 18 cuotas sin intereses" },
  { name: "Inter Express", category: "Viajes", subcategory: "Transporte", benefit: "Hasta 18 cuotas sin intereses" },
  { name: "Intertours", category: "Viajes", subcategory: "Agencia", benefit: "Hasta 18 cuotas sin intereses" },
  { name: "Kostas", category: "Viajes", subcategory: "Agencia", benefit: "Hasta 18 cuotas sin intereses" },
  { name: "Uelo", category: "Viajes", subcategory: "Transporte", benefit: "Hasta 18 cuotas + 300 ŭpys con KMC" },
  { name: "Instituto de Moda y Arte", category: "Educación", subcategory: "Instituto", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Pagopar", category: "Tecnología", subcategory: "Pagos", benefit: "Hasta 12 cuotas sin intereses" },
  { name: "Hendyla.com", category: "Moda", subcategory: "E-commerce", benefit: "Hasta 12 cuotas + 150 ŭpys por compra ≥ Gs. 100.000" },
  { name: "U Market", category: "Moda", subcategory: "Tienda", benefit: "Hasta 18 cuotas sin intereses" },

  // Puma (also in deportes)
  { name: "Puma Store", category: "Deportes", subcategory: "Tienda Deportiva", benefit: "Hasta 12 cuotas sin intereses" },
];

async function seedAlliances() {
  console.log("🌱 Seeding Ueno alliances...");
  console.log(`📋 Total alliances to process: ${ALLIANCES.length}`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const alliance of ALLIANCES) {
    try {
      const slug = slugify(alliance.name);

      const existing = await prisma.company.findFirst({
        where: {
          OR: [
            { slug },
            { name: { equals: alliance.name, mode: "insensitive" } },
          ],
        },
      });

      if (existing) {
        await prisma.company.update({
          where: { id: existing.id },
          data: {
            allianceStatus: "active",
            allianceDetails: JSON.parse(
              JSON.stringify({
                type: alliance.benefit?.includes("cuotas")
                  ? "financing"
                  : alliance.benefit?.includes("ŭpys")
                    ? "rewards"
                    : alliance.benefit?.includes("reintegro")
                      ? "cashback"
                      : "standard",
                benefit: alliance.benefit,
                exclusiveLocation: alliance.exclusiveLocation,
                source: "ueno_alliances_june_2026",
              })
            ),
            tags: JSON.parse(
              JSON.stringify(["ueno_partner", "active_alliance"])
            ),
          },
        });
        updated++;
      } else {
        await prisma.company.create({
          data: {
            name: alliance.name,
            slug,
            category: alliance.category,
            subcategory: alliance.subcategory,
            city: alliance.exclusiveLocation || "Asunción",
            country: "Paraguay",
            allianceStatus: "active",
            allianceDetails: JSON.parse(
              JSON.stringify({
                type: alliance.benefit?.includes("cuotas")
                  ? "financing"
                  : alliance.benefit?.includes("ŭpys")
                    ? "rewards"
                    : alliance.benefit?.includes("reintegro")
                      ? "cashback"
                      : "standard",
                benefit: alliance.benefit,
                exclusiveLocation: alliance.exclusiveLocation,
                source: "ueno_alliances_june_2026",
              })
            ),
            tags: JSON.parse(
              JSON.stringify(["ueno_partner", "active_alliance"])
            ),
            dataSources: JSON.parse(
              JSON.stringify({
                ueno_alliances: new Date().toISOString(),
              })
            ),
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`Error with "${alliance.name}":`, error);
      errors++;
    }
  }

  console.log(`\n✅ Seed completed:`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${ALLIANCES.length}`);
}

seedAlliances()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
