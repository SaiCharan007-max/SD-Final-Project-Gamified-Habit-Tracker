# Manual Testing Guide - HabitQuest
**Purpose:** Complete manual testing checklist for all features before submission  
**Date:** March 31, 2026  
**Tester:** You

---

## ⚙️ SETUP BEFORE TESTING

### Prerequisites
- [ ] Backend server running (`npm run dev` in server folder)
- [ ] Database connected and running
- [ ] Open browser to `http://localhost:3137/index.html`
- [ ] Clear browser localStorage to start fresh (F12 → Application → Clear)
- [ ] Open browser console (F12) to check for errors

---

## 📝 TEST CASE 1: USER REGISTRATION

**URL:** http://localhost:3137/signup.html

### Steps:
1. [ ] Click "Sign up" link (or go to signup.html)
2. [ ] Fill in username: `testuser_your_name`
3. [ ] Fill in email: `test_your_name@example.com`
4. [ ] Fill in password: `TestPass123!`
5. [ ] Confirm password: `TestPass123!`

### Watch for:
- [ ] Password strength indicator shows all rules met (length, upper, lower, number, symbol)
- [ ] Register button becomes enabled
- [ ] No console errors
- [ ] All password rules are visible below the input field

### Expected Result:
- [ ] ✅ After clicking Register → Redirect to dashboard
- [ ] ✅ Logged in automatically (token stored in localStorage)
- [ ] ✅ User profile shows username at top

**To Verify Token Storage:**
- [ ] Open F12 → Application → LocalStorage → Select localhost:3137
- [ ] ✅ Should see `token` key with JWT value
- [ ] ✅ JWT should start with `eyJhbGc...`

---

## 🔐 TEST CASE 2: USER LOGIN

**URL:** http://localhost:3137/index.html

### Scenario A: Valid Login
1. [ ] Logout first (if logged in)
   - Go to Profile page → Click Logout
   - [ ] Should redirect to login page
2. [ ] Enter email: `test_your_name@example.com`
3. [ ] Enter password: `TestPass123!`
4. [ ] Click Login button

### Expected Result:
- [ ] ✅ Redirect to dashboard
- [ ] ✅ Token stored in localStorage
- [ ] ✅ User data displayed

### Scenario B: Invalid Password
1. [ ] Go back to login page
2. [ ] Enter email: `test_your_name@example.com`
3. [ ] Enter password: `WrongPassword`
4. [ ] Click Login

### Expected Result:
- [ ] ✅ Error message shown: "Invalid email or password"
- [ ] ❌ Should NOT redirect
- [ ] ❌ Should NOT store token

### Scenario C: Non-existent Email
1. [ ] Enter email: `nonexistent@example.com`
2. [ ] Enter password: `SomePass123!`
3. [ ] Click Login

### Expected Result:
- [ ] ✅ Error message shown: "Invalid email or password"
- [ ] ❌ Should NOT redirect

---

## 🏠 TEST CASE 3: DASHBOARD

**URL:** http://localhost:3137/dashboard.html

### Verify Display:
- [ ] Username displayed at top
- [ ] User stats visible:
  - [ ] Total Points: 0 (initially)
  - [ ] Tasks Completed: 0
  - [ ] Habits Completed: 0
  - [ ] Current Streak: 0
- [ ] Navigation menu with all pages
- [ ] Quick action buttons

### Check Navigation:
Click each menu item and verify:
- [ ] Habits → habits.html loads
- [ ] Tasks → tasks.html loads
- [ ] Focus → focus.html loads
- [ ] Timetable → timetable.html loads
- [ ] Stats → stats.html loads
- [ ] Leaderboard → leaderboard.html loads
- [ ] Achievements → achievements.html loads
- [ ] Profile → profile.html loads

### Verify No Console Errors:
- [ ] F12 → Console tab
- [ ] ❌ Should have NO red error messages
- [ ] ⚠️ Yellow warnings are OK

