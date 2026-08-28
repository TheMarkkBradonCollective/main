window.MHP = {
  brand: {
    name: "My Happy Plate",
    tagline: "A Little Happy in Every Bite.",
    owner: "Tyrone Johnson",
    voice: "Come get you a plate."
  },
  location: {
    label: "Sacramento stop",
    address: "Today's location posts here each morning.",
    hours: "11:00 AM – 7:00 PM",
    status: "open",
    mapQuery: "Sacramento CA food truck"
  },
  dinner: {
    name: "Smothered Chicken Dinner",
    description: "Come see what I made. Tender chicken in homemade gravy with the comfort sides.",
    main: "Smothered Chicken",
    sides: ["Mac & Cheese", "Collard Greens"],
    bread: "Cornbread",
    dessert: "Peach Cobbler",
    price: 17,
    qty: 32,
    sold: 21,
    status: "available",
    start: null,
    end: null
  },
  happyPlate: {
    name: "Smothered Chicken Comfort Plate",
    sides: "Mac & Cheese • Greens • Cornbread",
    price: 17
  },
  menuDate: "Friday • August 28",
  categories: [
    {
      id: "plates",
      name: "Plates",
      items: [
        { id: "comfort", name: "Smothered Chicken Comfort Plate", desc: "Smothered chicken, mac & cheese, collard greens, cornbread.", price: 17, status: "available", favorite: true },
        { id: "catfish", name: "Fried Catfish Plate", desc: "Crispy catfish, two sides, and bread.", price: 18, status: "available" }
      ]
    },
    {
      id: "dishes",
      name: "Dishes",
      items: [
        { id: "chicken", name: "Smothered Chicken", desc: "Tender chicken simmered in rich homemade gravy.", price: 12, status: "available" },
        { id: "ribs", name: "BBQ Ribs", desc: "Fall-off-the-bone, house sauce.", price: 16, status: "almost" },
        { id: "meatloaf", name: "Meatloaf", desc: "Sunday-table meatloaf, extra gravy if you want it.", price: 13, status: "available" }
      ]
    },
    {
      id: "sides",
      name: "Sides",
      items: [
        { id: "mac", name: "Mac & Cheese", price: 5, status: "available" },
        { id: "greens", name: "Collard Greens", price: 5, status: "available" },
        { id: "yams", name: "Yams", price: 5, status: "available" },
        { id: "cornbread", name: "Cornbread", price: 3, status: "available" }
      ]
    },
    {
      id: "desserts",
      name: "Desserts",
      items: [
        { id: "cobbler", name: "Peach Cobbler", price: 6, status: "available" },
        { id: "pudding", name: "Banana Pudding", price: 6, status: "coming" }
      ]
    },
    {
      id: "drinks",
      name: "Drinks",
      items: [
        { id: "tea", name: "Sweet Tea", price: 3, status: "available" },
        { id: "lemonade", name: "Lemonade", price: 3, status: "available" },
        { id: "water", name: "Water", price: 2, status: "available" }
      ]
    }
  ],
  history: [
    { date: "Aug 27", name: "Smothered Chicken" },
    { date: "Aug 26", name: "BBQ Ribs" },
    { date: "Aug 25", name: "Fried Catfish" },
    { date: "Aug 24", name: "Meatloaf" },
    { date: "Aug 23", name: "Chicken & Waffles" }
  ]
};

window.MHPStore = {
  key: "mhp-preview-202608280103",
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || "null") || {};
    } catch {
      return {};
    }
  },
  save(partial) {
    const next = { ...this.load(), ...partial };
    localStorage.setItem(this.key, JSON.stringify(next));
    window.dispatchEvent(new Event("mhp-update"));
    return next;
  },
  state() {
    const saved = this.load();
    return {
      dinner: { ...window.MHP.dinner, ...(saved.dinner || {}) },
      location: { ...window.MHP.location, ...(saved.location || {}) },
      items: saved.items || {},
      season: saved.season || "fall"
    };
  }
};
