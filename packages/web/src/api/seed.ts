import { db } from "./database";
import * as schema from "./database/schema";

const DEMO_PRODUCTS = [
  {
    name: "Crown Tee — Black Gold",
    description: "Premium heavyweight cotton tee. Gold crown embroidery on chest. Built for kings who move in silence.",
    price: 34.99,
    category: "T-Shirts",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    stock: 50,
    featured: true,
  },
  {
    name: "PowerHouse Hoodie",
    description: "Oversized fleece hoodie. Gold embroidered logo. Drop shoulder fit for that legacy look.",
    price: 74.99,
    category: "Hoodies",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80",
    stock: 30,
    featured: true,
  },
  {
    name: "Kingz Snapback",
    description: "Structured snapback with gold embroidery. One size fits all crowned heads.",
    price: 29.99,
    category: "Hats",
    imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
    stock: 40,
    featured: false,
  },
  {
    name: "Ltronics Pro Phone (256GB)",
    description: "Custom-spec flagship smartphone. Matte black finish with gold accents. Unlocked.",
    price: 499.99,
    category: "Phones / Electronics",
    imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80",
    stock: 15,
    featured: true,
  },
  {
    name: "PowerCharge 100W Cable",
    description: "Braided USB-C to USB-C. 100W fast charging. 6ft length. Built to last.",
    price: 14.99,
    category: "Cables & Chargers",
    imageUrl: "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&q=80",
    stock: 100,
    featured: false,
  },
  {
    name: "BassKingz Speaker",
    description: "Portable Bluetooth 5.3 speaker. 360° surround. 24hr battery. Loud enough for the throne.",
    price: 89.99,
    category: "Speakers / Headphones",
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80",
    stock: 20,
    featured: true,
  },
  {
    name: "Kingdom Backpack",
    description: "Water-resistant tactical backpack. 30L capacity. Hidden laptop sleeve. Gold hardware.",
    price: 59.99,
    category: "Backpacks",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    stock: 25,
    featured: false,
  },
  {
    name: "Crown Logo Sticker Pack",
    description: "5-pack holographic vinyl stickers. Waterproof. Laptop-ready.",
    price: 7.99,
    category: "Stickers",
    imageUrl: "https://images.unsplash.com/photo-1589365278144-c9e705f843ba?w=600&q=80",
    stock: 200,
    featured: false,
  },
  {
    name: "Hustle Chain — Gold",
    description: "18K gold-plated Cuban link chain. 24 inch. Heavy. Royal.",
    price: 44.99,
    category: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
    stock: 18,
    featured: true,
  },
  {
    name: "Legacy Tee — White",
    description: "Classic white tee with bold black Legacy graphic. 100% organic cotton.",
    price: 29.99,
    category: "T-Shirts",
    imageUrl: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&q=80",
    stock: 45,
    featured: false,
  },
  {
    name: "PowerHouse Wireless Earbuds",
    description: "Active noise cancellation. 30hr total battery. Matte black case with gold detail.",
    price: 79.99,
    category: "Speakers / Headphones",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
    stock: 22,
    featured: false,
  },
  {
    name: "65W GaN Wall Charger",
    description: "Foldable 65W GaN charger. Charges laptop, phone, tablet simultaneously.",
    price: 34.99,
    category: "Cables & Chargers",
    imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",
    stock: 60,
    featured: false,
  },
];

async function seed() {
  console.log("Seeding products...");
  for (const p of DEMO_PRODUCTS) {
    await db.insert(schema.products).values(p).onConflictDoNothing();
  }
  console.log(`Seeded ${DEMO_PRODUCTS.length} products.`);
}

seed().catch(console.error).finally(() => process.exit(0));
