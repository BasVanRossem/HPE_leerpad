/* ==========================================================
   QUIZ ENGINE — één generieke motor voor alle oefeningen
   ==========================================================
   Een "block" is het enige bouwsteen-concept in dit systeem.
   Een block is ofwel:
     - info    : puur informatieve tekst (evt. met video/foto)
     - input   : open invulvraag (getal + eenheid)
     - multi   : meerkeuzevraag (1 of meerdere juiste opties)
     - photo   : juiste foto kiezen uit meerdere
     - hotspot : stukjes tekst naar het juiste vak op een figuur slepen
     - sort    : woorden/zinnen naar de juiste categorie-vakken slepen

   Een block kan altijd een lijst "hints" bevatten. Een hint IS
   ook gewoon een block — vandaar dat hints, extra hints, en
   zelfs hints-van-hints allemaal met dezelfde renderBlock()
   functie getekend en nagekeken worden. Geen aparte kopieën
   van dezelfde logica meer per "niveau".

   Zie README.md voor de volledige uitleg van het JSON-formaat.
========================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     0. Data inladen
  --------------------------------------------------------- */
  const dataEl = document.getElementById("quiz-data");
  if (!dataEl) {
    console.error("Geen #quiz-data script-tag gevonden.");
    return;
  }
  const quiz = JSON.parse(dataEl.textContent);

  const successMessages =
    quiz.successMessages && quiz.successMessages.length
      ? quiz.successMessages
      : ["Goed bezig!", "Juist!", "Uitstekend!"];

  function randomSuccess() {
    return successMessages[Math.floor(Math.random() * successMessages.length)];
  }

  const quizEl = document.getElementById("quiz");

  // De afrondings-animatie (lichter scherm + confetti) staat standaard uit
  // en wordt alleen ingeschakeld als de auteur dat in de bouwer aanvinkt.
  const celebrationEnabled = !!quiz.celebrationEnabled;

  const state = {
    solvedQuestions: [],
    navigatorImages: [],
    currentNavIndex: 0,
    celebrationFired: false,
  };

  /* ---------------------------------------------------------
     1. Kleine hulpfuncties (getallen, wiskunde-notatie, MathJax)
  --------------------------------------------------------- */

  // Zet gebruikersinvoer of auteursinvoer om naar een getal.
  // Ondersteunt komma's, "3*10^4" en "3e4"-notatie.
  function parseNumber(str) {
    if (str === null || str === undefined || str === "") return NaN;
    let s = String(str).trim().replace(",", ".");

    const sci = s.match(
      /^([+-]?[0-9]*\.?[0-9]+)?\s*\*?\s*10(?:\^(\(?[+-]?[0-9]+\)?))?$/i
    );
    if (sci && /[*^]/.test(s)) {
      const factor = sci[1] ? parseFloat(sci[1]) : 1;
      const exp = sci[2] ? parseInt(sci[2].replace(/[()]/g, "")) : s.includes("*") ? 1 : 0;
      s = (factor * Math.pow(10, exp)).toString();
    }
    return parseFloat(s);
  }

  // Praktisch gelijk (verwaarloosbare afrondingsfouten in de berekening zelf).
  function almostEqual(a, b) {
    const absTol = 1e-9;
    return Math.abs(a - b) <= Math.max(absTol, Math.abs(b) * 1e-6);
  }

  // Kleine marge voor een andere afronding / aantal beduidende cijfers
  // dan de auteur gebruikte (géén brede schattingsmarge).
  function inRoundingTolerance(a, b) {
    const tol = Math.abs(b) * 0.01;
    return Math.abs(a - b) <= tol;
  }

  function renderMathIn(el) {
    if (window.MathJax && el) {
      MathJax.typesetPromise([el]).catch((err) => console.error("MathJax error:", err.message));
    }
  }

  function shuffle(arr) {
    return arr
      .map((v) => [Math.random(), v])
      .sort((a, b) => a[0] - b[0])
      .map((p) => p[1]);
  }

  let uid = 0;
  function nextId(prefix) {
    return `${prefix}-${uid++}`;
  }

  /* ---------------------------------------------------------
     2. Media helpers (video & foto netjes en herbruikbaar)
  --------------------------------------------------------- */

  // Lokale videobestanden (mp4/webm/ogg/mov) krijgen een gewone <video>-speler,
  // alles anders (youtube-embed-links, ...) krijgt een <iframe>.
  function isLocalVideoFile(src) {
    return /\.(mp4|webm|ogv|ogg|mov)(\?.*)?$/i.test(src);
  }

  function makeVideoEmbed(src) {
    const wrap = document.createElement("div");

    if (isLocalVideoFile(src)) {
      // Eigen bestand: toon op de eigen (bv. portret-)verhouding van de video,
      // zonder vaste 16:9 doos, zodat er geen zwarte balken ontstaan.
      wrap.className = "media-embed video-embed local-video";
      const video = document.createElement("video");
      video.src = src;
      video.controls = true;
      video.preload = "metadata";
      wrap.appendChild(video);
    } else {
      // Externe embed (YouTube, ...): deze verwachten wel een 16:9 doos.
      wrap.className = "media-embed video-embed";
      const iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      wrap.appendChild(iframe);
    }
    return wrap;
  }

  // Bouwt een "frame" rond een <img>: de afbeelding zelf plus een rond
  // plus-knopje rechtsboven waarmee ze met een vloeiende animatie naar
  // volledig scherm kan worden vergroot (zie sectie 3, de lightbox).
  function makeZoomableImage(src, alt) {
    const frame = document.createElement("div");
    frame.className = "figure-frame";

    const imgEl = document.createElement("img");
    imgEl.src = src;
    imgEl.alt = alt || "Figuur";
    frame.appendChild(imgEl);

    const zoomBtn = document.createElement("button");
    zoomBtn.type = "button";
    zoomBtn.className = "figure-zoom-btn";
    zoomBtn.setAttribute("aria-label", "Vergroot figuur");
    zoomBtn.title = "Vergroot figuur";
    zoomBtn.textContent = "+";
    zoomBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openLightbox(imgEl);
    });
    frame.appendChild(zoomBtn);

    return { frame, imgEl };
  }

  function makeImageEmbed(img) {
    const wrap = document.createElement("div");
    wrap.className = "media-embed image-embed";
    const { frame } = makeZoomableImage(img.src, img.alt);
    wrap.appendChild(frame);
    if (img.caption) {
      const cap = document.createElement("div");
      cap.className = "media-caption";
      cap.textContent = img.caption;
      wrap.appendChild(cap);
    }
    return wrap;
  }

  /* ---------------------------------------------------------
     3. Figuren-lightbox (zoom naar volledig scherm)
     ---------------------------------------------------------
     Eén herbruikbare lightbox voor de hele pagina. Bij het
     openen wordt de aangeklikte <img> "gemorpht" van zijn eigen
     positie/grootte naar het midden van het scherm (FLIP-
     animatie met CSS transitions op top/left/width/height),
     en bij het sluiten weer helemaal terug.
  --------------------------------------------------------- */

  let lightboxEls = null;
  let lightboxSourceImg = null;

  function ensureLightbox() {
    if (lightboxEls) return lightboxEls;

    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "lightbox-close";
    closeBtn.setAttribute("aria-label", "Sluiten");
    closeBtn.textContent = "✕";

    const img = document.createElement("img");
    img.className = "lightbox-img";
    img.alt = "";

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    closeBtn.addEventListener("click", closeLightbox);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });

    lightboxEls = { overlay, img, closeBtn };
    return lightboxEls;
  }

  function fitContain(naturalW, naturalH) {
    const maxW = window.innerWidth * 0.92;
    const maxH = window.innerHeight * 0.9;
    const ratio = naturalW && naturalH ? naturalW / naturalH : maxW / maxH;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    return { w, h, left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 };
  }

  function openLightbox(sourceImgEl) {
    const { overlay, img } = ensureLightbox();
    lightboxSourceImg = sourceImgEl;

    const startRect = sourceImgEl.getBoundingClientRect();
    img.src = sourceImgEl.currentSrc || sourceImgEl.src;

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";

    // Startpositie = exact de plaats/grootte van de originele afbeelding.
    img.style.transition = "none";
    img.style.top = startRect.top + "px";
    img.style.left = startRect.left + "px";
    img.style.width = startRect.width + "px";
    img.style.height = startRect.height + "px";

    // Forceer een reflow zodat de browser de startpositie effectief toepast
    // vóórdat we naar de eindpositie animeren.
    void img.offsetWidth;

    requestAnimationFrame(() => {
      overlay.classList.add("show");
      img.style.transition = "";
      const target = fitContain(sourceImgEl.naturalWidth, sourceImgEl.naturalHeight);
      img.style.top = target.top + "px";
      img.style.left = target.left + "px";
      img.style.width = target.w + "px";
      img.style.height = target.h + "px";
    });
  }

  function closeLightbox() {
    if (!lightboxEls || !lightboxEls.overlay.classList.contains("open")) return;
    const { overlay, img } = lightboxEls;

    overlay.classList.remove("show");
    if (lightboxSourceImg) {
      const rect = lightboxSourceImg.getBoundingClientRect();
      img.style.top = rect.top + "px";
      img.style.left = rect.left + "px";
      img.style.width = rect.width + "px";
      img.style.height = rect.height + "px";
    }
    document.body.style.overflow = "";
    setTimeout(() => overlay.classList.remove("open"), 380);
  }

  /* ---------------------------------------------------------
     4. Figuren-navigator (linkerkolom)
  --------------------------------------------------------- */

  function showNavigatorImage() {
    const imgEl = document.getElementById("opgaveImage");
    const wrapEl = document.getElementById("opgaveImageWrap");
    if (!imgEl || !wrapEl) return;
    if (state.navigatorImages.length === 0) return;

    imgEl.src = state.navigatorImages[state.currentNavIndex];
    wrapEl.style.display = "block";
  }

  function addNavigatorImage(src) {
    if (!src || state.navigatorImages.includes(src)) return;
    state.navigatorImages.push(src);
    state.currentNavIndex = state.navigatorImages.length - 1;
    showNavigatorImage();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("figurePrev")?.addEventListener("click", () => {
      if (!state.navigatorImages.length) return;
      state.currentNavIndex =
        (state.currentNavIndex - 1 + state.navigatorImages.length) % state.navigatorImages.length;
      showNavigatorImage();
    });
    document.getElementById("figureNext")?.addEventListener("click", () => {
      if (!state.navigatorImages.length) return;
      state.currentNavIndex = (state.currentNavIndex + 1) % state.navigatorImages.length;
      showNavigatorImage();
    });
    document.getElementById("opgaveImageZoom")?.addEventListener("click", () => {
      const imgEl = document.getElementById("opgaveImage");
      if (imgEl && imgEl.src) openLightbox(imgEl);
    });

    if (quiz.problemImage && quiz.problemImage.alwaysShow && quiz.problemImage.src) {
      addNavigatorImage(quiz.problemImage.src);
    }
  });

  /* ---------------------------------------------------------
     5. Accordion helper (gebruikt voor vragen én hints)
  --------------------------------------------------------- */

  function createAccordion(label, contentEl, { hintStyle = false, startOpen = false } = {}) {
    const btn = document.createElement("button");
    btn.className = hintStyle ? "accordion-hint" : "accordion";
    if (startOpen) btn.classList.add("active");

    // Label en pijltje zijn ECHTE, aparte elementen (geen ::after content en
    // geen ruwe tekst-node) zodat MathJax de wiskunde in het label netjes op
    // zijn plaats kan typesetten zonder de flex-knop in vreemde brokken op
    // te delen.
    const labelSpan = document.createElement("span");
    labelSpan.className = "accordion-label";
    labelSpan.innerHTML = label;
    btn.appendChild(labelSpan);
    renderMathIn(labelSpan);

    const arrow = document.createElement("span");
    arrow.className = "accordion-arrow";
    arrow.textContent = startOpen ? "▲" : "►";
    btn.appendChild(arrow);

    const panel = document.createElement("div");
    panel.className = hintStyle ? "panel-hint" : "panel";
    if (startOpen) panel.classList.add("open");
    panel.appendChild(contentEl);

    btn.addEventListener("click", () => {
      if (btn.classList.contains("locked")) return;
      const nowActive = btn.classList.toggle("active");
      panel.classList.toggle("open");
      arrow.textContent = nowActive ? "▲" : "►";
    });

    return { btn, panel, labelSpan, arrow };
  }

  /* ---------------------------------------------------------
     6. Hints renderen (recursief — hints zijn zelf ook blocks)
  --------------------------------------------------------- */

  function renderHints(hints, idPrefix) {
    const section = document.createElement("div");

    const header = document.createElement("div");
    header.className = "hint-header";
    header.textContent = "Bekijk beschikbare hints";

    const list = document.createElement("div");
    list.className = "panel-hint";

    header.addEventListener("click", () => {
      header.classList.toggle("active");
      list.classList.toggle("open");
    });

    hints.forEach((hint, i) => {
      const label = `${hint.label ? hint.label : "Hint " + (i + 1)}`;
      const inner = renderBlock(hint, { idPrefix: nextId(idPrefix + "-hint" + i) });
      const { btn, panel } = createAccordion(label, inner, { hintStyle: true });
      list.appendChild(btn);
      list.appendChild(panel);
    });

    section.appendChild(header);
    section.appendChild(list);
    return section;
  }

  /* ---------------------------------------------------------
     7. De interactieve blok-types
  --------------------------------------------------------- */

  function renderInputInteraction(block, opts) {
    const wrap = document.createElement("div");

    const row = document.createElement("div");
    row.className = "q-row";

    const inputWrap = document.createElement("div");
    inputWrap.className = "input-with-unit";

    if (block.prefix) {
      const pre = document.createElement("span");
      pre.className = "prefix-addon";
      pre.innerHTML = block.prefix;
      inputWrap.appendChild(pre);
      renderMathIn(pre);
    }

    const input = document.createElement("input");
    input.type = "text";
    input.id = opts.idPrefix + "-input";
    input.className = "quiz-input";
    inputWrap.appendChild(input);

    if (block.unit) {
      const unit = document.createElement("span");
      unit.className = "unit-addon";
      unit.innerHTML = block.unit;
      inputWrap.appendChild(unit);
      renderMathIn(unit);
    }

    row.appendChild(inputWrap);

    const btn = document.createElement("button");
    btn.className = "submit-btn";
    btn.textContent = "Controleer";
    row.appendChild(btn);

    const feedback = document.createElement("div");
    feedback.className = "feedback";

    function check() {
      const val = parseNumber(input.value);
      if (isNaN(val)) {
        feedback.style.color = "red";
        feedback.textContent = "Geen geldig getal ingevoerd.";
        input.value = "";
        return;
      }

      const wrongs = block.wrongAnswers || {};
      for (const [wrongVal, msg] of Object.entries(wrongs)) {
        const wv = parseNumber(wrongVal);
        if (almostEqual(val, wv) || inRoundingTolerance(val, wv)) {
          feedback.style.color = "red";
          feedback.textContent = "❌ " + (msg || "Probeer opnieuw!");
          input.value = "";
          renderMathIn(feedback);
          return;
        }
      }

      const correct = parseNumber(block.answer);
      if (almostEqual(val, correct)) {
        feedback.style.color = "green";
        feedback.textContent = `✅ Correct! ${randomSuccess()}`;
      } else if (inRoundingTolerance(val, correct)) {
        feedback.style.color = "green";
        feedback.textContent = `✅ Correct! Je gebruikte een andere afronding, maar dat is geen probleem.`;
      } else {
        feedback.style.color = "red";
        feedback.textContent = "❌ Fout. Probeer opnieuw.";
        input.value = "";
        return;
      }

      input.value = String(block.answer);
      input.disabled = true;
      btn.disabled = true;
      if (opts.onSolved) opts.onSolved();
    }

    btn.addEventListener("click", check);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") btn.click();
    });

    wrap.appendChild(row);
    wrap.appendChild(feedback);
    return wrap;
  }

  function renderMultiInteraction(block, opts) {
    const wrap = document.createElement("div");
    const optsDiv = document.createElement("div");
    optsDiv.className = "options-list";

    const allOptions = shuffle([...block.options, ...Object.keys(block.wrongOptions || {})]);

    allOptions.forEach((opt) => {
      const id = nextId(opts.idPrefix + "-opt");
      const label = document.createElement("label");
      label.className = "checkbox-container";
      label.htmlFor = id;

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = id;
      input.value = opt;

      const mark = document.createElement("span");
      mark.className = "checkbox-checkmark";

      const span = document.createElement("span");
      span.innerHTML = opt;

      label.append(input, mark, span);
      optsDiv.appendChild(label);
      renderMathIn(span);
    });

    const btn = document.createElement("button");
    btn.className = "submit-btn";
    btn.textContent = "Controleer!";

    const feedback = document.createElement("div");
    feedback.className = "feedback";

    btn.addEventListener("click", () => {
      const checked = Array.from(optsDiv.querySelectorAll("input:checked")).map((i) => i.value);
      const checkedSorted = checked.slice().sort();
      const correctSorted = block.options.slice().sort();
      const key = checkedSorted.join("|");

      if (JSON.stringify(checkedSorted) === JSON.stringify(correctSorted)) {
        feedback.style.color = "green";
        feedback.textContent = `✅ Correct! ${randomSuccess()}`;
        optsDiv.querySelectorAll("input").forEach((i) => (i.disabled = true));
        btn.disabled = true;
        if (opts.onSolved) opts.onSolved();
        return;
      }

      const combo = (block.combinationFeedback || {})[key];
      if (combo) {
        feedback.style.color = "red";
        feedback.textContent = "❌ " + combo;
        renderMathIn(feedback);
      } else {
        feedback.style.color = "red";
        feedback.textContent = "❌ Probeer opnieuw!";
      }
    });

    wrap.appendChild(optsDiv);
    wrap.appendChild(btn);
    wrap.appendChild(feedback);
    return wrap;
  }

  function renderPhotoInteraction(block, opts) {
    const wrap = document.createElement("div");
    const grid = document.createElement("div");
    grid.className = "image-options";

    const photos = shuffle(block.photos);
    let selected = null;

    photos.forEach((photo) => {
      const cell = document.createElement("div");
      cell.className = "image-option";
      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = "Antwoordoptie";
      cell.appendChild(img);

      cell.addEventListener("click", () => {
        grid.querySelectorAll(".image-option").forEach((c) => c.classList.remove("selected"));
        cell.classList.add("selected");
        selected = photo;
      });

      grid.appendChild(cell);
    });

    const btn = document.createElement("button");
    btn.className = "submit-btn";
    btn.textContent = "Controleer!";

    const feedback = document.createElement("div");
    feedback.className = "feedback";

    btn.addEventListener("click", () => {
      if (!selected) {
        feedback.style.color = "red";
        feedback.textContent = "Kies eerst een foto.";
        return;
      }
      if (selected.correct) {
        feedback.style.color = "green";
        feedback.textContent = `✅ Correct! ${randomSuccess()}`;
        grid.querySelectorAll(".image-option").forEach((c) => (c.style.pointerEvents = "none"));
        btn.disabled = true;
        addNavigatorImage(selected.displayAs || selected.src);
        if (opts.onSolved) opts.onSolved();
      } else {
        feedback.style.color = "red";
        feedback.textContent = "❌ " + (selected.feedback || "Probeer opnieuw!");
        renderMathIn(feedback);
      }
    });

    wrap.appendChild(grid);
    wrap.appendChild(btn);
    wrap.appendChild(feedback);
    return wrap;
  }

  /* ---------------------------------------------------------
     8. Sleep-chip hulpfunctie (gedeeld door "hotspot" en "sort")
     ---------------------------------------------------------
     Eén klein, aanraking-vriendelijk sleepmechanisme op basis van
     Pointer Events (werkt zo voor muis, touch én pen). Bij het
     loslaten wordt via elementFromPoint() gezocht welk drop-vak
     onder de vinger/cursor zit; de chip wordt dan gewoon fysiek
     verplaatst (appendChild) naar dat vak. Zo hoeft er nadien geen
     pixel-positie meer bijgehouden te worden: de layout (flexbox of
     percentage-positionering) van het doelvak plaatst de chip zelf
     netjes, op elke schermresolutie.
  --------------------------------------------------------- */

  function makeChip(text) {
    const chip = document.createElement("div");
    chip.className = "drag-chip";
    chip.innerHTML = text; // toestaan van $wiskunde$/html in chip-tekst
    renderMathIn(chip);
    return chip;
  }

  // Auto-scroll van de pagina terwijl je een chip naar de rand van het
  // scherm sleept, zodat een doelvak dat (nog) buiten beeld valt toch
  // bereikbaar is — anders kan je nooit iets helemaal bovenaan droppen.
  let dragScrollSpeed = 0;
  let dragScrollRAF = null;
  function dragScrollStep() {
    if (dragScrollSpeed !== 0) {
      window.scrollBy(0, dragScrollSpeed);
      dragScrollRAF = requestAnimationFrame(dragScrollStep);
    } else {
      dragScrollRAF = null;
    }
  }
  function updateDragAutoScroll(clientY) {
    const margin = 90;
    const maxSpeed = 16;
    if (clientY < margin) {
      dragScrollSpeed = -maxSpeed * (1 - clientY / margin);
    } else if (clientY > window.innerHeight - margin) {
      dragScrollSpeed = maxSpeed * (1 - (window.innerHeight - clientY) / margin);
    } else {
      dragScrollSpeed = 0;
    }
    if (dragScrollSpeed !== 0 && !dragScrollRAF) {
      dragScrollRAF = requestAnimationFrame(dragScrollStep);
    }
  }
  function stopDragAutoScroll() {
    dragScrollSpeed = 0;
  }

  // Verplaatst de chip zelf altijd effectief naar het gevonden doelvak (of
  // terug naar de opbergbak als er geen geldig doelvak onder de vinger/
  // cursor zit). "onDropped" is enkel nog een optionele hook voor extra
  // logica vóór die verplaatsing (bv. een reeds aanwezige chip uit een
  // hokje wippen), niet meer verantwoordelijk voor de plaatsing zelf.
  function makeDraggable(chip, dropSelector, tray, onDropped) {
    let dragging = false;
    let offsetX = 0, offsetY = 0;

    chip.addEventListener("pointerdown", (e) => {
      if (chip.classList.contains("locked")) return;
      dragging = true;
      const rect = chip.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      chip.classList.add("dragging");
      chip.style.position = "fixed";
      chip.style.left = rect.left + "px";
      chip.style.top = rect.top + "px";
      chip.style.width = rect.width + "px";
      chip.style.zIndex = 9500;
      document.body.appendChild(chip);
      chip.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    chip.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      chip.style.left = e.clientX - offsetX + "px";
      chip.style.top = e.clientY - offsetY + "px";
      updateDragAutoScroll(e.clientY);
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      stopDragAutoScroll();
      chip.classList.remove("dragging");
      chip.style.position = "";
      chip.style.left = "";
      chip.style.top = "";
      chip.style.width = "";
      chip.style.zIndex = "";

      chip.style.visibility = "hidden";
      const under = document.elementFromPoint(e.clientX, e.clientY);
      chip.style.visibility = "";
      const target = under ? under.closest(dropSelector) : null;
      const landedOnTray = !target || target === tray;
      const destination = landedOnTray ? tray : target;

      if (onDropped) onDropped(chip, landedOnTray ? null : target);
      destination.appendChild(chip);
    }

    chip.addEventListener("pointerup", endDrag);
    chip.addEventListener("pointercancel", endDrag);
  }

  // "Hotspot": sleep losse stukjes tekst naar het juiste vak op een figuur.
  // De vakken liggen met percentage-positionering (left/top/width/height in %)
  // op de afbeelding, dus ze schuiven altijd gewoon mee met de afbeelding —
  // op elke schermbreedte staan ze op precies dezelfde relatieve plek.
  function renderHotspotInteraction(block, opts) {
    const wrap = document.createElement("div");
    wrap.className = "hotspot-widget";

    const frame = document.createElement("div");
    frame.className = "figure-frame hotspot-frame";
    const img = document.createElement("img");
    img.src = (block.image && block.image.src) || "";
    img.alt = (block.image && block.image.alt) || "Figuur";
    frame.appendChild(img);

    const zoneEls = {};
    (block.zones || []).forEach((zone) => {
      const z = document.createElement("div");
      z.className = "hotspot-zone";
      z.dataset.zoneId = zone.id;
      z.style.left = zone.x * 100 + "%";
      z.style.top = zone.y * 100 + "%";
      z.style.width = zone.w * 100 + "%";
      z.style.height = zone.h * 100 + "%";
      frame.appendChild(z);
      zoneEls[zone.id] = z;
    });

    // De opties staan bovenaan, de figuur waarop je sleept eronder — zo zie
    // je meteen wat je te slepen hebt vóór je de figuur induikt.
    const tray = document.createElement("div");
    tray.className = "chip-tray";
    wrap.appendChild(tray);
    wrap.appendChild(frame);

    const chipToLabel = new Map();
    const allLabels = shuffle([
      ...(block.zones || []).map((z) => z.label),
      ...(block.distractors || []),
    ]);
    allLabels.forEach((label) => {
      const chip = makeChip(label);
      chipToLabel.set(chip, label);
      tray.appendChild(chip);
      makeDraggable(chip, ".hotspot-zone, .chip-tray", tray, (droppedChip, target) => {
        if (target) {
          const existing = target.querySelector(".drag-chip");
          if (existing && existing !== droppedChip) tray.appendChild(existing);
        }
      });
    });

    const btn = document.createElement("button");
    btn.className = "submit-btn";
    btn.textContent = "Controleer";
    wrap.appendChild(btn);

    const feedback = document.createElement("div");
    feedback.className = "feedback";
    wrap.appendChild(feedback);

    btn.addEventListener("click", () => {
      const zones = block.zones || [];
      if (!zones.length) return;
      let allCorrect = true;
      const toReturn = [];

      zones.forEach((zone) => {
        const zEl = zoneEls[zone.id];
        const chip = zEl.querySelector(".drag-chip");
        if (!chip) {
          allCorrect = false;
          return;
        }
        const correct = chipToLabel.get(chip) === zone.label;
        if (correct) {
          zEl.classList.add("zone-correct");
          chip.classList.add("locked", "chip-correct");
        } else {
          allCorrect = false;
          zEl.classList.add("zone-incorrect");
          chip.classList.add("chip-incorrect");
          toReturn.push({ chip, zEl });
        }
      });

      if (allCorrect) {
        feedback.style.color = "green";
        feedback.textContent = `✅ Correct! ${randomSuccess()}`;
        btn.disabled = true;
        wrap.querySelectorAll(".drag-chip").forEach((c) => c.classList.add("locked"));
        if (opts.onSolved) opts.onSolved();
      } else {
        feedback.style.color = "red";
        feedback.textContent = "❌ " + (block.feedback || "Nog niet alles staat op de juiste plaats. Probeer opnieuw!");
        renderMathIn(feedback);
        // Even laten zien wat er fout stond, dan de foute chips terug naar
        // de opbergbak laten springen zodat de student opnieuw kan proberen.
        btn.disabled = true;
        setTimeout(() => {
          toReturn.forEach(({ chip, zEl }) => {
            chip.classList.remove("chip-incorrect");
            zEl.classList.remove("zone-incorrect");
            tray.appendChild(chip);
          });
          btn.disabled = false;
        }, 700);
      }
    });

    return wrap;
  }

  // "Sort": sleep woorden/zinnen in de juiste categorie-vakken. De vakken
  // staan gewoon in de normale flex-flow (geen absolute positionering), dus
  // ze reflowen vanzelf netjes op elke schermbreedte, en groeien vanzelf mee
  // in hoogte naarmate er meer items in belanden.
  function renderSortInteraction(block, opts) {
    const wrap = document.createElement("div");
    wrap.className = "sort-widget";

    const board = document.createElement("div");
    board.className = "sort-board";

    const contentEls = {};
    (block.categories || []).forEach((cat) => {
      const box = document.createElement("div");
      box.className = "sort-category";

      const title = document.createElement("div");
      title.className = "sort-category-title";
      title.innerHTML = cat.title;
      box.appendChild(title);
      renderMathIn(title);

      const content = document.createElement("div");
      content.className = "sort-category-content";
      content.dataset.categoryId = cat.id;
      box.appendChild(content);

      board.appendChild(box);
      contentEls[cat.id] = content;
    });

    // De opties staan bovenaan, de categorie-vakken eronder.
    const tray = document.createElement("div");
    tray.className = "chip-tray sort-tray";
    wrap.appendChild(tray);
    wrap.appendChild(board);

    const chipToItem = new Map();
    shuffle(block.items || []).forEach((item) => {
      const chip = makeChip(item.text);
      chipToItem.set(chip, item);
      tray.appendChild(chip);
      makeDraggable(chip, ".sort-category-content, .chip-tray", tray, null);
    });

    const btn = document.createElement("button");
    btn.className = "submit-btn";
    btn.textContent = "Controleer";
    wrap.appendChild(btn);

    const feedback = document.createElement("div");
    feedback.className = "feedback";
    wrap.appendChild(feedback);

    btn.addEventListener("click", () => {
      const chips = Array.from(wrap.querySelectorAll(".drag-chip"));
      if (!chips.length) return;
      let allCorrect = true;
      const toReturn = [];

      chips.forEach((chip) => {
        const item = chipToItem.get(chip);
        const parentContent = chip.closest(".sort-category-content");
        if (!parentContent) {
          // nog niet in een categorie geplaatst — gewoon nog niet klaar,
          // geen foutmelding nodig op een chip die nog in de opbergbak zit.
          allCorrect = false;
          return;
        }
        const correct = parentContent.dataset.categoryId === item.categoryId;
        if (correct) {
          chip.classList.add("locked", "chip-correct");
        } else {
          allCorrect = false;
          chip.classList.add("chip-incorrect");
          toReturn.push(chip);
        }
      });

      if (allCorrect) {
        feedback.style.color = "green";
        feedback.textContent = `✅ Correct! ${randomSuccess()}`;
        btn.disabled = true;
        if (opts.onSolved) opts.onSolved();
      } else {
        feedback.style.color = "red";
        feedback.textContent = "❌ " + (block.feedback || "Nog niet alles zit in het juiste vak. Probeer opnieuw!");
        renderMathIn(feedback);
        // Even laten zien wat er fout stond, dan de foute chips terug naar
        // de opbergbak laten springen zodat de student opnieuw kan proberen.
        btn.disabled = true;
        setTimeout(() => {
          toReturn.forEach((chip) => {
            chip.classList.remove("chip-incorrect");
            tray.appendChild(chip);
          });
          btn.disabled = false;
        }, 700);
      }
    });

    return wrap;
  }

  /* ---------------------------------------------------------
     9. renderBlock — de centrale, hergebruikte functie
  --------------------------------------------------------- */

  function renderBlock(block, opts = {}) {
    opts.idPrefix = opts.idPrefix || nextId("blk");

    const wrap = document.createElement("div");
    wrap.className = "block";

    if (block.text) {
      const textEl = document.createElement("div");
      textEl.className = "block-text";
      textEl.innerHTML = block.text;
      wrap.appendChild(textEl);
      renderMathIn(textEl);
    }

    if (block.video) wrap.appendChild(makeVideoEmbed(block.video));
    // Bij "hotspot" toont de widget zelf al de afbeelding als sleepoppervlak;
    // die zou anders dubbel getoond worden.
    if (block.image && block.type !== "hotspot") wrap.appendChild(makeImageEmbed(block.image));

    let interaction = null;
    switch (block.type) {
      case "input":
        interaction = renderInputInteraction(block, opts);
        break;
      case "multi":
        interaction = renderMultiInteraction(block, opts);
        break;
      case "photo":
        interaction = renderPhotoInteraction(block, opts);
        break;
      case "hotspot":
        interaction = renderHotspotInteraction(block, opts);
        break;
      case "sort":
        interaction = renderSortInteraction(block, opts);
        break;
      case "info":
      default:
        interaction = null;
    }
    if (interaction) wrap.appendChild(interaction);

    if (block.hints && block.hints.length) {
      wrap.appendChild(renderHints(block.hints, opts.idPrefix));
    }

    return wrap;
  }

  /* ---------------------------------------------------------
     10. Oriëntatie-sectie (ongated, alles meteen bekijkbaar)
  --------------------------------------------------------- */

  function renderOrientationSection() {
    if (!quiz.orientation || !quiz.orientation.length) return;

    const content = document.createElement("div");
    quiz.orientation.forEach((block, i) => {
      const group = document.createElement("div");
      group.className = "orientation-group";

      const title = document.createElement("div");
      title.className = "orientation-title";
      title.textContent = `Oriëntatie ${i + 1}`;
      group.appendChild(title);

      group.appendChild(renderBlock(block, { idPrefix: nextId("orient" + i) }));
      content.appendChild(group);
    });

    const { btn, panel } = createAccordion("Oriëntatie (optioneel)", content, { startOpen: false });
    quizEl.appendChild(btn);
    quizEl.appendChild(panel);
  }

  /* ---------------------------------------------------------
     11. Afrondings-animatie (optioneel — uit te zetten/aan te
     zetten via quiz.celebrationEnabled, ingesteld in de bouwer)
  --------------------------------------------------------- */

  function allQuestionsSolved() {
    return (
      quiz.questions &&
      quiz.questions.length > 0 &&
      state.solvedQuestions.length === quiz.questions.length &&
      state.solvedQuestions.every(Boolean)
    );
  }

  function launchConfetti() {
    const colors = ["#2f6fed", "#2f9e58", "#f6c445", "#e85d75", "#8b5cf6", "#1c3f8f"];
    const container = document.createElement("div");
    container.className = "confetti-container";

    const pieceCount = 130;
    for (let i = 0; i < pieceCount; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = 2.4 + Math.random() * 1.8 + "s";
      piece.style.animationDelay = Math.random() * 0.5 + "s";
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      if (Math.random() > 0.5) piece.style.borderRadius = "50%";
      container.appendChild(piece);
    }

    document.body.appendChild(container);
    setTimeout(() => container.remove(), 4600);
  }

  function celebrateCompletion() {
    if (!celebrationEnabled || state.celebrationFired) return;
    state.celebrationFired = true;

    const overlay = document.createElement("div");
    overlay.className = "celebration-overlay";
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("show"));
    setTimeout(() => {
      overlay.classList.remove("show");
      setTimeout(() => overlay.remove(), 800);
    }, 2600);

    launchConfetti();
  }

  /* ---------------------------------------------------------
     12. Hoofdvragen-sectie (sequentieel gegrendeld)
  --------------------------------------------------------- */

  function renderQuestionsSection() {
    if (!quiz.questions || !quiz.questions.length) return;

    const accordions = [];

    quiz.questions.forEach((block, qi) => {
      state.solvedQuestions[qi] = false;

      const content = renderBlock(block, {
        idPrefix: nextId("q" + qi),
        onSolved: () => {
          state.solvedQuestions[qi] = true;
          unlock(qi + 1);
          if (allQuestionsSolved()) celebrateCompletion();
        },
      });

      const locked = qi > 0;
      const label = locked ? `Vraag ${qi + 1}: los eerst de vorige vraag op!` : `Vraag ${qi + 1}`;
      const { btn, panel, labelSpan, arrow } = createAccordion(label, content, { startOpen: qi === 0 });
      if (locked) btn.classList.add("locked");

      quizEl.appendChild(btn);
      quizEl.appendChild(panel);
      accordions.push({ btn, panel, labelSpan, arrow });
    });

    function unlock(index) {
      if (index < 0 || index >= accordions.length) return;
      const { btn, panel, labelSpan, arrow } = accordions[index];
      btn.classList.remove("locked");
      labelSpan.textContent = `Vraag ${index + 1}`;
      btn.classList.add("active");
      panel.classList.add("open");
      if (arrow) arrow.textContent = "▲";
      try {
        btn.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (e) {}
    }
  }

  /* ---------------------------------------------------------
     13. Credits (kleine box onderaan, onder de laatste vraag)
  --------------------------------------------------------- */

  function renderCreditsSection() {
    const box = document.createElement("div");
    box.className = "credits-box";
    box.textContent = "Developed by Bas Van Rossem, Tom Simon, Wout Van Laere";
    quizEl.appendChild(box);
  }

  /* ---------------------------------------------------------
     14. Opstarten
  --------------------------------------------------------- */

  renderOrientationSection();
  renderQuestionsSection();
  renderCreditsSection();
})();
