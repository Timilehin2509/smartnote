-- Add FULLTEXT indexes for better search performance
ALTER TABLE notes ADD FULLTEXT INDEX note_search (title, content, cue_column, summary);
ALTER TABLE categories ADD FULLTEXT INDEX category_search (name);