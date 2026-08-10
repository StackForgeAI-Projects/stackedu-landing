export function scrollToContact() {
  const el = document.getElementById("contact");
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
    return;
  }
  window.location.href = "/#contact";
}
