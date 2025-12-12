"""
Migration script to add 'favorites' column to user_configs table.
Run this once to update the database schema.
"""
import sqlite3
import os

def migrate_database():
    db_path = os.path.join(os.path.dirname(__file__), 'users.db')
    
    if not os.path.exists(db_path):
        print(f"⚠ Database not found at {db_path}")
        print("The database will be created automatically when you start the server.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if favorites column already exists
        cursor.execute("PRAGMA table_info(user_configs)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'favorites' in columns:
            print("✓ 'favorites' column already exists in user_configs table")
        else:
            print("Adding 'favorites' column to user_configs table...")
            cursor.execute("ALTER TABLE user_configs ADD COLUMN favorites TEXT")
            conn.commit()
            print("✓ Migration completed successfully!")
            print("  - Added 'favorites' column to store favorite document IDs")
        
        # Show table structure
        cursor.execute("PRAGMA table_info(user_configs)")
        print("\nCurrent user_configs table structure:")
        for column in cursor.fetchall():
            print(f"  - {column[1]} ({column[2]})")
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Database Migration: Add Favorites Column")
    print("=" * 60)
    migrate_database()
