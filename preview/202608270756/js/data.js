window.RINK = {
  days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  schedule: {
    Sun: [
      { title: "Sunday afternoon", time: "1:00 PM – 5:00 PM", note: "Public skate · $12" },
      { title: "Adult night (18+)", time: "7:30 PM – 10:30 PM", note: "Spectator $12" }
    ],
    Mon: [{ title: "Private parties / fundraisers", time: "By booking", note: "Office hours 11 AM – 3:30 PM" }],
    Tue: [
      { title: "Coffee club (18+)", time: "10:00 AM – 12:00 PM", note: "$8 / $10 with rental" },
      { title: "Private bookings", time: "Anytime", note: "Call to reserve" }
    ],
    Wed: [{ title: "Wednesday night", time: "6:00 PM – 9:00 PM", note: "Public skate · $12" }],
    Thu: [{ title: "Thursday adult skate (18+)", time: "6:00 PM – 9:00 PM", note: "Public skate · $12" }],
    Fri: [
      { title: "Evening session", time: "6:00 PM – 8:30 PM", note: "Public skate · $12" },
      { title: "Late session", time: "8:00 PM – 10:30 PM", note: "Extra session $5" }
    ],
    Sat: [
      { title: "Saturday lessons", time: "9:30 AM – 10:30 AM", note: "Arrive before 9:45" },
      { title: "Morning Zoo", time: "10:30 AM – 1:00 PM", note: "Includes lesson admission" },
      { title: "Afternoon", time: "1:00 PM – 5:00 PM", note: "Public skate" },
      { title: "Evening", time: "6:00 PM – 10:30 PM", note: "Extra sessions $5" }
    ]
  },
  tonight: [
    { day: "Friday", title: "Evening skate", time: "6:00 PM – 8:30 PM", meta: "All ages · $12", tag: "family" },
    { day: "Friday", title: "Late session", time: "8:00 PM – 10:30 PM", meta: "All ages · extra $5", tag: "family" },
    { day: "Sunday", title: "Adult night", time: "7:30 PM – 10:30 PM", meta: "18+ · spectator $12", tag: "adult" },
    { day: "Saturday", title: "Morning Zoo", time: "10:30 AM – 1:00 PM", meta: "Family · lessons at 9:30", tag: "family" }
  ],
  events: [
    { day: "Thu", title: "Adult skate", time: "6:00–9:00 PM", meta: "18+", tag: "adult" },
    { day: "Fri", title: "Public + late", time: "6:00–10:30 PM", meta: "Family", tag: "family" },
    { day: "Sat", title: "Lessons + Zoo", time: "9:30 AM–1:00 PM", meta: "All ages", tag: "family" },
    { day: "Sun", title: "Adult night", time: "7:30–10:30 PM", meta: "18+", tag: "adult" },
    { day: "Mon", title: "Private rental", time: "By request", meta: "Birthday / group", tag: "private" },
    { day: "Special", title: "Fundraiser night", time: "Mon or Tue evening", meta: "Schools & churches", tag: "special" }
  ],
  map: {
    rink: { title: "The floor", copy: "Open skate, lights, music. This is the main event." },
    dj: { title: "DJ booth", copy: "The soundtrack of the night. Adult nights hit different." },
    snack: { title: "Snack bar", copy: "Open during sessions and private parties. Outside food OK for private rentals — no alcohol." },
    party: { title: "Party area", copy: "Tables, birthday setup, and room for your crew." },
    rental: { title: "Skate rental", copy: "Quads $5 · blades $7 · trainers included." },
    arcade: { title: "Arcade", copy: "A place to take a lap off the floor." }
  },
  rentals: {
    regular: "Regular quads — $5. Most people start here. Socks required.",
    blades: "Rollerblades — $7. Steady, fast, controlled. Bring your own if you prefer.",
    kids: "Kids sizes + skate trainers included. Perfect for first timers."
  }
};
