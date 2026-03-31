#!/usr/bin/env node

/**
 * Comprehensive API Testing Script for HabitQuest
 * Tests all endpoints systematically
 */

const BASE_URL = "http://localhost:3137/api";
let testToken = null;
let userId = null;
let habitId = null;
let taskId = null;
let focusSessionId = null;

// Color output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function apiCall(method, endpoint, body = null, token = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" }
    };
    
    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }
    
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        return { status: response.status, data, ok: response.ok };
    } catch (error) {
        return { status: 0, error: error.message, ok: false };
    }
}

async function test(name, fn) {
    try {
        log('cyan', `\n► Testing: ${name}`);
        await fn();
        log('green', `✓ PASSED: ${name}`);
    } catch (error) {
        log('red', `✗ FAILED: ${name}`);
        log('red', `  Error: ${error.message}`);
    }
}

// ============================================
// TEST 1: Health Check
// ============================================
async function runHealthCheck() {
    await test('Health Endpoint', async () => {
        const response = await fetch(`${BASE_URL.replace('/api', '')}/health`);
        const data = await response.json();
        if (!data.status) throw new Error('No status in response');
        log('yellow', `  Status: ${data.status}`);
    });
}

// ============================================
// TEST 2: Authentication
// ============================================
async function runAuthTests() {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = "testPassword123";
    
    // Register
    await test('Register - Valid User', async () => {
        const result = await apiCall('POST', '/auth/register', {
            username: `testuser_${Date.now()}`,
            email: testEmail,
            password: testPassword
        });
        if (result.status !== 201) throw new Error(`Status ${result.status}`);
        if (!result.data.token) throw new Error('No token in response');
        testToken = result.data.token;
        if (!result.data.userId) throw new Error('No userId in response');
        userId = result.data.userId;
        log('yellow', `  Token Generated: ${testToken.substring(0, 20)}...`);
        log('yellow', `  User ID: ${userId}`);
    });

    // Login
    await test('Login - Valid Credentials', async () => {
        const result = await apiCall('POST', '/auth/login', {
            email: testEmail,
            password: testPassword
        });
        if (result.status !== 200) throw new Error(`Status ${result.status}`);
        if (!result.data.token) throw new Error('No token in response');
        log('yellow', `  Login successful`);
    });

    // Login with invalid password
    await test('Login - Invalid Password (Should Fail)', async () => {
        const result = await apiCall('POST', '/auth/login', {
            email: testEmail,
            password: "wrongPassword"
        });
        if (result.status === 200) throw new Error('Should have failed');
        log('yellow', `  Correctly rejected (Status: ${result.status})`);
    });
}

// ============================================
// TEST 3: Habits
// ============================================
async function runHabitTests() {
    // Create Habit
    await test('Create Habit - Valid Data', async () => {
        const result = await apiCall('POST', '/habits/create', {
            name: 'Morning Meditation',
            frequency: 'daily',
            target_count: 30
        }, testToken);
        if (result.status !== 201) throw new Error(`Status ${result.status}`);
        if (!result.data.data?.id) throw new Error('No habit ID in response');
        habitId = result.data.data.id;
        log('yellow', `  Habit ID: ${habitId}`);
    });

    // Get Habits
    await test('Get Habits - User Habits', async () => {
        const result = await apiCall('GET', '/habits', null, testToken);
        if (result.status !== 200) throw new Error(`Status ${result.status}`);
        if (!Array.isArray(result.data.data)) throw new Error('Not an array');
        log('yellow', `  Found ${result.data.data.length} habits`);
    });

    // Complete Habit
    await test('Complete Habit - Mark as Done', async () => {
        if (!habitId) throw new Error('No habitId available');
        const result = await apiCall('POST', `/habits/complete/${habitId}`, {}, testToken);
        if (result.status !== 200) throw new Error(`Status ${result.status}`);
        log('yellow', `  Habit marked complete`);
    });

    // Create Habit - Invalid Data
    await test('Create Habit - Invalid Data (Should Fail)', async () => {
        const result = await apiCall('POST', '/habits/create', {
            name: '',
            frequency: 'invalid',
            target_count: -5
        }, testToken);
        if (result.status === 201) throw new Error('Should have failed');
        log('yellow', `  Correctly rejected (Status: ${result.status})`);
    });
}

// ============================================
// TEST 4: Tasks
// ============================================
async function runTaskTests() {
    // Create Task
    await test('Create Task - Valid Data', async () => {
        const result = await apiCall('POST', '/tasks', {
            title: 'Fix Frontend Bug',
            description: 'Debug login issue',
            priority: 2,
            due_date: '2026-04-15'
        }, testToken);
        if (result.status !== 201) throw new Error(`Status ${result.status}`);
        if (!result.data.data?.id) throw new Error('No task ID in response');
        taskId = result.data.data.id;
        log('yellow', `  Task ID: ${taskId}`);
    });

    // Get Tasks
    await test('Get Tasks - User Tasks', async () => {
        const result = await apiCall('GET', '/tasks', null, testToken);
        if (result.status !== 200) throw new Error(`Status ${result.status}`);
        if (!Array.isArray(result.data.data)) throw new Error('Not an array');
        log('yellow', `  Found ${result.data.data.length} tasks`);
    });

    // Complete Task
    await test('Complete Task - Mark as Done', async () => {
        if (!taskId) throw new Error('No taskId available');
        const result = await apiCall('POST', `/tasks/${taskId}/complete`, {}, testToken);
        if (result.status !== 200) throw new Error(`Status ${result.status}`);
        log('yellow', `  Task marked complete`);
    });
}

