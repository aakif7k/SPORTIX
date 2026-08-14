"""
update_sportix_sport_roles_counts.py
─────────────────────────────────────────────────────────────────────────────
In-place migration script for Appwrite collection 'sportix_sport_roles'.
Adds role count attributes and total_players, and updates all 30 existing records in place.
"""

import time
from datetime import datetime, timezone
from app.core.appwrite import db, DB_ID
from app.core.config import settings

collection = settings.collection_sports_roles

# Exact complete dataset from prompt Section 3
SPORTS_ROLE_UPDATE_DATASET = [
    {"sport_id": "S001", "sport": "Football",          "role_1": "Goalkeeper",         "role_1_count": 1, "role_2": "Defender",             "role_2_count": 4, "role_3": "Midfielder",            "role_3_count": 3, "role_4": "Forward",              "role_4_count": 3, "total_players": 11},
    {"sport_id": "S002", "sport": "Cricket",           "role_1": "Batter",             "role_1_count": 4, "role_2": "Bowler",               "role_2_count": 4, "role_3": "All-Rounder",           "role_3_count": 2, "role_4": "Wicketkeeper",        "role_4_count": 1, "total_players": 11},
    {"sport_id": "S003", "sport": "Basketball",        "role_1": "Point Guard",        "role_1_count": 1, "role_2": "Shooting Guard",       "role_2_count": 1, "role_3": "Forward",               "role_3_count": 2, "role_4": "Center",              "role_4_count": 1, "total_players": 5},
    {"sport_id": "S004", "sport": "Volleyball",        "role_1": "Setter",             "role_1_count": 1, "role_2": "Outside Hitter",       "role_2_count": 2, "role_3": "Middle Blocker",        "role_3_count": 2, "role_4": "Libero",              "role_4_count": 1, "total_players": 6},
    {"sport_id": "S005", "sport": "Tennis",            "role_1": "Baseline Player",    "role_1_count": 1, "role_2": "Serve & Volley",       "role_2_count": 1, "role_3": "All-Court Player",      "role_3_count": 1, "role_4": "Counterpuncher",      "role_4_count": 1, "total_players": 1},
    {"sport_id": "S006", "sport": "Badminton",         "role_1": "Singles Player",     "role_1_count": 1, "role_2": "Doubles Player",       "role_2_count": 1, "role_3": "Attacking Player",      "role_3_count": 1, "role_4": "Defensive Player",    "role_4_count": 1, "total_players": 1},
    {"sport_id": "S007", "sport": "Field Hockey",      "role_1": "Goalkeeper",         "role_1_count": 1, "role_2": "Defender",             "role_2_count": 4, "role_3": "Midfielder",            "role_3_count": 3, "role_4": "Forward",              "role_4_count": 3, "total_players": 11},
    {"sport_id": "S008", "sport": "Baseball",          "role_1": "Pitcher",            "role_1_count": 1, "role_2": "Catcher",              "role_2_count": 1, "role_3": "Infielder",             "role_3_count": 4, "role_4": "Outfielder",          "role_4_count": 3, "total_players": 9},
    {"sport_id": "S009", "sport": "Softball",          "role_1": "Pitcher",            "role_1_count": 1, "role_2": "Catcher",              "role_2_count": 1, "role_3": "Infielder",             "role_3_count": 4, "role_4": "Outfielder",          "role_4_count": 3, "total_players": 9},
    {"sport_id": "S010", "sport": "Rugby",             "role_1": "Forward",            "role_1_count": 8, "role_2": "Scrum-Half",           "role_2_count": 1, "role_3": "Back",                  "role_3_count": 5, "role_4": "Fullback",            "role_4_count": 1, "total_players": 15},
    {"sport_id": "S011", "sport": "American Football", "role_1": "Quarterback",        "role_1_count": 1, "role_2": "Running Back",         "role_2_count": 1, "role_3": "Wide Receiver",         "role_3_count": 3, "role_4": "Defensive Player",    "role_4_count": 6, "total_players": 11},
    {"sport_id": "S012", "sport": "Water Polo",        "role_1": "Goalkeeper",         "role_1_count": 1, "role_2": "Defender",             "role_2_count": 2, "role_3": "Midfielder",            "role_3_count": 2, "role_4": "Attacker",            "role_4_count": 2, "total_players": 7},
    {"sport_id": "S013", "sport": "Table Tennis",      "role_1": "Attacker",           "role_1_count": 1, "role_2": "Defender",             "role_2_count": 1, "role_3": "All-Rounder",           "role_3_count": 1, "role_4": "Counter-Attacker",    "role_4_count": 1, "total_players": 1},
    {"sport_id": "S014", "sport": "Boxing",            "role_1": "Out-Boxer",          "role_1_count": 1, "role_2": "Swarmer",              "role_2_count": 1, "role_3": "Slugger",               "role_3_count": 1, "role_4": "Counterpuncher",      "role_4_count": 1, "total_players": 1},
    {"sport_id": "S015", "sport": "MMA",               "role_1": "Striker",            "role_1_count": 1, "role_2": "Wrestler",             "role_2_count": 1, "role_3": "Grappler",              "role_3_count": 1, "role_4": "All-Rounder",         "role_4_count": 1, "total_players": 1},
    {"sport_id": "S016", "sport": "Swimming",          "role_1": "Freestyle",          "role_1_count": 1, "role_2": "Backstroke",           "role_2_count": 1, "role_3": "Breaststroke",          "role_3_count": 1, "role_4": "Butterfly",           "role_4_count": 1, "total_players": 1},
    {"sport_id": "S017", "sport": "Cycling",           "role_1": "Sprinter",          "role_1_count": 1, "role_2": "Climber",              "role_2_count": 1, "role_3": "Time-Trialist",         "role_3_count": 1, "role_4": "All-Rounder",         "role_4_count": 1, "total_players": 1},
    {"sport_id": "S018", "sport": "Athletics",         "role_1": "Sprinter",          "role_1_count": 1, "role_2": "Distance Runner",      "role_2_count": 1, "role_3": "Jumper",                "role_3_count": 1, "role_4": "Thrower",             "role_4_count": 1, "total_players": 1},
    {"sport_id": "S019", "sport": "Golf",              "role_1": "Driver",            "role_1_count": 1, "role_2": "Iron Player",          "role_2_count": 1, "role_3": "Short-Game Specialist", "role_3_count": 1, "role_4": "Putter",              "role_4_count": 1, "total_players": 1},
    {"sport_id": "S020", "sport": "Lacrosse",          "role_1": "Goaltender",         "role_1_count": 1, "role_2": "Defender",             "role_2_count": 3, "role_3": "Midfielder",            "role_3_count": 3, "role_4": "Attacker",            "role_4_count": 3, "total_players": 10},
    {"sport_id": "S021", "sport": "Beach Volleyball",  "role_1": "Blocker",            "role_1_count": 1, "role_2": "Defender",             "role_2_count": 1, "role_3": "Server",                "role_3_count": 1, "role_4": "All-Rounder",         "role_4_count": 1, "total_players": 2},
    {"sport_id": "S022", "sport": "Pickleball",        "role_1": "Baseline Player",    "role_1_count": 1, "role_2": "Net Player",           "role_2_count": 1, "role_3": "Server",                "role_3_count": 1, "role_4": "All-Rounder",         "role_4_count": 1, "total_players": 2},
    {"sport_id": "S023", "sport": "Darts",             "role_1": "Scoring Specialist", "role_1_count": 1, "role_2": "Finisher",             "role_2_count": 1, "role_3": "All-Rounder",           "role_3_count": 1, "role_4": "Accuracy Specialist", "role_4_count": 1, "total_players": 1},
    {"sport_id": "S024", "sport": "Gymnastics",        "role_1": "Floor Specialist",   "role_1_count": 1, "role_2": "Vault Specialist",     "role_2_count": 1, "role_3": "Bars Specialist",       "role_3_count": 1, "role_4": "Beam Specialist",     "role_4_count": 1, "total_players": 1},
    {"sport_id": "S025", "sport": "Handball",          "role_1": "Goalkeeper",         "role_1_count": 1, "role_2": "Defender",             "role_2_count": 3, "role_3": "Playmaker",             "role_3_count": 2, "role_4": "Pivot",               "role_4_count": 1, "total_players": 7},
    {"sport_id": "S026", "sport": "Kabaddi",           "role_1": "Raider",             "role_1_count": 2, "role_2": "Defender",             "role_2_count": 4, "role_3": "All-Rounder",           "role_3_count": 1, "role_4": "Corner",              "role_4_count": 2, "total_players": 7},
    {"sport_id": "S027", "sport": "Kho-Kho",           "role_1": "Chaser",             "role_1_count": 1, "role_2": "Runner",               "role_2_count": 3, "role_3": "Defender",              "role_3_count": 3, "role_4": "Attacker",            "role_4_count": 2, "total_players": 9},
    {"sport_id": "S028", "sport": "Wrestling",         "role_1": "Freestyle Wrestler", "role_1_count": 1, "role_2": "Greco-Roman Wrestler", "role_2_count": 1, "role_3": "Takedown Specialist",   "role_3_count": 1, "role_4": "Grappler",            "role_4_count": 1, "total_players": 1},
    {"sport_id": "S029", "sport": "Futsal",            "role_1": "Goalkeeper",         "role_1_count": 1, "role_2": "Defender",             "role_2_count": 1, "role_3": "Winger",                "role_3_count": 2, "role_4": "Pivot",               "role_4_count": 1, "total_players": 5},
    {"sport_id": "S030", "sport": "Squash",            "role_1": "Attacker",           "role_1_count": 1, "role_2": "Defender",             "role_2_count": 1, "role_3": "All-Rounder",           "role_3_count": 1, "role_4": "Counter-Attacker",    "role_4_count": 1, "total_players": 1},
]


