/* تفاعلات مشتركة وخفيفة تعمل في جميع الصفحات. */
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const readStorage = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const writeStorage = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // التخزين اختياري؛ لا نوقف الصفحة إذا عطّله المتصفح.
    }
  };

  if (readStorage("svu-theme") === "dark") body.dataset.theme = "dark";
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const darkMode = body.dataset.theme === "dark";
      if (darkMode) {
        delete body.dataset.theme;
        writeStorage("svu-theme", "light");
        button.setAttribute("aria-label", "تفعيل الوضع الليلي");
        button.innerHTML =
          '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
      } else {
        body.dataset.theme = "dark";
        writeStorage("svu-theme", "dark");
        button.setAttribute("aria-label", "تفعيل الوضع النهاري");
        button.innerHTML = '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
      }
    });
  });

  const scrollTopButton = document.getElementById("scrollTopBtn");
  if (scrollTopButton) {
    window.addEventListener(
      "scroll",
      () => scrollTopButton.classList.toggle("show", window.scrollY > 350),
      { passive: true },
    );
    scrollTopButton.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  }

  const toastContainer = document.createElement("div");
  toastContainer.id = "toastContainer";
  toastContainer.className =
    "toast-container position-fixed bottom-0 start-0 p-3";
  toastContainer.setAttribute("aria-live", "polite");
  document.body.appendChild(toastContainer);

  initEventsPage();
  initContactPage();
  initEventDetails();
});

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const icon =
    type === "success"
      ? "fa-circle-check"
      : type === "danger"
        ? "fa-circle-exclamation"
        : "fa-circle-info";
  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-bg-${type} border-0`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="fa-solid ${icon} ms-2" aria-hidden="true"></i>${message}</div><button type="button" class="btn-close btn-close-white ms-2 m-auto" data-bs-dismiss="toast" aria-label="إغلاق"></button></div>`;
  container.appendChild(toast);
  const instance = bootstrap.Toast.getOrCreateInstance(toast, { delay: 2000 });
  toast.addEventListener("hidden.bs.toast", () => toast.remove());
  instance.show();
}

function setButtonLoading(button, isLoading, label, icon = "fa-filter") {
  if (!button) return;
  button.disabled = isLoading;
  button.innerHTML = isLoading
    ? '<span class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>جارٍ المعالجة'
    : `<i class="fa-solid ${icon} ms-2" aria-hidden="true"></i>${label}`;
}

