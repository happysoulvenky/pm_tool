document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("attributeForm");
  const listContainer = document.getElementById("attributeList");
  const catSelect = document.getElementById("catSelect");

  // Fetch and populate categories
  async function loadCategories() {
    const res = await fetch("/api/categories");
    const cats = await res.json();
    catSelect.innerHTML = '<option value="">Select Category</option>';
    cats.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      catSelect.appendChild(opt);
    });
  }

  loadCategories();

  // Load Attributes for a Category
  async function loadAttributes(categoryId) {
    listContainer.innerHTML = "";
    if (!categoryId) return;
    const res = await fetch(`/api/categories/${categoryId}/attributes`);
    const attrs = await res.json();

    attrs.forEach((a) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span><strong>${a.name}</strong> (${a.data_type})</span>
        <button class="editBtn">Edit</button>
        <button class="deleteBtn">Delete</button>
      `;

      // Edit button
      li.querySelector(".editBtn").addEventListener("click", () => {
        document.getElementById("attrName").value = a.name;
        document.getElementById("dataType").value = a.data_type;
        document.getElementById("isRequired").checked = !!a.is_required;
        document.getElementById("isUnique").checked = !!a.is_unique;
        document.getElementById("unit").value = a.unit || "";
        document.getElementById("options").value = (a.data_type === "enum" && a.options_json) ? JSON.parse(a.options_json).join(", ") : "";
        form.setAttribute("data-edit-id", a.id);
        form.querySelector("button[type='submit']").textContent = "Update";
      });

      // Delete button
      li.querySelector(".deleteBtn").addEventListener("click", async () => {
        if (confirm(`Delete attribute '${a.name}'?`)) {
          await fetch(`/api/categories/${categoryId}/attributes/${a.id}`, { method: "DELETE" });
          loadAttributes(categoryId);
          form.reset();
          form.removeAttribute("data-edit-id");
          form.querySelector("button[type='submit']").textContent = "Create";
        }
      });

      listContainer.appendChild(li);
    });
  }

  // Create or Update Attribute
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const categoryId = catSelect.value;
    const name = document.getElementById("attrName").value.trim();
    const data_type = document.getElementById("dataType").value;
    const is_required = document.getElementById("isRequired").checked;
    const is_unique = document.getElementById("isUnique").checked;
    const unit = document.getElementById("unit").value.trim();
    const optionsStr = document.getElementById("options").value.trim();
    const editId = form.getAttribute("data-edit-id");

    const payload = { name, data_type, is_required, is_unique, unit };
    if (data_type === "enum" && optionsStr) {
      payload.options = optionsStr.split(",").map((o) => o.trim());
    }

    let res;
    if (editId) {
      // Update attribute
      res = await fetch(`/api/categories/${categoryId}/attributes/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      // Create attribute
      res = await fetch(`/api/categories/${categoryId}/attributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      form.reset();
      form.removeAttribute("data-edit-id");
      form.querySelector("button[type='submit']").textContent = "Create";
      loadAttributes(categoryId);
    } else {
      const err = await res.json();
      alert("Error: " + err.message);
    }
  });

  // Auto-load when category changes
  catSelect.addEventListener("change", (e) => {
    loadAttributes(e.target.value);
  });
});