def run_migration():
    print("================================================================================")
    print("SPORTiX: In-Place Schema Migration & Update for 'sportix_sport_roles'")
    print("================================================================================")
    
    # 1. Inspect existing attributes
    col = db.get_collection(DB_ID, collection)
    existing_attrs = {}
    for attr in getattr(col, 'attributes', []):
        key_name = getattr(attr, 'key', None) or (attr.get('key') if isinstance(attr, dict) else None)
        status = getattr(attr, 'status', None) or (attr.get('status') if isinstance(attr, dict) else None)
        if key_name:
            existing_attrs[key_name] = str(status)
    
    print(f"[*] Existing attributes in collection '{collection}': {list(existing_attrs.keys())}")

    # 2. Add new integer attributes if missing
    new_attributes = [
        'role_1_count',
        'role_2_count',
        'role_3_count',
        'role_4_count',
        'total_players'
    ]

    for attr_name in new_attributes:
        if attr_name not in existing_attrs:
            print(f"[*] Creating attribute '{attr_name}' (integer, default=1, min=0)...")
            try:
                db.create_integer_attribute(
                    database_id=DB_ID,
                    collection_id=collection,
                    key=attr_name,
                    required=False,
                    min=0,
                    default=1
                )
                print(f"  [+] Created attribute request for '{attr_name}'")
            except Exception as e:
                print(f"  [!] Note on creating '{attr_name}': {e}")

    # 3. Wait for all 5 attributes to become available
    print("[*] Waiting for attributes to become available in Appwrite...")
    max_wait = 40
    start_time = time.time()
    while time.time() - start_time < max_wait:
        col = db.get_collection(DB_ID, collection)
        current_status = {}
        for attr in getattr(col, 'attributes', []):
            k = getattr(attr, 'key', None) or (attr.get('key') if isinstance(attr, dict) else None)
            s = getattr(attr, 'status', None) or (attr.get('status') if isinstance(attr, dict) else None)
            if k in new_attributes:
                current_status[k] = str(s).lower()
        
        all_ready = all('available' in current_status.get(attr, '') for attr in new_attributes)
        print(f"  Status: {current_status}")
        if all_ready and len(current_status) == len(new_attributes):
            print("[+] All new attributes are AVAILABLE in Appwrite!")
            break
        time.sleep(2)

    # 4. Update the 30 existing records in place
    print("\n[*] Updating existing 30 records in place...")
    updated_count = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    for item in SPORTS_ROLE_UPDATE_DATASET:
        sid = item["sport_id"]
        doc_id = f"s_{sid.lower()}"
        
        payload = {
            "sport_id": item["sport_id"],
            "sport": item["sport"],
            "role_1": item["role_1"],
            "role_1_count": item["role_1_count"],
            "role_2": item["role_2"],
            "role_2_count": item["role_2_count"],
            "role_3": item["role_3"],
            "role_3_count": item["role_3_count"],
            "role_4": item["role_4"],
            "role_4_count": item["role_4_count"],
            "total_players": item["total_players"],
            "updated_at": now_iso,
        }

        try:
            db.update_document(DB_ID, collection, doc_id, payload)
            updated_count += 1
            print(f"  [UPDATED] {sid} {item['sport']}: {item['role_1']}({item['role_1_count']}) + {item['role_2']}({item['role_2_count']}) + {item['role_3']}({item['role_3_count']}) + {item['role_4']}({item['role_4_count']}) = total {item['total_players']}")
        except Exception as e:
            print(f"  [ERROR updating {doc_id}]: {e}")

    print(f"\n[+] Total records updated in place: {updated_count} / 30")


if __name__ == "__main__":
    run_migration()
