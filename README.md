# Oefeningen maken — snelstartgids

## De 4 bestanden

| Bestand | Wat is het |
|---|---|
| `builder.html` | De bouwer — hierin stel je een oefening samen. Open gewoon in je browser, geen server nodig. |
| `engine.js` | De motor die een oefening laat werken. Nooit zelf aanpassen. |
| `style.css` | De opmaak (kleuren, lay-out). Nooit zelf aanpassen. |
| `oefening.html` | Een voorbeeld van een geëxporteerde oefening — ter inspiratie. |

## Een oefening maken

1. Open **`builder.html`** in je browser (dubbelklikken volstaat).
2. Vul bovenaan de **opgave** in (tekst + eventueel een figuur).
3. Voeg vragen toe met **"+ Vraag toevoegen"**. Kies per vraag een type:
   - **Info** — puur tekst/uitleg, geen interactie.
   - **Invulvraag** — student typt een getal in.
   - **Meerkeuze** — student vinkt de juiste optie(s) aan.
   - **Foto-keuze** — student kiest de juiste foto tussen meerdere.
   - **Sleep naar hokje op figuur** — je tekent hokjes op een afbeelding; de student sleept tekst naar het juiste hokje.
   - **Sleep naar categorie** — vakken met een titel; de student sleept woorden/zinnen in de juiste categorie.
4. Voeg optioneel **hints** toe per vraag (klik "+ Hint toevoegen" onderaan de vraag). Een hint is zelf ook gewoon een block, dus een hint kan ook weer een hint bevatten.
5. Vragen worden **na elkaar** ontgrendeld: de student moet vraag 1 oplossen voor vraag 2 opengaat, enzovoort.

### Instellingen bovenaan

- **Bestandsnaam** — naam van het uiteindelijke HTML-bestand.
- **Importeer/Download HTML** — een bestaande oefening terug inladen om te bewerken, of je werk exporteren.
- **Afrondings-animatie** — lichter scherm + confetti zodra alle vragen zijn opgelost (staat standaard uit).
- **Volledige breedte** — verbergt de linkerkolom (opgave/figuur) zodat de vragen de volle breedte krijgen.
- **Kleurenpalet** — blauw, geel, groen of roze; kleurt zowel de bouwer als de geëxporteerde oefening.
- **Boodschappen bij correct antwoord** — een lijstje bemoedigende berichtjes (één per lijn) dat willekeurig getoond wordt bij een juist antwoord.

## Een oefening exporteren

Klik op **"⬇ Download HTML"**. Dit levert één `.html`-bestand op.

## Een oefening runnen/testen

Zet het geëxporteerde `.html`-bestand **in dezelfde map** als `engine.js` en `style.css` (en eventuele afbeeldingen die je gebruikte). Dubbelklik het `.html`-bestand — het opent gewoon in de browser, **geen server of installatie nodig**.

```
mijn-oefeningen/
├── engine.js
├── style.css
├── opgave1.html      ← jouw geëxporteerde oefening
├── opgave2.html
└── figuur.jpg        ← afbeeldingen die je in de vragen gebruikte
```

> Belangrijk: `engine.js` en `style.css` zijn **gedeeld** door al je oefeningen. Eén exemplaar van elk in de map volstaat voor alle `.html`-bestanden erin.

## Afbeeldingen gebruiken

Sleep geen bestanden — geef bij een afbeelding-veld gewoon de **bestandsnaam** op (bv. `figuur.jpg`), en zorg dat dat bestand naast de oefening staat. Elke figuur krijgt automatisch een "+"-knopje om ze op volledig scherm te bekijken.

## Een bestaande oefening opnieuw bewerken

In de bouwer: klik **"📂 Importeer HTML"** en kies het geëxporteerde bestand. Alles (vragen, hints, instellingen) wordt teruggeladen zodat je verder kan werken.
