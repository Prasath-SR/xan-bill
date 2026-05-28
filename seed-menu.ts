import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const menuData = [
  {
    category: "Master Special Dosa",
    items: [
      { name: "Chicken Kari-Dosa", price: 220 },
      { name: "Mutton Kari-Dosa", price: 260 },
      { name: "Podi Dosa", price: 80 },
      { name: "Egg Dosa", price: 90 },
      { name: "Onion Dosa", price: 90 },
      { name: "Ghee Dosa", price: 100 },
      { name: "Roast", price: 70 },
      { name: "Plain Roast", price: 70 },
      { name: "Podi Roast", price: 80 },
      { name: "Egg Roast", price: 90 },
      { name: "Onion Roast", price: 90 },
      { name: "Ghee Roast", price: 100 },
      { name: "Ghee Podi Roast", price: 120 },
      { name: "Ghee Onion Roast", price: 120 },
      { name: "Masal Roast", price: 100 },
      { name: "Podi Onion Roast", price: 100 }
    ]
  },
  {
    category: "Dosa & South Indian",
    items: [
      { name: "Dosa", price: 60 },
      { name: "Kall Dosa", price: 60 },
      { name: "Uthappam", price: 70 },
      { name: "Idly", price: 20 },
      { name: "Poori", price: 60 },
      { name: "Pongal", price: 70 },
      { name: "Tomato Rice", price: 70 },
      { name: "Vada (1pc)", price: 20 }
    ]
  },
  {
    category: "Parotta Items",
    items: [
      { name: "Parotta", price: 25 },
      { name: "Vazhai Ilai Parotta", price: 150 },
      { name: "Chapathi", price: 30 },
      { name: "Nool Parotta", price: 35 },
      { name: "Egg Chapathi", price: 50 },
      { name: "Chicken Murthapa", price: 180 },
      { name: "Veechu Parotta", price: 35 },
      { name: "Mutta Veechu Parotta", price: 60 },
      { name: "Bun Parotta", price: 40 },
      { name: "Veg Kothu Parotta", price: 100 },
      { name: "Kothu Parotta", price: 120 },
      { name: "Chicken Kothu Parotta", price: 160 },
      { name: "Mutton Kothu Parotta", price: 220 },
      { name: "Chilli Parotta", price: 110 }
    ]
  },
  {
    category: "Tandoor Breads",
    items: [
      { name: "Naan", price: 50 },
      { name: "Roti", price: 40 },
      { name: "Kulcha", price: 50 }
    ]
  },
  {
    category: "Biriyani & Meals",
    items: [
      { name: "Chicken Biriyani", price: 180 },
      { name: "Chicken Varuval Biriyani", price: 220 },
      { name: "Chicken 65 Biriyani", price: 200 },
      { name: "Mutton Varuval Biriyani", price: 320 },
      { name: "Naatukozhi Varuval Biriyani", price: 280 },
      { name: "Empty Biriyani", price: 120 },
      { name: "Egg Biriyani", price: 140 },
      { name: "Veg Meal (Unlimited)", price: 120 },
      { name: "Non-Veg Meal (Unlimited)", price: 150 },
      { name: "Extra Rice", price: 40 }
    ]
  },
  {
    category: "Chinese Rice",
    items: [
      { name: "Chicken Fried Rice", price: 160 },
      { name: "Mutton Fried Rice", price: 220 },
      { name: "Egg Fried Rice", price: 130 },
      { name: "Veg Fried Rice", price: 120 },
      { name: "Mixed Veg Rice", price: 140 },
      { name: "Mushroom Fried Rice", price: 140 },
      { name: "Paneer Fried Rice", price: 150 }
    ]
  },
  {
    category: "Schezwan Rice",
    items: [
      { name: "Schezwan Rice", price: 130 },
      { name: "Schezwan Chicken Rice", price: 170 },
      { name: "Schezwan Mutton Rice", price: 230 },
      { name: "Schezwan Egg Rice", price: 140 },
      { name: "Schezwan Veg Rice", price: 130 },
      { name: "Schezwan Mixed Veg Rice", price: 150 },
      { name: "Schezwan Mushroom Rice", price: 150 },
      { name: "Schezwan Paneer Rice", price: 160 }
    ]
  },
  {
    category: "Chinese Noodles",
    items: [
      { name: "Chicken Noodles", price: 160 },
      { name: "Mutton Noodles", price: 220 },
      { name: "Egg Noodles", price: 130 },
      { name: "Veg Noodles", price: 120 },
      { name: "Mixed Veg Noodles", price: 140 },
      { name: "Mushroom Noodles", price: 140 },
      { name: "Paneer Noodles", price: 150 }
    ]
  },
  {
    category: "Schezwan Noodles",
    items: [
      { name: "Schezwan Noodles", price: 130 },
      { name: "Schezwan Chicken Noodles", price: 170 },
      { name: "Schezwan Mutton Noodles", price: 230 },
      { name: "Schezwan Egg Noodles", price: 140 },
      { name: "Schezwan Veg Noodles", price: 130 },
      { name: "Schezwan Mixed Veg Noodles", price: 150 },
      { name: "Schezwan Mushroom Noodles", price: 150 },
      { name: "Schezwan Paneer Noodles", price: 160 }
    ]
  },
  {
    category: "Chicken Starters",
    items: [
      { name: "Chicken 65", price: 160 },
      { name: "Chicken Lollipop", price: 180 },
      { name: "Chicken Manchurian", price: 170 },
      { name: "Chicken Pepper Fry", price: 180 },
      { name: "Chicken Chukka", price: 180 },
      { name: "Chicken Pallipalayam", price: 190 },
      { name: "Chicken Chettinad Dry", price: 190 },
      { name: "Chicken Pichupota Kari", price: 180 },
      { name: "Chicken Nallampatty", price: 190 },
      { name: "Dragon Chicken", price: 200 },
      { name: "Honey Chicken", price: 200 },
      { name: "Garlic Chicken", price: 180 },
      { name: "Kadai Chicken", price: 190 },
      { name: "Kadai 65", price: 180 },
      { name: "Chicken 777", price: 200 },
      { name: "Chicken 555", price: 200 },
      { name: "Tandoori Chicken", price: 250 },
      { name: "Grill Chicken", price: 250 }
    ]
  },
  {
    category: "Naatukozhi Starters",
    items: [
      { name: "Naatukozhi Pepper Fry", price: 260 },
      { name: "Naatukozhi Chettinad Fry", price: 260 },
      { name: "Naatukozhi Chukka Fry", price: 260 },
      { name: "Naatukozhi Pallipalayam Fry", price: 270 },
      { name: "Naatukozhi Chinthamani Fry", price: 270 },
      { name: "Naatukozhi Nallampatty Fry", price: 270 }
    ]
  },
  {
    category: "Mutton Starters",
    items: [
      { name: "Mutton Pepper Fry", price: 320 },
      { name: "Mutton Chettinad Fry", price: 320 },
      { name: "Mutton Chukka Fry", price: 320 },
      { name: "Mutton Pallipalayam Fry", price: 340 },
      { name: "Mutton Chinthamani Fry", price: 340 },
      { name: "Mutton Nallampatty Fry", price: 340 },
      { name: "Mutton Kudal Fry", price: 250 }
    ]
  },
  {
    category: "Sea-food Starters",
    items: [
      { name: "Fish 65", price: 220 },
      { name: "Paarai Meen (1pc)", price: 180 },
      { name: "Prawn 65", price: 250 },
      { name: "Prawn Kadai Roast", price: 260 },
      { name: "Prawn Pepper Roast", price: 260 }
    ]
  },
  {
    category: "Veg Starters",
    items: [
      { name: "Paneer 65", price: 150 },
      { name: "Paneer Pepper Fry", price: 160 },
      { name: "Paneer Manchurian", price: 160 },
      { name: "Kadai Paneer Dry", price: 170 },
      { name: "Mushroom 65", price: 140 },
      { name: "Mushroom Pepper Fry", price: 150 },
      { name: "Mushroom Manchurian", price: 150 },
      { name: "Gobi 65", price: 120 },
      { name: "Gobi Pepper Fry", price: 130 },
      { name: "Gobi Manchurian", price: 130 }
    ]
  },
  {
    category: "Chicken Gravy",
    items: [
      { name: "Chicken Chettinad Gravy", price: 180 },
      { name: "Chicken Chinthamani Gravy", price: 190 },
      { name: "Chicken Pallipalayam Gravy", price: 190 },
      { name: "Chicken Hyderabadi Gravy", price: 190 },
      { name: "Chicken Tikka Masala", price: 200 },
      { name: "Chicken Nallampatty Gravy", price: 190 },
      { name: "Chicken Uppukari Gravy", price: 180 },
      { name: "Pepper Chicken Gravy", price: 180 },
      { name: "Butter Chicken Gravy", price: 200 },
      { name: "Garlic Chicken Gravy", price: 180 },
      { name: "Kadai Chicken Gravy", price: 190 },
      { name: "Guntur Chicken Masala", price: 190 }
    ]
  },
  {
    category: "Naatukozhi Gravy",
    items: [
      { name: "Naatukozhi Masala", price: 260 },
      { name: "Naatukozhi Pallipalayam Gravy", price: 270 },
      { name: "Naatukozhi Chinthamani Gravy", price: 270 },
      { name: "Naatukozhi Chettinad Gravy", price: 260 },
      { name: "Pepper Naatukozhi Gravy", price: 260 }
    ]
  },
  {
    category: "Mutton Gravy",
    items: [
      { name: "Mutton Masala", price: 320 },
      { name: "Mutton Pallipalayam Gravy", price: 340 },
      { name: "Mutton Chinthamani Gravy", price: 340 },
      { name: "Mutton Chettinad Gravy", price: 320 },
      { name: "Pepper Mutton Gravy", price: 320 }
    ]
  },
  {
    category: "Sea-food Gravy",
    items: [
      { name: "Crab (Nandu) Gravy", price: 280 },
      { name: "Nandu Pepper Masala", price: 280 },
      { name: "Prawn Masala", price: 250 },
      { name: "Prawn Pepper Gravy", price: 260 }
    ]
  },
  {
    category: "Veg Gravy",
    items: [
      { name: "Paneer Masala", price: 160 },
      { name: "Paneer Butter Masala", price: 180 },
      { name: "Paneer Pallipalayam Gravy", price: 170 },
      { name: "Kadai Paneer Gravy", price: 170 },
      { name: "Mushroom Masala", price: 150 },
      { name: "Mushroom Pepper Gravy", price: 160 },
      { name: "Mushroom Pallipalayam Gravy", price: 160 },
      { name: "Gobi Masala", price: 130 },
      { name: "Gobi Pepper Gravy", price: 140 },
      { name: "Gobi Pallipalayam Gravy", price: 140 }
    ]
  }
];

async function main() {
  console.log('Starting seed...');
  for (const catData of menuData) {
    let category = await prisma.category.findUnique({
      where: { name: catData.category }
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: catData.category, isActive: true }
      });
      console.log(`Created category: ${category.name}`);
    }

    for (const itemData of catData.items) {
      // Create a unique SKU for each item
      const sku = `${category.name.substring(0, 3).toUpperCase()}-${itemData.name.substring(0, 4).toUpperCase().replace(/\s/g, '')}-${crypto.randomUUID().split('-')[0]}`;

      const existingItem = await prisma.menuItem.findFirst({
        where: { name: itemData.name, categoryId: category.id }
      });

      if (!existingItem) {
        await prisma.menuItem.create({
          data: {
            name: itemData.name,
            price: itemData.price,
            gstRate: 5.0, // Assuming standard 5% GST for restaurants
            sku,
            categoryId: category.id,
            isAvailable: true,
            isEnabled: true,
          }
        });
        console.log(`  Added item: ${itemData.name}`);
      } else {
        console.log(`  Item already exists: ${itemData.name}`);
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
