"""
create_sports_roles_collection.py
Creates the sportix_sport_roles collection and its attributes/indexes in Appwrite.
"""
import requests
import time

ENDPOINT = "https://sgp.cloud.appwrite.io/v1"
PROJECT_ID = "6a5fab1d0026ad341f32"
DATABASE_ID = "6a5faf43003e0b2d9f34"
API_KEY = "standard_64a9d566d5f0d30127ef60780378e89eae93b78e7b3eb8eceaa9e134803815747a949bf4d37c8235da8f596af9df7d2d6460885f6d1f423fddba21b3e384fd752cfa2c1662e242c55cd2c2062537881fe3f5fef5de874c7c18410003a0e377fe0073693f3d69f7bb1c57253116a52e2315c92e853f261a34c58d45829f6825d2"

headers = {
    "X-Appwrite-Project": PROJECT_ID,
    "X-Appwrite-Key": API_KEY,
    "Content-Type": "application/json"
}

needed_perms = [
    'read("any")', 'create("any")', 'update("any")', 'delete("any")',
    'read("users")', 'create("users")', 'update("users")', 'delete("users")'
]

COLLECTION_ID = "sportix_sport_roles"
COLLECTION_NAME = "SPORTIX_SPORT_ROLES"

def setup_sports_roles_schema():
    print(f"Checking collection {COLLECTION_ID}...")
    res = requests.get(f"{ENDPOINT}/databases/{DATABASE_ID}/collections/{COLLECTION_ID}", headers=headers)
    if res.status_code == 404:
        print(f"Creating collection {COLLECTION_ID}...")
        create_res = requests.post(
            f"{ENDPOINT}/databases/{DATABASE_ID}/collections",
            headers=headers,
            json={
                "collectionId": COLLECTION_ID,
                "name": COLLECTION_NAME,
                "permissions": needed_perms,
                "documentSecurity": False,
                "enabled": True
            }
        )
        print("Create collection result:", create_res.status_code, create_res.text)
        time.sleep(1)
    else:
        print(f"Collection {COLLECTION_ID} already exists. Updating permissions...")
        requests.put(
            f"{ENDPOINT}/databases/{DATABASE_ID}/collections/{COLLECTION_ID}",
            headers=headers,
            json={
                "name": COLLECTION_NAME,
                "permissions": needed_perms,
                "documentSecurity": False,
                "enabled": True
            }
        )

    # Check existing attributes
    attr_res = requests.get(f"{ENDPOINT}/databases/{DATABASE_ID}/collections/{COLLECTION_ID}/attributes", headers=headers)
    existing_attrs = {a["key"] for a in attr_res.json().get("attributes", [])}
    print("Existing attributes:", existing_attrs)

    attributes = [
        {"key": "sport_id", "size": 32, "required": True},
        {"key": "sport", "size": 128, "required": True},
        {"key": "role_1", "size": 128, "required": True},
        {"key": "role_2", "size": 128, "required": True},
        {"key": "role_3", "size": 128, "required": True},
        {"key": "role_4", "size": 128, "required": True},
        {"key": "created_at", "size": 64, "required": False},
        {"key": "updated_at", "size": 64, "required": False},
    ]

    for attr in attributes:
        key = attr["key"]
        if key not in existing_attrs:
            print(f"Adding attribute '{key}'...")
            r = requests.post(
                f"{ENDPOINT}/databases/{DATABASE_ID}/collections/{COLLECTION_ID}/attributes/string",
                headers=headers,
                json={
                    "key": key,
                    "size": attr["size"],
                    "required": attr["required"]
                }
            )
            print(f"  Result for '{key}': {r.status_code} {r.text}")
            time.sleep(0.6)

    # Check existing indexes
    idx_res = requests.get(f"{ENDPOINT}/databases/{DATABASE_ID}/collections/{COLLECTION_ID}/indexes", headers=headers)
    existing_indexes = {i["key"] for i in idx_res.json().get("indexes", [])}
    print("Existing indexes:", existing_indexes)

    if "idx_sport_id" not in existing_indexes:
        print("Creating index idx_sport_id...")
        r = requests.post(
            f"{ENDPOINT}/databases/{DATABASE_ID}/collections/{COLLECTION_ID}/indexes",
            headers=headers,
            json={
                "key": "idx_sport_id",
                "type": "unique",
                "attributes": ["sport_id"],
                "orders": ["ASC"]
            }
        )
        print("  Index idx_sport_id result:", r.status_code, r.text)
        time.sleep(0.6)

    if "idx_sport" not in existing_indexes:
        print("Creating index idx_sport...")
        r = requests.post(
            f"{ENDPOINT}/databases/{DATABASE_ID}/collections/{COLLECTION_ID}/indexes",
            headers=headers,
            json={
                "key": "idx_sport",
                "type": "key",
                "attributes": ["sport"],
                "orders": ["ASC"]
            }
        )
        print("  Index idx_sport result:", r.status_code, r.text)
        time.sleep(0.6)

    print("\nSchema setup for sportix_sport_roles complete.")

if __name__ == "__main__":
    setup_sports_roles_schema()