---

## 🎯 TEST CASE 4: HABITS MANAGEMENT

**URL:** http://localhost:3137/habits.html

### Create Habit #1:
1. [ ] Click "Create New Habit" button
2. [ ] Fill in:
   - Habit Name: `Morning Meditation`
   - Frequency: `Daily` (select from dropdown)
   - Target Count: `30` (minutes)
3. [ ] Click "Create Habit"

### Expected Result:
- [ ] ✅ Habit appears in the list
- [ ] ✅ Shows: "Morning Meditation | Daily | Target: 30"
- [ ] ✅ Shows streak: "Current: 0 | Best: 0"
- [ ] ✅ "Complete" button available

### Create Habit #2:
1. [ ] Create another habit:
   - Name: `Exercise`
   - Frequency: `Weekly`
   - Target: `5` (days per week)

### Expected Result:
- [ ] ✅ Second habit appears in list
- [ ] ✅ Both habits displayed

### Complete a Habit:
1. [ ] Click "Complete" button on "Morning Meditation"
2. [ ] Verify streak updates

### Expected Result:
- [ ] ✅ Streak changes from 0 to 1
- [ ] ✅ Points may increase (based on gamification)
- [ ] ✅ Completion status shows

### Error Testing:
1. [ ] Try to create habit with empty name
2. [ ] Try to create habit with 0 target

### Expected Result:
- [ ] ✅ Error message shown
- [ ] ❌ Habit NOT created

---

## ✅ TEST CASE 5: TASKS MANAGEMENT

**URL:** http://localhost:3137/tasks.html

### Create Task #1:
1. [ ] Click "Create New Task" button
2. [ ] Fill in:
   - Task Title: `Fix Login Bug`
   - Description: `Debug authentication issues`
   - Priority: `High` (select 1-3 or HIGH)
   - Due Date: `2026-04-15`
3. [ ] Click "Create Task"

### Expected Result:
- [ ] ✅ Task appears in list
- [ ] ✅ Shows: Title, description, priority level
- [ ] ✅ Shows due date

### Create Task #2:
1. [ ] Create another task:
   - Title: `Update Documentation`
   - Description: `Add API docs`
   - Priority: `Medium`
   - Due Date: `2026-04-20`

### Create Task #3:
1. [ ] Create low priority task:
   - Title: `Code Review`
   - Priority: `Low`

### Complete Task:
1. [ ] Click "Complete" or checkbox on first task
2. [ ] Verify task status changes

### Expected Result:
- [ ] ✅ Task appears as completed
- [ ] ✅ Strikethrough or visual change
- [ ] ✅ Task count increases in dashboard

### Error Testing:
1. [ ] Try to create task without title
2. [ ] Try invalid date format

### Expected Result:
- [ ] ✅ Error message shown
- [ ] ❌ Task NOT created

---

## ⏱️ TEST CASE 6: FOCUS SESSIONS

**URL:** http://localhost:3137/focus.html

### Start Focus Session:
1. [ ] Click "Start Focus Session" button
2. [ ] Verify timer appears and starts counting

### Expected Result:
- [ ] ✅ Timer visible (e.g., "0:00, 0:01, 0:02...")
- [ ] ✅ Timer increments every second
- [ ] ✅ "Stop" button appears (instead of "Start")

### Continue for 10 seconds:
1. [ ] Let timer run for at least 10 seconds
2. [ ] Observe time accumulating

### Stop Focus Session:
1. [ ] Click "Stop" button
2. [ ] Note the duration displayed

### Expected Result:
- [ ] ✅ Timer stops
- [ ] ✅ Session duration shows (e.g., "10 seconds completed")
- [ ] ✅ Session appears in history
- [ ] ✅ Timer resets to "Start Focus Session"

### Multiple Sessions:
1. [ ] Start another session
2. [ ] Stop it after 5 seconds
3. [ ] Check history shows multiple sessions

