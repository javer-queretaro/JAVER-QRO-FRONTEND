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

function setupCarousel (carouselRoot) {
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

  function updateButtons () {
    if (prevButton) prevButton.disabled = index <= 0;
    if (nextButton) nextButton.disabled = index >= slides.length - 1;
  }

  function updateTrack () {
    track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
    updateButtons();
  }

  function goNext () {
    if (index < slides.length - 1) {
      index += 1;
      updateTrack();
    }
  }

  function goPrev () {
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

function toSlug (value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function setupDevelopmentsTabsFromBackup () {
  const root = document.querySelector("[data-dev-tabs]");
  const tabsBar = root?.querySelector(".dev-zone-tabs");
  const contentMount = document.getElementById("dev-state-content");
  const backup = document.getElementById("legacy-developments-backup");

  if (!root || !tabsBar || !contentMount || !backup) return;

  const firstNode = backup.content.firstElementChild;
  if (!firstNode) return;

  const cloned = firstNode.cloneNode(true);
  contentMount.innerHTML = "";
  contentMount.appendChild(cloned);

  const stateSections = Array.from(contentMount.querySelectorAll("h3.font-bold"))
    .map((heading) => {
      const section = heading.closest("div");
      const name = (heading.textContent || "").trim();
      if (!section || !name) return null;
      return { name, slug: toSlug(name), section };
    })
    .filter(Boolean);

  if (!stateSections.length) return;

  tabsBar.innerHTML = "";

  function setActiveState (activeSlug) {
    Array.from(tabsBar.querySelectorAll(".dev-tab")).forEach((button) => {
      button.classList.toggle("active", button.getAttribute("data-state-tab") === activeSlug);
    });

    stateSections.forEach((state) => {
      state.section.style.display = state.slug === activeSlug ? "block" : "none";
    });
  }

  stateSections.forEach((state, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `dev-tab${index === 0 ? " active" : ""}`;
    button.setAttribute("data-state-tab", state.slug);
    button.textContent = state.name;
    button.addEventListener("click", () => setActiveState(state.slug));
    tabsBar.appendChild(button);
  });

  setActiveState(stateSections[0].slug);

  const clonedCarousels = contentMount.querySelectorAll(
    '[role="region"][aria-roledescription="carousel"]'
  );
  clonedCarousels.forEach((carousel) => setupCarousel(carousel));

  setupAmenitiesLikeProjectCard(contentMount);
}

function normalizeText (value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const AMENITIES_BY_PROJECT = {
  valvento: ["Casa club", "Juegos infantiles", "Alberca"],
  "marques del rio": ["Areas verdes", "Cancha multiusos", "Juegos infantiles"],
  "privalia ambienta": ["Alberca", "Terraza", "Ejercitadores"],
  "massaro residencial": ["Casa club", "Alberca", "Areas recreativas"],
  "cumbre mezquite": ["Casa club", "Alberca", "Juegos infantiles"],
};

function getAmenitiesForCard (card) {
  const title = card.querySelector("h4")?.textContent || "";
  const normalized = normalizeText(title);

  const projectKey = Object.keys(AMENITIES_BY_PROJECT).find((key) =>
    normalized.includes(key)
  );

  if (!projectKey) return ["Amenidades disponibles"];
  return AMENITIES_BY_PROJECT[projectKey];
}

function createAmenitiesPanel (items, isMobile) {
  const panel = document.createElement("div");
  panel.className = `amenities-panel ${isMobile ? "amenities-panel-mobile" : "amenities-panel-desktop"}`;

  const title = document.createElement("p");
  title.className = "amenities-title";
  title.textContent = "Amenidades";
  panel.appendChild(title);

  const list = document.createElement("ul");
  list.className = "amenities-list";

  items.slice(0, 3).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });

  panel.appendChild(list);
  return panel;
}

function closeAllMobileAmenities (scope) {
  scope.querySelectorAll(".amenities-panel-mobile.open").forEach((panel) => {
    panel.classList.remove("open");
  });
}

function setupAmenitiesLikeProjectCard (scope) {
  const cards = scope.querySelectorAll(".bg-card.text-card-foreground");

  cards.forEach((card) => {
    const amenities = getAmenitiesForCard(card);

    const mobileMenu = card.querySelector('[role="menubar"]');
    const mobileTrigger = mobileMenu?.querySelector("button");

    if (mobileMenu && mobileTrigger && !mobileMenu.querySelector(".amenities-panel-mobile")) {
      mobileMenu.classList.add("amenities-anchor");
      const mobilePanel = createAmenitiesPanel(amenities, true);
      mobileMenu.appendChild(mobilePanel);

      mobileTrigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const willOpen = !mobilePanel.classList.contains("open");
        closeAllMobileAmenities(scope);
        mobilePanel.classList.toggle("open", willOpen);
      });

      mobilePanel.addEventListener("click", (event) => event.stopPropagation());
    }

    const desktopIcon = card.querySelector('img[alt="amenities-icon-tooltip"]');
    const desktopTrigger = desktopIcon?.closest("div.bg-white");

    if (desktopTrigger && !desktopTrigger.querySelector(".amenities-panel-desktop")) {
      desktopTrigger.classList.add("amenities-anchor");
      const desktopPanel = createAmenitiesPanel(amenities, false);
      desktopTrigger.appendChild(desktopPanel);

      const openDesktop = () => desktopPanel.classList.add("open");
      const closeDesktop = () => desktopPanel.classList.remove("open");

      desktopTrigger.addEventListener("mouseenter", openDesktop);
      desktopTrigger.addEventListener("mouseleave", closeDesktop);
      desktopTrigger.addEventListener("focusin", openDesktop);
      desktopTrigger.addEventListener("focusout", (event) => {
        if (!desktopTrigger.contains(event.relatedTarget)) {
          closeDesktop();
        }
      });
    }
  });

  document.addEventListener("click", () => closeAllMobileAmenities(scope));
}

