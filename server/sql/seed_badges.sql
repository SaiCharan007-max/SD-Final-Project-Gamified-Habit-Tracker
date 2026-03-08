-- Seed predefined badges (safe to run multiple times)
INSERT INTO badges (id, name, description, condition_type, condition_value)
SELECT gen_random_uuid(), 'First Orbit', 'Earn your first 50 XP.', 'total_points', 50
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'First Orbit');

INSERT INTO badges (id, name, description, condition_type, condition_value)
SELECT gen_random_uuid(), 'Centurion', 'Reach 100 XP.', 'total_points', 100
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Centurion');

INSERT INTO badges (id, name, description, condition_type, condition_value)
SELECT gen_random_uuid(), 'Task Runner', 'Complete 5 tasks.', 'tasks_completed', 5
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Task Runner');

INSERT INTO badges (id, name, description, condition_type, condition_value)
SELECT gen_random_uuid(), 'Task Master', 'Complete 25 tasks.', 'tasks_completed', 25
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Task Master');

INSERT INTO badges (id, name, description, condition_type, condition_value)
SELECT gen_random_uuid(), 'Habit Starter', 'Complete 5 habits.', 'habits_completed', 5
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Habit Starter');

INSERT INTO badges (id, name, description, condition_type, condition_value)
SELECT gen_random_uuid(), 'Streak Keeper', 'Reach a best habit streak of 7.', 'best_habit_streak', 7
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Streak Keeper');

INSERT INTO badges (id, name, description, condition_type, condition_value)
SELECT gen_random_uuid(), 'Deep Diver', 'Complete 5 focus sessions.', 'focus_sessions_completed', 5
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Deep Diver');

INSERT INTO badges (id, name, description, condition_type, condition_value)
SELECT gen_random_uuid(), 'Time Bender', 'Finish a 60-minute focus session.', 'long_focus_minutes', 60
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Time Bender');
