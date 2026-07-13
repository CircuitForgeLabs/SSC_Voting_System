/**
 * carousel.js
 * -----------------------------------------------------------------------
 * Drives the slow, auto-rotating fade carousel of promotional candidate
 * photos on the home page. Add or remove images by editing the
 * `CAROUSEL_IMAGES` list in index.html — no other changes needed.
 * -----------------------------------------------------------------------
 */
function initCarousel(images, intervalMs = 4500) {
  const viewport = document.getElementById("carousel-viewport");
  const dotsContainer = document.getElementById("carousel-dots");
  if (!viewport || !images.length) return;
  viewport.innerHTML = images
    .map(
      (src, i) => `
      <div class="carousel__slide ${i === 0 ? "carousel__slide--active" : ""}" data-index="${i}">
        <img src="${src}" alt="Candidate promotional photo ${i + 1}" loading="${i === 0 ? "eager" : "lazy"}" />
      </div>
    `
    )
    .join("");
  dotsContainer.innerHTML = images
    .map(
      (_, i) => `
      <button type="button" class="carousel__dot ${i === 0 ? "carousel__dot--active" : ""}" data-index="${i}" aria-label="Show photo ${i + 1}"></button>
    `
    )
    .join("");
  const slides = viewport.querySelectorAll(".carousel__slide");
  const dots = dotsContainer.querySelectorAll(".carousel__dot");
  let current = 0;
  let timer = null;
  function show(index) {
    slides[current].classList.remove("carousel__slide--active");
    dots[current].classList.remove("carousel__dot--active");
    current = (index + images.length) % images.length;
    slides[current].classList.add("carousel__slide--active");
    dots[current].classList.add("carousel__dot--active");
  }
  function next() {
    show(current + 1);
  }
  function restartTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, intervalMs);
  }
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      show(Number(dot.dataset.index));
      restartTimer();
    });
  });
  restartTimer();
}
document.addEventListener("DOMContentLoaded", () => {
  // Add/remove image paths here as you upload more candidate photos.
  const CAROUSEL_IMAGES = [
    "assets/images/promo1.jpg",
    "assets/images/promo2.jpg",
    "assets/images/promo3.jpg",
    "assets/images/promo4.jpg",
    "assets/images/promo5.jpg",
    "assets/images/promo6.jpg",
    "assets/images/promo7.jpg",
    "assets/images/promo8.jpg",
    "assets/images/promo9.jpg",
    "assets/images/promo10.jpg",
    "assets/images/promo11.jpg",
    "assets/images/promo12.jpg",
    "assets/images/promo13.jpg",
    "assets/images/promo14.jpg",
    "assets/images/promo15.jpg",
    "assets/images/promo16.jpg",
    "assets/images/promo17.jpg",
  ];
  initCarousel(CAROUSEL_IMAGES, 4500);
});