setupDevelopmentsTabsFromBackup();

function setupDevelopmentsMap () {
  const mapContainer = document.getElementById("developments-map");
  if (!mapContainer) return;

  // Coordenadas aproximadas por desarrollo para emular el mapa de estado con multiples pines.
  const projectsByState = {
    "el-marques": [
      {
        name: "Valvento",
        zone: "El Marqués",
        lat: 20.7663321,
        lng: -100.3422369,
        mapsUrl: "https://maps.app.goo.gl/v26J32NMYvVjq1f77",
      },
      {
        name: "Marqués del Río",
        zone: "El Marqués",
        lat: 20.632235,
        lng: -100.2722218,
        mapsUrl: "https://maps.app.goo.gl/5ig6PBs1r6DRdQYp6",
      },
    ],
    queretaro: [
      {
        name: "Privalia Ambienta",
        zone: "Querétaro",
        lat: 20.662525,
        lng: -100.3858254,
        mapsUrl: "https://maps.app.goo.gl/2cZxwaTWgUxmZU4N6",
      },
    ],
    zibata: [
      {
        name: "Massaro Residencial",
        zone: "Zibatá",
        lat: 20.6844774,
        lng: -100.3475647,
        mapsUrl: "https://maps.app.goo.gl/TbDxTTbB9d9rA3ZdA",
      },
    ],
    zakia: [
      {
        name: "Cumbre Mezquite",
        zone: "Zakia",
        lat: 20.6429185,
        lng: -100.3101667,
        mapsUrl: "https://maps.app.goo.gl/v8YEQWDvvuGjtaJ87",
      },
    ],
  };

  const defaultCenter = [20.6248, -100.3294];
  const title = document.getElementById("mapa-zonas-title");
  const subtitle = document.getElementById("mapa-zonas-subtitle");
  const mapZoneLink = document.getElementById("map-zone-link");
  let lastRenderedStateSlug = null;
  let renderMapForState = null;
  const mapKeyFromWindow = window.STATIC_GOOGLE_MAPS_KEY || "";
  const mapKeyFromData = mapContainer.getAttribute("data-google-maps-key") || "";
  const googleMapsKey = (mapKeyFromWindow || mapKeyFromData).trim();

  function markerSvg (fillColor) {
    return `
      <svg width="32" height="39" viewBox="0 0 56 68" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M26.7715 67.7369L26.7603 67.7319L26.7374 67.7215L26.6648 67.6881C26.6047 67.6601 26.5213 67.6209 26.4164 67.5703C26.2065 67.4691 25.9098 67.3223 25.5387 67.1287C24.7969 66.7419 23.7551 66.1675 22.5134 65.3979C20.0351 63.8619 16.7305 61.5304 13.4181 58.3377C6.79132 51.9504 0 41.9699 0 28C0 12.536 12.536 0 28 0C43.464 0 56 12.536 56 28C56 41.9699 49.2087 51.9504 42.5819 58.3377C39.2695 61.5304 35.9649 63.8619 33.4866 65.3979C32.2449 66.1675 31.2031 66.7419 30.4613 67.1287C30.0902 67.3223 29.7935 67.4691 29.5836 67.5703C29.4787 67.6209 29.3953 67.6601 29.3352 67.6881L29.2626 67.7215L29.2397 67.7319L29.2316 67.7355C28.44 68.08 28 68 28 68C28 68 27.56 68.08 26.7715 67.7369Z" fill="${fillColor}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 26.2381H21.5238L32.9524 11H23.0476L12 26.2381ZM14.6667 30.4286H24.1905L35.2381 14.8095L37.9048 18.2381L26.8571 33.8571H16.9524L14.6667 30.4286ZM28.381 36.5238H18.4762L21.1429 39.9524H31.0476L41.7143 24.3333L39.4286 20.9048L28.381 36.5238ZM23.0476 43H32.9524L44 27.381H42.0952L31.8095 41.4762H24.1905L23.0476 43Z" fill="white"/>
      </svg>
    `;
  }

  function markerIconUrl (fillColor) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg(fillColor))}`;
  }

  function projectLabel (projects) {
    if (!projects.length) return "No hay desarrollos con coordenadas para esta zona.";
    return `${projects.length} desarrollo${projects.length > 1 ? "s" : ""} en ${projects[0].zone}.`;
  }

  function updateMapHeading (projects) {
    if (!title) return;
    if (!projects.length) {
      title.textContent = "Mapa de zonas y desarrollos";
      return;
    }
    title.textContent = `${projects[0].zone}`;
  }

  function updateMapLink (projects) {
    if (!mapZoneLink) return;

    const nextUrl = projects[0]?.mapsUrl || "https://maps.app.goo.gl/ZeLwaQCYwk5pjp5cA";
    mapZoneLink.href = nextUrl;
  }

  function openMapsUrl (url) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function setupMapTabsMirror (onMirrorSelect) {
    const sourceTabsBar = document.querySelector("[data-dev-tabs] .dev-zone-tabs");
    const mirrorTabsBar = document.getElementById("map-zone-tabs");
    if (!sourceTabsBar || !mirrorTabsBar) return;

    const sourceTabs = Array.from(sourceTabsBar.querySelectorAll(".dev-tab"));
    mirrorTabsBar.innerHTML = "";

    const syncMirrorState = (forcedSlug = null) => {
      const activeSlug =
        forcedSlug ||
        sourceTabsBar.querySelector(".dev-tab.active")?.getAttribute("data-state-tab");
      Array.from(mirrorTabsBar.querySelectorAll(".dev-tab")).forEach((button) => {
        button.classList.toggle("active", button.getAttribute("data-state-tab") === activeSlug);
      });
    };

    sourceTabs.forEach((sourceTab) => {
      const slug = sourceTab.getAttribute("data-state-tab");
      if (!slug) return;

      const mirrorButton = document.createElement("button");
      mirrorButton.type = "button";
      mirrorButton.className = "dev-tab";
      mirrorButton.setAttribute("data-state-tab", slug);
      mirrorButton.textContent = sourceTab.textContent || "";
      mirrorButton.addEventListener("click", (event) => {
        event.preventDefault();
        syncMirrorState(slug);
        if (typeof onMirrorSelect === "function") {
          onMirrorSelect(slug);
        }
      });
      mirrorTabsBar.appendChild(mirrorButton);
    });

    sourceTabsBar.addEventListener("click", () => {
      window.setTimeout(syncMirrorState, 0);
    });

    syncMirrorState();
  }

  function loadGoogleMapsApi (apiKey) {
    if (!apiKey) return Promise.resolve(false);
    if (window.google && window.google.maps) return Promise.resolve(true);

    return new Promise((resolve) => {
      const existing = document.querySelector('script[data-google-maps-loader="static-landing"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(Boolean(window.google && window.google.maps)));
        existing.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
      script.async = true;
      script.defer = true;
      script.setAttribute("data-google-maps-loader", "static-landing");
      script.onload = () => resolve(Boolean(window.google && window.google.maps));
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  function bindTabs (renderFn, postRender) {
    const tabRoot = document.querySelector("[data-dev-tabs]");
    const tabs = tabRoot ? Array.from(tabRoot.querySelectorAll(".dev-tab")) : [];

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const stateSlug = tab.getAttribute("data-state-tab");
        if (!stateSlug) return;

        window.setTimeout(() => {
          renderFn(stateSlug);
          if (postRender) postRender();
        }, 0);
      });
    });

    const initialActive =
      tabRoot?.querySelector(".dev-tab.active")?.getAttribute("data-state-tab") || "el-marques";
    renderFn(initialActive);
    if (postRender) window.setTimeout(postRender, 120);
  }

  function initLeafletMap () {
    if (typeof window.L === "undefined") return;

    const map = window.L.map(mapContainer, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView(defaultCenter, 11);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const layerGroup = window.L.layerGroup().addTo(map);
    const leafletIcon = window.L.icon({
      iconUrl: markerIconUrl("#cc0f19"),
      iconSize: [32, 39],
      iconAnchor: [16, 39],
      popupAnchor: [0, -34],
    });

    function renderStateMarkers (stateSlug) {
      if (stateSlug === lastRenderedStateSlug) return;
      lastRenderedStateSlug = stateSlug;

      const projects = projectsByState[stateSlug] || [];
      layerGroup.clearLayers();

      updateMapHeading(projects);
      updateMapLink(projects);
      if (subtitle) subtitle.textContent = projectLabel(projects);

      if (!projects.length) {
        map.setView(defaultCenter, 11);
        return;
      }

      const points = [];

      projects.forEach((project) => {
        const marker = window.L.marker([project.lat, project.lng], { icon: leafletIcon }).addTo(layerGroup);
        marker.on("click", () => {
          openMapsUrl(project.mapsUrl);
        });
        points.push([project.lat, project.lng]);
      });

      if (points.length === 1) {
        map.setView(points[0], 13, { animate: false });
      } else {
        const avgLat =
          points.reduce((sum, point) => sum + point[0], 0) / points.length;
        const avgLng =
          points.reduce((sum, point) => sum + point[1], 0) / points.length;
        map.setView([avgLat, avgLng], 11, { animate: false });
      }
    }

    renderMapForState = renderStateMarkers;

    bindTabs(renderStateMarkers, () => map.invalidateSize());
  }

  function initGoogleMap () {
    const map = new window.google.maps.Map(mapContainer, {
      center: { lat: defaultCenter[0], lng: defaultCenter[1] },
      zoom: 11,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const infoWindow = new window.google.maps.InfoWindow();
    let markers = [];

    const markerIcon = {
      url: markerIconUrl("#cc0f19"),
      scaledSize: new window.google.maps.Size(32, 39),
      anchor: new window.google.maps.Point(16, 39),
    };

    function clearMarkers () {
      markers.forEach((marker) => marker.setMap(null));
      markers = [];
    }

    function renderStateMarkers (stateSlug) {
      if (stateSlug === lastRenderedStateSlug) return;
      lastRenderedStateSlug = stateSlug;

      const projects = projectsByState[stateSlug] || [];
      clearMarkers();

      updateMapHeading(projects);
      updateMapLink(projects);
      if (subtitle) subtitle.textContent = projectLabel(projects);

      if (!projects.length) {
        map.setCenter({ lat: defaultCenter[0], lng: defaultCenter[1] });
        map.setZoom(11);
        return;
      }

      const points = [];

      projects.forEach((project) => {
        const position = { lat: project.lat, lng: project.lng };
        const marker = new window.google.maps.Marker({
          position,
          map,
          icon: markerIcon,
          title: project.name,
        });

        marker.addListener("click", () => {
          openMapsUrl(project.mapsUrl);
        });

        markers.push(marker);
        points.push(position);
      });

      if (projects.length === 1) {
        map.setCenter({ lat: projects[0].lat, lng: projects[0].lng });
        map.setZoom(13);
      } else {
        const avgLat =
          points.reduce((sum, point) => sum + point.lat, 0) / points.length;
        const avgLng =
          points.reduce((sum, point) => sum + point.lng, 0) / points.length;
        map.setCenter({ lat: avgLat, lng: avgLng });
        map.setZoom(11);
      }
    }

    renderMapForState = renderStateMarkers;

    bindTabs(renderStateMarkers);
  }

  loadGoogleMapsApi(googleMapsKey).then((loaded) => {
    if (loaded) {
      initGoogleMap();
      setupMapTabsMirror((slug) => {
        if (renderMapForState) renderMapForState(slug);
      });
      return;
    }
    initLeafletMap();
    setupMapTabsMirror((slug) => {
      if (renderMapForState) renderMapForState(slug);
    });
  });
}

setupDevelopmentsMap();