const eventCatalog = {
  tech: {
    category: "تكنولوجيا وبرمجيات",
    title: "ورشة عمل C# و .NET المتقدمة",
    date: "25 نوفمبر 2026",
    location: "قاعة البث الافتراضية عبر الإنترنت",
    image: "img/ورشة عمل برمجية.jpg",
    description:
      "تستعرض هذه الورشة البرمجية المكثفة آليات تصميم وتطوير الأنظمة باستخدام لغة C# وإطار عمل .NET الحديث. نركز على معمارية الطبقات الثلاث، إدارة قواعد البيانات باستخدام SQL Server، وبناء تطبيقات متكاملة تتسم بالكفاءة وقابلية التوسع.",
    duration: "ساعتان ونصف",
    mode: "عن بُعد",
    seats: "50 مقعدًا",
    features: [
      ["fa-layer-group", "3-Tier Architecture", "تصميم قابل للتوسع"],
      ["fa-database", "SQL Server", "إدارة البيانات باحتراف"],
      ["fa-code", "C# و .NET", "تطبيقات عملية حديثة"],
    ],
  },
  culture: {
    category: "ثقافة ومعرفة",
    title: "نادي الكتاب الجامعي",
    date: "28 ديسمبر 2026",
    location: "القاعة المركزية",
    image: "img/نادي الكتاب.jpg",
    description:
      "مساحة ثقافية تفاعلية نناقش فيها روايات ومؤلفات إدارية وبرمجية، ونشارك الأفكار والتجارب التي تساهم في صقل مهارات الطالب وتوسيع مداركه.",
    duration: "ساعتان",
    mode: "حضوري",
    seats: "35 مقعدًا",
    features: [
      ["fa-book-open", "جلسة نقاش", "حوار مفتوح مع المشاركين"],
      ["fa-lightbulb", "أفكار جديدة", "تبادل القراءات والتجارب"],
      ["fa-users", "مجتمع قارئ", "تواصل بين الطلاب"],
    ],
  },
  sports: {
    category: "رياضة وتحدي",
    title: "بطولة الشطرنج البرمجي",
    date: "1 ديسمبر 2026",
    location: "منصة الجامعة",
    image: "img/شطرنج.jpg",
    description:
      "منافسات ذكاء استراتيجي وتحديات تفكير منطقي بين طلاب الكليات المختلفة، في تجربة تجمع الحماس والتحدي وتنمّي مهارات التركيز والتخطيط.",
    duration: "ثلاث ساعات",
    mode: "عن بُعد",
    seats: "64 مقعدًا",
    features: [
      ["fa-chess-knight", "منافسات ذكية", "جولات بتحديات متنوعة"],
      ["fa-ranking-star", "ترتيب المشاركين", "نتائج واضحة وعادلة"],
      ["fa-trophy", "روح التحدي", "تجربة تنافسية ممتعة"],
    ],
  },
  family: {
    category: "عائلي واجتماعي",
    title: "يوم العائلة الجامعي والأنشطة",
    date: "15 نوفمبر 2026",
    location: "الحرم الرئيسي",
    image: "img/يوم العائلة.jpg",
    description:
      "فعالية ترفيهية اجتماعية تجمع عائلات الطلاب والأساتذة في يوم مليء بالأنشطة الخفيفة والمسابقات واللحظات الجميلة خارج أجواء الدراسة.",
    duration: "أربع ساعات",
    mode: "حضوري",
    seats: "100 مقعدًا",
    features: [
      ["fa-people-group", "أنشطة جماعية", "فقرات تناسب الجميع"],
      ["fa-puzzle-piece", "مسابقات", "تحديات ترفيهية متنوعة"],
      ["fa-heart", "أجواء عائلية", "يوم مليء بالمرح"],
    ],
  },
  "october-flower": {
    category: "عائلي واجتماعي",
    title: "زهرة أكتوبر",
    date: "29 أكتوبر 2026",
    location: "الحرم الجامعي",
    image: "img/فعالية زهرة اكتوبر.jpg",
    description:
      "مساحة هادئة ومميزة تجمع طلاب الحرم الجامعي للاستمتاع بأجواء الخريف اللطيفة، وإبراز جمال الطبيعة، ومشاركة لحظات دافئة ومبهجة تعكس روح الفصل وتفاصيله المميزة.",
    duration: "ساعتان",
    mode: "حضوري (الحرم الجامعي)",
    seats: "مفتوحة للجميع",
    features: [
      ["fa-leaf", "أجواء خريفية", "جلسات هادئة ومريحة وسط الطبيعة"],
      ["fa-gift", "توزيعات لطيفة", "لفتات رمزية ومشاركة ألوان الزهور"],
      ["fa-handshake", "لحظات تفاعلية", "مساحة للقاءات الودية والأوقات الجميلة"],
    ],
  },
};

function initEventsPage() {
  const search = document.getElementById("searchInput");
  const category = document.getElementById("categoryFilter");
  const date = document.getElementById("dateFilter");
  const filterButton = document.getElementById("filterBtn");
  if (!search || !category || !date || !filterButton) return;

  const categoryFromUrl = new URLSearchParams(window.location.search).get(
    "cat",
  );
  if (
    categoryFromUrl &&
    [...category.options].some((option) => option.value === categoryFromUrl)
  ) {
    category.value = categoryFromUrl;
  }

  const applyFilters = () => {
    setButtonLoading(filterButton, true, "تطبيق");
    window.setTimeout(() => {
      const term = search.value.trim().toLowerCase();
      let count = 0;
      document.querySelectorAll(".event-item").forEach((item) => {
        const title = item
          .querySelector(".card-title")
          .textContent.toLowerCase();
        const description = item
          .querySelector(".event-content p:last-of-type")
          .textContent.toLowerCase();
        const visible =
          (!category.value || item.dataset.category === category.value) &&
          (!date.value || item.dataset.date === date.value) &&
          (!term || title.includes(term) || description.includes(term));
        item.classList.toggle("d-none", !visible);
        if (visible) count += 1;
      });
      document.getElementById("resultsCount").textContent = `${count} فعاليات`;
      document
        .getElementById("emptyState")
        .classList.toggle("d-none", count > 0);
      setButtonLoading(filterButton, false, "تطبيق");
    }, 180);
  };

  document.getElementById("resetFiltersBtn")?.addEventListener("click", () => {
    search.value = "";
    category.value = "";
    date.value = "";
    applyFilters();
    showToast("تم مسح جميع الفلاتر.", "info");
  });
  filterButton.addEventListener("click", applyFilters);
  search.addEventListener("input", applyFilters);
  category.addEventListener("change", applyFilters);
  date.addEventListener("change", applyFilters);
  applyFilters();
}

