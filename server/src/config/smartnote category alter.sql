use smartnote;
ALTER TABLE categories
ADD UNIQUE KEY `unique_category_name_per_user` (user_id, name);