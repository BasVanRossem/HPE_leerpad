# Oefeningen-bouwer

Met deze tool maak je zelf interactieve oefeningen. Je hebt er geen server of installatie voor nodig: je opent gewoon een `.html`-bestand in je browser en je kan aan de slag.

## Downloaden

- 📦 [engine_and_builder.zip](engine_and_builder.zip): de bouwer, de motor en de opmaak samen, alles wat je nodig hebt om zelf oefeningen te maken.
- 📦 [voorbeeld_oef.zip](voorbeeld_oef.zip): een volledig uitgewerkte oefening, zodat je kan zien hoe een eindresultaat eruitziet.

Note: pak deze zipbestanden uit en open oefening.html om de voorbeeld oefening te zien (als je de antwoorden wil om hier eens door te gaan kan je deze importeren in de builder waar alles zichtbaar is). Om direct te beginnen bouwen kan je simpelweg de andere zip gebruiken en de builder openen. (Je opent deze bestanden simpelweg in google, firefox, ... door ze te dubbelklikken)
## Beschikbare bestanden

- **`builder.html`** is de bouwer zelf. Hier stel je een oefening samen: de opgave, de vragen, de hints en een aantal instellingen. Alles gebeurt in je browser, er wordt niets ergens naartoe verstuurd. Op het einde exporteer je één `.html`-bestand.
- **`engine.js`** is de motor die een geëxporteerde oefening laat werken: vragen ontgrendelen, antwoorden nakijken, hints tonen, sleepvragen laten functioneren, enzovoort. Dit bestand pas je nooit zelf aan.
- **`style.css`** bepaalt de opmaak: kleuren, kaders en lay-out. Ook dit bestand pas je nooit zelf aan. Het kleurenpalet en de volledige-breedte-weergave stel je in via de bouwer zelf, niet in dit bestand.
- **`engine_and_builder.zip`** bundelt `builder.html`, `engine.js` en `style.css` samen, zodat je alles in één keer kan downloaden.
- **`voorbeeld_oef.zip`** bevat een kant-en-klare oefening met foto's en een video, als voorbeeld of als vertrekpunt om zelf mee te experimenteren.

## Hoe gebruik je dit

Zet `engine.js` en `style.css` in dezelfde map als een `.html`-bestand, zoals het voorbeeld `oefening.html`. Zo'n `.html`-bestand is het enige dat verandert van oefening tot oefening, en je maakt het aan met `builder.html`. Zet daarnaast ook alle afbeeldingen en video's die je in je oefening gebruikt in diezelfde map. Open vervolgens de oefening in je browser, en je kan ermee aan de slag.

```
mijn-oefeningen/
├── engine.js
├── style.css
├── oefening1.html
├── oefening2.html
└── figuur.jpg
```

Wil je een bestaande oefening opnieuw bewerken? Open de bouwer, klik op "Importeer HTML" en kies het geëxporteerde bestand. Alles wordt teruggeladen zodat je verder kan werken.

## Functionaliteiten

- Zes soorten vragen: info (zuivere uitleg), invulvraag, meerkeuze, foto-keuze, slepen naar een hokje op een figuur, en slepen naar een categorie.
- Hints per vraag, die zelf ook weer eigen hints kunnen bevatten.
- Vragen die na elkaar ontgrendelen: een student moet de vorige vraag oplossen voor de volgende opengaat.
- Een afrondings-animatie (lichter scherm met confetti) zodra alle vragen zijn opgelost, aan te zetten in de bouwer.
- Vier kleurenpaletten (blauw, geel, groen, roze), die zowel de bouwer als de geëxporteerde oefening kleuren.
- Een volledige-breedte-weergave die de opgave/figuur-kolom verbergt, zodat de vragen de volle breedte krijgen.
- Aanpasbare succesboodschappen die willekeurig verschijnen bij een juist antwoord.
- Een vergrootknopje op elke figuur waarmee je ze op volledig scherm kan bekijken.

## Integreren in Ufora

Je moet de motor en de opmaak eenmaal uploaden in de Ufora-cursus waarvoor je een leerpadoefening wil maken. Doe dit liefst in een verborgen map, zodat studenten hier niet bij kunnen. Waar die map precies staat maakt niet uit, zolang hij maar in dezelfde cursus staat als waar je oefening straks komt.

Vervolgens maak je per oefening een map aan in Ufora, bijvoorbeeld "oefening 1", waarin je alle figuren en video's plaatst die je in die oefening gebruikt. Ook deze map plaats je best niet zichtbaar voor studenten, om verwarring te vermijden.

Daarna upload je je gemaakte `oefening.html` (bijvoorbeeld hernoemd naar `oefening1.html`) op de plek waar je wil dat studenten de oefening maken. Zij kunnen de oefening dan zien en invullen.
