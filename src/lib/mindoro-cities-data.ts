/**
 * Oriental Mindoro Cities Data
 * Contains information about each municipality for the Explore Mindoro section
 */

export interface MindoroCity {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  highlights: string[];
  touristSpots: string[];
  localProducts: string[];
}

export const MINDORO_CITIES: MindoroCity[] = [
  {
    id: "calapan-city",
    name: "Calapan City",
    displayName: "Calapan City",
    slug: "calapan-city",
    description: "The thriving capital city of Oriental Mindoro",
    longDescription:
      "Calapan City, the capital of Oriental Mindoro, is a vibrant hub of commerce and culture. Known for its bustling markets, historic churches, and warm community, it offers visitors an authentic glimpse into provincial Philippine life.",
    imageUrl:
      "https://images.unsplash.com/photo-1548013146-72f27e1f306d?w=800&h=600&fit=crop",
    latitude: 12.7556,
    longitude: 121.1869,
    highlights: [
      "Calapan Market",
      "Tabinay Beach",
      "Tamaraw Falls (nearby)",
    ],
    touristSpots: [
      "Calapan Cathedral",
      "City Proper",
      "Pola Beach",
      "Mansalay Beach",
    ],
    localProducts: [
      "Fresh seafood",
      "Agricultural produce",
      "Local textiles",
      "Coconut products",
    ],
  },
  {
    id: "puerto-galera",
    name: "Puerto Galera",
    displayName: "Puerto Galera",
    slug: "puerto-galera",
    description: "Premier beach destination and dive capital",
    longDescription:
      "Puerto Galera is renowned as one of the Philippines' premier beach destinations and dive capitals. With its crystal-clear waters, pristine beaches, and world-class diving spots, it's a paradise for beach lovers and adventure seekers.",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
    latitude: 13.8131,
    longitude: 120.9624,
    highlights: [
      "White Beach",
      "Big Lagoon",
      "Small Lagoon",
      "Diving sites",
    ],
    touristSpots: [
      "White Beach",
      "Sabang Beach",
      "Talipanan Beach",
      "Big Lagoon Beach",
      "Dipolog Strait",
    ],
    localProducts: [
      "Fresh fish",
      "Seafood delicacies",
      "Local crafts",
      "Coconut souvenirs",
    ],
  },
  {
    id: "bongabong",
    name: "Bongabong",
    displayName: "Bongabong",
    slug: "bongabong",
    description: "Scenic municipality by the coast",
    longDescription:
      "Bongabong is a picturesque coastal municipality in Oriental Mindoro. It's known for its beautiful beaches, warm hospitality, and agricultural heritage.",
    imageUrl:
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    latitude: 12.4833,
    longitude: 121.3167,
    highlights: [
      "Bongabong Beach",
      "Coconut plantations",
      "Local markets",
    ],
    touristSpots: [
      "Bongabong Beach",
      "Pola-Bongabong Bridge",
      "Local mangrove areas",
      "Fishing villages",
    ],
    localProducts: [
      "Coconut oil",
      "Dried fish",
      "Agricultural products",
      "Woven baskets",
    ],
  },
  {
    id: "roxas",
    name: "Roxas",
    displayName: "Roxas",
    slug: "roxas",
    description: "Fishing town rich in marine culture",
    longDescription:
      "Roxas is a charming fishing town known for its abundance of fresh seafood and vibrant fishing culture. It's a gateway to understanding the maritime heritage of Oriental Mindoro.",
    imageUrl:
      "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop",
    latitude: 12.6,
    longitude: 121.25,
    highlights: [
      "Fresh fish markets",
      "Fishing villages",
      "Coastal views",
    ],
    touristSpots: [
      "Roxas Market",
      "Fishing harbor",
      "Coastal fishing communities",
    ],
    localProducts: [
      "Fresh fish",
      "Dried fish",
      "Fish sauce",
      "Seafood specialties",
    ],
  },
  {
    id: "san-teodoro",
    name: "San Teodoro",
    displayName: "San Teodoro",
    slug: "san-teodoro",
    description: "Peaceful municipality with agricultural heritage",
    longDescription:
      "San Teodoro is a peaceful municipality known for its agricultural abundance and friendly locals. It offers a more rural, authentic experience of Oriental Mindoro life.",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    latitude: 12.8667,
    longitude: 121.5167,
    highlights: [
      "Agricultural farms",
      "Local markets",
      "Rural landscapes",
    ],
    touristSpots: [
      "San Teodoro Church",
      "Town plaza",
      "Local markets",
      "Farming communities",
    ],
    localProducts: [
      "Fresh vegetables",
      "Rice",
      "Coconut products",
      "Local crafts",
    ],
  },
  {
    id: "mansalay",
    name: "Mansalay",
    displayName: "Mansalay",
    slug: "mansalay",
    description: "Hidden gem with pristine beaches",
    longDescription:
      "Mansalay is a hidden gem in Oriental Mindoro, boasting pristine beaches and a relaxed atmosphere. It's perfect for travelers seeking peace and natural beauty away from crowded tourist spots.",
    imageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=600&fit=crop",
    latitude: 12.4,
    longitude: 121.3833,
    highlights: [
      "Mansalay Beach",
      "Clear waters",
      "Local hospitality",
    ],
    touristSpots: [
      "Mansalay Beach",
      "Mansalay Church",
      "Fishing communities",
      "Local markets",
    ],
    localProducts: [
      "Coconut products",
      "Fish",
      "Vegetables",
      "Handicrafts",
    ],
  },
  {
    id: "naujan",
    name: "Naujan",
    displayName: "Naujan",
    slug: "naujan",
    description: "Eco-friendly municipality with natural attractions",
    longDescription:
      "Naujan is known for its environmental conservation efforts and rich natural attractions. It features scenic landscapes, bird sanctuaries, and sustainable tourism initiatives.",
    imageUrl:
      "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop",
    latitude: 12.7167,
    longitude: 121.4167,
    highlights: [
      "Naujan Lake",
      "Bird sanctuary",
      "Natural ecosystems",
    ],
    touristSpots: [
      "Naujan Lake",
      "Wetland sanctuary",
      "Nature trails",
      "Local villages",
    ],
    localProducts: [
      "Aquatic plants",
      "Fish species",
      "Local produce",
      "Nature-inspired crafts",
    ],
  },
  {
    id: "pinamalayan",
    name: "Pinamalayan",
    displayName: "Pinamalayan",
    slug: "pinamalayan",
    description: "Agricultural center with scenic views",
    longDescription:
      "Pinamalayan is an important agricultural center in Oriental Mindoro. Known for its fertile lands and farming communities, it offers insights into the region's agricultural backbone.",
    imageUrl:
      "https://images.unsplash.com/photo-1500382017468-f049863256f0?w=800&h=600&fit=crop",
    latitude: 12.65,
    longitude: 121.35,
    highlights: [
      "Agricultural farms",
      "Mountain views",
      "Local markets",
    ],
    touristSpots: [
      "Pinamalayan town center",
      "Agricultural areas",
      "Local markets",
      "Scenic viewpoints",
    ],
    localProducts: [
      "Rice",
      "Vegetables",
      "Coconut products",
      "Locally-made goods",
    ],
  },
];

// Quick lookup by slug
export const getCityBySlug = (slug: string): MindoroCity | undefined => {
  return MINDORO_CITIES.find(city => city.slug === slug);
};

// Get all city slugs for route generation
export const getAllCitySlugs = (): string[] => {
  return MINDORO_CITIES.map(city => city.slug);
};
