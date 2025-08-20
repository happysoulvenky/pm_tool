
import os
from flask import Flask, jsonify, request
from database import db, init_db, seed_data
from services.categories import CategoryService
from services.attributes import AttributeService
from services.products import ProductService

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    @app.cli.command('db-init')
    def db_init():
        with app.app_context():
            init_db()
            seed_data()
            print('Database initialized and seeded.')

    # Health check
    @app.get('/')
    def root():
        return jsonify({'status': 'ok'})

    # Categories
    @app.post('/categories')
    def create_category():
        data = request.get_json(force=True)
        cat = CategoryService.create(data)
        return jsonify(cat), 201

    @app.get('/categories')
    def list_categories():
        return jsonify(CategoryService.list())

    @app.get('/categories/<int:cid>')
    def get_category(cid):
        return jsonify(CategoryService.get(cid))

    @app.put('/categories/<int:cid>')
    def update_category(cid):
        data = request.get_json(force=True)
        return jsonify(CategoryService.update(cid, data))

    @app.delete('/categories/<int:cid>')
    def delete_category(cid):
        CategoryService.delete(cid)
        return '', 204

    # Attributes
    @app.post('/categories/<int:cid>/attributes')
    def create_attribute(cid):
        data = request.get_json(force=True)
        return jsonify(AttributeService.create(cid, data)), 201

    @app.get('/categories/<int:cid>/attributes')
    def list_attributes(cid):
        return jsonify(AttributeService.list(cid))

    @app.put('/categories/<int:cid>/attributes/<int:aid>')
    def update_attribute(cid, aid):
        data = request.get_json(force=True)
        return jsonify(AttributeService.update(cid, aid, data))

    @app.delete('/categories/<int:cid>/attributes/<int:aid>')
    def delete_attribute(cid, aid):
        AttributeService.delete(cid, aid)
        return '', 204

    # Products
    @app.post('/products')
    def create_product():
        data = request.get_json(force=True)
        return jsonify(ProductService.create(data)), 201

    @app.get('/products')
    def list_products():
        return jsonify(ProductService.list())

    @app.get('/products/<int:pid>')
    def get_product(pid):
        return jsonify(ProductService.get(pid))

    @app.put('/products/<int:pid>')
    def update_product(pid):
        data = request.get_json(force=True)
        return jsonify(ProductService.update(pid, data))

    @app.post('/products/<int:pid>/attributes')
    def set_product_attributes(pid):
        data = request.get_json(force=True)
        return jsonify(ProductService.set_attributes(pid, data.get('attributes', {})))

    @app.delete('/products/<int:pid>')
    def delete_product(pid):
        ProductService.delete(pid)
        return '', 204

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