function initContactPage() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      showToast("يرجى مراجعة الحقول المطلوبة.", "danger");
      return;
    }
    setButtonLoading(button, true, "إرسال الرسالة", "fa-paper-plane");
    window.setTimeout(() => {
      form.reset();
      form.classList.remove("was-validated");
      setButtonLoading(button, false, "إرسال الرسالة", "fa-paper-plane");
      showToast("تم إرسال رسالتك بنجاح. شكرًا لتواصلك معنا.");
    }, 550);
  });
}

function initEventDetails() {
  const title = document.getElementById("eventTitle");
  if (!title) return;
  const id = new URLSearchParams(window.location.search).get("id") || "tech";
  const event = eventCatalog[id] || eventCatalog.tech;
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };
  document.title = `${event.title} | دليل فعاليات SVU`;
  setText("#eventKicker", `فعالية مميزة · ${event.category}`);
  setText("#eventTitle", event.title);
  setText("#eventDescription", event.description);
  setText("#eventDuration", event.duration);
  setText("#eventMode", event.mode);
  setText("#eventSeats", event.seats);
  const meta = document.getElementById("eventMeta");
  if (meta)
    meta.innerHTML = `<i class="fa-regular fa-calendar"></i> ${event.date} <i class="fa-solid fa-location-dot"></i> ${event.location}`;
  const image = document.getElementById("eventImage");
  if (image) {
    image.src = event.image;
    image.alt = event.title;
  }
  document.getElementById("eventFeatures").innerHTML = event.features
    .map(
      ([icon, featureTitle, description]) =>
        `<div class="col-sm-4"><div class="feature-box"><i class="fa-solid ${icon}"></i><strong>${featureTitle}</strong><span>${description}</span></div></div>`,
    )
    .join("");
  document.getElementById("relatedEvents").innerHTML = Object.entries(
    eventCatalog,
  )
    .filter(([eventId]) => eventId !== id)
    .map(
      ([eventId, item]) =>
        `<a class="related-link" href="event.html?id=${eventId}">${item.title}<small>${item.date} · ${item.category}</small></a>`,
    )
    .join("");

  const modalElement = document.getElementById("bookingModal");
  setText("#bookingEventTitle", event.title);
  setText("#bookingEventMeta", `${event.date} · ${event.location}`);
  modalElement?.addEventListener("shown.bs.modal", () =>
    document.getElementById("bookingName")?.focus(),
  );
  modalElement?.addEventListener("hidden.bs.modal", () => {
    const bookingForm = document.getElementById("bookingForm");
    bookingForm?.classList.remove("was-validated");
  });
  const form = document.getElementById("bookingForm");
  form?.addEventListener("submit", (eventSubmit) => {
    eventSubmit.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      showToast("يرجى إدخال الاسم والبريد الإلكتروني بشكل صحيح.", "danger");
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    setButtonLoading(button, true, "تأكيد الحجز", "fa-ticket");
    window.setTimeout(() => {
      form.reset();
      form.classList.remove("was-validated");
      setButtonLoading(button, false, "تأكيد الحجز", "fa-ticket");
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
      showToast("تم تأكيد حجزك الوهمي بنجاح.");
    }, 650);
  });
  document
    .querySelector("[data-calendar]")
    ?.addEventListener("click", () =>
      showToast("تمت إضافة الفعالية إلى تقويمك."),
    );
  document
    .querySelector("[data-share]")
    ?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("تم نسخ رابط الفعالية.");
      } catch {
        showToast("يمكنك نسخ الرابط من شريط المتصفح.", "info");
      }
    });
}
