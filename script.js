(() => {
  const body = document.body;
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const setActiveNav = () => {
    document.querySelectorAll(".nav-right a").forEach((link) => {
      if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  };

  const installReveal = () => {
    const revealTargets = document.querySelectorAll(
      ".card, .service-item, .activity-item, .info-bloc, .contact-card, .contact-form, .gallery-item"
    );

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealTargets.forEach((el) => {
      el.classList.add("reveal");
      observer.observe(el);
    });
  };

  const installGalleryLightbox = () => {
    const images = Array.from(document.querySelectorAll(".gallery-item img"));
    if (!images.length) return;

    const overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.innerHTML = `
      <button class="lightbox-close" type="button" aria-label="Fermer">&times;</button>
      <button class="lightbox-nav lightbox-prev" type="button" aria-label="Precedent">&#10094;</button>
      <img class="lightbox-image" alt="">
      <button class="lightbox-nav lightbox-next" type="button" aria-label="Suivant">&#10095;</button>
    `;
    document.body.appendChild(overlay);

    const imageEl = overlay.querySelector(".lightbox-image");
    const closeBtn = overlay.querySelector(".lightbox-close");
    const prevBtn = overlay.querySelector(".lightbox-prev");
    const nextBtn = overlay.querySelector(".lightbox-next");
    let index = 0;

    const openAt = (idx) => {
      index = (idx + images.length) % images.length;
      imageEl.src = images[index].src;
      imageEl.alt = images[index].alt || "";
      overlay.classList.add("open");
      body.classList.add("lightbox-open");
    };

    const close = () => {
      overlay.classList.remove("open");
      body.classList.remove("lightbox-open");
    };

    const next = () => openAt(index + 1);
    const prev = () => openAt(index - 1);

    images.forEach((img, idx) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => openAt(idx));
    });

    closeBtn.addEventListener("click", close);
    nextBtn.addEventListener("click", next);
    prevBtn.addEventListener("click", prev);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });

    document.addEventListener("keydown", (event) => {
      if (!overlay.classList.contains("open")) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    });
  };

  const installReservationRules = () => {
    const reservationForm = document.getElementById("reservation-form");
    if (!reservationForm) return;

    const domeInput = document.getElementById("typeDome");
    const startInput = document.getElementById("dateArrivee");
    const endInput = document.getElementById("dateDepart");
    const nightsInput = document.getElementById("nuits");
    const nightlyInput = document.getElementById("montant");
    const totalInput = document.getElementById("total");
    const message = document.getElementById("reservation-message");

    const rates = { dome2: 240, dome4: 360 };
    const storageKey = "domes_reservations_v1";

    const formatCAD = (value) => new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0
    }).format(value);

    const readBookings = () => {
      try {
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    };

    const saveBookings = (bookings) => {
      localStorage.setItem(storageKey, JSON.stringify(bookings));
    };

    const hasOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

    const updatePrice = () => {
      const selectedDome = domeInput.value;
      const startDate = startInput.value ? new Date(startInput.value) : null;
      const endDate = endInput.value ? new Date(endInput.value) : null;
      const nightlyRate = rates[selectedDome] || 0;
      let nights = 0;

      if (startDate && endDate) {
        const diff = endDate.getTime() - startDate.getTime();
        nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      if (!nightlyRate || nights <= 0) {
        nightlyInput.value = nightlyRate ? formatCAD(nightlyRate) : "";
        nightsInput.value = nights > 0 ? String(nights) : "";
        totalInput.value = "";
        return;
      }

      nightlyInput.value = formatCAD(nightlyRate);
      nightsInput.value = String(nights);
      totalInput.value = formatCAD(nightlyRate * nights);
    };

    [domeInput, startInput, endInput].forEach((input) => input.addEventListener("change", updatePrice));

    reservationForm.addEventListener("submit", (event) => {
      event.preventDefault();
      updatePrice();

      const nights = Number.parseInt(nightsInput.value, 10);
      if (!domeInput.value || !startInput.value || !endInput.value || Number.isNaN(nights) || nights <= 0) {
        message.textContent = "Veuillez remplir le formulaire avec des dates valides.";
        message.classList.add("error");
        return;
      }

      const selectedDome = domeInput.value;
      const newStart = new Date(startInput.value);
      const newEnd = new Date(endInput.value);
      const bookings = readBookings();

      const conflict = bookings.some((booking) => {
        if (booking.dome !== selectedDome) return false;
        return hasOverlap(newStart, newEnd, new Date(booking.start), new Date(booking.end));
      });

      if (conflict) {
        message.textContent = "Ces dates sont déja reservées pour ce type de dôme.";
        message.classList.add("error");
        return;
      }

      bookings.push({
        dome: selectedDome,
        start: startInput.value,
        end: endInput.value,
        createdAt: new Date().toISOString()
      });
      saveBookings(bookings);

      message.textContent = "Merci. Votre demande est enregistrée.";
      message.classList.remove("error");
      reservationForm.reset();
      nightlyInput.value = "";
      nightsInput.value = "";
      totalInput.value = "";
    });
  };

  setActiveNav();
  installReveal();
  installGalleryLightbox();
  installReservationRules();
})();

const hamburger = document.getElementById("hamburger");
const navright = document.getElementById("primary-nav");

if (hamburger && navright) {
  hamburger.addEventListener("click", ()=> {
    hamburger.classList.toggle("active");
    navright.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    const clickedInsideNav = navright.contains(event.target);
    const clickedHamburger = hamburger.contains(event.target);
    if (clickedInsideNav || clickedHamburger) return;
    navright.classList.remove("open");
    hamburger.classList.remove("active");
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 880) {
      navright.classList.remove("open");
      hamburger.classList.remove("active");
    }
  });
}

document.querySelectorAll("#primary-nav a").forEach(link => {
  link.addEventListener("click", () => {
    if (!navright || !hamburger) return;
    navright.classList.remove("open");
    hamburger.classList.remove("active");
  });
});
