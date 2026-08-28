window.MHP = {
  brand: {
    name: "My Happy Plate",
    tagline: "A Little Happy in Every Bite.",
    owner: "Tyrone Johnson"
  },
  location: {
    label: "Sacramento stop",
    address: "Today's location posts here each morning.",
    hours: "11:00 AM – 7:00 PM",
    openHour: 11,
    closeHour: 19,
    status: "open",
    mapQuery: "Sacramento CA food truck"
  },
  dinner: {
    id: "dinner-today",
    name: "Smothered Chicken Dinner",
    description: "Come see what I made. Tender chicken in homemade gravy with the comfort sides.",
    main: "Smothered Chicken",
    sides: ["Mac & Cheese", "Collard Greens"],
    bread: "Cornbread",
    dessert: "Peach Cobbler",
    price: 17,
    qty: 32,
    sold: 21,
    status: "available"
  },
  happyPlate: {
    id: "comfort",
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
  key: "mhp-app-v1",
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
      orders: saved.orders || [],
      season: saved.season || "fall"
    };
  },
  cartKey: "mhp-cart-v1",
  cart() {
    try {
      return JSON.parse(sessionStorage.getItem(this.cartKey) || "[]");
    } catch {
      return [];
    }
  },
  setCart(items) {
    sessionStorage.setItem(this.cartKey, JSON.stringify(items));
    window.dispatchEvent(new Event("mhp-cart"));
  },
  addToCart(item) {
    const cart = this.cart();
    const existing = cart.find((c) => c.id === item.id);
    if (existing) existing.qty += item.qty || 1;
    else cart.push({ ...item, qty: item.qty || 1 });
    this.setCart(cart);
    return cart;
  },
  remainingDinner() {
    const d = this.state().dinner;
    return Math.max(0, (d.qty || 0) - (d.sold || 0));
  },
  nextCode() {
    const n = (this.load().seq || 0) + 1;
    this.save({ seq: n });
    const d = new Date();
    const stamp = `${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    return `MHP-${stamp}-${String(n).padStart(4, "0")}`;
  },
  placeOrder({ name, phone, note, pickupAt, lines }) {
    const st = this.state();
    const dinnerQty = lines
      .filter((l) => l.id === "dinner-today" || l.id === "comfort")
      .reduce((n, l) => n + l.qty, 0);
    if (dinnerQty > this.remainingDinner()) {
      throw new Error("Not enough dinner plates left for that pickup.");
    }
    const soldOut = lines.some((l) => {
      const status = st.items[l.id]?.status;
      return status === "sold" || status === "coming" || status === "hidden";
    });
    if (soldOut) throw new Error("Something in the bag is sold out. Check the menu.");
    const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
    const order = {
      id: this.nextCode(),
      name,
      phone,
      note: note || "",
      pickupAt,
      items: lines,
      total: subtotal,
      status: "new",
      pay: "pay_at_pickup",
      createdAt: new Date().toISOString()
    };
    const dinner = { ...st.dinner };
    if (dinnerQty) {
      dinner.sold = (dinner.sold || 0) + dinnerQty;
      if (dinner.sold >= dinner.qty) dinner.status = "sold";
      else if (dinner.qty - dinner.sold <= 5) dinner.status = "almost";
    }
    this.save({ orders: [order, ...st.orders], dinner });
    this.setCart([]);
    return order;
  },
  setOrderStatus(id, status) {
    const orders = this.state().orders.map((o) => (o.id === id ? { ...o, status } : o));
    this.save({ orders });
  }
};
