import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Categories for Itti/Ueno
  const categories = [
    { name: "Restaurantes", slug: "restaurantes", icon: "🍽️" },
    { name: "Cafeterías", slug: "cafeterias", icon: "☕" },
    { name: "Tecnología", slug: "tecnologia", icon: "💻" },
    { name: "Moda", slug: "moda", icon: "👗" },
    { name: "Fitness", slug: "fitness", icon: "💪" },
    { name: "Educación", slug: "educacion", icon: "📚" },
    { name: "Salud", slug: "salud", icon: "🏥" },
    { name: "Entretenimiento", slug: "entretenimiento", icon: "🎬" },
    { name: "Supermercados", slug: "supermercados", icon: "🛒" },
    { name: "Belleza", slug: "belleza", icon: "💅" },
    { name: "Viajes", slug: "viajes", icon: "✈️" },
    { name: "Hogar", slug: "hogar", icon: "🏠" },
  ];

  console.log(`📋 ${categories.length} categories defined`);
  console.log("✅ Seed completed (categories will be used for scraping)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
