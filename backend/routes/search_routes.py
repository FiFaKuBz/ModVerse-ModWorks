"""
Example usage:
    
    # ค้นหาผู้ใช้ที่มีทั้ง tag python และ flask (AND)
    curl 'http://localhost:5000/api/search/tags?tags=python,flask'
    
    # ค้นหาผู้ใช้ที่มี tag python หรือ flask (OR) หน้า 2, แสดง 5 รายการ เรียงตาม created_at ล่าสุด
    curl 'http://localhost:5000/api/search/tags?tags=python&op=or&page=2&limit=5&sort=-created_at'
"""

from typing import List, Tuple, Dict, Optional, Any
from flask import Blueprint, request, current_app, jsonify

from ..models.search import ensure_tags_index

search_bp = Blueprint("search", __name__)

def _parse_tags(tags_str: str) -> List[str]:
    """แยก tags string เป็น list และลบ duplicates"""
    if not tags_str:
        return []
    return list(set(tag.strip() for tag in tags_str.split(',') if tag.strip()))

def _parse_sort(sort_str: Optional[str] = None) -> List[Tuple[str, int]]:
    """แปลง sort string เป็น MongoDB sort specification"""
    if not sort_str:
        return [('created_at', -1)]  # default sort
    
    field = sort_str.strip()
    if field.startswith('-'):
        return [(field[1:], -1)]
    return [(field, 1)]

def _safe_projection(collection: str) -> Dict[str, int]:
    """กำหนด fields ที่ปลอดภัยสำหรับแต่ละ collection"""
    if collection == 'users':
        return {
            '_id': 1,
            'name': 1,
            'email': 1,
            'picture': 1,
            'role': 1,
            'tags': 1,
            'created_at': 1,
            'updated_at': 1
        }
    # สำหรับ collections อื่นๆ ให้แสดงทุก field ยกเว้น fields ที่ sensitive
    return {
        'password': 0,
        'token': 0,
        'secret': 0
    }

@search_bp.route("/api/search/tags")
def search_by_tags():
    """
    ค้นหา documents ตาม tags และ pagination
    Query params:
        - collection: (optional) ชื่อ collection ที่จะค้นหา default: "users"
        - tags: (required) comma-separated tags
        - op: (optional) "and" หรือ "or" default: "and"
        - page: (optional) หน้าที่จะแสดง default: 1
        - limit: (optional) จำนวนรายการต่อหน้า default: จาก Config.SEARCH_PAGE_SIZE หรือ 20
        - sort: (optional) field ที่จะเรียง default: -created_at
    """
    # Get and validate parameters
    collection = request.args.get('collection', 'users')
    tags = _parse_tags(request.args.get('tags', ''))
    op = request.args.get('op', 'and').lower()
    
    try:
        page = max(1, int(request.args.get('page', 1)))
        default_limit = getattr(current_app.config, 'SEARCH_PAGE_SIZE', 20)
        limit = min(100, max(1, int(request.args.get('limit', default_limit))))
    except ValueError:
        return jsonify({
            'ok': False,
            'error': {
                'code': 'invalid_pagination',
                'message': 'Page and limit must be positive integers'
            }
        }), 400

    # Validate required parameters
    if not tags:
        return jsonify({
            'ok': False,
            'error': {
                'code': 'missing_tags',
                'message': 'Tags parameter is required and must not be empty'
            }
        }), 400
    
    # Build query filter
    filter_op = '$all' if op == 'and' else '$in'
    mongo_filter = {'tags': {filter_op: tags}}
    
    # Get database handle
    db = current_app.extensions['pymongo'].db
    
    # Ensure collection exists
    if collection not in db.list_collection_names():
        return jsonify({
            'ok': False,
            'error': {
                'code': 'collection_not_found',
                'message': f'Collection {collection} does not exist'
            }
        }), 404
    
    # Ensure tags index exists
    ensure_tags_index(db, collection)
    
    # Prepare query options
    skip = (page - 1) * limit
    sort_spec = _parse_sort(request.args.get('sort'))
    projection = _safe_projection(collection)
    
    # Execute query
    total = db[collection].count_documents(mongo_filter)
    cursor = db[collection].find(
        filter=mongo_filter,
        projection=projection,
        skip=skip,
        limit=limit,
        sort=sort_spec
    )
    
    # Format results
    items = []
    for doc in cursor:
        doc['_id'] = str(doc['_id'])  # Convert ObjectId to string
        items.append(doc)
    
    # Return response
    return jsonify({
        'ok': True,
        'collection': collection,
        'filters': {
            'tags': tags,
            'op': op
        },
        'page': page,
        'limit': limit,
        'total': total,
        'items': items
    })