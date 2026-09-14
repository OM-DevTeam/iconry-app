import { useState, useEffect, useMemo, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Iconry                                                             */
/*  A tool for normalizing icon sets: detects fill vs. line icons and  */
/*  adjusts stroke weight, color, and size — then copies or exports.   */
/* ------------------------------------------------------------------ */

/* Design tokens. Every color, font, and radius in this file resolves through
   here — no raw values inline, so the theme can be swapped in one place. */
const C = {
  /* OM Performance Marketing brand tokens (OM Style Guide v1.2).
     Dark blue carries ~90% of the ink. Sky blue is a POINTER, not a fill:
     use it for focus rings, selection borders and control handles only —
     never as a text color or a large surface. */
  ink: "#0D2132",        // OM dark blue — primary ink and primary fill
  paper: "#FFFFFF",
  canvas: "#EFEFEF",     // OM grey EF
  panel: "#FFFFFF",
  line: "#E1E1E1",       // OM hairline
  lineSoft: "#EFEFEF",
  muted: "#606060",      // OM grey 60
  accent: "#46C3FC",     // OM sky blue — pointer only, see note above
  accentSoft: "#E8F7FE", // sky-blue tint for active chip backgrounds
  dark: "#0A1926",       // near-black dark blue, for the dark preview stage
  good: "#38E426",
  danger: "#F41F3D",     // OM red — borders and indicators
  dangerText: "#E51D39",  // OM red darkened to clear WCAG AA (4.60:1) as body text
  surfaceSoft: "#F7F7F7", // OM grey F7 — input and rail backgrounds
  shadow: "#000000",

  /* The default color of icons the user EXPORTS. Deliberately its own token,
     not C.ink: UI chrome and tool output are different concerns, and retuning
     the interface must not silently change what the tool produces. */
  iconDefault: "#0D2132",

  /* type — Archivo stands in for Altivo until licensed files are available */
  fontDisplay: "'Archivo', system-ui, sans-serif",
  fontBody: "'Open Sans', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, monospace",

  /* radii */
  radiusSm: 6,
  radiusMd: 8,
  radiusLg: 14,
  radiusPill: "50%",
};

const SAMPLE_SVG = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 482.6 482.6"><path d="M98.339,320.8c47.6,56.9,104.9,101.7,170.3,133.4c24.9,11.8,58.2,25.8,95.3,28.2c2.3,0.1,4.5,0.2,6.8,0.2c24.9,0,44.9-8.6,61.2-26.3c0.1-0.1,0.3-0.3,0.4-0.5c5.8-7,12.4-13.3,19.3-20c4.7-4.5,9.5-9.2,14.1-14c21.3-22.2,21.3-50.4-0.2-71.9l-60.1-60.1c-10.2-10.6-22.4-16.2-35.2-16.2c-12.8,0-25.1,5.6-35.6,16.1l-35.8,35.8c-3.3-1.9-6.7-3.6-9.9-5.2c-4-2-7.7-3.9-11-6c-32.6-20.7-62.2-47.7-90.5-82.4c-14.3-18.1-23.9-33.3-30.6-48.8c9.4-8.5,18.2-17.4,26.7-26.1c3-3.1,6.1-6.2,9.2-9.3c10.8-10.8,16.6-23.3,16.6-36s-5.7-25.2-16.6-36l-29.8-29.8c-3.5-3.5-6.8-6.9-10.2-10.4c-6.6-6.8-13.5-13.8-20.3-20.1c-10.3-10.1-22.4-15.4-35.2-15.4c-12.7,0-24.9,5.3-35.6,15.5l-37.4,37.4c-13.6,13.6-21.3,30.1-22.9,49.2c-1.9,23.9,2.5,49.3,13.9,80C32.739,229.6,59.139,273.7,98.339,320.8z M25.739,104.2c1.2-13.3,6.3-24.4,15.9-34l37.2-37.2c5.8-5.6,12.2-8.5,18.4-8.5c6.1,0,12.3,2.9,18,8.7c6.7,6.2,13,12.7,19.8,19.6c3.4,3.5,6.9,7,10.4,10.6l29.8,29.8c6.2,6.2,9.4,12.5,9.4,18.7s-3.2,12.5-9.4,18.7c-3.1,3.1-6.2,6.3-9.3,9.4c-9.3,9.4-18,18.3-27.6,26.8c-0.2,0.2-0.3,0.3-0.5,0.5c-8.3,8.3-7,16.2-5,22.2c0.1,0.3,0.2,0.5,0.3,0.8c7.7,18.5,18.4,36.1,35.1,57.1c30,37,61.6,65.7,96.4,87.8c4.3,2.8,8.9,5,13.2,7.2c4,2,7.7,3.9,11,6c0.4,0.2,0.7,0.4,1.1,0.6c3.3,1.7,6.5,2.5,9.7,2.5c8,0,13.2-5.1,14.9-6.8l37.4-37.4c5.8-5.8,12.1-8.9,18.3-8.9c7.6,0,13.8,4.7,17.7,8.9l60.3,60.2c12,12,11.9,25-0.3,37.7c-4.2,4.5-8.6,8.8-13.3,13.3c-7,6.8-14.3,13.8-20.9,21.7c-11.5,12.4-25.2,18.2-42.9,18.2c-1.7,0-3.5-0.1-5.2-0.2c-32.8-2.1-63.3-14.9-86.2-25.8c-62.2-30.1-116.8-72.8-162.1-127c-37.3-44.9-62.4-86.7-79-131.5C28.039,146.4,24.139,124.3,25.739,104.2z"/></svg>`;

const DRAWABLE = ["path", "line", "polyline", "polygon", "circle", "rect", "ellipse"];

/* --- read a paint value from attribute or inline style --- */
function readPaint(el, prop) {
  let v = el.getAttribute(prop);
  if (v == null) {
    const s = el.getAttribute("style");
    if (s) {
      const m = s.match(new RegExp(prop + "\\s*:\\s*([^;]+)"));
      if (m) v = m[1].trim();
    }
  }
  return v;
}

/* --- strip a prop out of an inline style string --- */
function stripStyleProp(el, prop) {
  const s = el.getAttribute("style");
  if (!s) return;
  const cleaned = s
    .split(";")
    .filter((r) => r.trim() && !r.trim().startsWith(prop + ":") && !r.trim().startsWith(prop + " :"))
    .join(";");
  if (cleaned) el.setAttribute("style", cleaned);
  else el.removeAttribute("style");
}

/* --- read a paint value from the element OR any ancestor (inheritance) --- */
function readPaintResolved(el, prop) {
  let node = el;
  while (node && node.nodeType === 1) {
    const v = readPaint(node, prop);
    if (v != null) return v;
    node = node.parentNode;
  }
  return null;
}

/* --- neutralize fill/stroke declared in <style> blocks so our attributes win --- */
/* CSS class selectors beat presentation attributes, so files that color via a  */
/* <style>{.st0{fill:#000}} block would ignore our attribute changes otherwise.  */
function neutralizeStyleBlocks(svg, doFill, doStroke) {
  const styles = [...svg.querySelectorAll("style")];
  for (const st of styles) {
    let css = st.textContent || "";
    // only strip the paint color props — leaves fill-rule, stroke-width, etc. intact
    if (doFill) css = css.replace(/(^|[;{\s])fill\s*:\s*[^;}]*;?/gi, "$1");
    if (doStroke) css = css.replace(/(^|[;{\s])stroke\s*:\s*[^;}]*;?/gi, "$1");
    st.textContent = css;
  }
}

/* --- analyze an icon without mutating: type + scale + existing weight --- */
function analyze(raw) {
  try {
    const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
    if (doc.querySelector("parsererror")) return { ok: false, error: "Invalid SVG markup." };
    const svg = doc.querySelector("svg");
    if (!svg) return { ok: false, error: "No <svg> element found." };

    // viewBox / scale
    let vb = svg.getAttribute("viewBox");
    let vbMin = 24;
    if (vb) {
      const p = vb.trim().split(/[\s,]+/).map(Number);
      if (p.length === 4) vbMin = Math.min(p[2], p[3]) || 24;
    } else {
      const w = parseFloat(svg.getAttribute("width")) || 24;
      const h = parseFloat(svg.getAttribute("height")) || 24;
      vbMin = Math.min(w, h);
    }

    const els = [...svg.querySelectorAll(DRAWABLE.join(","))];
    let isLine = false;
    let detectedW = null;
    for (const el of els) {
      const stroke = readPaint(el, "stroke");
      const fill = readPaint(el, "fill");
      if ((stroke && stroke !== "none") || fill === "none") isLine = true;
      if (detectedW == null) {
        const sw = readPaint(el, "stroke-width");
        if (sw) detectedW = parseFloat(sw);
      }
    }
    if (detectedW == null) {
      const svgW = svg.getAttribute("stroke-width");
      if (svgW) detectedW = parseFloat(svgW);
    }
    return { ok: true, type: isLine ? "line" : "fill", vbMin, detectedW };
  } catch (e) {
    return { ok: false, error: "Could not read this SVG." };
  }
}

/* --- summarize detected stroke widths across a set of icons --- */
function strokeStats(list) {
  const ws = [];
  let lineCount = 0;
  for (const ic of list) {
    const a = analyze(ic.raw);
    if (!a.ok) continue;
    if (a.type === "line") {
      lineCount += 1;
      if (a.detectedW != null && !isNaN(a.detectedW)) ws.push(a.detectedW);
    }
  }
  ws.sort((x, y) => x - y);
  const median = ws.length ? +ws[Math.floor(ws.length / 2)].toFixed(2) : null;
  return {
    lineCount,
    count: ws.length,
    median,
    min: ws.length ? ws[0] : null,
    max: ws.length ? ws[ws.length - 1] : null,
  };
}

/* --- the core transform --- */
function processSvg(raw, s) {
  const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  if (doc.querySelector("parsererror")) return null;
  const svg = doc.querySelector("svg");
  if (!svg) return null;

  // establish a numeric viewBox
  let vb = svg.getAttribute("viewBox");
  let vx = 0, vy = 0, vw = 24, vh = 24;
  if (vb) {
    const p = vb.trim().split(/[\s,]+/).map(Number);
    if (p.length === 4 && p.every((n) => !isNaN(n))) [vx, vy, vw, vh] = p;
  } else {
    vw = parseFloat(svg.getAttribute("width")) || 24;
    vh = parseFloat(svg.getAttribute("height")) || 24;
  }

  // remember the original content geometry — transforms pivot on this center
  const cx = vx + vw / 2;
  const cy = vy + vh / 2;
  const ovw = vw, ovh = vh;

  // Pad the viewBox by half the stroke width (plus a little breathing room) so
  // a centered stroke never clips at the edges, while keeping the icon well
  // inside its frame.
  if (s.weight > 0) {
    const vbMin = Math.min(vw, vh);
    const pad = s.weight / 2 + vbMin * 0.03;
    vx -= pad; vy -= pad; vw += pad * 2; vh += pad * 2;
  }
  svg.setAttribute("viewBox", `${vx} ${vy} ${vw} ${vh}`);
  svg.setAttribute("width", s.size);
  svg.setAttribute("height", s.size);

  const els = [...svg.querySelectorAll(DRAWABLE.join(","))];
  const solid = s.colorMode === "solid";
  const current = s.colorMode === "current";
  // fill and stroke are painted independently
  const fillPaint = solid ? s.fillColor : current ? "currentColor" : null;
  const strokePaint = solid ? s.strokeColor : current ? "currentColor" : null;

  // make sure <style>/class-based colors can't override the paint we set
  if (fillPaint || strokePaint) neutralizeStyleBlocks(svg, !!fillPaint, !!strokePaint);

  for (const el of els) {
    // resolve paint through ancestors so grouped/inherited icons classify correctly
    const stroke = readPaintResolved(el, "stroke");
    const fill = readPaintResolved(el, "fill");
    const hasStroke = stroke && stroke !== "none";
    const isFilled = fill !== "none"; // null => default fill, still filled

    // --- color ---
    if (fillPaint && isFilled) {
      stripStyleProp(el, "fill");
      el.setAttribute("fill", fillPaint);
    }
    if (strokePaint && hasStroke) {
      stripStyleProp(el, "stroke");
      el.setAttribute("stroke", strokePaint);
    }

    // --- stroke weight ---
    if (hasStroke || fill === "none") {
      // true line element: adjust its stroke width
      if (s.weight > 0) {
        el.setAttribute("stroke-width", s.weight);
        if (!readPaint(el, "stroke") || readPaint(el, "stroke") === "none") {
          el.setAttribute("stroke", strokePaint || "currentColor");
        }
      }
    } else if (isFilled && s.weight > 0) {
      // filled shape: add a centered outline to bolden it
      const outline = strokePaint || fill || "currentColor";
      el.setAttribute("stroke", outline);
      el.setAttribute("stroke-width", s.weight);
      el.setAttribute("stroke-linejoin", "round");
      el.setAttribute("stroke-linecap", "round");
    }
  }

  // --- geometric transforms (scale / move / rotate / flip) ---
  const scale = (s.scale ?? 100) / 100;
  const rotate = s.rotate ?? 0;
  const flipH = s.flipH ? -1 : 1;
  const flipV = s.flipV ? -1 : 1;
  const mx = ((s.moveX ?? 0) / 100) * ovw; // move as % of original width
  const my = ((s.moveY ?? 0) / 100) * ovh;
  const sx = scale * flipH;
  const sy = scale * flipV;

  const identity = scale === 1 && rotate === 0 && flipH === 1 && flipV === 1 && mx === 0 && my === 0;
  if (!identity) {
    const r = (n) => Math.round(n * 1000) / 1000;
    const t =
      `translate(${r(mx)} ${r(my)}) translate(${r(cx)} ${r(cy)}) ` +
      `rotate(${r(rotate)}) scale(${r(sx)} ${r(sy)}) translate(${r(-cx)} ${r(-cy)})`;
    const g = doc.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", t);
    // move every child of <svg> into the group, preserving structure
    while (svg.firstChild) g.appendChild(svg.firstChild);
    svg.appendChild(g);
  }

  let out = new XMLSerializer().serializeToString(svg);
  // tidy: ensure xmlns present
  if (!/xmlns=/.test(out)) out = out.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  return out;
}

function download(name, text) {
  const blob = new Blob([text], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".svg") ? name : name + ".svg";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* --- dependency-free ZIP builder (STORE / no compression) --- */
/* icons are tiny, so storing uncompressed keeps this simple and library-free. */
function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    let c = (crc ^ bytes[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(files) {
  const enc = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const push = (arr) => { chunks.push(arr); offset += arr.length; };
  const u16 = (n) => new Uint8Array([n & 255, (n >>> 8) & 255]);
  const u32 = (n) => new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
  const central = [];

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const data = f.bytes;
    const crc = crc32(data);
    const localOffset = offset;
    push(u32(0x04034b50));      // local file header signature
    push(u16(20));              // version needed
    push(u16(0x0800));          // flag: UTF-8 filename
    push(u16(0));               // method: store
    push(u16(0)); push(u16(33)); // time 00:00, date 1980-01-01 (valid DOS)
    push(u32(crc));
    push(u32(data.length));     // compressed size
    push(u32(data.length));     // uncompressed size
    push(u16(nameBytes.length));
    push(u16(0));               // extra length
    push(nameBytes);
    push(data);
    central.push({ nameBytes, crc, size: data.length, localOffset });
  }

  const cdStart = offset;
  for (const c of central) {
    push(u32(0x02014b50));      // central directory header signature
    push(u16(20)); push(u16(20));
    push(u16(0x0800));          // flag: UTF-8
    push(u16(0));               // method
    push(u16(0)); push(u16(33)); // time / date 1980-01-01
    push(u32(c.crc));
    push(u32(c.size)); push(u32(c.size));
    push(u16(c.nameBytes.length));
    push(u16(0)); push(u16(0)); // extra / comment
    push(u16(0)); push(u16(0)); // disk start / internal attrs
    push(u32(0));               // external attrs
    push(u32(c.localOffset));
    push(c.nameBytes);
  }
  const cdSize = offset - cdStart;

  push(u32(0x06054b50));        // end of central directory
  push(u16(0)); push(u16(0));
  push(u16(central.length)); push(u16(central.length));
  push(u32(cdSize)); push(u32(cdStart));
  push(u16(0));                 // comment length

  let total = 0;
  for (const ch of chunks) total += ch.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const ch of chunks) { out.set(ch, p); p += ch.length; }
  return out;
}

function downloadZip(name, files) {
  const bytes = buildZip(files);
  const blob = new Blob([bytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".zip") ? name : name + ".zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ================================================================== */

export default function App() {
  const [icons, setIcons] = useState([]); // {id, name, raw}
  const [selId, setSelId] = useState(null);
  const [paste, setPaste] = useState("");
  const [pasteErr, setPasteErr] = useState("");
  const [bg, setBg] = useState("checker"); // checker | light | dark
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);
  const nextId = useRef(1);

  const [colorMode, setColorMode] = useState("original"); // original | solid | current
  const [fillColor, setFillColor] = useState(C.iconDefault);
  const [strokeColor, setStrokeColor] = useState(C.iconDefault);
  const [linkColors, setLinkColors] = useState(true); // keep fill & stroke in sync
  const [weight, setWeight] = useState(0);
  const weightTouched = useRef(false); // becomes true once the user sets weight manually
  const [size, setSize] = useState(96);

  // display transforms
  const [scale, setScale] = useState(100);
  const [moveX, setMoveX] = useState(0);
  const [moveY, setMoveY] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const [tab, setTab] = useState("display"); // colors | display | stroke
  const [viewMode, setViewMode] = useState("single"); // single | grid
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState(null); // grid cell being renamed
  const [leftOpen, setLeftOpen] = useState(true);   // left panel expanded
  const [rightOpen, setRightOpen] = useState(true); // right panel expanded
  const [isNarrow, setIsNarrow] = useState(false);  // stacked layout on small screens

  function resetTransforms() {
    setScale(100); setMoveX(0); setMoveY(0); setRotate(0); setFlipH(false); setFlipV(false);
  }

  // inject fonts once
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(l);
    return () => l.remove();
  }, []);

  // track viewport width for the stacked (mobile) fallback
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 820);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // seed with the sample
  useEffect(() => {
    const id = nextId.current++;
    setIcons([{ id, name: "telephone", raw: SAMPLE_SVG }]);
    setSelId(id);
  }, []);

  const selected = icons.find((i) => i.id === selId) || null;
  const info = useMemo(() => (selected ? analyze(selected.raw) : null), [selected]);

  const vbMin = info?.ok ? info.vbMin : 24;
  const maxW = Math.max(2, Math.round(vbMin * 0.16));
  const stepW = vbMin > 80 ? 1 : 0.1;

  // stroke widths detected across the whole loaded set (for the readout)
  const sstats = useMemo(() => strokeStats(icons), [icons]);

  const settings = { colorMode, fillColor, strokeColor, weight, size, scale, moveX, moveY, rotate, flipH, flipV };
  const processed = useMemo(
    () => (selected ? processSvg(selected.raw, settings) : null),
    [selected, colorMode, fillColor, strokeColor, weight, size, scale, moveX, moveY, rotate, flipH, flipV]
  );

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1600);
  }

  function addIcons(list) {
    const added = list.map((it) => ({ id: nextId.current++, ...it }));
    if (!added.length) return;
    setIcons((prev) => [...prev, ...added]);
    setSelId(added[0].id);
    // "fresh start": if the user hasn't set a weight yet and this set is a line
    // pack with mismatched widths, snap everyone to one uniform baseline.
    if (!weightTouched.current) {
      const st = strokeStats([...icons, ...added]);
      if (st.median != null) setWeight(st.median);
    }
  }

  function renameIcon(id, name) {
    const clean = slugify(name);
    setIcons((prev) => prev.map((i) => (i.id === id ? { ...i, name: clean } : i)));
    return clean;
  }

  function onPaste() {
    const raw = paste.trim();
    if (!raw) return;
    const a = analyze(raw);
    if (!a.ok) {
      setPasteErr(a.error);
      return;
    }
    setPasteErr("");
    addIcons([{ name: "pasted-icon", raw }]);
    setPaste("");
  }

  function ingestFiles(fileList) {
    const files = [...fileList].filter(
      (f) => /\.svg$/i.test(f.name) || f.type === "image/svg+xml"
    );
    if (!files.length) {
      flash("No SVG files found");
      return;
    }
    Promise.all(
      files.map(
        (f) =>
          new Promise((res) => {
            const r = new FileReader();
            r.onload = () => res({ name: slugify(f.name.replace(/\.svg$/i, "")), raw: r.result });
            r.readAsText(f);
          })
      )
    ).then((loaded) => {
      const valid = loaded.filter((x) => analyze(x.raw).ok);
      if (valid.length) addIcons(valid);
      const bad = loaded.length - valid.length;
      flash(
        valid.length
          ? `Added ${valid.length} icon${valid.length > 1 ? "s" : ""}${bad ? ` · ${bad} skipped` : ""}`
          : "Those files weren't valid SVG"
      );
    });
  }

  function onFiles(e) {
    ingestFiles(e.target.files);
    e.target.value = "";
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) ingestFiles(e.dataTransfer.files);
  }

  function clearAll() {
    setIcons([]);
    setSelId(null);
    weightTouched.current = false; // next pack can auto-normalize again
  }

  function removeIcon(id) {
    setIcons((prev) => prev.filter((i) => i.id !== id));
    if (id === selId) {
      const next = icons.filter((i) => i.id !== id);
      setSelId(next[0]?.id ?? null);
    }
  }

  function copyCurrent() {
    if (!processed) return;
    copyText(processed).then(
      () => flash("Copied SVG code"),
      () => flash("Couldn't copy — use Download instead"),
    );
  }
  function downloadCurrent() {
    if (!processed || !selected) return;
    download(selected.name, processed);
    flash("Downloaded");
  }
  function downloadOne(ic) {
    const out = processSvg(ic.raw, settings);
    if (out) { download(ic.name, out); flash("Downloaded"); }
  }
  function downloadAll() {
    const enc = new TextEncoder();
    const used = {};
    const files = [];
    for (const ic of icons) {
      const out = processSvg(ic.raw, settings);
      if (!out) continue;
      const base = slugify(ic.name);
      let name = base;
      if (used[base] != null) { used[base] += 1; name = `${base}-${used[base]}`; }
      else used[base] = 0;
      files.push({ name: name + ".svg", bytes: enc.encode(out) });
    }
    if (!files.length) { flash("Nothing to export"); return; }
    downloadZip("iconry-icons", files);
    flash(`Zipped ${files.length} icon${files.length > 1 ? "s" : ""}`);
  }

  const previewBg =
    bg === "light" ? C.paper : bg === "dark" ? C.dark : "transparent";
  // colors are baked into attributes for "solid"; for "current" the wrapper's
  // color drives currentColor (demo with fillColor); "original" falls back to bg.
  const previewColor = colorMode === "current" ? fillColor : bg === "dark" ? C.paper : C.ink;

  const seg = (active) => ({
    flex: 1,
    padding: "7px 0",
    fontSize: 12,
    fontFamily: C.fontBody,
    fontWeight: 500,
    letterSpacing: "0.02em",
    border: "none",
    cursor: "pointer",
    borderRadius: 7,
    background: active ? C.ink : "transparent",
    color: active ? C.paper : C.muted,
    transition: "all .15s",
  });

  const railBtn = (active) => ({
    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
    padding: "12px 4px", border: "none", borderRadius: 10, cursor: "pointer",
    background: active ? C.accentSoft : "transparent",
    color: active ? C.ink : C.muted, transition: "all .15s",
  });

  const numBox = {
    width: 62, textAlign: "center", borderRadius: 8, border: `1px solid ${C.line}`,
    padding: "6px 8px", fontFamily: C.fontBody, fontSize: 14,
    fontWeight: 600, color: C.ink,
  };

  const cellBtn = {
    width: 20, height: 20, borderRadius: 6, border: "none", cursor: "pointer",
    background: C.ink, color: C.paper, fontSize: 12, lineHeight: "20px", padding: 0,
    opacity: 0.75,
  };

  const chevBtn = {
    width: 24, height: 24, borderRadius: 7, border: `1px solid ${C.line}`,
    background: C.paper, color: C.muted, cursor: "pointer", padding: 0,
    fontSize: 16, lineHeight: "22px", fontFamily: C.fontBody,
  };

  const label = {
    fontFamily: C.fontDisplay,
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: C.muted,
    fontWeight: 500,
  };

  return (
    <div
      style={{
        height: "100vh",
        background: C.canvas,
        color: C.ink,
        fontFamily: C.fontDisplay,
        display: "flex",
        flexDirection: "column",
        overflow: isNarrow ? "auto" : "hidden",
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
      onDrop={onDrop}
    >
      <style>{`
        * { box-sizing: border-box; }
        input[type=range]{ -webkit-appearance:none; appearance:none; height:4px; border-radius:4px; background:${C.line}; outline:none; }
        input[type=range]::-webkit-slider-thumb{ -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:${C.accent}; cursor:pointer; border:3px solid ${C.paper}; box-shadow:0 1px 4px rgba(0,0,0,.2); }
        input[type=range]::-moz-range-thumb{ width:18px; height:18px; border-radius:50%; background:${C.accent}; cursor:pointer; border:3px solid ${C.paper}; }
        button:focus-visible, input:focus-visible, textarea:focus-visible { outline:2px solid ${C.accent}; outline-offset:2px; }
        @media (prefers-reduced-motion: reduce){ *{ transition:none!important; } }
        .stage-checker{
          background-image:
            linear-gradient(45deg,${C.lineSoft} 25%,transparent 25%),
            linear-gradient(-45deg,${C.lineSoft} 25%,transparent 25%),
            linear-gradient(45deg,transparent 75%,${C.lineSoft} 75%),
            linear-gradient(-45deg,transparent 75%,${C.lineSoft} 75%);
          background-size:20px 20px;
          background-position:0 0,0 10px,10px -10px,-10px 0;
        }
        .ico-panel::-webkit-scrollbar{ width:10px; height:10px; }
        .ico-panel::-webkit-scrollbar-thumb{ background:${C.line}; border-radius:6px; }
        .ico-panel::-webkit-scrollbar-track{ background:transparent; }
      `}</style>

      {/* drag overlay */}
      {dragOver && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 60,
          background: "rgba(70,195,252,0.10)", border: `2px dashed ${C.accent}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", backdropFilter: "blur(1px)",
        }}>
          <span style={{ ...label, color: C.ink, fontSize: 14 }}>Drop SVG files to add</span>
        </div>
      )}

      {/* ---------- sticky top bar ---------- */}
      <div style={{
        flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "10px 16px", borderBottom: `1px solid ${C.line}`, background: C.panel,
        position: "sticky", top: 0, zIndex: 30, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ ...label, color: C.ink }}>ICONRY</span>
          <span style={{ fontSize: 14, color: C.muted }}>Recolor, resize, and restyle SVG icons</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={label}>{icons.length} loaded</span>
          <div style={{ display: "flex", gap: 4, background: C.lineSoft, borderRadius: 9, padding: 3, flex: "none" }}>
            {[["single", "Single"], ["grid", "Grid"]].map(([m, l]) => (
              <button key={m} aria-pressed={viewMode === m} onClick={() => setViewMode(m)} style={{ ...seg(viewMode === m), padding: "5px 12px", flex: "none", fontSize: 11 }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- shell: left | canvas | right ---------- */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: isNarrow ? "column" : "row" }}>

        {/* ===== LEFT panel: icons ===== */}
        {(leftOpen || isNarrow) ? (
          <aside className="ico-panel" style={{
            flex: "none", width: isNarrow ? "auto" : 264,
            borderRight: isNarrow ? "none" : `1px solid ${C.line}`,
            borderBottom: isNarrow ? `1px solid ${C.line}` : "none",
            background: C.panel, display: "flex", flexDirection: "column",
            overflowY: "auto", padding: 14, gap: 12,
          }}>
            <Row>
              <div style={label}>Icons</div>
              <div style={{ display: "flex", gap: 6 }}>
                {icons.length > 0 && <button onClick={clearAll} style={{ ...miniBtn, color: C.muted }}>Clear all</button>}
                {!isNarrow && <button onClick={() => setLeftOpen(false)} title="Collapse" style={chevBtn}>‹</button>}
              </div>
            </Row>
            <textarea
              value={paste}
              onChange={(e) => { setPaste(e.target.value); setPasteErr(""); }}
              placeholder="Paste <svg> code…"
              rows={3}
              style={{
                width: "100%", resize: "vertical", borderRadius: 9,
                border: `1px solid ${pasteErr ? C.danger : C.line}`, padding: "9px 11px",
                fontFamily: C.fontMono, fontSize: 12, color: C.ink, background: C.surfaceSoft,
              }}
            />
            {pasteErr && <div style={{ color: C.dangerText, fontSize: 12 }}>{pasteErr}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onPaste} style={btn(C.ink, C.paper, true)}>Add</button>
              <button onClick={() => fileRef.current?.click()} style={btn("transparent", C.ink)}>Upload</button>
              <input ref={fileRef} type="file" accept=".svg,image/svg+xml" multiple onChange={onFiles} style={{ display: "none" }} />
            </div>

            {/* icon list */}
            {icons.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 2 }}>
                {icons.map((ic) => {
                  const active = ic.id === selId;
                  return (
                    <div key={ic.id} style={{ position: "relative" }}>
                      <button
                        onClick={() => setSelId(ic.id)}
                        title={ic.name}
                        style={{
                          width: 58, height: 58, borderRadius: 12, cursor: "pointer",
                          background: C.paper, border: `1.5px solid ${active ? C.accent : C.line}`,
                          boxShadow: active ? `0 0 0 3px ${C.accentSoft}` : "none",
                          display: "flex", alignItems: "center", justifyContent: "center", padding: 9,
                          color: C.ink, transition: "all .15s",
                        }}
                      >
                        <div style={{ lineHeight: 0, maxWidth: "100%", maxHeight: "100%" }}
                          dangerouslySetInnerHTML={{ __html: processSvg(ic.raw, { colorMode: "solid", fillColor: C.ink, strokeColor: C.ink, weight: 0, size: 38 }) || "" }} />
                      </button>
                      <button onClick={() => removeIcon(ic.id)} aria-label="Remove"
                        style={{
                          position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%",
                          border: "none", background: C.ink, color: C.paper, fontSize: 11, lineHeight: "18px", cursor: "pointer", padding: 0,
                        }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        ) : (
          <div style={{ flex: "none", width: 42, borderRight: `1px solid ${C.line}`, background: C.panel, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 10 }}>
            <button onClick={() => setLeftOpen(true)} title="Expand icons" style={chevBtn}>›</button>
            <span style={{ ...label, writingMode: "vertical-rl", transform: "rotate(180deg)", letterSpacing: "0.12em" }}>ICONS</span>
          </div>
        )}

        {/* ===== CENTER: canvas ===== */}
        <div className="ico-panel" style={{ flex: 1, minWidth: 0, minHeight: isNarrow ? 380 : 0, display: "flex", flexDirection: "column", overflow: "auto", padding: 16 }}>

          {/* preview stage */}
          <div style={{ background: C.panel, borderRadius: 16, border: `1px solid ${C.line}`, overflow: "hidden", flex: 1, minHeight: isNarrow ? 340 : 0, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "12px 16px", borderBottom: `1px solid ${C.lineSoft}` }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flex: "1 1 200px", minWidth: 0 }}>
                  {viewMode === "grid" ? (
                    <span style={label}>All icons · settings applied</span>
                  ) : (
                    <>
                      {info?.ok && (
                        <span style={{
                          ...label,
                          color: info.type === "line" ? C.ink : C.muted,
                          background: info.type === "line" ? C.accentSoft : C.lineSoft,
                          padding: "4px 8px", borderRadius: 6, flex: "none",
                        }}>
                          {info.type === "line" ? "LINE ICON" : "FILL ICON"}
                        </span>
                      )}
                      {selected && (
                        <NameEditor
                          key={selected.id}
                          initial={selected.name}
                          onCommit={(v) => renameIcon(selected.id, v)}
                        />
                      )}
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4, background: C.lineSoft, borderRadius: 9, padding: 3 }}>
                  {["checker", "light", "dark"].map((b) => (
                    <button key={b} aria-pressed={bg === b} onClick={() => setBg(b)} style={{ ...seg(bg === b), padding: "5px 12px", flex: "none", fontSize: 11 }}>
                      {b === "checker" ? "trans" : b}
                    </button>
                  ))}
                </div>
              </div>

              {/* ---- empty ---- */}
              {icons.length === 0 && (
                <div
                  onClick={() => fileRef.current?.click()}
                  className={bg === "checker" ? "stage-checker" : ""}
                  style={{
                    background: previewBg, flex: 1, minHeight: 320, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: 40, textAlign: "center",
                  }}
                >
                  <div style={{ ...label, fontSize: 13 }}>Drop SVG files here</div>
                  <div style={{ fontSize: 13, color: C.muted }}>or click to browse · paste code in the sidebar</div>
                </div>
              )}

              {/* ---- single ---- */}
              {icons.length > 0 && viewMode === "single" && (
                <div
                  className={bg === "checker" ? "stage-checker" : ""}
                  style={{
                    background: previewBg, flex: 1, minHeight: 320,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 40, position: "relative",
                  }}
                >
                  {["tl", "tr", "bl", "br"].map((p) => (
                    <span key={p} style={{
                      position: "absolute", width: 14, height: 14,
                      borderColor: bg === "dark" ? "rgba(255,255,255,.25)" : "rgba(25,27,34,.18)",
                      borderStyle: "solid",
                      borderWidth: p === "tl" ? "1px 0 0 1px" : p === "tr" ? "1px 1px 0 0" : p === "bl" ? "0 0 1px 1px" : "0 1px 1px 0",
                      top: p[0] === "t" ? 14 : "auto", bottom: p[0] === "b" ? 14 : "auto",
                      left: p[1] === "l" ? 14 : "auto", right: p[1] === "r" ? 14 : "auto",
                    }} />
                  ))}
                  {processed && (
                    <div
                      style={{ color: previewColor, lineHeight: 0, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.06))" }}
                      dangerouslySetInnerHTML={{ __html: processed }}
                    />
                  )}
                </div>
              )}

              {/* ---- grid ---- */}
              {icons.length > 0 && viewMode === "grid" && (
                <div
                  className={bg === "checker" ? "stage-checker" : ""}
                  style={{
                    background: previewBg, flex: 1, minHeight: 320, overflowY: "auto",
                    padding: 16,
                    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 12,
                    gridAutoRows: "min-content", alignContent: "start", alignItems: "start",
                  }}
                >
                  {icons.map((ic) => {
                    const active = ic.id === selId;
                    return (
                      <div key={ic.id}
                        onClick={() => setSelId(ic.id)}
                        title={ic.name}
                        style={{
                          position: "relative", borderRadius: 12, cursor: "pointer",
                          border: `1.5px solid ${active ? C.accent : "rgba(128,128,128,.18)"}`,
                          boxShadow: active ? `0 0 0 3px ${C.accentSoft}` : "none",
                          background: bg === "dark" ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.55)",
                          display: "flex", flexDirection: "column", alignItems: "center",
                          padding: "16px 8px 8px", gap: 8, transition: "all .12s",
                        }}
                      >
                        <div style={{ color: previewColor, lineHeight: 0, height: 56, display: "flex", alignItems: "center" }}
                          dangerouslySetInnerHTML={{ __html: processSvg(ic.raw, { ...settings, size: 52 }) || "" }} />
                        {editingId === ic.id ? (
                          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%" }}>
                            <NameEditor
                              autoFocus
                              compact
                              initial={ic.name}
                              onCommit={(v) => { renameIcon(ic.id, v); setEditingId(null); }}
                            />
                          </div>
                        ) : (
                          <span
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => { e.stopPropagation(); setEditingId(ic.id); }}
                            title="Double-click to rename"
                            style={{
                              fontSize: 10.5, color: bg === "dark" ? "rgba(255,255,255,.7)" : C.muted,
                              fontFamily: C.fontBody, maxWidth: "100%",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "text",
                            }}>{ic.name}</span>
                        )}
                        <div style={{ position: "absolute", top: 5, right: 5, display: "flex", gap: 3 }}>
                          <button onClick={(e) => { e.stopPropagation(); downloadOne(ic); }} title="Download"
                            style={cellBtn}>↓</button>
                          <button onClick={(e) => { e.stopPropagation(); removeIcon(ic.id); }} title="Remove"
                            style={cellBtn}>×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* (icon list now lives in the left panel) */}
          </div>
          {/* end CENTER */}

          {/* ===== RIGHT panel: properties ===== */}
          {(rightOpen || isNarrow) ? (
          <div className="ico-panel" style={{
            flex: "none", width: isNarrow ? "auto" : 344,
            borderLeft: isNarrow ? "none" : `1px solid ${C.line}`,
            borderTop: isNarrow ? `1px solid ${C.line}` : "none",
            background: C.panel, display: "flex", flexDirection: "column",
            overflowY: "auto", padding: 14, gap: 14,
          }}>
            <Row>
              <div style={label}>Properties</div>
              {!isNarrow && <button onClick={() => setRightOpen(false)} title="Collapse" style={chevBtn}>›</button>}
            </Row>

            {/* tabbed editor: Colors / Display / Stroke */}
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden", display: "flex" }}>
              {/* rail */}
              <div style={{ width: 76, borderRight: `1px solid ${C.lineSoft}`, background: C.surfaceSoft, display: "flex", flexDirection: "column", padding: "8px 6px", gap: 4 }}>
                {[["colors", "Colors"], ["display", "Display"], ["stroke", "Stroke"]].map(([id, lbl]) => (
                  <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)} style={railBtn(tab === id)}>
                    <RailIcon name={id} />
                    <span style={{ fontSize: 11, fontWeight: 600, fontFamily: C.fontDisplay }}>{lbl}</span>
                  </button>
                ))}
              </div>

              {/* active panel */}
              <div style={{ flex: 1, padding: 16, minWidth: 0 }}>
                {/* COLORS */}
                {tab === "colors" && (
                  <div>
                    <div style={{ display: "flex", gap: 4, background: C.lineSoft, borderRadius: 9, padding: 3 }}>
                      {[["original", "keep"], ["solid", "solid"], ["current", "currentColor"]].map(([m, lbl]) => (
                        <button key={m} aria-pressed={colorMode === m} onClick={() => setColorMode(m)} style={seg(colorMode === m)}>{lbl}</button>
                      ))}
                    </div>
                    {colorMode === "solid" && (
                      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                        <ColorField name="Fill" value={fillColor}
                          onChange={(v) => { setFillColor(v); if (linkColors) setStrokeColor(v); }} />
                        <ColorField name="Stroke" value={strokeColor}
                          onChange={(v) => { setStrokeColor(v); if (linkColors) setFillColor(v); }} />
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                          <input type="checkbox" checked={linkColors} onChange={(e) => {
                            const on = e.target.checked; setLinkColors(on); if (on) setStrokeColor(fillColor);
                          }} style={{ accentColor: C.accent, width: 15, height: 15 }} />
                          <span style={{ fontSize: 12, color: C.muted }}>Keep fill &amp; stroke the same</span>
                        </label>
                        <p style={{ fontSize: 11.5, color: C.muted, margin: 0, lineHeight: 1.5 }}>
                          Fill colors the shape; stroke colors the outline{info?.type === "line" ? " (the line itself)" : " added by stroke weight"}. Unlink for a two-tone icon.
                        </p>
                      </div>
                    )}
                    {colorMode === "current" && (
                      <p style={{ fontSize: 11.5, color: C.muted, margin: "12px 0 0", lineHeight: 1.5 }}>
                        Sets fill/stroke to <code style={{ fontFamily: C.fontMono }}>currentColor</code> so CSS <code style={{ fontFamily: C.fontMono }}>color</code> drives it — ideal for Elementor theming.
                      </p>
                    )}
                    {colorMode === "original" && (
                      <p style={{ fontSize: 11.5, color: C.muted, margin: "12px 0 0", lineHeight: 1.5 }}>
                        Leaves the icon's original colors untouched.
                      </p>
                    )}
                  </div>
                )}

                {/* DISPLAY */}
                {tab === "display" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {/* scale */}
                    <div>
                      <Row>
                        <div style={label}>Scale</div>
                        <NumField value={scale} min={10} max={300} onCommit={setScale}
                          ariaLabel="Scale percentage" style={numBox} />
                      </Row>
                      <input type="range" min={10} max={200} step={1} value={Math.min(scale, 200)}
                        onChange={(e) => setScale(parseInt(e.target.value))} style={{ width: "100%", marginTop: 12 }} />
                    </div>
                    {/* move */}
                    <div>
                      <div style={label}>Move</div>
                      <Group items={[
                        { label: "←", title: "Left", onClick: () => setMoveX((v) => v - 2) },
                        { label: "→", title: "Right", onClick: () => setMoveX((v) => v + 2) },
                        { label: "↑", title: "Up", onClick: () => setMoveY((v) => v - 2) },
                        { label: "↓", title: "Down", onClick: () => setMoveY((v) => v + 2) },
                      ]} />
                    </div>
                    {/* rotate */}
                    <div>
                      <Row>
                        <div style={label}>Rotate</div>
                        <input type="number" step={15} value={rotate}
                          onChange={(e) => setRotate(parseInt(e.target.value) || 0)} style={numBox} />
                      </Row>
                      <div style={{ maxWidth: 150 }}>
                        <Group items={[
                          { label: "↺", title: "Rotate left 90°", onClick: () => setRotate((r) => r - 90) },
                          { label: "↻", title: "Rotate right 90°", onClick: () => setRotate((r) => r + 90) },
                        ]} />
                      </div>
                    </div>
                    {/* flip */}
                    <div>
                      <div style={label}>Flip</div>
                      <div style={{ maxWidth: 150 }}>
                        <Group items={[
                          { label: "⇆", title: "Flip horizontal", active: flipH, onClick: () => setFlipH((f) => !f) },
                          { label: "⇅", title: "Flip vertical", active: flipV, onClick: () => setFlipV((f) => !f) },
                        ]} />
                      </div>
                    </div>
                    <button onClick={resetTransforms} style={{ ...btn("transparent", C.ink), width: "100%" }}>Reset transforms</button>
                  </div>
                )}

                {/* STROKE */}
                {tab === "stroke" && (
                  <div>
                    <Row>
                      <div style={label}>Stroke weight</div>
                      <span style={mono()}>{weight === 0 ? "off" : weight}</span>
                    </Row>
                    <input type="range" min={0} max={maxW} step={stepW} value={Math.min(weight, maxW)}
                      onChange={(e) => { weightTouched.current = true; setWeight(parseFloat(e.target.value)); }}
                      style={{ width: "100%", marginTop: 12 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                      <button onClick={() => { weightTouched.current = true; setWeight(0); }} style={miniBtn}>None</button>
                      {sstats.median != null && (
                        <button onClick={() => { weightTouched.current = true; setWeight(sstats.median); }} style={miniBtn}>
                          Normalize ({sstats.median})
                        </button>
                      )}
                      <button onClick={() => { weightTouched.current = true; setWeight(+(vbMin * 0.06).toFixed(stepW < 1 ? 1 : 0)); }} style={miniBtn}>Bold</button>
                    </div>

                    {sstats.lineCount > 0 && (
                      <div style={{
                        marginTop: 12, padding: "8px 10px", borderRadius: 8, background: C.lineSoft,
                        fontSize: 11.5, color: C.muted, lineHeight: 1.5,
                      }}>
                        {sstats.count > 0 ? (
                          <>Detected widths across {sstats.lineCount} line icon{sstats.lineCount > 1 ? "s" : ""}:{" "}
                            <span style={{ fontFamily: C.fontBody, color: C.ink }}>
                              {sstats.min === sstats.max ? sstats.min : `${sstats.min}–${sstats.max}`}
                            </span>. The weight above overrides them all to one value.</>
                        ) : (
                          <>Line icons detected (no explicit widths).</>
                        )}
                      </div>
                    )}

                    <p style={{ fontSize: 11.5, color: C.muted, margin: "16px 0 0", lineHeight: 1.5 }}>
                      {info?.type === "line"
                        ? "Line icon — this sets stroke-width directly."
                        : "Fill icon — this adds a centered outline to thicken it, kept inside the frame."}
                      {" "}Values are in the icon's own units.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* export (persistent) */}
            <Panel>
              <Row>
                <div style={label}>Export size</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <NumField
                    value={size}
                    min={1}
                    max={2048}
                    onCommit={setSize}
                    ariaLabel="Export size in pixels"
                    style={{ ...numBox, width: 64 }}
                  />
                  <span style={{ fontSize: 13, color: C.muted, fontFamily: C.fontBody }}>px</span>
                </div>
              </Row>
              <input type="range" min={16} max={512} step={1} value={Math.min(size, 512)}
                onChange={(e) => setSize(parseInt(e.target.value))} style={{ width: "100%", marginTop: 12 }} />
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {[24, 48, 96, 256, 512].map((v) => (
                  <button key={v} aria-pressed={size === v} onClick={() => setSize(v)}
                    style={{ ...miniBtn, background: size === v ? C.accentSoft : C.paper, color: size === v ? C.ink : C.muted, borderColor: size === v ? C.accent : C.line }}>
                    {v}
                  </button>
                ))}
              </div>
              <div style={{ height: 1, background: C.lineSoft, margin: "14px 0" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={copyCurrent} style={btn(C.ink, C.paper, true)}>Copy code</button>
                <button onClick={downloadCurrent} style={btn("transparent", C.ink)}>Download</button>
              </div>
              {icons.length > 1 && (
                <button onClick={downloadAll} style={{ ...btn(C.ink, C.paper, true), width: "100%", marginTop: 8 }}>
                  Download all as .zip ({icons.length})
                </button>
              )}
            </Panel>
          </div>
          ) : (
            <div style={{ flex: "none", width: 42, borderLeft: `1px solid ${C.line}`, background: C.panel, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 10 }}>
              <button onClick={() => setRightOpen(true)} title="Expand properties" style={chevBtn}>‹</button>
              <span style={{ ...label, writingMode: "vertical-rl", letterSpacing: "0.12em" }}>PROPERTIES</span>
            </div>
          )}
        </div>

      {/* toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: C.ink, color: C.paper, padding: "10px 18px", borderRadius: 10,
          fontFamily: C.fontBody, fontSize: 13, boxShadow: "0 6px 24px rgba(0,0,0,.25)", zIndex: 50,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* --- small style helpers / subcomponents --- */
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

// web-safe kebab-case filename slug; never empty
function slugify(s) {
  const out = (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return out || "icon";
}

/* navigator.clipboard is unavailable on non-secure origins and rejects when
   permission is denied. Fall back to a detached textarea + execCommand, and
   let the caller report failure rather than rejecting silently. */
function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
  }
  return legacyCopy(text);
}

function legacyCopy(text) {
  return new Promise((resolve, reject) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    document.body.removeChild(ta);
    ok ? resolve() : reject(new Error("clipboard unavailable"));
  });
}

function NameEditor({ initial, onCommit, compact = false, autoFocus = false }) {
  const [t, setT] = useState(initial);
  const ref = useRef(null);
  useEffect(() => { setT(initial); }, [initial]);
  useEffect(() => { if (autoFocus && ref.current) { ref.current.focus(); ref.current.select(); } }, [autoFocus]);
  const commit = () => { const s = slugify(t); setT(s); onCommit(s); };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, maxWidth: "100%", minWidth: 0, flex: "1 1 auto" }}>
      <input
        ref={ref}
        value={t}
        onChange={(e) => setT(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setT(initial); e.currentTarget.blur(); } }}
        spellCheck={false}
        aria-label="Icon name"
        style={{
          width: compact ? "100%" : 170, minWidth: 0, flex: "1 1 auto",
          border: `1px solid ${C.line}`, borderRadius: 7,
          padding: compact ? "3px 6px" : "5px 9px",
          fontFamily: C.fontBody,
          fontSize: compact ? 10.5 : 13, color: C.ink, background: C.paper,
        }}
      />
      <span style={{ fontSize: compact ? 10 : 13, color: C.muted, fontFamily: C.fontBody, flex: "none" }}>.svg</span>
    </span>
  );
}

// numeric field that tolerates half-typed values: commits only valid in-range
// numbers while typing, and clamps whatever is left behind on blur.
function NumField({ value, min, max, step, onCommit, ariaLabel, style }) {
  const [text, setText] = useState(String(value));
  useEffect(() => { setText(String(value)); }, [value]);
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={text}
      onChange={(e) => {
        const v = e.target.value;
        setText(v);
        const n = parseInt(v, 10);
        if (!isNaN(n) && n >= min && n <= max) onCommit(n);
      }}
      onBlur={(e) => {
        const n = parseInt(e.target.value, 10);
        if (isNaN(n)) setText(String(value));
        else onCommit(clamp(n, min, max));
      }}
      aria-label={ariaLabel}
      style={style}
    />
  );
}

function Group({ items }) {
  return (
    <div style={{ display: "flex", border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", marginTop: 10 }}>
      {items.map((it, i) => (
        <button key={i} onClick={it.onClick} title={it.title}
          style={{
            flex: 1, padding: "11px 0", border: "none",
            borderLeft: i ? `1px solid ${C.line}` : "none",
            background: it.active ? C.accentSoft : C.paper,
            color: it.active ? C.ink : C.muted,
            fontSize: 18, lineHeight: 1, cursor: "pointer",
            fontFamily: C.fontBody, transition: "all .12s",
          }}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

function RailIcon({ name }) {
  const p = {
    width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round",
  };
  if (name === "colors")
    return (<svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="8.5" cy="9.5" r=".8" /><circle cx="15" cy="8.4" r=".8" /><circle cx="16.2" cy="13" r=".8" /></svg>);
  if (name === "display")
    return (<svg {...p}><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M20 8V5.5A1.5 1.5 0 0 0 18.5 4H16M4 16v2.5A1.5 1.5 0 0 0 5.5 20H8M20 16v2.5A1.5 1.5 0 0 1 18.5 20H16" /></svg>);
  return (<svg {...p}><line x1="4" y1="7" x2="20" y2="7" strokeWidth="1" /><line x1="4" y1="12" x2="20" y2="12" strokeWidth="2" /><line x1="4" y1="17" x2="20" y2="17" strokeWidth="3.4" /></svg>);
}

function ColorField({ name, value, onChange }) {
  // allow free typing of a hex; only accept it once it's a valid #rgb/#rrggbb
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const valid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{
        width: 42, fontFamily: C.fontBody, fontSize: 11,
        letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted,
      }}>{name}</span>
      <input
        type="color"
        value={valid ? value : C.shadow}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${name} swatch`}
        style={{ width: 38, height: 38, border: `1px solid ${C.line}`, borderRadius: 9, background: "none", cursor: "pointer", padding: 2 }}
      />
      <input
        value={text}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) onChange(v);
        }}
        spellCheck={false}
        style={{
          flex: 1, minWidth: 0, borderRadius: 9,
          border: `1px solid ${valid ? C.line : C.danger}`,
          padding: "9px 11px", fontFamily: C.fontMono,
          fontSize: 13, color: C.ink,
        }}
      />
    </div>
  );
}
function Panel({ children }) {
  return <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>{children}</div>;
}
function Row({ children }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>{children}</div>;
}
function mono() {
  return { fontFamily: C.fontDisplay, fontSize: 14, fontWeight: 700, color: C.ink };
}
function btn(bg, fg, filled) {
  return {
    flex: 1, padding: "10px 12px", borderRadius: 9, cursor: "pointer",
    fontFamily: C.fontDisplay, fontSize: 14, fontWeight: 600,
    background: bg, color: fg, border: filled ? "none" : `1px solid ${C.line}`,
    transition: "opacity .15s",
  };
}
const miniBtn = {
  padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.line}`, background: C.paper,
  fontFamily: C.fontBody, fontSize: 11, color: C.muted, cursor: "pointer",
};
