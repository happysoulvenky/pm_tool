
import json
from flask import abort
from database import db
from models import Category, AttributeDefinition
from utils import to_dict, DATATYPES

class AttributeService:
    @staticmethod
    def create(category_id, data):
        Category.query.get_or_404(category_id)
        name = (data.get('name') or '').strip()
        dtype = (data.get('data_type') or '').strip()
        if not name:
            abort(400, 'Attribute name is required')
        if dtype not in DATATYPES:
            abort(400, f'Invalid data_type. Allowed: {sorted(DATATYPES)}')
        attr = AttributeDefinition(
            category_id=category_id,
            name=name,
            data_type=dtype,
            is_required=bool(data.get('is_required', False)),
            is_unique=bool(data.get('is_unique', False)),
            unit=data.get('unit')
        )
        options = data.get('options')
        if dtype == 'enum':
            if not isinstance(options, list) or not options:
                abort(400, 'Enum attributes require a non-empty "options" list')
            attr.options_json = json.dumps(options)
        db.session.add(attr)
        db.session.commit()
        return to_dict(attr)

    @staticmethod
    def list(category_id):
        Category.query.get_or_404(category_id)
        attrs = AttributeDefinition.query.filter_by(category_id=category_id).order_by(AttributeDefinition.name).all()
        return [to_dict(a) for a in attrs]

    @staticmethod
    def update(category_id, attr_id, data):
        Category.query.get_or_404(category_id)
        attr = AttributeDefinition.query.filter_by(id=attr_id, category_id=category_id).first_or_404()
        if 'name' in data:
            name = (data.get('name') or '').strip()
            if not name:
                abort(400, 'Attribute name cannot be empty')
            attr.name = name
        if 'data_type' in data:
            dtype = (data.get('data_type') or '').strip()
            if dtype not in DATATYPES:
                abort(400, f'Invalid data_type. Allowed: {sorted(DATATYPES)}')
            attr.data_type = dtype
        if 'is_required' in data:
            attr.is_required = bool(data.get('is_required'))
        if 'is_unique' in data:
            attr.is_unique = bool(data.get('is_unique'))
        if 'unit' in data:
            attr.unit = data.get('unit')
        if attr.data_type == 'enum' and 'options' in data:
            options = data.get('options')
            if not isinstance(options, list) or not options:
                abort(400, 'Enum attributes require a non-empty "options" list')
            attr.options_json = json.dumps(options)
        db.session.commit()
        return to_dict(attr)

    @staticmethod
    def delete(category_id, attr_id):
        Category.query.get_or_404(category_id)
        attr = AttributeDefinition.query.filter_by(id=attr_id, category_id=category_id).first_or_404()
        db.session.delete(attr)
        db.session.commit()

    @staticmethod
    def validate_value(attr, value):
        # Returns normalized value per data type, raises 400 on invalid
        from utils import normalize_value_by_type
        return normalize_value_by_type(attr, value)
