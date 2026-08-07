import os
import sys

# ensure we can import from app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.appwrite import db, DB_ID

try:
    res = db.list_collections(DB_ID)
    print("List Response Type:", type(res))
    if hasattr(res, 'collections'):
        print("Collections list type:", type(res.collections))
        if len(res.collections) > 0:
            first = res.collections[0]
            print("First Collection Type:", type(first))
            print("First Collection Dir:", dir(first))
            print("First Collection to_dict:", hasattr(first, 'to_dict'))
except Exception as e:
    print("Error:", e)
