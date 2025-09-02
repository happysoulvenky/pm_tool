// static/js/app.js
// A small SPA to manage categories, attributes and products via your Flask API.
//
// Assumptions: API routes are at same origin: /categories, /products
// If you serve frontend separately, enable CORS server-side.

const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

// Helper for fetch with JSON
async function api(method, path, body = null) {
  const opts = { method, headers: {} };
  if (body !== null) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  if (res.status === 204) return null;
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error('Invalid JSON response');
  }
}

/* ========== UI: Tabs ========== */
const tabCategoriesBtn = qs('#tab-categories');
const tabProductsBtn = qs('#tab-products');
const pageCategories = qs('#page-categories');
const pageProducts = qs('#page-products');

function showTab(tab) {
  tabCategoriesBtn.classList.remove('active');
  tabProductsBtn.classList.remove('active');
  pageCategories.classList.remove('visible');
  pageProducts.classList.remove('visible');

  if (tab === 'categories') {
    tabCategoriesBtn.classList.add('active');
    pageCategories.classList.add('visible');
  } else {
    tabProductsBtn.classList.add('active');
    pageProducts.classList.add('visible');
  }
}

tabCategoriesBtn.addEventListener('click', () => showTab('categories'));
tabProductsBtn.addEventListener('click', () => showTab('products'));

/* ========== Categories ========== */
const categoriesListEl = qs('#categories-list');
const categoryForm = qs('#category-form');
const categoryIdInput = qs('#category-id');
const categoryNameInput = qs('#category-name');
const categoryDescInput = qs('#category-desc');
const categorySaveBtn = qs('#category-save');
const categoryCancelBtn = qs('#category-cancel');

async function loadCategories() {
  try {
    const cats = await api('GET', '/categories');
    renderCategories(cats || []);
    populateProductCategorySelect(cats || []);
  } catch (err) {
    console.error(err);
    categoriesListEl.innerHTML = `<div class="item">Failed to load categories</div>`;
  }
}

function renderCategories(cats) {
  if (!cats.length) {
    categoriesListEl.innerHTML = `<div class="item"><div class="meta"><strong>No categories yet</strong></div></div>`;
    return;
  }
  categoriesListEl.innerHTML = '';
  cats.forEach(cat => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <div class="meta">
        <div>
          <strong>${escapeHtml(cat.name || 'Untitled')}</strong>
          <div class="muted">${escapeHtml(cat.description || '')}</div>
        </div>
      </div>
      <div class="actions">
        <button class="view">Attributes</button>
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </div>
    `;
    const viewBtn = el.querySelector('.view');
    const editBtn = el.querySelector('.edit');
    const delBtn = el.querySelector('.delete');

    viewBtn.addEventListener('click', () => selectCategory(cat));
    editBtn.addEventListener('click', () => startEditCategory(cat));
    delBtn.addEventListener('click', async () => {
      if (!confirm(`Delete category "${cat.name}"?`)) return;
      try {
        await api('DELETE', `/categories/${cat.id}`);
        await loadCategories();
        clearSelectedCategory();
      } catch (err) {
        alert('Delete failed');
        console.error(err);
      }
    });

    categoriesListEl.appendChild(el);
  });
}

function startEditCategory(cat) {
  categoryIdInput.value = cat.id;
  categoryNameInput.value = cat.name || '';
  categoryDescInput.value = cat.description || '';
  categorySaveBtn.textContent = 'Update';
  categoryCancelBtn.classList.remove('hidden');
}

categoryCancelBtn.addEventListener('click', (e) => {
  e.preventDefault();
  resetCategoryForm();
});

categoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = categoryIdInput.value;
  const payload = {
    name: categoryNameInput.value.trim(),
    description: categoryDescInput.value.trim()
  };
  try {
    if (id) {
      await api('PUT', `/categories/${id}`, payload);
    } else {
      await api('POST', '/categories', payload);
    }
    resetCategoryForm();
    await loadCategories();
  } catch (err) {
    alert('Save failed');
    console.error(err);
  }
});

function resetCategoryForm() {
  categoryIdInput.value = '';
  categoryNameInput.value = '';
  categoryDescInput.value = '';
  categorySaveBtn.textContent = 'Create';
  categoryCancelBtn.classList.add('hidden');
}

/* ========== Selected Category & Attributes ========== */
const selectedCategoryTitle = qs('#selected-category-title');
const attributesListEl = qs('#attributes-list');
const attributeForm = qs('#attribute-form');
const attrCidInput = qs('#attr-cid');
const attrIdInput = qs('#attr-id');
const attrNameInput = qs('#attr-name');
const attrValuesInput = qs('#attr-values');
const attrSaveBtn = qs('#attr-save');
const attrCancelBtn = qs('#attr-cancel');

let selectedCategory = null;
function selectCategory(cat) {
  selectedCategory = cat;
  attrCidInput.value = cat.id;
  selectedCategoryTitle.textContent = `Category: ${cat.name}`;
  resetAttributeForm();
  loadAttributes(cat.id);
}

function clearSelectedCategory() {
  selectedCategory = null;
  attrCidInput.value = '';
  selectedCategoryTitle.textContent = 'No category selected';
  attributesListEl.innerHTML = '';
}

async function loadAttributes(cid) {
  try {
    const attrs = await api('GET', `/categories/${cid}/attributes`);
    renderAttributes(attrs || []);
  } catch (err) {
    console.error(err);
    attributesListEl.innerHTML = `<div class="item">Failed to load attributes</div>`;
  }
}

function renderAttributes(attrs) {
  attributesListEl.innerHTML = '';
  if (!attrs || !attrs.length) {
    attributesListEl.innerHTML = `<div class="item"><div class="meta"><strong>No attributes</strong></div></div>`;
    return;
  }
  attrs.forEach(a => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <div class="meta">
        <div>
          <strong>${escapeHtml(a.name || 'Attribute')}</strong>
          <div class="muted">${Array.isArray(a.values) ? escapeHtml(a.values.join(', ')) : (a.values || '')}</div>
        </div>
      </div>
      <div class="actions">
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </div>
    `;
    el.querySelector('.edit').addEventListener('click', () => {
      attrIdInput.value = a.id;
      attrNameInput.value = a.name || '';
      attrValuesInput.value = Array.isArray(a.values) ? a.values.join(', ') : (a.values || '');
      attrSaveBtn.textContent = 'Update';
      attrCancelBtn.classList.remove('hidden');
    });
    el.querySelector('.delete').addEventListener('click', async () => {
      if (!confirm(`Delete attribute "${a.name}"?`)) return;
      try {
        await api('DELETE', `/categories/${selectedCategory.id}/attributes/${a.id}`);
        await loadAttributes(selectedCategory.id);
      } catch (err) {
        alert('Failed to delete attribute');
        console.error(err);
      }
    });
    attributesListEl.appendChild(el);
  });
}

attributeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cid = attrCidInput.value || (selectedCategory && selectedCategory.id);
  if (!cid) { alert('Select a category first'); return; }
  const aid = attrIdInput.value;
  const payload = {
    name: attrNameInput.value.trim(),
    values: attrValuesInput.value.split(',').map(s => s.trim()).filter(Boolean)
  };
  try {
    if (aid) {
      await api('PUT', `/categories/${cid}/attributes/${aid}`, payload);
    } else {
      await api('POST', `/categories/${cid}/attributes`, payload);
    }
    resetAttributeForm();
    await loadAttributes(cid);
  } catch (err) {
    alert('Save failed');
    console.error(err);
  }
});

attrCancelBtn.addEventListener('click', (e) => {
  e.preventDefault();
  resetAttributeForm();
});

function resetAttributeForm() {
  attrIdInput.value = '';
  attrNameInput.value = '';
  attrValuesInput.value = '';
  attrSaveBtn.textContent = 'Add Attribute';
  attrCancelBtn.classList.add('hidden');
}

/* ========== Products ========== */
const productsListEl = qs('#products-list');
const productForm = qs('#product-form');
const productIdInput = qs('#product-id');
const productNameInput = qs('#product-name');
const productCategorySelect = qs('#product-category');
const productPriceInput = qs('#product-price');
const productDescInput = qs('#product-desc');
const productSaveBtn = qs('#product-save');
const productCancelBtn = qs('#product-cancel');

async function loadProducts() {
  try {
    const products = await api('GET', '/products');
    renderProducts(products || []);
  } catch (err) {
    console.error(err);
    productsListEl.innerHTML = `<div class="item">Failed to load products</div>`;
  }
}

