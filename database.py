

import os
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db():
    from models import Category, AttributeDefinition, Product, ProductAttributeValue  # noqa
    db.create_all()

def seed_data():
    # Create initial categories and attributes for demo
    from models import Category, AttributeDefinition, Product
    if not Category.query.first():
        smartphones = Category(name='Smartphones', description='Handheld smart devices')
        watches = Category(name='Watches', description='Wrist watches')
        db.session.add_all([smartphones, watches])
        db.session.commit()

        # Smartphone attrs
        db.session.add_all([
            AttributeDefinition(category_id=smartphones.id, name='OS', data_type='enum', options_json='["Android","iOS"]', is_required=True),
            AttributeDefinition(category_id=smartphones.id, name='RAM_GB', data_type='int', is_required=True),
            AttributeDefinition(category_id=smartphones.id, name='Battery_mAh', data_type='int')
        ])

        # Watch attrs
        db.session.add_all([
            AttributeDefinition(category_id=watches.id, name='Dial_Color', data_type='string'),
            AttributeDefinition(category_id=watches.id, name='Dial_Size_mm', data_type='int'),
            AttributeDefinition(category_id=watches.id, name='Strap_Type', data_type='enum', options_json='["Leather","Metal","Silicone"]')
        ])
        db.session.commit()

        # Sample products
        db.session.add_all([
            Product(name='Pixel X', sku='PX-001', category_id=smartphones.id, price=699.0, currency='USD'),
            Product(name='Classic Watch', sku='CW-001', category_id=watches.id, price=199.0, currency='USD')
        ])
        db.session.commit()
