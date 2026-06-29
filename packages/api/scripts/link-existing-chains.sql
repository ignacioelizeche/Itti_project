-- Migration: Link existing chain branches
-- Run with: PGPASSWORD=itti_secret psql -h localhost -U itti -d itti_alliances -f scripts/link-existing-chains.sql

-- Sport House (130) → parent of (347 Shopping Multiplaza, 346 Shopping Mariscal)
UPDATE "Company" SET parent_id = 130 WHERE id IN (347, 346);

-- Gorilla's Gym (366) → parent of (527 Suc. Artigas)
UPDATE "Company" SET parent_id = 366 WHERE id = 527;

-- Smart Fit (456) → parent of (453 Distrito Perseverancia)
UPDATE "Company" SET parent_id = 456 WHERE id = 453;

-- Compulandia (246) → parent of (415 Multiplaza)
UPDATE "Company" SET parent_id = 246 WHERE id = 415;

-- Joyería Fernando (192) → parent of (567 Casa Central)
UPDATE "Company" SET parent_id = 192 WHERE id = 567;

-- La Cabrera (403) → parent of (13 Santa Teresa)
UPDATE "Company" SET parent_id = 403 WHERE id = 13;

-- Nissei (234) → parent of (414 Asunción)
UPDATE "Company" SET parent_id = 234 WHERE id = 414;

-- Farmacenter (269) → parent of (551 Carmelitas)
UPDATE "Company" SET parent_id = 269 WHERE id = 551;

-- Victoria Joyas (558) → parent of (572 Luque)
UPDATE "Company" SET parent_id = 558 WHERE id = 572;

-- Visuar (245) → parent of (416 Paraguay)
UPDATE "Company" SET parent_id = 245 WHERE id = 416;

-- Sport Center (137) → parent of (350 Tienda Sport Center)
UPDATE "Company" SET parent_id = 137 WHERE id = 350;

-- Casa Luma (2) → parent of (6 Alba By Casa Luma)
UPDATE "Company" SET parent_id = 2 WHERE id = 6;

-- Librería Arandu (206) → parent of (210 Paper)
UPDATE "Company" SET parent_id = 206 WHERE id = 210;

-- Las Mercedes Garden (92) → parent of (255 Garden)
UPDATE "Company" SET parent_id = 92 WHERE id = 255;

-- Sanycer (242) → parent of (243 Boutique)
UPDATE "Company" SET parent_id = 242 WHERE id = 243;

-- Pilates (298) → parent of (450 CASA MÍA, 529 DC Pilates, 457 Postura)
UPDATE "Company" SET parent_id = 298 WHERE id IN (450, 529, 457);

-- TecnoStore - Casa Central (332) → parent of (412 Paseo la Galería, 342 Servicio Técnico)
UPDATE "Company" SET parent_id = 332 WHERE id IN (412, 342);

-- Superseis (100) → parent of (101 Expréss)
UPDATE "Company" SET parent_id = 100 WHERE id = 101;

-- Dirección General de Educación Inicial (446) → parent of (388 MEC)
UPDATE "Company" SET parent_id = 446 WHERE id = 388;

-- La Esquinita (98) → parent of (613 Bar)
UPDATE "Company" SET parent_id = 98 WHERE id = 613;

-- Top Tenis (357) → linked to itself already via name, skip if different
-- CH Carolina Herrera (438) is a store INSIDE Shopping del Sol (507), not a branch - skip
-- Meta Sports (356) is a store INSIDE Shopping del Sol (507), not a branch - skip
-- Shopping del Sol is a mall, not a company branch - skip all mall references

-- Baco (182) → parent of (437 Asunción)
UPDATE "Company" SET parent_id = 182 WHERE id = 437;

-- Della Poletti: 570 (Paseo Vía Allegra) and 566 (Shopping del Sol) - these are branches of same brand but no "parent" exists yet. Link to whichever has lower ID.
UPDATE "Company" SET parent_id = 570 WHERE id = 566;
