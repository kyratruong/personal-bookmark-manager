(() => {
  "use strict";

  const STORAGE_KEY = "personal-bookmarks";
  const CATEGORIES = ["Articles", "Recipes", "Funny Videos"];
  let bookmarks = loadBookmarks();
  let editingId = null;

  const allView = document.querySelector("#all-view");
  const addView = document.querySelector("#add-view");
  const bookmarkList = document.querySelector("#bookmark-list");
  const bookmarkForm = document.querySelector("#bookmark-form");

  function loadBookmarks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.filter((bookmark) =>
        bookmark &&
        typeof bookmark.title === "string" &&
        typeof bookmark.url === "string" &&
        CATEGORIES.includes(bookmark.category)
      ).map((bookmark) => ({
        id: typeof bookmark.id === "string" ? bookmark.id : createId(),
        title: bookmark.title,
        url: bookmark.url,
        category: bookmark.category
      }));
    } catch (error) {
      console.error("Could not restore bookmarks from localStorage.", error);
      return [];
    }
  }

  function saveBookmarks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.error("Could not save bookmarks to localStorage.", error);
    }
  }

  function createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function showView() {
    const route = window.location.hash === "#add" ? "add" : "all";
    allView.hidden = route !== "all";
    addView.hidden = route !== "add";
    document.querySelectorAll("[data-route]").forEach((link) => {
      const active = link.dataset.route === route;
      link.classList.toggle("active", active);
      link.setAttribute("aria-current", active ? "page" : "false");
    });
    if (route === "all") renderBookmarks();
    window.scrollTo(0, 0);
  }

  function renderBookmarks() {
    bookmarkList.replaceChildren();
    if (bookmarks.length === 0) {
      bookmarkList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon" aria-hidden="true">☆</div>
          <h2>No bookmarks yet</h2>
          <p>Your saved links will appear here.</p>
          <a class="primary-button" href="#add">Add your first bookmark</a>
        </div>`;
      return;
    }

    const grouped = CATEGORIES.map((category) => ({
      category,
      items: bookmarks.filter((bookmark) => bookmark.category === category)
    })).filter((group) => group.items.length);

    grouped.forEach((group) => {
      const section = document.createElement("section");
      section.className = "category-section";
      const heading = document.createElement("h2");
      heading.className = "category-heading";
      heading.textContent = group.category;
      section.appendChild(heading);
      const cards = document.createElement("div");
      cards.className = "cards";
      group.items.forEach((bookmark) => cards.appendChild(createBookmarkCard(bookmark)));
      section.appendChild(cards);
      bookmarkList.appendChild(section);
    });
  }

  function createBookmarkCard(bookmark) {
    const card = document.createElement("article");
    card.className = "bookmark-card";
    if (bookmark.id === editingId) {
      card.appendChild(createEditForm(bookmark));
      return card;
    }

    const initial = document.createElement("div");
    initial.className = "bookmark-initial";
    initial.textContent = bookmark.title.charAt(0).toUpperCase();
    const content = document.createElement("div");
    content.className = "bookmark-content";
    const title = document.createElement("h3");
    title.textContent = bookmark.title;
    const link = document.createElement("a");
    link.href = bookmark.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = bookmark.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    content.append(title, link);
    const actions = document.createElement("div");
    actions.className = "card-actions";
    const editButton = document.createElement("button");
    editButton.className = "text-button";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      editingId = bookmark.id;
      renderBookmarks();
    });
    const deleteButton = document.createElement("button");
    deleteButton.className = "text-button danger";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      bookmarks = bookmarks.filter((item) => item.id !== bookmark.id);
      saveBookmarks();
      renderBookmarks();
    });
    actions.append(editButton, deleteButton);
    card.append(initial, content, actions);
    return card;
  }

  function createEditForm(bookmark) {
    const form = document.createElement("form");
    form.className = "inline-edit-form";
    form.innerHTML = `
      <h3>Edit bookmark</h3>
      <div class="edit-fields">
        <input name="title" type="text" value="${escapeAttribute(bookmark.title)}" maxlength="120" required aria-label="Bookmark title">
        <input name="url" type="url" value="${escapeAttribute(bookmark.url)}" required aria-label="Bookmark URL">
        <select name="category" aria-label="Bookmark category">${CATEGORIES.map((category) =>
          `<option value="${category}" ${category === bookmark.category ? "selected" : ""}>${category}</option>`).join("")}</select>
      </div>
      <div class="card-actions">
        <button type="submit" class="small-primary">Save changes</button>
        <button type="button" class="text-button" data-cancel>Cancel</button>
      </div>`;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const updated = bookmarks.find((item) => item.id === bookmark.id);
      if (!updated) return;
      updated.title = data.get("title").trim();
      updated.url = data.get("url").trim();
      updated.category = data.get("category");
      editingId = null;
      saveBookmarks();
      renderBookmarks();
    });
    form.querySelector("[data-cancel]").addEventListener("click", () => {
      editingId = null;
      renderBookmarks();
    });
    return form;
  }

  function escapeAttribute(value) {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  bookmarkForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(bookmarkForm);
    bookmarks.push({
      id: createId(),
      title: data.get("title").trim(),
      url: data.get("url").trim(),
      category: data.get("category")
    });
    saveBookmarks();
    bookmarkForm.reset();
    window.location.hash = "#all";
  });

  window.addEventListener("hashchange", showView);
  if (!window.location.hash) window.location.hash = "#all";
  showView();
})();