# Oefeningen-bouwer

Zelfgebouwde, interactieve oefeningen — geen server, geen installatie, gewoon een `.html`-bestand dat je opent in de browser.

## 🔗 Snel naar

| | |
|---|---|
| 🛠️ **[Open de bouwer](builder.html)** | maak of bewerk hier een oefening |
| ⚙️ [engine.js](engine.js) | de motor (los bestand) |
| 🎨 [style.css](style.css) | de opmaak (los bestand) |
| 📦 [engine_and_builder.zip](engine_and_builder.zip) | bouwer + motor + opmaak, alles in één download |
| 📦 [voorbeeld_oef.zip](voorbeeld_oef.zip) | een volledig uitgewerkt voorbeeld, ter inspiratie |

> Bovenstaande links gaan ervan uit dat deze bestanden naast dit `README.md` staan (repo-root). Verplaats je iets, pas de links hierboven aan.

---

## Bestandenoverzicht

### `builder.html` — de bouwer
Waar je een oefening in elkaar klikt: opgave, vragen, hints en instellingen. Werkt volledig in de browser, niets wordt ergens naartoe verstuurd. Aan het einde exporteer je één `.html`-bestand.

### `engine.js` — de motor
Het script dat een geëxporteerde oefening laat werken (vragen ontgrendelen, antwoorden nakijken, hints tonen, sleepvragen, enz.). **Nooit zelf aanpassen** — elke geëxporteerde oefening deelt hetzelfde bestand.

### `style.css` — de opmaak
Alle kleuren, kaders en lay-out. **Nooit zelf aanpassen.** Kleurenpalet en volledige-breedte-weergave stel je in via de bouwer, niet in dit bestand zelf.

### `engine_and_builder.zip`
Een kant-en-klare download met `builder.html` + `engine.js` + `style.css` samen — handig als je alles in één keer lokaal wil hebben staan.

### `voorbeeld_oef.zip`
Een volledig uitgewerkte, geëxporteerde oefening (met foto's en een video) om te zien hoe een eindresultaat eruitziet, of om als vertrekpunt te importeren in de bouwer.
> ⚠️ Deze zip mist momenteel 2 afbeeldingen die de oefening aanhaalt (`materiaal-grafiek.jpg` en `1BO5 foto 6.jpg`) — de hotspot-vraag toont daardoor een gebroken afbeelding tot je die toevoegt.

---

## Een oefening maken

1. Open **[builder.html](builder.html)**.
2. Vul de **opgave** in (tekst + eventueel een figuur).
3. Voeg vragen toe met **"+ Vraag toevoegen"**:
   - **Info** — tekst/uitleg, geen interactie.
   - **Invulvraag** — student typt een getal in.
   - **Meerkeuze** — student vinkt de juiste optie(s) aan.
   - **Foto-keuze** — student kiest de juiste foto tussen meerdere.
   - **Sleep naar hokje op figuur** — hokjes op een afbeelding; de student sleept tekst naar het juiste hokje.
   - **Sleep naar categorie** — vakken met een titel; de student sleept woorden/zinnen in de juiste categorie.
4. Voeg optioneel **hints** toe per vraag. Een hint is zelf ook een block en kan dus ook weer eigen hints bevatten.
5. Vragen ontgrendelen **na elkaar**: vraag 1 moet opgelost zijn voor vraag 2 opengaat, enzovoort.

### Instellingen bovenaan de bouwer
- **Bestandsnaam** — naam van het uiteindelijke HTML-bestand.
- **Importeer/Download HTML** — een bestaande oefening terug inladen om te bewerken, of je werk exporteren.
- **Afrondings-animatie** — lichter scherm + confetti zodra alle vragen zijn opgelost (standaard uit).
- **Volledige breedte** — verbergt de linkerkolom (opgave/figuur), vragen krijgen de volle breedte.
- **Kleurenpalet** — blauw, geel, groen of roze; kleurt zowel de bouwer als de geëxporteerde oefening.
- **Boodschappen bij correct antwoord** — lijstje bemoedigende berichtjes (één per lijn), willekeurig getoond bij een juist antwoord.

## Een oefening exporteren

Klik **"⬇ Download HTML"** in de bouwer. Dit levert één `.html`-bestand op.

## Een oefening runnen/testen

Zet het geëxporteerde `.html`-bestand **in dezelfde map** als `engine.js` en `style.css` (en de afbeeldingen/video's die je gebruikte). Dubbelklikken volstaat — geen server nodig.

```
mijn-oefeningen/
├── engine.js
├── style.css
├── opgave1.html      ← jouw geëxporteerde oefening
├── opgave2.html
└── figuur.jpg        ← afbeeldingen die je in de vragen gebruikte
```

`engine.js` en `style.css` zijn **gedeeld** door al je oefeningen — één exemplaar van elk in de map volstaat voor alle `.html`-bestanden erin.

## Afbeeldingen gebruiken

Geef bij een afbeelding-veld gewoon de **bestandsnaam** op (bv. `figuur.jpg`) en zorg dat dat bestand naast de oefening staat. Elke figuur krijgt automatisch een "+"-knopje om ze op volledig scherm te bekijken.

## Een bestaande oefening opnieuw bewerken

In de bouwer: klik **"📂 Importeer HTML"** en kies het geëxporteerde bestand. Alles (vragen, hints, instellingen) wordt teruggeladen zodat je verder kan werken.
