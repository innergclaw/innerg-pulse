// INNERG PULSE Style A v3 ~ draws the ink spray-burst behind the hero and adds a light parallax.
// Decoration only. Nothing here touches the sign-up flow (that stays in pulse.js).
(function () {
  var svg = document.getElementById("burst");
  if (!svg) return;
  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var cx = 800, cy = 900;
  var g = document.createElementNS(NS, "g");
  g.setAttribute("class", "spin");

  // speed lines
  for (var i = 0; i < 170; i++) {
    var a = Math.PI + rnd() * Math.PI;               // upper half fan
    var r0 = 70 + rnd() * 160;
    var len = 220 + Math.pow(rnd(), 0.7) * 900;
    var x1 = cx + Math.cos(a) * r0, y1 = cy + Math.sin(a) * r0;
    var x2 = cx + Math.cos(a) * (r0 + len), y2 = cy + Math.sin(a) * (r0 + len);
    var l = document.createElementNS(NS, "line");
    l.setAttribute("x1", x1.toFixed(1)); l.setAttribute("y1", y1.toFixed(1));
    l.setAttribute("x2", x2.toFixed(1)); l.setAttribute("y2", y2.toFixed(1));
    var w = (0.6 + Math.pow(rnd(), 2.2) * 5.5).toFixed(2);
    l.setAttribute("stroke-width", w);
    l.setAttribute("stroke-opacity", (0.18 + rnd() * 0.5).toFixed(2));
    var L = Math.ceil(len);
    l.setAttribute("stroke-dasharray", L);
    l.style.setProperty("--len", L);
    l.style.animationDelay = (0.05 + rnd() * 0.5).toFixed(2) + "s";
    g.appendChild(l);
  }
  // spatter
  for (var j = 0; j < 260; j++) {
    var b = Math.PI + rnd() * Math.PI;
    var d = 120 + Math.pow(rnd(), 0.8) * 900;
    var c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", (cx + Math.cos(b) * d).toFixed(1));
    c.setAttribute("cy", (cy + Math.sin(b) * d).toFixed(1));
    c.setAttribute("r", (0.8 + Math.pow(rnd(), 3) * 4).toFixed(2));
    c.setAttribute("fill-opacity", (0.25 + rnd() * 0.6).toFixed(2));
    c.style.animationDelay = (0.3 + rnd() * 0.7).toFixed(2) + "s";
    g.appendChild(c);
  }
  var core = document.createElementNS(NS, "ellipse");
  core.setAttribute("class", "core");
  core.setAttribute("cx", cx); core.setAttribute("cy", cy + 20);
  core.setAttribute("rx", 120); core.setAttribute("ry", 90);
  g.appendChild(core);
  svg.appendChild(g);

  if (reduce) return;
  // gentle pointer parallax on the burst (desktop only)
  var raf = 0, tx = 0, ty = 0;
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    tx = (e.clientX / window.innerWidth - 0.5) * -18;
    ty = (e.clientY / window.innerHeight - 0.5) * -10;
    if (!raf) raf = requestAnimationFrame(function () {
      raf = 0;
      svg.style.transform = "translate(calc(-50% + " + tx.toFixed(1) + "px)," + ty.toFixed(1) + "px)";
    });
  }, { passive: true });
})();