### Expected Result:
- [ ] ✅ Session history shows all sessions
- [ ] ✅ Each with its duration and timestamp

---

## 📅 TEST CASE 7: TIMETABLE/SCHEDULE

**URL:** http://localhost:3137/timetable.html

### Create Schedule Entry:
1. [ ] Click "Add Schedule" or create button
2. [ ] Fill in:
   - Day: `Monday` (or day_of_week: 1)
   - Title: `Morning Standup`
   - Start Time: `09:00`
   - End Time: `09:30`
3. [ ] Click "Create" or "Add"

### Expected Result:
- [ ] ✅ Entry appears in schedule
- [ ] ✅ Shows day, title, time range
- [ ] ✅ Format: "Monday | 09:00 - 09:30 | Morning Standup"

### Create Multiple Entries:
1. [ ] Add Monday afternoon entry:
   - Time: `14:00 - 15:00`
   - Title: `Team Meeting`
2. [ ] Add Wednesday entry:
   - Time: `10:00 - 11:00`
   - Title: `1-on-1 with Manager`

### Verify Weekly View:
- [ ] All days of week visible (Mon-Sun)
- [ ] Entries organized by day
- [ ] Time displayed in 24-hour format

### Error Testing:
1. [ ] Try to create with end_time = start_time
2. [ ] Try to create with end_time < start_time

### Expected Result:
- [ ] ✅ Error message: "End time must be after start time"
- [ ] ❌ Entry NOT created

---

## 🏆 TEST CASE 8: GAMIFICATION & BADGES

**URL:** http://localhost:3137/achievements.html

### Browse Available Badges:
1. [ ] Scroll through all badges
2. [ ] Read badge names and descriptions

### Expected Result:
- [ ] ✅ See all 8 badges listed
- [ ] ✅ Badge descriptions visible
- [ ] ✅ Shows earned/not earned status

### Example Badges Should Include:
- [ ] "First Steps" (register)
- [ ] "Task Master" (complete tasks)
- [ ] "Habit Hero" (maintain habits)
- [ ] "Focus Master" (focus sessions)
- [ ] "Streak Keeper" (maintain streak)
- [ ] And more...

### Earn Badges:
1. [ ] Complete enough tasks to potentially earn a badge
2. [ ] Maintain habit streaks
3. [ ] Complete focus sessions

### Expected Result:
- [ ] ✅ As you complete activities, badges may unlock
- [ ] ✅ Badge shows earned date
- [ ] ✅ Visual indication of earned vs. locked

---

## 👥 TEST CASE 9: LEADERBOARD

**URL:** http://localhost:3137/leaderboard.html

### View Rankings:
1. [ ] Navigate to leaderboard
2. [ ] View user list

### Expected Result:
- [ ] ✅ Users listed in order
- [ ] ✅ Shows rank/position
- [ ] ✅ Shows total points per user
- [ ] ✅ Your user highlighted/indicated

### Verify Data:
- [ ] [ ] Check that higher point users appear first
- [ ] [ ] Your user appears with your current points
- [ ] [ ] Other registered users visible (if any)

### Check Column Headers:
- [ ] ✅ Rank | Username | Total Points

---

## 📊 TEST CASE 10: STATS & ANALYTICS

**URL:** http://localhost:3137/stats.html

### Verify Displayed Metrics:
- [ ] Total Points earned
- [ ] Tasks Completed count
- [ ] Habits Completed count
- [ ] Current Login Streak
- [ ] Best Habit Streak

### Expected Result:
- [ ] ✅ All stats visible
- [ ] ✅ Numbers match what you've done
  - If you completed 2 tasks → Tasks Completed = 2
  - If you completed 1 habit → Habits Completed = 1
  - If focus session was 10 secs → points awarded

### Visual Elements:
- [ ] ✅ Charts or progress bars (if implemented)
- [ ] ✅ Clean, readable format
- [ ] ✅ Updates reflect your actions

