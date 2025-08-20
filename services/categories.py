
from flask import abort
from database import db
from models import Category
from utils import to_dict

class CategoryService:
    @staticmethod
    def create(data):
        name = (data.get('name') or '').strip()
        if not name:
            abort(400, 'Category name is required')
        cat = Category(name=name, description=data.get('description'))
        db.session.add(cat)
        db.session.commit()
        return to_dict(cat)

    @staticmethod
    def list():
        return [to_dict(c) for c in Category.query.order_by(Category.name).all()]

    @staticmethod
    def get(cid):
        cat = Category.query.get_or_404(cid)
        return to_dict(cat)

    @staticmethod
    def update(cid, data):
        cat = Category.query.get_or_404(cid)
        if 'name' in data:
            name = (data.get('name') or '').strip()
            if not name:
                abort(400, 'Category name cannot be empty')
            cat.name = name
        if 'description' in data:
            cat.description = data.get('description')
        db.session.commit()
        return to_dict(cat)

    @staticmethod
    def delete(cid):
        cat = Category.query.get_or_404(cid)
        db.session.delete(cat)
        db.session.commit()
