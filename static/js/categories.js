document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("categoryForm");
  const listContainer = document.getElementById("categoryList");

  // Create Category
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("catName").value.trim();
    const description = document.getElementById("catDesc").value.trim();

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description })
    });

    if (res.ok) {
      form.reset();
      loadCategories();
    } else {
      const err = await res.json();
      alert("Error: " + err.message);
    }
  });

  // Load Categories
  async function loadCategories() {
    listContainer.innerHTML = "";
    const res = await fetch("/api/categories");
    const cats = await res.json();

    cats.forEach((c) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span><strong>${c.name}</strong> - ${c.description || ""}</span>
        <button class="editBtn">Edit</button>
        <button class="deleteBtn">Delete</button>
      `;

      // Edit button
      li.querySelector(".editBtn").addEventListener("click", () => {
        document.getElementById("catName").value = c.name;
        document.getElementById("catDesc").value = c.description || "";
        form.setAttribute("data-edit-id", c.id);
        form.querySelector("button[type='submit']").textContent = "Update";
      });

      // Delete button
      li.querySelector(".deleteBtn").addEventListener("click", async () => {
        if (confirm(`Delete category '${c.name}'?`)) {
          await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
          loadCategories();
          form.reset();
          form.removeAttribute("data-edit-id");
          form.querySelector("button[type='submit']").textContent = "Create";
        }
      });

      listContainer.appendChild(li);
    });
  }

  // Handle edit mode in form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("catName").value.trim();
    const description = document.getElementById("catDesc").value.trim();
    const editId = form.getAttribute("data-edit-id");

    if (editId) {
      // Update category
      const res = await fetch(`/api/categories/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        form.reset();
        form.removeAttribute("data-edit-id");
        form.querySelector("button[type='submit']").textContent = "Create";
        loadCategories();
      } else {
        const err = await res.json();
        alert("Error: " + err.message);
      }
    } else {
      // Create category
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        form.reset();
        loadCategories();
      } else {
        const err = await res.json();
        alert("Error: " + err.message);
      }
    }
  });

  loadCategories();
});
