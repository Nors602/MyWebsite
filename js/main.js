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
  initCalendarPage();
  initFavorites();
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

const FAVORITES_KEY = "svu-favorite-events";
const GOOGLE_BOOKING_FORM = {
  url: "https://docs.google.com/forms/d/e/1FAIpQLSdL63WuKvIYeLJV3xJ-aOsPkQGlOIO6M4tljcNY1v9p22n-sA/viewform",
  fields: {
    name: "598426308",
    email: "1546476987",
    event: "1932515026",
  },
};

function hasGoogleBookingForm() {
  return GOOGLE_BOOKING_FORM.url.startsWith("https://docs.google.com/forms/");
}

function getGoogleBookingUrl(event, name, email) {
  if (!hasGoogleBookingForm()) return null;
  const params = new URLSearchParams();
  const fields = GOOGLE_BOOKING_FORM.fields;
  if (fields.name) params.set(`entry.${fields.name}`, name);
  if (fields.email) params.set(`entry.${fields.email}`, email);
  if (fields.event) params.set(`entry.${fields.event}`, event.title);
  return `${GOOGLE_BOOKING_FORM.url}?${params.toString()}`;
}

function submitToGoogleForm(event, name, email) {
  if (!hasGoogleBookingForm()) return false;
  const frameName = `googleBookingFrame-${Date.now()}`;
  const frame = document.createElement("iframe");
  frame.name = frameName;
  frame.title = "إرسال الحجز";
  frame.hidden = true;
  document.body.appendChild(frame);
  const form = document.createElement("form");
  form.method = "POST";
  form.action = GOOGLE_BOOKING_FORM.url.replace("/viewform", "/formResponse");
  form.target = frameName;
  form.hidden = true;
  const values = {
    [`entry.${GOOGLE_BOOKING_FORM.fields.name}`]: name,
    [`entry.${GOOGLE_BOOKING_FORM.fields.email}`]: email,
    [`entry.${GOOGLE_BOOKING_FORM.fields.event}`]: event.title,
  };
  Object.entries(values).forEach(([fieldName, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = fieldName;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  window.setTimeout(() => {
    form.remove();
    frame.remove();
  }, 5000);
  return true;
}

function getFavoriteIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function setFavoriteState(eventId, isFavorite) {
  const favorites = getFavoriteIds().filter((id) => id !== eventId);
  if (isFavorite) favorites.push(eventId);
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    showToast("تعذر حفظ المفضلة في هذا المتصفح.", "danger");
    return false;
  }
  return true;
}

function createFavoriteButton(eventId) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "favorite-toggle";
  button.dataset.favoriteId = eventId;
  button.setAttribute("aria-label", "إضافة إلى المفضلة");
  button.title = "إضافة إلى المفضلة";
  button.innerHTML = '<i class="fa-regular fa-heart" aria-hidden="true"></i>';
  button.addEventListener("click", () => {
    const isFavorite = !getFavoriteIds().includes(eventId);
    if (!setFavoriteState(eventId, isFavorite)) return;
    updateFavoriteButtons();
    showToast(isFavorite ? "تمت إضافة الفعالية إلى المفضلة." : "تمت إزالة الفعالية من المفضلة.", "info");
    document.dispatchEvent(new CustomEvent("favoriteschanged"));
  });
  return button;
}

function updateFavoriteButtons() {
  const favorites = getFavoriteIds();
  document.querySelectorAll("[data-favorite-id]").forEach((button) => {
    const isFavorite = favorites.includes(button.dataset.favoriteId);
    button.classList.toggle("is-favorite", isFavorite);
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute(
      "aria-label",
      isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة",
    );
    button.title = isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة";
    button.innerHTML = `<i class="fa-${isFavorite ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>`;
  });
}

function initFavorites() {
  document.querySelectorAll(".event-card").forEach((card) => {
    const link = card.querySelector('a[href*="event.html?id="]');
    const eventId = link?.href.split("id=")[1];
    if (eventId && !card.querySelector("[data-favorite-id]")) {
      card.querySelector(".event-image")?.appendChild(createFavoriteButton(eventId));
    }
  });

  const eventTitle = document.getElementById("eventTitle");
  if (eventTitle && !document.querySelector("[data-detail-favorite]")) {
    const eventId =
      new URLSearchParams(window.location.search).get("id") || "tech";
    const button = createFavoriteButton(eventId);
    button.dataset.detailFavorite = "true";
    button.classList.add("detail-favorite");
    document.querySelector(".d-flex.flex-wrap.gap-2")?.prepend(button);
  }

  const eventsContainer = document.getElementById("eventsContainer");
  const resultsHeading = document.querySelector("#resultsCount")?.parentElement;
  if (eventsContainer && resultsHeading && !document.getElementById("favoritesOnlyBtn")) {
    const button = document.createElement("button");
    button.id = "favoritesOnlyBtn";
    button.type = "button";
    button.className = "btn btn-sm btn-outline-primary";
    button.innerHTML = '<i class="fa-regular fa-heart ms-1" aria-hidden="true"></i>المفضلة فقط';
    button.addEventListener("click", () => {
      const showingFavorites = button.classList.toggle("active");
      button.setAttribute("aria-pressed", String(showingFavorites));
      document.querySelectorAll(".event-item").forEach((item) => {
        const link = item.querySelector('a[href*="event.html?id="]');
        const eventId = link?.href.split("id=")[1];
        if (showingFavorites && !getFavoriteIds().includes(eventId)) {
          item.classList.add("d-none");
        } else if (!item.dataset.filteredOut || item.dataset.filteredOut === "false") {
          item.classList.remove("d-none");
        }
      });
      if (showingFavorites && !getFavoriteIds().length) showToast("لم تحفظ أي فعالية في المفضلة بعد.", "info");
    });
    resultsHeading.appendChild(button);
  }
  document.addEventListener("favoriteschanged", () => {
    const favoritesOnly = document.getElementById("favoritesOnlyBtn");
    if (!favoritesOnly?.classList.contains("active")) return;
    document.querySelectorAll(".event-item").forEach((item) => {
      const eventId = item
        .querySelector('a[href*="event.html?id="]')
        ?.href.split("id=")[1];
      item.classList.toggle("d-none", !getFavoriteIds().includes(eventId));
    });
  });
  updateFavoriteButtons();
}

const eventCatalog = {
  "annual-conference": {
    category: "تكنولوجيا وبرمجيات",
    title: "المؤتمر السنوي لهندسة البرمجيات",
    date: "10 نوفمبر 2026",
    time: "10:00 صباحًا – 4:00 مساءً",
    location: "الجامعة الافتراضية السورية",
    image: "img/المؤتمر السنوي للبرمجة.jpg",
    description:
      "يلتقي الطلاب والمهتمون بالتقنية في يوم معرفي يستعرض اتجاهات هندسة البرمجيات، من تطوير أنظمة Backend إلى تطبيقات الذكاء الاصطناعي، عبر جلسات حوارية وتجارب عملية تفتح آفاقًا جديدة.",
    duration: "6 ساعات",
    mode: "حضوري",
    seats: "120 مقعدًا",
    features: [
      ["fa-microphone-lines", "جلسات متخصصة", "حوارات مع خبراء ومهتمين"],
      ["fa-brain", "ذكاء اصطناعي", "أفكار وتطبيقات عملية حديثة"],
      ["fa-network-wired", "تواصل تقني", "تبادل الخبرات وبناء العلاقات"],
    ],
  },
  "book-exhibition": {
    category: "ثقافة ومعرفة",
    title: "معرض الكتاب الجامعي",
    date: "20 نوفمبر 2026",
    time: "10:00 صباحًا – 5:00 مساءً يوميًا",
    location: "الجامعة الافتراضية السورية",
    image: "img/نادي الكتاب.jpg",
    description:
      "معرض ثقافي مفتوح يضم إصدارات أكاديمية وروايات مختارة، ويمنح الطلاب فرصة اكتشاف مصادر جديدة للتعلم وتبادل التوصيات في أجواء جامعية ملهمة.",
    duration: "ثلاثة أيام، 7 ساعات يوميًا",
    mode: "حضوري",
    seats: "مفتوحة للجميع",
    features: [
      ["fa-book-open", "إصدارات متنوعة", "كتب أكاديمية وثقافية مختارة"],
      ["fa-magnifying-glass", "اكتشاف ومعرفة", "مصادر جديدة للتعلم والقراءة"],
      ["fa-comments", "لقاءات ثقافية", "نقاشات وتبادل توصيات القراءة"],
    ],
  },
  tech: {
    category: "تكنولوجيا وبرمجيات",
    title: "ورشة عمل C# و .NET المتقدمة",
    date: "25 نوفمبر 2026",
    time: "6:00 مساءً – 8:30 مساءً",
    location: "أونلاين",
    image: "img/ورشة عمل برمجية.jpg",
    description:
      "ورشة عملية للمطورين والطلاب الراغبين في تطوير أنظمة حديثة باستخدام C# و.NET. تتناول معمارية الطبقات الثلاث، SQL Server، وبناء تطبيقات قابلة للتوسع من خلال أمثلة تطبيقية.",
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
    time: "11:00 صباحًا – 1:00 ظهرًا",
    location: "الجامعة الافتراضية السورية",
    image: "img/نادي الكتاب.jpg",
    description:
      "مساحة حوارية نقرأ فيها روايات ومؤلفات مختارة، ثم نتبادل الأفكار والتجارب التي توسّع المدارك وتدعم عادة التعلم المستمر.",
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
    time: "7:00 مساءً – 10:00 مساءً",
    location: "أونلاين",
    image: "img/شطرنج.jpg",
    description:
      "تجربة تنافسية تجمع الطلاب في جولات شطرنج تنمّي التركيز والتخطيط والتفكير المنطقي، ضمن أجواء حماسية ومنظمة.",
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
    time: "11:00 صباحًا – 3:00 مساءً",
    location: "الجامعة الافتراضية السورية",
    image: "img/يوم العائلة.jpg",
    description:
      "يوم اجتماعي مفتوح يجمع الطلاب وأسرهم وأعضاء الهيئة التدريسية في أنشطة خفيفة ومسابقات ولقاءات تعزز روح الانتماء إلى المجتمع الجامعي.",
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
    time: "12:00 ظهرًا – 2:00 ظهرًا",
    location: "الجامعة الافتراضية السورية",
    image: "img/فعالية زهرة اكتوبر.jpg",
    description:
      "لقاء خريفي بسيط يفتح مساحة للتعارف والراحة ومشاركة لحظات مبهجة مع مجتمع الجامعة، بعيدًا عن ضغط الدراسة وروتينها.",
    duration: "ساعتان",
    mode: "حضوري",
    seats: "مفتوحة للجميع",
    features: [
      ["fa-leaf", "أجواء خريفية", "جلسات هادئة ومريحة وسط الطبيعة"],
      ["fa-gift", "توزيعات لطيفة", "لفتات رمزية ومشاركة ألوان الزهور"],
      ["fa-handshake", "لحظات تفاعلية", "مساحة للقاءات الودية والأوقات الجميلة"],
    ],
  },
  career: {
    category: "مهنة وريادة أعمال",
    title: "يوم المهنة والتوظيف",
    date: "5 يناير 2027",
    time: "10:00 صباحًا – 3:00 مساءً",
    location: "الجامعة الافتراضية السورية",
    image: "img/طلاب يبرمجون.jpg",
    description:
      "يوم مهني يساعد الطلاب والخريجين على الانتقال بثقة إلى سوق العمل من خلال مراجعة السيرة الذاتية، التدريب على المقابلات، واستكشاف فرص التدريب والعمل الحر.",
    duration: "خمس ساعات",
    mode: "حضوري",
    seats: "80 مقعدًا",
    features: [
      ["fa-file-lines", "السيرة الذاتية", "مراجعة وتحسين الملف المهني"],
      ["fa-user-tie", "مقابلات العمل", "تدريب عملي على أسئلة المقابلات"],
      ["fa-rocket", "ريادة الأعمال", "خطوات تحويل الفكرة إلى مشروع"],
    ],
  },
  arts: {
    category: "فن وإبداع",
    title: "مختبر التصوير وصناعة المحتوى",
    date: "12 يناير 2027",
    time: "5:00 مساءً – 7:00 مساءً",
    location: "أونلاين",
    image: "img/فعالية زهرة اكتوبر.jpg",
    description:
      "ورشة إبداعية للمبتدئين وصنّاع المحتوى تتناول اختيار الفكرة، بناء القصة، أساسيات التصوير، وتقديم صورة وفيديو أكثر تأثيرًا.",
    duration: "ساعتان",
    mode: "عن بُعد",
    seats: "60 مقعدًا",
    features: [
      ["fa-camera", "أساسيات التصوير", "إضاءة وتكوين الصورة"],
      ["fa-pen-nib", "بناء الفكرة", "تحويل الفكرة إلى قصة قصيرة"],
      ["fa-video", "صناعة المحتوى", "نصائح للتصوير والمونتاج"],
    ],
  },
  wellbeing: {
    category: "صحة ورفاهية",
    title: "إدارة ضغط الامتحانات",
    date: "18 يناير 2027",
    time: "6:00 مساءً – 8:00 مساءً",
    location: "أونلاين",
    image: "img/يوم العائلة.jpg",
    description:
      "جلسة عملية تقدم أدوات قابلة للتطبيق لتنظيم وقت الدراسة، تخفيف ضغط الامتحانات، وبناء روتين متوازن يدعم التركيز والراحة.",
    duration: "ساعتان",
    mode: "عن بُعد",
    seats: "100 مقعدًا",
    features: [
      ["fa-calendar-check", "تنظيم الوقت", "خطة واقعية للدراسة والراحة"],
      ["fa-wind", "تخفيف التوتر", "تمارين تنفس واستعادة التركيز"],
      ["fa-moon", "نوم أفضل", "عادات تساعد على الراحة والاستعداد"],
    ],
  },
  research: {
    category: "بحث وابتكار",
    title: "معرض مشاريع الطلاب والابتكار",
    date: "25 يناير 2027",
    time: "11:00 صباحًا – 2:00 مساءً",
    location: "الجامعة الافتراضية السورية",
    image: "img/المؤتمر السنوي للبرمجة.jpg",
    description:
      "منصة لعرض مشاريع الطلاب وأفكارهم البحثية والابتكارية، وفتح حوار مع الأكاديميين والمهتمين للحصول على ملاحظات تساعد على تطويرها.",
    duration: "ثلاث ساعات",
    mode: "حضوري",
    seats: "مفتوحة للجميع",
    features: [
      ["fa-display", "عرض المشاريع", "تجارب وتطبيقات من طلاب الجامعة"],
      ["fa-lightbulb", "أفكار مبتكرة", "حلول جديدة لمشكلات واقعية"],
      ["fa-comments", "تغذية راجعة", "نقاشات تساعد على تطوير المشاريع"],
    ],
  },
  languages: {
    category: "لغات وتواصل",
    title: "نادي المحادثة الإنكليزية",
    date: "2 فبراير 2027",
    time: "6:00 مساءً – 8:00 مساءً",
    location: "أونلاين",
    image: "img/نادي الكتاب.jpg",
    description:
      "لقاء تفاعلي لممارسة المحادثة الإنكليزية وتطوير الإلقاء والتواصل بثقة، من خلال موضوعات يومية وأكاديمية تناسب مستويات مختلفة.",
    duration: "ساعتان",
    mode: "عن بُعد",
    seats: "50 مقعدًا",
    features: [
      ["fa-comments", "محادثة عملية", "موضوعات يومية وأكاديمية"],
      ["fa-microphone", "إلقاء أفضل", "تدريب على التعبير بثقة"],
      ["fa-language", "مفردات جديدة", "مصطلحات مفيدة للدراسة والعمل"],
    ],
  },
  volunteering: {
    category: "تطوع وخدمة مجتمع",
    title: "مبادرة أثر التطوعية",
    date: "10 فبراير 2027",
    time: "10:00 صباحًا – 1:00 ظهرًا",
    location: "الجامعة الافتراضية السورية",
    image: "img/طلاب يبرمجون.jpg",
    description:
      "مبادرة طلابية تحول روح التطوع إلى خطوات عملية لخدمة المجتمع، وتتيح للمشاركين توظيف مهاراتهم ضمن فرق تصنع أثرًا ملموسًا ومستدامًا.",
    duration: "ثلاث ساعات",
    mode: "حضوري",
    seats: "70 مقعدًا",
    features: [
      ["fa-people-group", "عمل جماعي", "فرق طلابية تتعاون لتحقيق الهدف"],
      ["fa-seedling", "أثر مستدام", "مبادرات تخدم البيئة والمجتمع"],
      ["fa-handshake", "شراكات", "تعاون مع جهات ومبادرات محلية"],
    ],
  },
};

function parseEventDateTime(event) {
  const monthNames = {
    يناير: 0,
    فبراير: 1,
    مارس: 2,
    أبريل: 3,
    مايو: 4,
    يونيو: 5,
    يوليو: 6,
    أغسطس: 7,
    سبتمبر: 8,
    أكتوبر: 9,
    نوفمبر: 10,
    ديسمبر: 11,
  };
  const dateMatch = event.date.match(/(\d+)\s+(\S+)\s+(\d{4})/);
  const timeMatches = [...event.time.matchAll(/(\d{1,2}):(\d{2})\s*(صباحًا|مساءً|ظهرًا)/g)];
  if (!dateMatch || timeMatches.length < 2 || monthNames[dateMatch[2]] === undefined) {
    return null;
  }
  const toDate = (match) => {
    let hour = Number(match[1]);
    if ((match[3] === "مساءً" || match[3] === "ظهرًا") && hour < 12) hour += 12;
    if (match[3] === "صباحًا" && hour === 12) hour = 0;
    return new Date(
      Number(dateMatch[3]),
      monthNames[dateMatch[2]],
      Number(dateMatch[1]),
      hour,
      Number(match[2]),
    );
  };
  return { start: toDate(timeMatches[0]), end: toDate(timeMatches[1]) };
}

function toCalendarValue(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function getGoogleCalendarUrl(event) {
  const parsed = parseEventDateTime(event);
  if (!parsed) return null;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toCalendarValue(parsed.start)}/${toCalendarValue(parsed.end)}`,
    details: event.description,
    location: event.location === "أونلاين" ? "أونلاين" : "الجامعة الافتراضية السورية، دمشق، G76F+C28",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function initCalendarPage() {
  const grid = document.getElementById("calendarGrid");
  const monthLabel = document.getElementById("calendarMonth");
  if (!grid || !monthLabel) return;
  const today = new Date();
  let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthFormatter = new Intl.DateTimeFormat("ar-SY", {
    month: "long",
    year: "numeric",
  });
  const render = () => {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    monthLabel.textContent = monthFormatter.format(displayedMonth);
    const monthEvents = [];
    Object.entries(eventCatalog).forEach(([id, event]) => {
      const parsed = parseEventDateTime(event);
      if (parsed && parsed.start.getFullYear() === year && parsed.start.getMonth() === month) {
        monthEvents.push([id, event, parsed.start]);
      }
    });
    monthEvents.sort(([, , firstDate], [, , secondDate]) => firstDate - secondDate);
    grid.innerHTML = monthEvents.length
      ? monthEvents
          .map(
            ([id, event, date]) =>
              `<a href="event.html?id=${id}" class="calendar-agenda-item"><strong>${date.getDate()} ${new Intl.DateTimeFormat("ar-SY", { weekday: "long" }).format(date)}</strong><span>${event.title}</span><small>${event.time} · ${event.location}</small></a>`,
          )
          .join("")
      : '<p class="calendar-empty mb-0">لا توجد فعاليات في هذا الشهر.</p>';
  };
  document.getElementById("calendarPrev")?.addEventListener("click", () => {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
    render();
  });
  document.getElementById("calendarNext")?.addEventListener("click", () => {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
    render();
  });
  render();
}

function initEventsPage() {
  const search = document.getElementById("searchInput");
  const category = document.getElementById("categoryFilter");
  const date = document.getElementById("dateFilter");
  const location = document.getElementById("locationFilter");
  const filterButton = document.getElementById("filterBtn");
  if (!search || !category || !date || !location || !filterButton) return;

  const categoryFromUrl = new URLSearchParams(window.location.search).get(
    "cat",
  );
  if (
    categoryFromUrl &&
    [...category.options].some((option) => option.value === categoryFromUrl)
  ) {
    category.value = categoryFromUrl;
  }
  const newEvents = [
    "career",
    "arts",
    "wellbeing",
    "research",
    "languages",
    "volunteering",
  ];
  const container = document.getElementById("eventsContainer");
  newEvents.forEach((eventId) => {
    const item = eventCatalog[eventId];
    const locationType = item.location === "أونلاين" ? "online" : "campus";
    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-3 event-item";
    card.dataset.category = eventId;
    card.dataset.date = "later";
    card.dataset.location = locationType;
    card.innerHTML = `<article class="event-card"><div class="event-image"><img src="${item.image}" alt="${item.title}" loading="lazy"><span class="event-badge">${item.category}</span></div><div class="event-content"><h3 class="card-title">${item.title}</h3><p class="event-meta"><i class="fa-regular fa-calendar"></i> ${item.date}<i class="fa-regular fa-clock"></i> ${item.time}<i class="fa-solid fa-location-dot"></i> ${item.location}</p><p>${item.description}</p><a href="event.html?id=${eventId}" class="event-link">عرض التفاصيل <i class="fa-solid fa-arrow-left me-2"></i></a></div></article>`;
    container.appendChild(card);
  });

  let selectedRange = null;
  const rangeButtons = document.querySelectorAll("[data-range-filter]");
  const updateRangeButtons = () => {
    rangeButtons.forEach((button) => {
      const active = String(selectedRange) === button.dataset.rangeFilter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };
  const applyFilters = () => {
    setButtonLoading(filterButton, true, "تطبيق");
    window.setTimeout(() => {
      const term = search.value.trim().toLowerCase();
      const rangeStart = new Date();
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = selectedRange
        ? new Date(rangeStart.getTime() + Number(selectedRange) * 86400000)
        : null;
      let count = 0;
      document.querySelectorAll(".event-item").forEach((item) => {
        const eventId = item
          .querySelector('a[href*="event.html?id="]')
          ?.href.split("id=")[1];
        const eventDate = eventId ? parseEventDateTime(eventCatalog[eventId])?.start : null;
        const title = item
          .querySelector(".card-title")
          .textContent.toLowerCase();
        const description = item
          .querySelector(".event-content p:last-of-type")
          .textContent.toLowerCase();
        const eventLocation = item
          .querySelector(".event-meta")
          .textContent.toLowerCase();
        const visible =
          (!category.value || item.dataset.category === category.value) &&
          (!date.value || item.dataset.date === date.value) &&
          (!location.value || item.dataset.location === location.value) &&
          (!rangeEnd || (eventDate && eventDate >= rangeStart && eventDate <= rangeEnd)) &&
          (!document
            .getElementById("favoritesOnlyBtn")
            ?.classList.contains("active") ||
            getFavoriteIds().includes(
              item.querySelector('a[href*="event.html?id="]')?.href.split("id=")[1],
            )) &&
          (!term ||
            title.includes(term) ||
            description.includes(term) ||
            eventLocation.includes(term));
        item.classList.toggle("d-none", !visible);
        item.dataset.filteredOut = String(!visible);
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
    location.value = "";
    selectedRange = null;
    updateRangeButtons();
    applyFilters();
    showToast("تم مسح جميع الفلاتر.", "info");
  });
  filterButton.addEventListener("click", applyFilters);
  search.addEventListener("input", applyFilters);
  category.addEventListener("change", applyFilters);
  date.addEventListener("change", applyFilters);
  location.addEventListener("change", applyFilters);
  rangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedRange =
        selectedRange === Number(button.dataset.rangeFilter)
          ? null
          : Number(button.dataset.rangeFilter);
      updateRangeButtons();
      applyFilters();
    });
  });
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
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    const detailsLayout = document.getElementById("eventDetailsLayout");
    const landing = document.getElementById("eventLanding");
    const landingEvents = document.getElementById("landingEvents");
    if (detailsLayout && landing && landingEvents) {
      detailsLayout.classList.add("d-none");
      landing.classList.remove("d-none");
      const featuredIds = [
        "annual-conference",
        "book-exhibition",
        "career",
        "research",
      ];
      landingEvents.innerHTML = featuredIds
        .map((eventId) => {
          const item = eventCatalog[eventId];
          return `<div class="col-md-6 col-lg-3"><article class="landing-event-card"><img src="${item.image}" alt="${item.title}" loading="lazy"><div class="p-3"><span class="event-badge">${item.category}</span><h2 class="h5 fw-bold mt-3">${item.title}</h2><p class="event-meta mb-3"><i class="fa-regular fa-calendar"></i> ${item.date}<i class="fa-regular fa-clock"></i> ${item.time}</p><a class="event-link" href="event.html?id=${eventId}">عرض التفاصيل <i class="fa-solid fa-arrow-left me-2"></i></a></div></article></div>`;
        })
        .join("");
    }
    document.title = "اختيار الفعالية | دليل فعاليات SVU";
    return;
  }
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
    meta.innerHTML = `<i class="fa-regular fa-calendar"></i> ${event.date} <i class="fa-regular fa-clock"></i> ${event.time} <i class="fa-solid fa-location-dot"></i> ${event.location}`;
  const mapSection = document.getElementById("eventMapSection");
  const mapFrame = document.getElementById("eventMap");
  if (mapSection && mapFrame && event.location !== "أونلاين") {
    mapSection.classList.remove("d-none");
    mapFrame.src =
      "https://www.google.com/maps?q=G76F%2BC28%2C%20Damascus%2C%20Syria&output=embed";
  }
  const image = document.getElementById("eventImage");
  if (image) {
    image.src = event.image;
    image.alt = event.title;
  }
  document.getElementById("eventFeatures").innerHTML = event.features
    .map(
      ([icon, featureTitle, description]) =>
        `<div class="col-sm-4"><div class="feature-box interactive-feature" tabindex="0" role="button" aria-expanded="false"><i class="fa-solid ${icon}"></i><strong>${featureTitle}</strong><span>${description}</span></div></div>`,
    )
    .join("");
  document.querySelectorAll(".interactive-feature").forEach((feature) => {
    const toggleFeature = () => {
      const expanded = feature.classList.toggle("is-expanded");
      feature.setAttribute("aria-expanded", String(expanded));
    };
    feature.addEventListener("click", toggleFeature);
    feature.addEventListener("keydown", (keyboardEvent) => {
      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        toggleFeature();
      }
    });
  });
  const otherEvents = Object.entries(eventCatalog).filter(
    ([eventId, item]) => eventId !== id && item.category !== event.category,
  );
  const relatedEvents = Object.entries(eventCatalog).filter(
    ([eventId, item]) => eventId !== id && item.category === event.category,
  );
  const renderEventLinks = (items, limit = 3) =>
    items.length
      ? items
          .slice(0, limit)
          .map(
            ([eventId, item]) =>
              `<a class="related-link" href="event.html?id=${eventId}">${item.title}<small>${item.date} · ${item.time}</small></a>`,
          )
          .join("")
      : '<p class="text-muted small mb-0">لا توجد فعاليات أخرى من النوع نفسه حاليًا.</p>';
  setText("#relatedEventsTitle", `فعاليات مرتبطة · ${event.category}`);
  document.getElementById("relatedEvents").innerHTML =
    renderEventLinks(relatedEvents);
  document.getElementById("otherEvents").innerHTML =
    renderEventLinks(otherEvents);
  const setupMoreButton = (buttonId, containerId, items, label) => {
    const button = document.getElementById(buttonId);
    const container = document.getElementById(containerId);
    if (!button || !container || items.length <= 3) return;
    button.classList.remove("d-none");
    button.addEventListener("click", () => {
      container.innerHTML = renderEventLinks(items, items.length);
      button.classList.add("d-none");
    });
    button.setAttribute("aria-label", label);
  };
  setupMoreButton(
    "showMoreRelated",
    "relatedEvents",
    relatedEvents,
    "عرض جميع الفعاليات المرتبطة",
  );
  setupMoreButton(
    "showMoreOther",
    "otherEvents",
    otherEvents,
    "عرض جميع الفعاليات الأخرى",
  );

  const modalElement = document.getElementById("bookingModal");
  setText("#bookingEventTitle", event.title);
  setText("#bookingEventMeta", `${event.date} · ${event.location}`);
  if (hasGoogleBookingForm()) {
    setText(
      "#bookingDescription",
      "أدخل بياناتك مرة واحدة، وسيتم تسجيلها مباشرة دون مغادرة الموقع.",
    );
  }
  const bookingButton = document.querySelector(
    '[data-bs-target="#bookingModal"]',
  );
  const numericSeats = Number.parseInt(event.seats, 10);
  const bookingStorageKey = `svu-bookings-${id}`;
  const readBookings = () => {
    if (!Number.isFinite(numericSeats)) return 0;
    try {
      const saved = Number.parseInt(
        window.localStorage.getItem(bookingStorageKey) || "0",
        10,
      );
      return Number.isFinite(saved) && saved >= 0 ? saved : 0;
    } catch {
      return 0;
    }
  };
  const updateAvailability = () => {
    if (!Number.isFinite(numericSeats)) {
      document.getElementById("seatProgressWrap")?.classList.add("d-none");
      setText("#bookingAvailability", "الدخول مفتوح للجميع");
      return;
    }
    const remaining = Math.max(numericSeats - readBookings(), 0);
    const booked = numericSeats - remaining;
    const percentage = Math.round((booked / numericSeats) * 100);
    setText("#eventSeats", `${remaining} مقعدًا متبقيًا من أصل ${numericSeats}`);
    setText(
      "#bookingAvailability",
      remaining
        ? `متبقي ${remaining} مقعدًا`
        : "اكتملت المقاعد المتاحة لهذه الفعالية",
    );
    document
      .getElementById("bookingAvailability")
      ?.classList.toggle("text-danger", remaining === 0);
    document
      .getElementById("bookingAvailability")
      ?.classList.toggle("text-success", remaining > 0);
    const progressWrap = document.getElementById("seatProgressWrap");
    const progressBar = document.getElementById("seatProgressBar");
    const progress = progressWrap?.querySelector(".progress");
    if (progressWrap && progressBar && progress) {
      progressWrap.classList.remove("d-none");
      progressBar.style.width = `${percentage}%`;
      progressBar.classList.toggle("bg-danger", remaining === 0);
      progressBar.classList.toggle("bg-warning", remaining > 0 && percentage >= 75);
      progressBar.classList.toggle(
        "bg-primary",
        remaining > 0 && percentage < 75,
      );
      progress.setAttribute("aria-valuenow", String(percentage));
      setText("#seatProgressLabel", `${percentage}%`);
      setText(
        "#seatProgressHint",
        remaining === 0
          ? "اكتملت المقاعد"
          : `متبقي ${remaining} من أصل ${numericSeats} مقعدًا`,
      );
    }
    if (bookingButton) {
      bookingButton.disabled = remaining === 0;
      bookingButton.title =
        remaining === 0 ? "اكتملت المقاعد المتاحة" : "حجز مقعد";
    }
  };
  updateAvailability();
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
      const sentToGoogleForm = submitToGoogleForm(
        event,
        document.getElementById("bookingName").value.trim(),
        document.getElementById("bookingEmail").value.trim(),
      );
      if (sentToGoogleForm) {
        form.reset();
        form.classList.remove("was-validated");
        setButtonLoading(button, false, "تأكيد الحجز", "fa-ticket");
        bootstrap.Modal.getInstance(modalElement)?.hide();
        updateAvailability();
        showToast("تم تسجيل طلب الحجز بنجاح.");
        return;
      }
      if (Number.isFinite(numericSeats)) {
        const currentBookings = readBookings();
        if (currentBookings >= numericSeats) {
          setButtonLoading(button, false, "تأكيد الحجز", "fa-ticket");
          updateAvailability();
          showToast("عذرًا، اكتملت المقاعد المتاحة.", "danger");
          return;
        }
        try {
          window.localStorage.setItem(
            bookingStorageKey,
            String(currentBookings + 1),
          );
        } catch {
          // يبقى الحجز تجريبيًا حتى عند تعطيل التخزين المحلي.
        }
      }
      form.reset();
      form.classList.remove("was-validated");
      setButtonLoading(button, false, "تأكيد الحجز", "fa-ticket");
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
      updateAvailability();
      showToast("تم تأكيد حجزك التجريبي بنجاح.");
    }, 650);
  });
  document
    .querySelector("[data-calendar]")
    ?.addEventListener("click", () => {
      const calendarUrl = getGoogleCalendarUrl(event);
      if (!calendarUrl) {
        showToast("تعذر تجهيز موعد هذه الفعالية للتقويم.", "danger");
        return;
      }
      window.open(calendarUrl, "_blank", "noopener,noreferrer");
      showToast("تم فتح Google Calendar لإضافة الفعالية.", "info");
    });
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
