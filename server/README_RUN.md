## Run Checklist

1. Update database credentials in [`.env`](c:\Users\Somashekar Reddy\Desktop\SD\SD-Final-Project-Gamified-Habit-Tracker\server\.env):
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`

2. In pgAdmin, create database `habit_tracker` (or use your chosen name and match `.env`).

3. Run schema in pgAdmin Query Tool:
   - [`sql/schema.sql`](c:\Users\Somashekar Reddy\Desktop\SD\SD-Final-Project-Gamified-Habit-Tracker\server\sql\schema.sql)

4. Run badge seed script:
   - [`sql/seed_badges.sql`](c:\Users\Somashekar Reddy\Desktop\SD\SD-Final-Project-Gamified-Habit-Tracker\server\sql\seed_badges.sql)

5. Start backend from `server/`:
   - `npm install`
   - `npm run dev`

6. Open app:
   - `http://localhost:3137/index.html`
