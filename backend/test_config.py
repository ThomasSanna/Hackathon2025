"""
Test script to retrieve configuration for username 'toto'
"""
import requests
import json

API_BASE_URL = "http://localhost:8000/api"

def login(username: str):
    """Login and get JWT token"""
    print(f"\n1. Logging in as '{username}'...")
    response = requests.post(
        f"{API_BASE_URL}/auth/login",
        json={"username": username}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Login successful!")
        print(f"   User ID: {data['user']['id']}")
        print(f"   Username: {data['user']['username']}")
        return data['token']
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(f"   Error: {response.json()}")
        return None

def get_config(token: str):
    """Get user configuration and favorites"""
    print(f"\n2. Retrieving configuration and favorites...")
    response = requests.get(
        f"{API_BASE_URL}/config",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Configuration retrieved successfully!")
        print(f"\n{'='*60}")
        print(f"Configuration for user: {data['user']['username']}")
        print(f"{'='*60}")
        
        # Display configuration
        if data.get('config'):
            print(f"\n📋 Configuration:")
            print(json.dumps(data['config'], indent=2))
        else:
            print(f"\n📋 Configuration: None")
        
        # Display favorites
        print(f"\n{'='*60}")
        if data.get('favorites'):
            print(f"⭐ Favorites ({len(data['favorites'])} documents):")
            for i, fav_id in enumerate(data['favorites'], 1):
                print(f"   {i}. {fav_id}")
        else:
            print(f"⭐ Favorites: None")
        print(f"{'='*60}")
        
        return data
    elif response.status_code == 404:
        print(f"ℹ No configuration found for this user yet")
        return None
    else:
        print(f"✗ Failed to retrieve config: {response.status_code}")
        print(f"   Error: {response.json()}")
        return None

def main():
    username = "toto"
    print(f"\n{'='*60}")
    print(f"Testing configuration retrieval for username: {username}")
    print(f"{'='*60}")
    
    # Login
    token = login(username)
    if not token:
        print("\n✗ Test failed: Could not login")
        return
    
    # Get configuration and favorites
    data = get_config(token)
    
    if data:
        print(f"\n✓ Test completed successfully!")
        print(f"\n📊 Summary:")
        
        # Configuration summary
        config = data.get('config')
        if config:
            print(f"\n  Configuration:")
            print(f"    - Font: {config.get('font', 'N/A')}")
            print(f"    - Theme background: {config.get('theme', {}).get('couleur_fond', 'N/A')}")
            print(f"    - Theme text: {config.get('theme', {}).get('couleur_texte', 'N/A')}")
            print(f"    - Dyslexie alternement_typo: {config.get('dyslexie', {}).get('alternement_typo', 'N/A')}")
            print(f"    - Dyslexie soulignement_syllabes: {config.get('dyslexie', {}).get('soulignement_syllabes', 'N/A')}")
        else:
            print(f"\n  Configuration: Not set")
        
        # Favorites summary
        favorites = data.get('favorites')
        if favorites:
            print(f"\n  Favorites:")
            print(f"    - Total: {len(favorites)} document(s)")
            print(f"    - IDs: {', '.join(favorites[:5])}")
            if len(favorites) > 5:
                print(f"    - ... and {len(favorites) - 5} more")
        else:
            print(f"\n  Favorites: None")
    else:
        print(f"\nℹ User '{username}' exists but has no saved configuration yet")
        print(f"   The frontend needs to send a configuration first via POST /api/config")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to backend server")
        print("   Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
