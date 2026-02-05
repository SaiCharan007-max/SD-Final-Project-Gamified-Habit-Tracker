import pool from "../config/db.js";

export const getUserByEmail = async (email) => {
    const result = await pool.query(
        `
            SELECT id, name, email, password_hash
            FROM users 
            WHERE email=$1
        `,
        [email]
    );

    return result.rows[0] || null;
}

const registerUser = async ({ name, email, password_hash }) => {
    const result = await pool.query(
        ` 
            INSERT INTO users name, email, password_hash
            VALUES ($1, $2, $3)
            RETURNING id, name, email
        `,
        [name, email, password_hash]
    );

    return result.rows[0] || null;
}