function renderProducts(products) {
  productsListEl.innerHTML = '';
  if (!products.length) {
    productsListEl.innerHTML = `<div class="item"><div class="meta"><strong>No products</strong></div></div>`;
    return;
  }
  products.forEach(p => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <div class="meta">
        <div>
          <strong>${escapeHtml(p.name || 'Untitled')}</strong>
          <div class="muted">Category: ${escapeHtml(p.category_name || p.category || '')} — ${escapeHtml(p.description || '')}</div>
        </div>
      </div>
      <div class="actions">
        <button class="view">Attributes</button>
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </div>
    `;
    el.querySelector('.edit').addEventListener('click', () => startEditProduct(p));
    el.querySelector('.delete').addEventListener('click', async () => {
      if (!confirm(`Delete product "${p.name}"?`)) return;
      try {
        await api('DELETE', `/products/${p.id}`);
        await loadProducts();
        clearProductAttributesArea();
      } catch (err) {
        alert('Delete failed'); console.error(err);
      }
    });
    el.querySelector('.view').addEventListener('click', () => showProductAttributesUI(p));
    productsListEl.appendChild(el);
  });
}

function startEditProduct(p) {
  productIdInput.value = p.id;
  productNameInput.value = p.name || '';
  productPriceInput.value = p.price || '';
  productDescInput.value = p.description || '';
  if (p.category) {
    productCategorySelect.value = p.category;
  } else if (p.category_id) {
    productCategorySelect.value = p.category_id;
  }
  productSaveBtn.textContent = 'Update';
  productCancelBtn.classList.remove('hidden');
}

productCancelBtn.addEventListener('click', (e) => {
  e.preventDefault();
  resetProductForm();
});

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = productIdInput.value;
  const payload = {
    name: productNameInput.value.trim(),
    description: productDescInput.value.trim(),
    price: productPriceInput.value.trim(),
    category: productCategorySelect.value || null,
    category_id: productCategorySelect.value || null
  };
  try {
    if (id) {
      await api('PUT', `/products/${id}`, payload);
    } else {
      await api('POST', '/products', payload);
    }
    resetProductForm();
    await loadProducts();
  } catch (err) {
    alert('Save failed');
    console.error(err);
  }
});

function resetProductForm() {
  productIdInput.value = '';
  productNameInput.value = '';
  productPriceInput.value = '';
  productDescInput.value = '';
  productSaveBtn.textContent = 'Create Product';
  productCancelBtn.classList.add('hidden');
}

/* ========== Product Attributes UI ========== */
const selectedProductTitle = qs('#selected-product-title');
const productAttributesRows = qs('#product-attributes-rows');
const productAttributesSaveBtn = qs('#product-attributes-save');

let currentProduct = null;

async function showProductAttributesUI(product) {
  // Load product detail
  try {
    const p = await api('GET', `/products/${product.id}`);
    currentProduct = p;
    selectedProductTitle.textContent = `Product: ${p.name || ''}`;
    // Determine category id
    const cid = p.category || p.category_id || (p.category && p.category.id) || null;
    if (!cid) {
      productAttributesRows.innerHTML = `<div class="item">Product has no category. Assign a category first.</div>`;
      return;
    }
    // Fetch attributes for category
    const attrs = await api('GET', `/categories/${cid}/attributes`);
    // The product object may already contain attributes; try to use them if available
    const existingAttrs = p.attributes || p.attr || {};
    buildAttributesForm(attrs || [], existingAttrs || {});
  } catch (err) {
    console.error(err);
    productAttributesRows.innerHTML = `<div class="item">Failed to load product attributes</div>`;
  }
}

function buildAttributesForm(attrs, existing) {
  productAttributesRows.innerHTML = '';
  if (!attrs.length) {
    productAttributesRows.innerHTML = `<div class="item"><div class="meta"><strong>No attributes for this category</strong></div></div>`;
    return;
  }
  attrs.forEach(a => {
    const row = document.createElement('div');
    row.className = 'item';
    const attrVal = (existing && existing[a.name]) ? existing[a.name] : '';
    const valuesPlaceholder = Array.isArray(a.values) && a.values.length ? `(${a.values.join(', ')})` : '';

    row.innerHTML = `
      <div class="meta" style="width:100%;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${escapeHtml(a.name)}</strong>
            <div class="muted">${escapeHtml(valuesPlaceholder)}</div>
          </div>
          <div style="min-width:40%;">
            <input data-attr-name="${escapeHtml(a.name)}" class="attr-input" placeholder="Value" value="${escapeHtml(attrVal)}"/>
          </div>
        </div>
      </div>
    `;
    productAttributesRows.appendChild(row);
  });
}

productAttributesSaveBtn.addEventListener('click', async () => {
  if (!currentProduct) { alert('Select a product first'); return; }
  const inputs = Array.from(productAttributesRows.querySelectorAll('.attr-input'));
  const attrs = {};
  inputs.forEach(i => {
    const k = i.dataset.attrName;
    attrs[k] = i.value;
  });
  try {
    const res = await api('POST', `/products/${currentProduct.id}/attributes`, { attributes: attrs });
    alert('Attributes saved');
    // reload products and product details
    await loadProducts();
  } catch (err) {
    alert('Failed to save attributes');
    console.error(err);
  }
});

function clearProductAttributesArea() {
  currentProduct = null;
  selectedProductTitle.textContent = 'No product selected';
  productAttributesRows.innerHTML = '';
}

/* ========== Utilities ========== */
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* Populate category dropdown for product creation */
function populateProductCategorySelect(cats) {
  productCategorySelect.innerHTML = '';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Choose category';
  productCategorySelect.appendChild(defaultOpt);

  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    productCategorySelect.appendChild(opt);
  });
}

/* Initial load */
async function init() {
  showTab('categories');
  await loadCategories();
  await loadProducts();
}

init();
