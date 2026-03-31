INSERT INTO puzzle_images (title, image_path, grid_rows, grid_cols)
VALUES
    ('Aurora Lake', '/puzzle-images/aurora-lake.jpg', 5, 5),
    ('Mountain Sunrise', '/puzzle-images/mountain-sunrise.jpg', 5, 5),
    ('City Nights', '/puzzle-images/city-nights.jpg', 5, 5)
ON CONFLICT (image_path) DO NOTHING;
