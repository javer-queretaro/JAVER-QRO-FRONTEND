const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
    });
  });
}

const revealElements = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  },
  { threshold: 0.22 }
);

revealElements.forEach((element) => observer.observe(element));

function setupCarousel(carouselRoot) {
  const viewport = carouselRoot.querySelector(":scope > .overflow-hidden");
  const track = viewport?.querySelector(":scope > .flex");

  if (!viewport || !track) return;

  const slides = Array.from(track.children).filter((node) =>
    node.getAttribute("role") === "group"
  );

  if (!slides.length) return;

  let index = 0;
  let startX = 0;
  let currentX = 0;
  let dragging = false;

  const allButtons = Array.from(carouselRoot.querySelectorAll("button"));
  const nextButton = allButtons.find((btn) =>
    (btn.textContent || "").toLowerCase().includes("next")
  );
  const prevButton = allButtons.find((btn) =>
    (btn.textContent || "").toLowerCase().includes("previous")
  );

  track.style.willChange = "transform";
  track.style.transition = "transform 350ms ease";

  function updateButtons() {
    if (prevButton) prevButton.disabled = index <= 0;
    if (nextButton) nextButton.disabled = index >= slides.length - 1;
  }

  function updateTrack() {
    track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
    updateButtons();
  }

  function goNext() {
    if (index < slides.length - 1) {
      index += 1;
      updateTrack();
    }
  }

  function goPrev() {
    if (index > 0) {
      index -= 1;
      updateTrack();
    }
  }

  if (nextButton) {
    nextButton.addEventListener("click", (event) => {
      event.preventDefault();
      goNext();
    });
  }

  if (prevButton) {
    prevButton.addEventListener("click", (event) => {
      event.preventDefault();
      goPrev();
    });
  }

  // Touch gestures for mobile swipe.
  viewport.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      startX = event.touches[0].clientX;
      currentX = startX;
      dragging = true;
    },
    { passive: true }
  );

  viewport.addEventListener(
    "touchmove",
    (event) => {
      if (!dragging || event.touches.length !== 1) return;
      currentX = event.touches[0].clientX;
    },
    { passive: true }
  );

  viewport.addEventListener("touchend", () => {
    if (!dragging) return;

    const delta = currentX - startX;
    const threshold = 45;

    if (delta <= -threshold) goNext();
    if (delta >= threshold) goPrev();

    dragging = false;
  });

  // Keyboard support when carousel gets focus.
  carouselRoot.tabIndex = carouselRoot.tabIndex >= 0 ? carouselRoot.tabIndex : 0;
  carouselRoot.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    }
  });

  updateTrack();
}

const carousels = document.querySelectorAll(
  '[role="region"][aria-roledescription="carousel"]'
);
carousels.forEach((carousel) => setupCarousel(carousel));
