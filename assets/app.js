(() => {
  "use strict";

  const people = Array.isArray(window.SHJARA_PEOPLE) ? window.SHJARA_PEOPLE : [];
  const peopleById = new Map(people.map((person) => [person.id, person]));

  const statusMeta = {
    readable: { label: "مقروء بوضوح", className: "readable" },
    review: { label: "يحتاج مراجعة", className: "review" },
    unclear: { label: "غير مقروء", className: "unclear" }
  };

  const elements = {
    searchInput: document.getElementById("searchInput"),
    clearSearch: document.getElementById("clearSearch"),
    searchMessage: document.getElementById("searchMessage"),
    peopleList: document.getElementById("peopleList"),
    visibleCount: document.getElementById("visibleCount"),
    lineageTree: document.getElementById("lineageTree"),
    resetFocus: document.getElementById("resetFocus"),
    personDialog: document.getElementById("personDialog"),
    personDetails: document.getElementById("personDetails"),
    peopleCount: document.getElementById("peopleCount"),
    readableCount: document.getElementById("readableCount"),
    reviewCount: document.getElementById("reviewCount"),
    unclearCount: document.getElementById("unclearCount")
  };

  let activePersonId = null;
  let filteredPeople = [...people];

  function normalizeArabic(value = "") {
    return String(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[إأآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getStatus(person) {
    return statusMeta[person.status] || statusMeta.review;
  }

  function getLineagePath(personId) {
    const path = [];
    const visited = new Set();
    let current = peopleById.get(personId);

    while (current && !visited.has(current.id)) {
      path.push(current);
      visited.add(current.id);
      current = current.lineageParentId ? peopleById.get(current.lineageParentId) : null;
    }

    return path.reverse();
  }

  function getChildren(personId) {
    return people.filter((person) => person.lineageParentId === personId);
  }

  function updateStats() {
    elements.peopleCount.textContent = String(people.length);
    elements.readableCount.textContent = String(people.filter((person) => person.status === "readable").length);
    elements.reviewCount.textContent = String(people.filter((person) => person.status === "review").length);
    elements.unclearCount.textContent = String(people.filter((person) => person.status === "unclear").length);
  }

  function renderPeopleList() {
    elements.peopleList.innerHTML = "";
    elements.visibleCount.textContent = String(filteredPeople.length);

    if (!filteredPeople.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "لا توجد أسماء مطابقة لعبارة البحث.";
      elements.peopleList.appendChild(empty);
      return;
    }

    filteredPeople.forEach((person) => {
      const status = getStatus(person);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `person-row${activePersonId === person.id ? " is-active" : ""}`;
      button.dataset.personId = String(person.id);
      button.innerHTML = `
        <span>
          <strong>${escapeHtml(person.name)}</strong>
          <small>${escapeHtml(person.title || `الجيل ${person.id}`)}</small>
        </span>
        <i class="status-dot status-${status.className}" title="${escapeHtml(status.label)}"></i>
      `;
      button.addEventListener("click", () => focusPerson(person.id, true));
      elements.peopleList.appendChild(button);
    });
  }

  function renderTree() {
    elements.lineageTree.innerHTML = "";

    const treePeople = filteredPeople.length ? filteredPeople : [];
    if (!treePeople.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = "لم يظهر أي اسم في المشجرة. امسح البحث لعرض السلسلة كاملة.";
      elements.lineageTree.appendChild(empty);
      return;
    }

    treePeople.forEach((person, index) => {
      const status = getStatus(person);
      const wrapper = document.createElement("div");
      wrapper.className = `lineage-node${activePersonId === person.id ? " is-focused" : ""}`;
      wrapper.dataset.personId = String(person.id);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "node-card";
      button.innerHTML = `
        <span class="node-index">${index + 1}</span>
        <span class="node-text">
          <strong>${escapeHtml(person.name)}</strong>
          <small>${escapeHtml(person.relation || "ضمن السلسلة")}${person.title ? ` · ${escapeHtml(person.title)}` : ""}</small>
        </span>
        <span class="status-label ${status.className}">${escapeHtml(status.label)}</span>
      `;
      button.addEventListener("click", () => focusPerson(person.id, true));
      wrapper.appendChild(button);
      elements.lineageTree.appendChild(wrapper);
    });
  }

  function renderDetails(person) {
    const parent = person.lineageParentId ? peopleById.get(person.lineageParentId) : null;
    const children = getChildren(person.id);
    const path = getLineagePath(person.id);
    const status = getStatus(person);
    const pathText = path.map((item) => item.name).join(" ← ");

    elements.personDetails.innerHTML = `
      <span class="status-label ${status.className}">${escapeHtml(status.label)}</span>
      <h2 class="person-title">${escapeHtml(person.name)}</h2>
      <p class="person-subtitle">${escapeHtml(person.title || "سجل أولي في السلسلة الوسطى")}</p>

      <div class="details-grid">
        <div class="detail-box">
          <span>السابق في السلسلة</span>
          <strong>${parent ? escapeHtml(parent.name) : "بداية المسار"}</strong>
        </div>
        <div class="detail-box">
          <span>التالي في البيانات الحالية</span>
          <strong>${children.length ? children.map((child) => escapeHtml(child.name)).join("، ") : "لم يُدخل بعد"}</strong>
        </div>
        <div class="detail-box">
          <span>مصدر القراءة</span>
          <strong>${escapeHtml(person.source || "غير محدد")}</strong>
        </div>
        <div class="detail-box">
          <span>رقم السجل</span>
          <strong>${person.id}</strong>
        </div>
      </div>

      <div class="path-box">
        <h3>مسار النسب المعروض</h3>
        <p class="path-text">${escapeHtml(pathText)}</p>
        <button class="copy-button" id="copyPathButton" type="button">نسخ المسار</button>
      </div>

      <p><strong>ملاحظة المراجعة:</strong> ${escapeHtml(person.notes || "لا توجد ملاحظة.")}</p>
    `;

    const copyButton = document.getElementById("copyPathButton");
    copyButton?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pathText);
        copyButton.textContent = "تم النسخ";
      } catch (error) {
        copyButton.textContent = "تعذر النسخ";
      }
      window.setTimeout(() => {
        copyButton.textContent = "نسخ المسار";
      }, 1800);
    });
  }

  function openPersonDialog(person) {
    renderDetails(person);
    if (typeof elements.personDialog.showModal === "function") {
      elements.personDialog.showModal();
    } else {
      elements.personDialog.setAttribute("open", "open");
    }
  }

  function focusPerson(personId, openDialog = false) {
    const person = peopleById.get(personId);
    if (!person) return;

    activePersonId = personId;
    renderPeopleList();
    renderTree();

    const node = elements.lineageTree.querySelector(`[data-person-id="${personId}"]`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });

    if (openDialog) {
      openPersonDialog(person);
    }
  }

  function applySearch() {
    const rawQuery = elements.searchInput.value;
    const query = normalizeArabic(rawQuery);

    if (!query) {
      filteredPeople = [...people];
      elements.searchMessage.textContent = "";
    } else {
      filteredPeople = people.filter((person) => {
        const searchable = normalizeArabic([
          person.name,
          person.title,
          person.relation,
          person.notes
        ].filter(Boolean).join(" "));
        return searchable.includes(query);
      });

      elements.searchMessage.textContent = filteredPeople.length
        ? `تم العثور على ${filteredPeople.length} اسمًا.`
        : "لم يتم العثور على اسم مطابق.";
    }

    activePersonId = filteredPeople.length === 1 ? filteredPeople[0].id : null;
    renderPeopleList();
    renderTree();
  }

  elements.searchInput.addEventListener("input", applySearch);

  elements.clearSearch.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.searchInput.focus();
    applySearch();
  });

  elements.resetFocus.addEventListener("click", () => {
    elements.searchInput.value = "";
    activePersonId = null;
    filteredPeople = [...people];
    elements.searchMessage.textContent = "";
    renderPeopleList();
    renderTree();
  });

  elements.personDialog.addEventListener("click", (event) => {
    if (event.target === elements.personDialog) {
      elements.personDialog.close();
    }
  });

  updateStats();
  renderPeopleList();
  renderTree();
})();
