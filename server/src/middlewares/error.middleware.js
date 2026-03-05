const errorMiddleware = (err, req, res, next) => {
    console.error(err);

    // Postgres duplicate key
    if (err.code === "23505") {
        return res.status(409).json({
            success: false,
            message: "Resource already exists"
        });
    }

    // Invalid UUID / invalid text representation
    if (err.code === "22P02") {
        return res.status(400).json({
            success: false,
            message: "Invalid ID format"
        });
    }

    // Custom operational errors
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    // Unknown errors
    return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === "development" ? err.message : "Internal Server Error"
    });
}

export default errorMiddleware;