---

## 👤 TEST CASE 11: PROFILE PAGE

**URL:** http://localhost:3137/profile.html

### View Profile:
1. [ ] Navigate to profile
2. [ ] Verify information displayed

### Expected Result:
- [ ] ✅ Username shown: `testuser_your_name`
- [ ] ✅ Email shown: `test_your_name@example.com`
- [ ] ✅ Account creation info

### Verify Logout:
1. [ ] Click "Logout" button
2. [ ] Application should redirect

### Expected Result:
- [ ] ✅ Redirected to login page (index.html)
- [ ] ✅ localStorage token cleared
- [ ] ✅ Can no longer access protected pages

### Attempt to Access Protected Page After Logout:
1. [ ] Try to directly visit `dashboard.html`
2. [ ] Or try to visit any other protected page

### Expected Result:
- [ ] ✅ Redirected to login page
- [ ] ✅ Cannot access without logging in

---

## 🔒 TEST CASE 12: SECURITY & AUTHENTICATION

### Test Token Validation:
1. [ ] Login and open console (F12)
2. [ ] Go to Application → LocalStorage
3. [ ] Copy the token value
4. [ ] Open a new tab and go to dashboard.html

### Expected Result:
- [ ] ✅ New tab loads dashboard (token from storage)
- [ ] ✅ User data displayed

### Test Invalid Token:
1. [ ] Open console (F12)
2. [ ] Run: `localStorage.setItem('token', 'invalid_token')`
3. [ ] Refresh dashboard.html

### Expected Result:
- [ ] ✅ API calls fail with 401 error
- [ ] ⚠️ User should be redirected to login
- [ ] ✅ Error message displayed (if implemented)

### Test Missing Token:
1. [ ] Open console and run: `localStorage.removeItem('token')`
2. [ ] Try to access any protected page

### Expected Result:
- [ ] ✅ Redirect to login page
- [ ] ✅ Cannot access protected content

---

## 🎨 TEST CASE 13: UI/UX VERIFICATION

### Check Layout:
- [ ] All pages load correctly
- [ ] No broken images
- [ ] No overlapping elements
- [ ] Responsive to window size

### Verify Navigation:
- [ ] All links work
- [ ] Links in correct locations
- [ ] Active page highlighted (if implemented)

### Check Buttons:
- [ ] All buttons are clickable
- [ ] Buttons are properly styled
- [ ] Hover states work (if implemented)

### Verify Forms:
- [ ] Form inputs clear and visible
- [ ] Labels correctly associated
- [ ] Placeholders helpful
- [ ] Error messages clear

### Color & Theme:
- [ ] Consistent color scheme across pages
- [ ] Good contrast for readability
- [ ] Professional appearance

### Check Responsiveness:
1. [ ] Resize browser window small (mobile size)
2. [ ] Resize browser window large (desktop size)

### Expected Result:
- [ ] ✅ Layout adapts to screen size
- [ ] ✅ Content readable on mobile
- [ ] ✅ No horizontal scroll on mobile

---

## ⚠️ TEST CASE 14: ERROR HANDLING

### Network Error Simulation:
1. [ ] Open DevTools (F12) → Network tab
2. [ ] Try to create a task/habit with network throttling

### Expected Result:
- [ ] ✅ Error message shown to user
- [ ] ✅ User can retry
- [ ] ❌ No crash or hang

### Invalid Input:
Test each form with invalid data:
- [ ] Empty required fields
- [ ] Special invalid characters
- [ ] Out-of-range values
- [ ] Invalid date formats

### Expected Result:
- [ ] ✅ Validation error shown
- [ ] ✅ Form doesn't submit
- [ ] ✅ Error message is helpful

---

## 📋 TEST CASE 15: DATA PERSISTENCE

