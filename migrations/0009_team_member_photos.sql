CREATE TABLE IF NOT EXISTS team_members_with_photos (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  role_label TEXT NOT NULL,
  belt_label TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO team_members_with_photos (id, full_name, role_label, belt_label, bio, image_url, display_order)
SELECT
  CAST(id AS TEXT),
  full_name,
  role_label,
  belt_label,
  bio,
  '',
  display_order
FROM team_members;

DROP TABLE team_members;
ALTER TABLE team_members_with_photos RENAME TO team_members;