// ============================================
// TEST 5: Focus Sessions
// ============================================
async function runFocusTests() {
    // Start Focus Session
    await test('Start Focus Session', async () => {
        const result = await apiCall('POST', '/focus/start', {}, testToken);
        if (result.status !== 201) throw new Error(`Status ${result.status}`);
        if (!result.data.data?.id) throw new Error('No session ID in response');
        focusSessionId = result.data.data.id;
        log('yellow', `  Session ID: ${focusSessionId}`);
    });

    // Stop Focus Session
    await test('Stop Focus Session', async () => {
        if (!focusSessionId) throw new Error('No focusSessionId available');
        // Wait a moment to get some duration
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = await apiCall('POST', `/focus/stop/${focusSessionId}`, {}, testToken);
        if (result.status !== 200) throw new Error(`Status ${result.status}`);
        log('yellow', `  Session stopped`);
    });
}

// ============================================
// TEST 6: Gamification - Badges
// ============================================
async function runGamificationTests() {
    // Get Badges
    await test('Get User Badges', async () => {
        const result = await apiCall('GET', '/gamification/badges', null, testToken);
        if (result.status !== 200) throw new Error(`Status ${result.status}`);
        if (!Array.isArray(result.data.data)) throw new Error('Not an array');
        log('yellow', `  Found ${result.data.data.length} badges`);
    });

    // Check and Award Badges
    await test('Check and Award Badges', async () => {
        const result = await apiCall('POST', '/gamification/badges/check', {}, testToken);
        if (result.status !== 200) throw new Error(`Status ${result.status}`);
        if (Array.isArray(result.data.data)) {
            log('yellow', `  ${result.data.data.length} new badges awarded`);
        }
    });
}

// ============================================
// TEST 7: Leaderboard
// ============================================
async function runLeaderboardTests() {
    await test('Get Leaderboard', async () => {
        const result = await apiCall('GET', '/leaderboard', null, testToken);
        if (result.status !== 200) throw new Error(`Status ${result.status}`);
        if (!Array.isArray(result.data.data)) throw new Error('Not an array');
        log('yellow', `  Found ${result.data.data.length} users on leaderboard`);
    });
}

// ============================================
// TEST 8: Timetable
// ============================================
async function runTimetableTests() {
    // Create Timetable Entry
    await test('Create Timetable Entry', async () => {
        const result = await apiCall('POST', '/timetable', {
            day_of_week: 1,
            title: 'Morning Standup',
            start_time: '09:00:00',
            end_time: '09:30:00'
        }, testToken);
        if (result.status !== 201) throw new Error(`Status ${result.status}`);
        log('yellow', `  Timetable entry created`);
    });

    // Get Timetable
    await test('Get Timetable', async () => {
        const result = await apiCall('GET', '/timetable', null, testToken);
        if (result.status !== 200) throw new Error(`Status ${result.status}`);
        if (!Array.isArray(result.data.data)) throw new Error('Not an array');
        log('yellow', `  Found ${result.data.data.length} timetable entries`);
    });
}

// ============================================
// TEST 9: Auth Required Endpoints (No Token)
// ============================================
async function runAuthRequiredTests() {
    await test('Protected Endpoint - No Token (Should Fail)', async () => {
        const result = await apiCall('GET', '/habits', null);
        if (result.status === 200) throw new Error('Should have failed without token');
        log('yellow', `  Correctly rejected (Status: ${result.status})`);
    });
}

// ============================================
// Main Test Suite
// ============================================
async function runAllTests() {
    log('blue', '═══════════════════════════════════════════════════════════');
    log('blue', '        HabitQuest API Testing Suite - Full Report');
    log('blue', '═══════════════════════════════════════════════════════════');

    try {
        // Phase 1: Health
        log('cyan', '\n📌 PHASE 1: Server Health Check');
        await runHealthCheck();

        // Phase 2: Auth
        log('cyan', '\n📌 PHASE 2: Authentication Tests');
        await runAuthTests();

        // Phase 3: Habits
        log('cyan', '\n📌 PHASE 3: Habit Management Tests');
        await runHabitTests();

        // Phase 4: Tasks
        log('cyan', '\n📌 PHASE 4: Task Management Tests');
        await runTaskTests();

        // Phase 5: Focus
        log('cyan', '\n📌 PHASE 5: Focus Session Tests');
        await runFocusTests();

        // Phase 6: Gamification
        log('cyan', '\n📌 PHASE 6: Gamification & Badge Tests');
        await runGamificationTests();

        // Phase 7: Leaderboard
        log('cyan', '\n📌 PHASE 7: Leaderboard Tests');
        await runLeaderboardTests();

        // Phase 8: Timetable
        log('cyan', '\n📌 PHASE 8: Timetable Tests');
        await runTimetableTests();

        // Phase 9: Auth Required
        log('cyan', '\n📌 PHASE 9: Security Tests (Auth Required Endpoints)');
        await runAuthRequiredTests();

    } catch (error) {
        log('red', `\nFatal Error: ${error.message}`);
    }

    log('blue', '\n═══════════════════════════════════════════════════════════');
    log('blue', '                   Testing Complete');
    log('blue', '═══════════════════════════════════════════════════════════\n');
    process.exit(0);
}

// Run tests
runAllTests();
