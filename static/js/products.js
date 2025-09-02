document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("productForm");
  const listContainer = document.getElementById("productList");
  const catSelect = document.getElementById("prodCatId");

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

  // Fetch and populate categories for filter
  async function loadFilterCategories() {
    const filterSelect = document.getElementById("filterCategory");
    const res = await fetch("/api/categories");
    const cats = await res.json();
    filterSelect.innerHTML = '<option value="">All Categories</option>';
    cats.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      filterSelect.appendChild(opt);
    });
  }
  loadFilterCategories();

  // Create Product
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("prodName").value.trim();
    const sku = document.getElementById("prodSku").value.trim();
    const category_id = parseInt(catSelect.value);
    const description = document.getElementById("prodDesc").value.trim();
    const price = parseFloat(document.getElementById("prodPrice").value) || null;
    const currency = document.getElementById("prodCurrency").value.trim();

    const payload = { name, sku, category_id, description, price, currency };

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      form.reset();
      loadProducts();
    } else {
      const err = await res.json();
      alert("Error: " + err.message);
    }
  });

  // Load Products with optional category filter
  async function loadProducts() {
    listContainer.innerHTML = "";
    const filterVal = document.getElementById("filterCategory").value;
    let url = "/api/products";
    if (filterVal) {
      url += `?category_id=${filterVal}`;
    }
    const res = await fetch(url);
    const prods = await res.json();

    prods.forEach((p) => {
      const li = document.createElement("li");
      li.innerHTML = `${p.name} (${p.sku}) - ${p.price || ""} ${p.currency || ""}`;
      // Add button to set attributes
      const attrBtn = document.createElement("button");
      attrBtn.textContent = "Set Attributes";
      attrBtn.style.marginLeft = "1em";
      attrBtn.addEventListener("click", () => showProductAttributes(p));
      li.appendChild(attrBtn);

      // Fetch and display attributes for this product
      const attrDiv = document.createElement("div");
      attrDiv.className = "product-attributes";
      attrDiv.style.marginLeft = "2em";
      fetch(`/api/products/${p.id}`)
        .then(r => r.json())
        .then(prodDetail => {
          if (prodDetail.attributes && Object.keys(prodDetail.attributes).length > 0) {
            let html = '<ul>';
            for (const [k, v] of Object.entries(prodDetail.attributes)) {
              html += `<li><b>${k}</b>: ${v}</li>`;
            }
            html += '</ul>';
            attrDiv.innerHTML = html;
          } else {
            attrDiv.innerHTML = '<i>No attributes set</i>';
          }
        });
      li.appendChild(attrDiv);

      listContainer.appendChild(li);
    });
  }

  // Reload products when filter changes
  document.getElementById("filterCategory").addEventListener("change", loadProducts);

  // Show product attribute fields for selected product
  async function showProductAttributes(product) {
    const attrSection = document.getElementById("attributeSection");
    const attrForm = document.getElementById("productAttrForm");
    const attrFields = document.getElementById("productAttrFields");
    attrForm.style.display = "block";
    attrFields.innerHTML = "<b>Loading attributes...</b>";
    attrForm.setAttribute("data-product-id", product.id);

    // Fetch attributes for the product's category
    const [attrRes, prodRes] = await Promise.all([
      fetch(`/api/categories/${product.category_id}/attributes`),
      fetch(`/api/products/${product.id}`)
    ]);
    const attrs = await attrRes.json();
    const prodDetail = await prodRes.json();
    const existing = prodDetail.attributes || {};
    attrFields.innerHTML = "";
    attrs.forEach(attr => {
      const field = document.createElement("div");
      field.style.marginBottom = "0.5em";
      const val = existing[attr.name] !== undefined ? existing[attr.name] : "";
      field.innerHTML = `<label>${attr.name} (${attr.data_type}): <input name="${attr.name}" value="${val}" /></label>`;
      attrFields.appendChild(field);
    });
  }

  // Handle attribute form submit
  document.getElementById("productAttrForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const productId = form.getAttribute("data-product-id");
    const inputs = form.querySelectorAll("input");
    const attributes = {};
    inputs.forEach(input => {
      attributes[input.name] = input.value;
    });
    const res = await fetch(`/api/products/${productId}/attributes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attributes })
    });
    if (res.ok) {
      alert("Attributes saved!");
      form.reset();
      form.style.display = "none";
    } else {
      const err = await res.json();
      alert("Error: " + err.message);
    }
  });

  loadProducts();
});
