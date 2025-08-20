
from flask import abort
from database import db
from models import Category, Product, AttributeDefinition, ProductAttributeValue
from utils import to_dict, normalize_value_by_type

class ProductService:
    @staticmethod
    def create(data):
        name = (data.get('name') or '').strip()
        sku = (data.get('sku') or '').strip()
        category_id = data.get('category_id')
        if not name or not sku or not category_id:
            abort(400, 'name, sku, category_id are required')
        Category.query.get_or_404(category_id)
        prod = Product(
            name=name,
            sku=sku,
            category_id=category_id,
            description=data.get('description'),
            price=data.get('price'),
            currency=data.get('currency')
        )
        db.session.add(prod)
        db.session.commit()
        return to_dict(prod)

    @staticmethod
    def list():
        prods = Product.query.order_by(Product.created_at.desc()).all()
        return [to_dict(p) for p in prods]

    @staticmethod
    def get(pid):
        prod = Product.query.get_or_404(pid)
        data = to_dict(prod)
        # expand attributes
        attrs = ProductAttributeValue.query.filter_by(product_id=pid).all()
        resolved = {}
        for pav in attrs:
            resolved[pav.attribute.name] = pav.best_value()
        data['attributes'] = resolved
        return data

    @staticmethod
    def update(pid, data):
        prod = Product.query.get_or_404(pid)
        for field in ['name','sku','description','price','currency']:
            if field in data:
                setattr(prod, field, data.get(field))
        db.session.commit()
        return to_dict(prod)

    @staticmethod
    def set_attributes(product_id, values_map):
        prod = Product.query.get_or_404(product_id)
        # Ensure attributes belong to the product's category
        attr_defs = AttributeDefinition.query.filter_by(category_id=prod.category_id).all()
        name_to_attr = {a.name: a for a in attr_defs}
        for name, raw in values_map.items():
            attr = name_to_attr.get(name)
            if not attr:
                abort(400, f'Unknown attribute for this category: {name}')
            normalized = normalize_value_by_type(attr, raw)
            pav = ProductAttributeValue.query.filter_by(
                product_id=product_id, attribute_definition_id=attr.id
            ).first()
            if not pav:
                pav = ProductAttributeValue(product_id=product_id, attribute_definition_id=attr.id)
                db.session.add(pav)
            pav.set_typed_value(attr.data_type, normalized)
        db.session.commit()
        return ProductService.get(product_id)

    @staticmethod
    def delete(pid):
        prod = Product.query.get_or_404(pid)
        db.session.delete(prod)
        db.session.commit()