### Create Data:
1. [ ] Create a habit
2. [ ] Create a task
3. [ ] Create timetable entry
4. [ ] Start and stop a focus session

### Refresh Page:
1. [ ] Refresh the page (F5)

### Expected Result:
- [ ] ✅ All created data still visible
- [ ] ✅ Data persisted to database
- [ ] ✅ Habit streaks remembered

### Navigate Away and Back:
1. [ ] Create a habit on habits.html
2. [ ] Go to tasks.html
3. [ ] Go back to habits.html

### Expected Result:
- [ ] ✅ Habit still there
- [ ] ✅ Data consistent

### Close and Reopen Browser:
1. [ ] Close browser completely
2. [ ] Reopen browser to http://localhost:3137
3. [ ] Login again with same credentials

### Expected Result:
- [ ] ✅ Can log in again
- [ ] ✅ All previous data still there
- [ ] ✅ Stats/streaks maintained

---

## 🐛 TEST CASE 16: CONSOLE ERRORS

### Throughout All Testing:
Regularly check browser console for errors

1. [ ] Open F12 → Console tab
2. [ ] Look for red error messages
3. [ ] Look for any JavaScript exceptions

### Expected Result:
- [ ] ❌ NO red error messages
- [ ] [ ] NO network errors (404, 500 except expected tests)
- [ ] ⚠️ Yellow warnings are acceptable (deprecation notices, etc.)

---

## ✨ BONUS: ADVANCED TESTING

### Test Multi-user Behavior:
1. [ ] Open two browser tabs
2. [ ] Log in as different users in each tab
3. [ ] Create habits/tasks in both
4. [ ] Verify data is user-specific

### Expected Result:
- [ ] ✅ User A sees only their data
- [ ] ✅ User B sees only their data
- [ ] ✅ No data mixing

### Test Concurrent Updates:
1. [ ] Create habit in Tab A
2. [ ] Without refreshing, check Tab B
3. [ ] Refresh Tab B

### Expected Result:
- [ ] ✅ New habit appears after refresh
- [ ] ✅ Real-time or refresh-based sync works

---

## 📝 SUMMARY CHECKLIST

### Critical Features:
- [ ] ✅ Registration works
- [ ] ✅ Login works
- [ ] ✅ Habits can be created and completed
- [ ] ✅ Tasks can be created and completed
- [ ] ✅ Focus sessions work
- [ ] ✅ Timetable can be managed
- [ ] ✅ Leaderboard displays
- [ ] ✅ Badges/achievements display
- [ ] ✅ Logout works
- [ ] ✅ Data persists

### Quality Checks:
- [ ] ✅ No console errors
- [ ] ✅ Professional UI
- [ ] ✅ All buttons functional
- [ ] ✅ Forms validate input
- [ ] ✅ Error messages helpful
- [ ] ✅ Responsive design
- [ ] ✅ Navigation works

### Security:
- [ ] ✅ Token stored properly
- [ ] ✅ Protected routes enforced
- [ ] ✅ Logout clears session
- [ ] ✅ No data leaks

---

## 🎯 TESTING PRIORITY

**MUST TEST (Critical):**
1. Registration & Login
2. Create Habits
3. Complete Habits/Tasks
4. Logout & Security
5. Data Persistence

**SHOULD TEST (Important):**
6. Focus Sessions
7. Timetable
8. Leaderboard
9. Achievements
10. Error Handling

**NICE TO TEST (Polish):**
11. UI/UX
12. Responsiveness
13. Multi-user
14. Performance

---

## 🎉 SUBMISSION READINESS

After completing all tests, verify:
- [ ] All critical features work
- [ ] No blocking bugs
- [ ] Data persists correctly
- [ ] Security measures in place
- [ ] UI looks professional
- [ ] No console errors

**If all items checked:** ✅ **READY FOR SUBMISSION!**

---

**Last Updated:** March 31, 2026  
**Status:** Ready for Manual Testing
