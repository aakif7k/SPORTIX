"""
Inspect schemas of events and event_participants collections.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.core.appwrite import db, DB_ID

for col_id in ['events', 'event_participants', 'profiles']:
    print(f"\n{'='*55}")
    print(f"Collection: {col_id}")
    print('='*55)
    try:
        attrs = db.list_attributes(DB_ID, col_id)
        attrib_list = attrs.attributes if hasattr(attrs, 'attributes') else attrs.get('attributes', [])
        
        # Also check permissions
        col = db.get_collection(DB_ID, col_id)
        col_dict = col.to_dict() if hasattr(col, 'to_dict') else (col if isinstance(col, dict) else {})
        perms = col_dict.get('$permissions', [])
        print(f"Permissions: {perms}")
        print(f"Attributes ({len(attrib_list)}):")
        
        for a in attrib_list:
            if hasattr(a, 'key'):
                key = a.key
                typ = getattr(a, 'type', '?')
                req = getattr(a, 'required', '?')
                arr = getattr(a, 'array', False)
                elems = getattr(a, 'elements', None)  # enum values
            elif isinstance(a, dict):
                key = a.get('key','?')
                typ = a.get('type','?')
                req = a.get('required','?')
                arr = a.get('array', False)
                elems = a.get('elements', None)
            else:
                print(f"  (unknown): {a}")
                continue
            
            extras = f"  ENUM:{elems}" if elems else ""
            print(f"  - {key}: {typ}{'[]' if arr else ''} required={req}{extras}")
    except Exception as e:
        print(f"  Error: {e}")
