const galleries = {
  patio: [
    "galeria/patio-01.png", "galeria/patio-02.png", "galeria/patio-03.png",
    "galeria/patio-05.png", "galeria/patio-06.png", "galeria/patio-07.png",
    "galeria/patio-08.png", "galeria/patio-09.png", "galeria/patio-10.png"
  ],
  diferenciais: [
    "galeria/patio-11.png", "galeria/patio-13.png", "galeria/patio-14.png",
    "galeria/patio-16.png", "galeria/patio-17.png", "galeria/patio-18.png"
  ]
};

const leadConfig = {
  propertyCode: "BBA002",
  propertyTitle: "Pátio São José",
  gallery: "patio"
};

let showLeadPromptForPhoto = () => {};

document.addEventListener("DOMContentLoaded", () => {
  menu();
  setupPropertyLeadPrompt();
  lightbox();
  tracking();
});

function menu() {
  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".menu-toggle");
  if (!nav || !toggle) return;

  const setOpen = (open) => {
    document.body.classList.toggle("mobile-menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  setOpen(false);
  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!document.body.classList.contains("mobile-menu-open"));
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });
}

function lightbox() {
  const element = document.getElementById("lightbox");
  const image = document.getElementById("lightbox-img");
  const count = document.getElementById("lightbox-count");
  const closeButton = document.querySelector(".lightbox-close");
  const previousButton = document.querySelector(".lightbox-prev");
  const nextButton = document.querySelector(".lightbox-next");
  if (!element || !image || !count || !closeButton || !previousButton || !nextButton) return;

  let currentGallery = "patio";
  let currentIndex = 0;

  const render = () => {
    const items = galleries[currentGallery];
    image.src = items[currentIndex];
    image.alt = `Foto ampliada ${currentIndex + 1} de ${items.length}`;
    count.textContent = `${currentIndex + 1} / ${items.length}`;
  };

  const open = (gallery, index) => {
    if (!galleries[gallery]) return;
    currentGallery = gallery;
    currentIndex = index;
    render();
    element.classList.add("open");
    element.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    closeButton.focus();
    showLeadPromptForPhoto(currentGallery, currentIndex);
  };

  const close = () => {
    element.classList.remove("open");
    element.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
  };

  const move = (direction) => {
    const items = galleries[currentGallery];
    currentIndex = (currentIndex + direction + items.length) % items.length;
    render();
    showLeadPromptForPhoto(currentGallery, currentIndex);
  };

  document.querySelectorAll(".photo-card").forEach((button) => {
    button.addEventListener("click", () => open(button.dataset.gallery, Number(button.dataset.index)));
  });
  closeButton.addEventListener("click", close);
  previousButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));
  document.addEventListener("keydown", (event) => {
    if (!element.classList.contains("open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowRight") move(1);
    if (event.key === "ArrowLeft") move(-1);
  });
}

function setupPropertyLeadPrompt() {
  const prompt = document.getElementById("property-lead-prompt");
  const closeButton = prompt?.querySelector(".lead-prompt-close");
  const form = document.getElementById("lead-prompt-form");
  const status = document.getElementById("lead-form-status");
  const success = document.getElementById("lead-success");
  if (!prompt || !closeButton || !form || !status || !success) return;

  const storageKey = `bb-lead-prompted:${leadConfig.propertyCode}`;

  const closePrompt = () => {
    prompt.classList.remove("open");
    window.setTimeout(() => { prompt.hidden = true; }, 180);
  };

  showLeadPromptForPhoto = (gallery, index) => {
    if (gallery !== leadConfig.gallery || index !== 3) return;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "true");
    } catch {
      // O convite continua funcionando quando o navegador bloqueia o armazenamento.
    }

    prompt.hidden = false;
    window.requestAnimationFrame(() => prompt.classList.add("open"));
    window.setTimeout(() => form.elements.name?.focus(), 200);
  };

  closeButton.addEventListener("click", closePrompt);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const submitButton = form.querySelector(".lead-submit");
    const formData = new FormData(form);
    const searchParams = new URLSearchParams(window.location.search);
    status.textContent = "";
    status.classList.remove("error");
    submitButton.disabled = true;
    submitButton.textContent = "Registrando...";

    try {
      const response = await fetch("https://www.bbconsultoriaimoveis.com.br/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyCode: leadConfig.propertyCode,
          name: formData.get("name"),
          phone: formData.get("phone"),
          consent: formData.get("consent") === "on",
          company: formData.get("company"),
          sourcePage: window.location.href,
          referrer: document.referrer || null,
          utmSource: searchParams.get("utm_source"),
          utmMedium: searchParams.get("utm_medium"),
          utmCampaign: searchParams.get("utm_campaign"),
          utmTerm: searchParams.get("utm_term"),
          utmContent: searchParams.get("utm_content"),
          gclid: searchParams.get("gclid")
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Não foi possível registrar seu contato.");

      form.hidden = true;
      success.hidden = false;
      if (typeof window.gtag === "function") {
        window.gtag("event", "landing_lead_created", {
          property_name: leadConfig.propertyTitle,
          property_code: leadConfig.propertyCode,
          transport_type: "beacon"
        });
      }
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Não foi possível registrar seu contato.";
      status.classList.add("error");
      submitButton.disabled = false;
      submitButton.textContent = "Receber informações";
    }
  });
}

function tracking() {
  document.querySelectorAll('a[href*="wa.me/"]').forEach((link) => {
    link.addEventListener("click", () => {
      if (typeof window.gtag !== "function") return;
      const location = link.dataset.ctaLocation || "nao_identificado";
      window.gtag("event", "generate_lead", { event_category: "WhatsApp", event_label: "Pátio São José", property_code: "BBA002", cta_location: location, link_url: link.href, transport_type: "beacon" });
      window.gtag("event", "whatsapp_click", { property_name: "Pátio São José", property_code: "BBA002", cta_location: location, transport_type: "beacon" });
      window.gtag("event", "conversion", { send_to: "AW-18217048699/QUxsCIexxukcEPu0yO5D", value: 1, currency: "BRL", property_name: "Pátio São José", property_code: "BBA002", cta_location: location, transport_type: "beacon" });
    });
  });
}
