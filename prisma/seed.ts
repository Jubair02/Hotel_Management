import { PrismaClient, Role, RoomType, RoomStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const IMG = {
  deluxe:
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80",
  suite:
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200&q=80",
  double:
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80",
  single:
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80",
  twin: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&q=80",
  family:
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80",
  pool: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
  view: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80",
};

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const users = [
    { name: "Aisha Rahman", email: "admin@grandtulip.com", role: Role.ADMIN },
    {
      name: "Rafiq Chowdhury",
      email: "reception@grandtulip.com",
      role: Role.RECEPTIONIST,
    },
    {
      name: "Shilpi Akter",
      email: "housekeeping@grandtulip.com",
      role: Role.HOUSEKEEPING,
    },
    { name: "Demo Guest", email: "guest@example.com", role: Role.GUEST },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role },
      create: { ...u, password, phone: "+8801700000000" },
    });
  }

  const rooms: {
    roomNumber: string;
    name: string;
    type: RoomType;
    description: string;
    pricePerNight: number;
    capacity: number;
    status: RoomStatus;
    images: string[];
    amenities: string[];
  }[] = [
    {
      roomNumber: "101",
      name: "Classic Single",
      type: RoomType.SINGLE,
      description:
        "A calm, compact room for the solo traveller — a queen bed, a writing desk by the window, and everything within arm's reach.",
      pricePerNight: 3500,
      capacity: 1,
      status: RoomStatus.AVAILABLE,
      images: [IMG.single, IMG.view],
      amenities: ["Wi-Fi", "Air Conditioning", "TV", "Work Desk", "Hot Water"],
    },
    {
      roomNumber: "102",
      name: "Classic Single",
      type: RoomType.SINGLE,
      description:
        "A quiet single room on the courtyard side with a queen bed, blackout curtains, and a rainfall shower.",
      pricePerNight: 3500,
      capacity: 1,
      status: RoomStatus.AVAILABLE,
      images: [IMG.single],
      amenities: ["Wi-Fi", "Air Conditioning", "TV", "Hot Water"],
    },
    {
      roomNumber: "201",
      name: "Garden Double",
      type: RoomType.DOUBLE,
      description:
        "A king bed overlooking the garden, with a reading chair, minibar, and generous morning light.",
      pricePerNight: 5500,
      capacity: 2,
      status: RoomStatus.AVAILABLE,
      images: [IMG.double, IMG.view],
      amenities: [
        "Wi-Fi",
        "Air Conditioning",
        "TV",
        "Minibar",
        "Garden View",
        "Breakfast Included",
      ],
    },
    {
      roomNumber: "202",
      name: "City Twin",
      type: RoomType.TWIN,
      description:
        "Two comfortable single beds with a city outlook — ideal for colleagues or friends travelling together.",
      pricePerNight: 5200,
      capacity: 2,
      status: RoomStatus.AVAILABLE,
      images: [IMG.twin],
      amenities: ["Wi-Fi", "Air Conditioning", "TV", "Work Desk", "Minibar"],
    },
    {
      roomNumber: "301",
      name: "Deluxe King",
      type: RoomType.DELUXE,
      description:
        "A spacious deluxe room with a king bed, lounge corner, walk-in shower, and skyline views from the seventh floor.",
      pricePerNight: 8500,
      capacity: 2,
      status: RoomStatus.AVAILABLE,
      images: [IMG.deluxe, IMG.pool],
      amenities: [
        "Wi-Fi",
        "Air Conditioning",
        "Smart TV",
        "Minibar",
        "City View",
        "Bathtub",
        "Breakfast Included",
      ],
    },
    {
      roomNumber: "302",
      name: "Deluxe King",
      type: RoomType.DELUXE,
      description:
        "Deluxe comfort with a king bed, espresso machine, and a deep soaking tub — our most requested room.",
      pricePerNight: 8500,
      capacity: 3,
      status: RoomStatus.AVAILABLE,
      images: [IMG.deluxe],
      amenities: [
        "Wi-Fi",
        "Air Conditioning",
        "Smart TV",
        "Minibar",
        "Espresso Machine",
        "Bathtub",
      ],
    },
    {
      roomNumber: "401",
      name: "Family Retreat",
      type: RoomType.FAMILY,
      description:
        "Two connecting sleeping areas, a king bed plus twin beds, and space for the whole family to unwind.",
      pricePerNight: 11000,
      capacity: 5,
      status: RoomStatus.AVAILABLE,
      images: [IMG.family, IMG.pool],
      amenities: [
        "Wi-Fi",
        "Air Conditioning",
        "Smart TV",
        "Minibar",
        "Connecting Rooms",
        "Breakfast Included",
        "Crib Available",
      ],
    },
    {
      roomNumber: "501",
      name: "Tulip Suite",
      type: RoomType.SUITE,
      description:
        "The signature suite — separate living room, panoramic corner windows, king bed, and butler service on request.",
      pricePerNight: 18000,
      capacity: 4,
      status: RoomStatus.AVAILABLE,
      images: [IMG.suite, IMG.view, IMG.pool],
      amenities: [
        "Wi-Fi",
        "Air Conditioning",
        "Smart TV",
        "Minibar",
        "Living Room",
        "Panoramic View",
        "Bathtub",
        "Butler Service",
        "Breakfast Included",
      ],
    },
    {
      roomNumber: "103",
      name: "Courtyard Single",
      type: RoomType.SINGLE,
      description:
        "Ground-floor single opening onto the courtyard palms — a queen bed, a reading lamp worth staying in for, and the pool a few steps away.",
      pricePerNight: 3800,
      capacity: 1,
      status: RoomStatus.AVAILABLE,
      images: [IMG.single, IMG.pool],
      amenities: ["Wi-Fi", "Air Conditioning", "TV", "Courtyard Access", "Hot Water"],
    },
    {
      roomNumber: "104",
      name: "Classic Single",
      type: RoomType.SINGLE,
      description:
        "Our quietest single, tucked at the end of the first-floor corridor — queen bed, deep desk, and blackout curtains for late sleepers.",
      pricePerNight: 3500,
      capacity: 1,
      status: RoomStatus.AVAILABLE,
      images: [IMG.single],
      amenities: ["Wi-Fi", "Air Conditioning", "TV", "Work Desk", "Hot Water"],
    },
    {
      roomNumber: "203",
      name: "Garden Double",
      type: RoomType.DOUBLE,
      description:
        "King bed facing the garden, with a window seat built for morning tea and afternoon rain.",
      pricePerNight: 5500,
      capacity: 2,
      status: RoomStatus.AVAILABLE,
      images: [IMG.double, IMG.view],
      amenities: [
        "Wi-Fi",
        "Air Conditioning",
        "TV",
        "Minibar",
        "Garden View",
        "Breakfast Included",
      ],
    },
    {
      roomNumber: "204",
      name: "Lake Double",
      type: RoomType.DOUBLE,
      description:
        "The corner double — king bed, two windows over Gulshan Lake, and the best sunset on the second floor.",
      pricePerNight: 6200,
      capacity: 2,
      status: RoomStatus.AVAILABLE,
      images: [IMG.double, IMG.view],
      amenities: [
        "Wi-Fi",
        "Air Conditioning",
        "Smart TV",
        "Minibar",
        "Lake View",
        "Breakfast Included",
      ],
    },
    {
      roomNumber: "205",
      name: "City Twin",
      type: RoomType.TWIN,
      description:
        "Two single beds, two desks, one city view — set up for colleagues who need to work and sleep well.",
      pricePerNight: 5200,
      capacity: 2,
      status: RoomStatus.AVAILABLE,
      images: [IMG.twin],
      amenities: ["Wi-Fi", "Air Conditioning", "TV", "Work Desk", "Minibar"],
    },
    {
      roomNumber: "303",
      name: "Deluxe Twin",
      type: RoomType.TWIN,
      description:
        "Deluxe-floor twin with two queen beds, a lounge chair, and a rainfall shower — room to spare for two.",
      pricePerNight: 7800,
      capacity: 3,
      status: RoomStatus.AVAILABLE,
      images: [IMG.twin, IMG.deluxe],
      amenities: [
        "Wi-Fi",
        "Air Conditioning",
        "Smart TV",
        "Minibar",
        "City View",
        "Rainfall Shower",
      ],
    },
    {
      roomNumber: "304",
      name: "Deluxe King",
      type: RoomType.DELUXE,
      description:
        "King bed, skyline windows, and a deep soaking tub — the deluxe room with the evening light.",
      pricePerNight: 8500,
      capacity: 2,
      status: RoomStatus.AVAILABLE,
      images: [IMG.deluxe, IMG.view],
      amenities: [
        "Wi-Fi",
        "Air Conditioning",
        "Smart TV",
        "Minibar",
        "City View",
        "Bathtub",
        "Breakfast Included",
      ],
    },
    {
      roomNumber: "402",
      name: "Family Retreat",
      type: RoomType.FAMILY,
      description:
        "Two connecting rooms — a king for the grown-ups, twins for the children — with a shared sitting area and a view of the courtyard.",
      pricePerNight: 11000,
      capacity: 5,
      status: RoomStatus.AVAILABLE,
      images: [IMG.family, IMG.pool],
      amenities: [
        "Wi-Fi",
        "Air Conditioning",
        "Smart TV",
        "Minibar",
        "Connecting Rooms",
        "Breakfast Included",
        "Crib Available",
      ],
    },
    {
      roomNumber: "403",
      name: "Garden Family",
      type: RoomType.FAMILY,
      description:
        "A single large family room with a king bed and a full-size sofa bed, opening onto a private slice of the garden terrace.",
      pricePerNight: 9800,
      capacity: 4,
      status: RoomStatus.AVAILABLE,
      images: [IMG.family, IMG.view],
      amenities: [
        "Wi-Fi",
        "Air Conditioning",
        "Smart TV",
        "Minibar",
        "Garden Terrace",
        "Sofa Bed",
        "Breakfast Included",
      ],
    },
    {
      roomNumber: "502",
      name: "Lake Suite",
      type: RoomType.SUITE,
      description:
        "Separate living room, king bedroom, and a private balcony over the lake — the suite for long stays and slow mornings.",
      pricePerNight: 15500,
      capacity: 3,
      status: RoomStatus.AVAILABLE,
      images: [IMG.suite, IMG.view],
      amenities: [
        "Wi-Fi",
        "Air Conditioning",
        "Smart TV",
        "Minibar",
        "Living Room",
        "Private Balcony",
        "Lake View",
        "Bathtub",
        "Breakfast Included",
      ],
    },
  ];

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { roomNumber: r.roomNumber },
      update: {},
      create: r,
    });
  }

  console.log("Seeded users:");
  console.log("  admin@grandtulip.com / password123 (ADMIN)");
  console.log("  reception@grandtulip.com / password123 (RECEPTIONIST)");
  console.log("  housekeeping@grandtulip.com / password123 (HOUSEKEEPING)");
  console.log("  guest@example.com / password123 (GUEST)");
  console.log(`Seeded ${rooms.length} rooms.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
