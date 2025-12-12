"""
Migration script to make config column nullable in user_configs table.
This allows users to save favorites without having a configuration.
"""
import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), 'users.db')
    
    if not os.path.exists(db_path):
        print(f"✗ Database not found at: {db_path}")
        return
    
    print(f"📁 Database location: {db_path}")
    print("🔄 Starting migration to make config nullable...\n")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current schema
        cursor.execute("PRAGMA table_info(user_configs)")
        columns = cursor.fetchall()
        print("Current schema:")
        for col in columns:
            print(f"  - {col[1]}: {col[2]} (nullable: {not col[3]})")
        
        print("\n🔄 Creating new table with nullable config...")
        
        # SQLite doesn't support ALTER COLUMN, so we need to:
        # 1. Create new table with correct schema
        # 2. Copy data
        # 3. Drop old table
        # 4. Rename new table
        
        # Create new table with nullable config
        cursor.execute("""
            CREATE TABLE user_configs_new (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE,
                config TEXT,
                favorites TEXT,
                updated_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Copy data from old table
        cursor.execute("""
            INSERT INTO user_configs_new (id, user_id, config, favorites, updated_at)
            SELECT id, user_id, config, favorites, updated_at
            FROM user_configs
        """)
        
        # Drop old table
        cursor.execute("DROP TABLE user_configs")
        
        # Rename new table
        cursor.execute("ALTER TABLE user_configs_new RENAME TO user_configs")
        
        # Recreate indexes
        cursor.execute("CREATE INDEX ix_user_configs_id ON user_configs (id)")
        cursor.execute("CREATE INDEX ix_user_configs_user_id ON user_configs (user_id)")
        
        conn.commit()
        
        # Verify new schema
        print("\n✓ Migration completed successfully!")
        print("\nNew schema:")
        cursor.execute("PRAGMA table_info(user_configs)")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[1]}: {col[2]} (nullable: {not col[3]})")
        
        print("\n✅ Config column is now nullable - favorites can be saved independently!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
