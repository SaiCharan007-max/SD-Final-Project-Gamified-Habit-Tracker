import { validationResult } from "express-validator";
import { registerUser, loginUser } from "../services/auth.service.js";

export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const errors = validationResult(req);
        if (!erros.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const user = await registerUser({ name: username, email, password });
        return res.status(201).json({
            data: user
        });
    } catch (err) {
        next(err);
    }
}

export const login = async (req, res, next) => {
    try {
        
        const { email, password } = req.body;
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const result = await loginUser({ email, password });
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}