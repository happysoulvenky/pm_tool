
import json
from flask import abort

DATATYPES = {'string','int','decimal','bool','date','enum','json'}

def to_dict(model):
    if model is None:
        return None
    data = {}
    for col in model.__table__.columns:
        data[col.name] = getattr(model, col.name)
    return data

def normalize_value_by_type(attr, value):
    dtype = attr.data_type
    try:
        if dtype == 'string':
            if value is None: raise ValueError('string cannot be null')
            return str(value)
        if dtype == 'int':
            return int(value)
        if dtype == 'decimal':
            return float(value)
        if dtype == 'bool':
            if isinstance(value, bool):
                return value
            if str(value).lower() in ('true','1','yes','y'): return True
            if str(value).lower() in ('false','0','no','n'): return False
            raise ValueError('invalid boolean')
        if dtype == 'date':
            # accept YYYY-MM-DD
            s = str(value)
            if len(s) != 10 or s[4] != '-' or s[7] != '-':
                raise ValueError('date must be YYYY-MM-DD')
            return s
        if dtype == 'enum':
            options = json.loads(attr.options_json or '[]')
            if value not in options:
                raise ValueError(f'value must be one of {options}')
            return str(value)
        if dtype == 'json':
            if isinstance(value, str):
                return json.loads(value)
            return value
    except Exception as e:
        abort(400, f'Invalid value for attribute {attr.name} ({dtype}): {e}')
