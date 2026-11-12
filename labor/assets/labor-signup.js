// Labor brief sign-up helpers. Decoration only: the sign-up itself runs in ../pulse.js.
// Links marked data-focus-email scroll to the card and put the cursor in the email field.
(function () {
  function focusEmail() {
    var email = document.getElementById("email");
    if (email && !email.closest("[hidden]")) { try { email.focus({ preventScroll: true }); } catch (e) { email.focus(); } }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-focus-email]");
    if (!a) return;
    var card = document.getElementById("signup-panel");
    if (!card) return;
    e.preventDefault();
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (history.replaceState) history.replaceState(null, "", "#signup-panel");
    setTimeout(focusEmail, reduce ? 0 : 450);
  });
  if (location.hash === "#signup-panel") window.addEventListener("load", function () { setTimeout(focusEmail, 50); });
})();
