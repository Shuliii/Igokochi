// src/data/menu.js

import dubaiMochi from "../assets/Dubai-Mochi-Chocolate.JPG";
import earlGreyJasmineMatchaLatte from "../assets/Earl-Grey-X-Jasmine-Matcha-Latte.JPG";
import mangoMatchaLatte from "../assets/Mango-Matcha-Latte.JPG";
import matchaCoconutLatte from "../assets/Matcha-Coconut-Latte.JPG";
import strawberryMatchaLatte from "../assets/Strawberry-Matcha-Latte.JPG";
import earlGreyMatchaLatte from "../assets/Earl-Grey-Matcha-Latte.JPG";
import matchaLatte from "../assets/Matcha-Latte.PNG";
import kinakoCreamMatchaLatte from "../assets/Kinako-Cream-Matcha-Latte.PNG";

const menu = [
  {
    id: "matcha-latte",
    name: "Matcha Latte",
    description: "Matcha Latte.",
    price: 5.5,
    image: matchaLatte,
  },
  {
    id: "earl-grey-matcha-latte",
    name: "Earl Grey Matcha Latte",
    description: "Earl Grey Matcha Latte.",
    price: 5.0,
    image: earlGreyMatchaLatte,
  },
  {
    id: "earl-grey-x-jasmine-matcha-latte",
    name: "Earl Grey X Jasmine Matcha Latte",
    description: "Earl Grey Matcha Latte.",
    price: 5.0,
    image: earlGreyJasmineMatchaLatte,
  },
  {
    id: "matcha-coconut-cloud",
    name: "Matcha Coconut Cloud",
    description: "Matcha Coconut Cloud.",
    price: 4.5,
    image: matchaCoconutLatte,
  },
  {
    id: "strawberry-matcha-latte",
    name: "Strawberry Matcha Latte",
    description: "Soft bread with matcha cream filling.",
    price: 6.8,
    image: strawberryMatchaLatte,
  },
  {
    id: "mango-matcha-latte",
    name: "Mango Matcha Latte",
    description: "Japanese egg sandwich with creamy texture.",
    price: 4.8,
    image: mangoMatchaLatte,
  },
  {
    id: "kinako-cream-matcha-latte",
    name: "Kinako Cream Matcha Latte",
    description: "Japanese egg sandwich with creamy texture.",
    price: 4.8,
    image: kinakoCreamMatchaLatte,
  },
  {
    id: "dubai-chewy-chocholate",
    name: "Dubai Chewy Chocolate",
    description: "Japanese egg sandwich with creamy texture.",
    price: 4.8,
    image: dubaiMochi,
  },
];

export default menu;
