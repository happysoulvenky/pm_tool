from datetime import datetime
from sqlalchemy import CheckConstraint, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from database import db

class Category(db.Model):
    __tablename__ = 'categories'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(db.String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(db.String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    attributes = relationship('AttributeDefinition', back_populates='category', cascade='all, delete-orphan')
    products = relationship('Product', back_populates='category')

class AttributeDefinition(db.Model):
    __tablename__ = 'attribute_definitions'
    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey('categories.id', ondelete='CASCADE'), nullable=False)
    name: Mapped[str] = mapped_column(db.String(100), nullable=False)
    data_type: Mapped[str] = mapped_column(db.String(50), nullable=False)  # string,int,decimal,bool,date,enum,json
    is_required: Mapped[bool] = mapped_column(db.Boolean, default=False, nullable=False)
    is_unique: Mapped[bool] = mapped_column(db.Boolean, default=False, nullable=False)
    unit: Mapped[str | None] = mapped_column(db.String(50), nullable=True)
    options_json: Mapped[str | None] = mapped_column(db.Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint('category_id','name', name='uq_attr_name_per_category'),)

    category = relationship('Category', back_populates='attributes')
    values = relationship('ProductAttributeValue', back_populates='attribute', cascade='all, delete-orphan')

class Product(db.Model):
    __tablename__ = 'products'
    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey('categories.id'), nullable=False)
    name: Mapped[str] = mapped_column(db.String(100), nullable=False)
    sku: Mapped[str] = mapped_column(db.String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(db.String(255), nullable=True)
    price: Mapped[float | None] = mapped_column(db.Float, nullable=True)
    currency: Mapped[str | None] = mapped_column(db.String(10), nullable=True)
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship('Category', back_populates='products')
    attributes = relationship('ProductAttributeValue', back_populates='product', cascade='all, delete-orphan')

class ProductAttributeValue(db.Model):
    __tablename__ = 'product_attribute_values'
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    attribute_definition_id: Mapped[int] = mapped_column(ForeignKey('attribute_definitions.id', ondelete='CASCADE'), nullable=False)
    string_value: Mapped[str | None] = mapped_column(db.String(255), nullable=True)
    int_value: Mapped[int | None] = mapped_column(db.Integer, nullable=True)
    decimal_value: Mapped[float | None] = mapped_column(db.Float, nullable=True)
    bool_value: Mapped[bool | None] = mapped_column(db.Boolean, nullable=True)
    date_value: Mapped[str | None] = mapped_column(db.String(20), nullable=True)  # ISO date string
    json_value: Mapped[str | None] = mapped_column(db.Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint('product_id','attribute_definition_id', name='uq_product_attr'),)

    product = relationship('Product', back_populates='attributes')
    attribute = relationship('AttributeDefinition', back_populates='values')

    def clear_values(self):
        self.string_value = None
        self.int_value = None
        self.decimal_value = None
        self.bool_value = None
        self.date_value = None
        self.json_value = None

    def set_typed_value(self, data_type, value):
        self.clear_values()
        if data_type == 'string' or data_type == 'enum':
            self.string_value = str(value)
        elif data_type == 'int':
            self.int_value = int(value)
        elif data_type == 'decimal':
            self.decimal_value = float(value)
        elif data_type == 'bool':
            self.bool_value = bool(value)
        elif data_type == 'date':
            self.date_value = str(value)
        elif data_type == 'json':
            from json import dumps
            self.json_value = dumps(value)
        else:
            raise ValueError('Unsupported data type')

    def best_value(self):
        return self.string_value or self.int_value or self.decimal_value or self.bool_value or self.date_value or self.json_value
