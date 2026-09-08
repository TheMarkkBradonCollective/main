# The Rink Studios — concept redesign

A full mock upgrade of [therinkstudiossac.com](https://www.therinkstudiossac.com). Not the official venue site.

**Live (GitHub Pages):** https://themarkkbradoncollective.github.io/the-rink-studios/

**Built by:** [The Markk Brandon Collective](https://themarkkbradoncollective.github.io/main/)

## Local

```bash
python3 -m http.server 8080
```

Open http://127.0.0.1:8080/

## Pages

| Page | What it does |
|------|----------------|
| Home | Cinematic hero, show marquee, tickets, venue stats, story, gallery, newsletter |
| Shows | Filterable calendar + event detail |
| About | History of the old skating rink + SWSH |
| Rent | Packages ($1,250–$4,500), amenity list, inquiry form |
| FAQ | Attendee / rental / location answers |
| Contact | Desk details, form, map |
| Team | Roles + embedded Google Form application |
| Privacy | Concept disclaimer |

Newsletter, contact, and rental forms stay in the browser. The team application embeds the venue’s Google Form inline. Ticket buttons do not check out.

Venue facts come from the official site and public listings. Calendar events are invented for the mock.

## Google Form

The team application embeds:

`https://docs.google.com/forms/d/e/1FAIpQLSdxGOng79TPegQhrGpYlYrNwNcBg78w89KhLLgFW2vyKc-AnQ/viewform`

For the iframe to load publicly, the form owner must allow **Anyone with the link can respond** and disable sign-in requirements.
