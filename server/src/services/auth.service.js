import bcrypt from "bcrypt";
import * as authRepository from "../repositories/auth.repository.js";
import * as statsRepository from "../repositories/stats.repository.js";
import AppError from "../utils/AppError.js";
import jwt from "jsonwebtoken";
import { initializePuzzleForUser } from "./puzzle.service.js";

export const registerUser = async ({ name, email, password }) => {

    const normalisedEmail = email.trim().toLowerCase();

    const existingUser = await authRepository.getUserByEmail(normalisedEmail);
    if (existingUser) {
        throw new AppError("User Already Registered", 409);
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await authRepository.registerUser({ name, email: normalisedEmail, password_hash });


    await statsRepository.createUserStats({
        userId: result.id,
        total_points: 0,
        tasks_completed: 0,
        habits_completed: 0,
        current_login_streak: 0
    });

    // Generate JWT token for immediate login after registration
    const token = jwt.sign(
        {
            userId: result.id,
            name: result.name,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );

    return {
        token,
        userId: result.id,
        user: {
            id: result.id,
            name: result.name,
            email: result.email,
        }
    };
}

export const loginUser = async ({ email, password }) => {

    const normalizedEmail = email.trim().toLowerCase();

    const user = await authRepository.getUserByEmail(normalizedEmail);

    if (!user)
        throw new AppError("Invalid email or password", 401);

    const password_hash = user.password_hash;

    const isCorrectPassword = await bcrypt.compare(password, password_hash);

    if (!isCorrectPassword)
        throw new AppError("Invalid email or password", 401);

    const token = jwt.sign(
        {
            userId: user.id,
            name: user.name,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        }
    };
}
