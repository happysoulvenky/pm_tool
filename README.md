
# Internal Product Management Tool for eCommerce

This repository contains the **design (ERD + Class Diagram)**, **database schema**, and a **working reference implementation** of an internal tool to manage an eCommerce product catalog with dynamic categories and attributes.

## Tech Stack

- **Backend**: Flask (Python), SQLAlchemy
- **Database**: SQLite by default (easily switchable to PostgreSQL/MySQL)
- **Migrations**: Simple `create_all()` for demo; can be extended with Alembic
- **API Docs**: Minimal examples below
- **Diagrams**: Mermaid (ERD + Class Diagram) in `docs/`

> This reference implementation focuses on correctness, clarity, and extensibility over UI polish. It exposes clean JSON APIs for internal use and can be paired with any admin UI (React/Next.js, Django Admin, Retool, etc.).

---

## 1) Diagrams

See `docs/` for Mermaid sources you can paste into any Mermaid renderer (including GitHub Markdown).

- `docs/erd.md` — Entity Relationship Diagram
- `docs/class_diagram.md` — Class Diagram (services/controllers/models)

---

## 2) Database Schema (DDL)

The DDL in `db/schema.sql` is generated from the ERD and mirrors the SQLAlchemy models. It uses an **EAV**-style design for category-specific attributes while keeping core product data normalized.

**Entities:**

- `categories`
- `attribute_definitions`
- `products`
- `product_attribute_values`

Key properties:
- Unique attribute names per category
- Type-safe attribute values (one value column non-null)
- Integrity constraints for product ↔ attribute pairs
- Room for enumerations (option lists) and validation

---

## 3) Running Locally

### Prerequisites
- Python 3.10+
- `pip`

### Setup

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export FLASK_APP=app.py
flask db-init   # creates SQLite db and seeds sample data
flask run
```

Server runs at `http://127.0.0.1:5000/`.

### Environment Variables

- `DATABASE_URL` (optional): e.g. `postgresql+psycopg2://user:pass@localhost:5432/pm_tool`

---

## 4) API Overview

### Categories
- `POST /categories` — create
- `GET /categories` — list
- `GET /categories/<id>` — detail
- `PUT /categories/<id>` — update
- `DELETE /categories/<id>` — delete

### Attributes (scoped by category)
- `POST /categories/<category_id>/attributes` — create attribute
- `GET /categories/<category_id>/attributes` — list attributes
- `PUT /categories/<category_id>/attributes/<attr_id>` — update
- `DELETE /categories/<category_id>/attributes/<attr_id>` — delete

### Products
- `POST /products` — create (with `category_id`)
- `GET /products` — list
- `GET /products/<id>` — detail (with expanded attributes)
- `PUT /products/<id>` — update core fields
- `POST /products/<id>/attributes` — set/update attribute values in bulk
- `DELETE /products/<id>` — delete

---

## 5) Example Requests

Create a category:
```bash
curl -X POST http://127.0.0.1:5000/categories -H "Content-Type: application/json" -d '{
  "name": "Smartphones",
  "description": "Handheld smart devices"
}'
```

Add attributes:
```bash
# OS (enum), RAM (int), Battery Size (int)
curl -X POST http://127.0.0.1:5000/categories/1/attributes -H "Content-Type: application/json" -d '{
  "name": "OS", "data_type": "enum", "is_required": true, "options": ["Android","iOS"]
}'
curl -X POST http://127.0.0.1:5000/categories/1/attributes -H "Content-Type: application/json" -d '{
  "name": "RAM_GB", "data_type": "int", "is_required": true
}'
curl -X POST http://127.0.0.1:5000/categories/1/attributes -H "Content-Type: application/json" -d '{
  "name": "Battery_mAh", "data_type": "int"
}'
```

Create a product:
```bash
curl -X POST http://127.0.0.1:5000/products -H "Content-Type: application/json" -d '{
  "name": "Pixel X",
  "sku": "PX-001",
  "category_id": 1,
  "price": 699.00,
  "currency": "USD"
}'
```

Set attribute values:
```bash
curl -X POST http://127.0.0.1:5000/products/1/attributes -H "Content-Type: application/json" -d '{
  "attributes": {
    "OS": "Android",
    "RAM_GB": 8,
    "Battery_mAh": 5000
  }
}'
```

Get product (with attributes):
```bash
curl http://127.0.0.1:5000/products/1
```

---

## 6) Notes on Design Decisions

- **Normalized core**: Products and categories are first-class, with a separate attribute definition set per category.
- **EAV for flexibility**: `product_attribute_values` allows category-specific fields without schema changes.
- **Type safety**: Only one value column is allowed per row; application layer enforces data type constraints.
- **Enumerations**: `attribute_definitions.options_json` supports fixed lists for enums.
- **Future-proofing**: Adding new categories/attributes is metadata-only and does not require migrations.

---

## 7) What to Submit

- Push this folder to your GitHub repo.
- Ensure `docs/erd.md`, `docs/class_diagram.md`, and `db/schema.sql` are present.
- Include a short note in your PR/README explaining any enhancements you make.


Justification for ERD Design

The database schema follows a normalized, flexible, and scalable design to support an internal product management tool.

Normalization: Data is split across four related tables (categories, attribute_definitions, products, and product_attribute_values) to eliminate redundancy and ensure data integrity. For example, attributes are not hard-coded in the product table but defined separately, avoiding schema changes when new attributes are added.

Flexibility: The attribute_definitions table allows each category to define custom attributes (e.g., color, size, warranty). These attributes are stored in product_attribute_values so different products can have different sets of attributes without altering the schema.

Scalability: The design supports future growth. New product categories or attributes can be added without restructuring the database. The use of constraints (unique keys, foreign keys, and check conditions) ensures consistency while allowing extensibility.

Relationships:

A category can have many products and many attribute definitions.

A product belongs to one category and has many attribute values.

An attribute definition belongs to one category and can be applied to many product attribute values.

This structure makes the system adaptable to a wide range of products and business requirements while keeping the schema clean and efficient.