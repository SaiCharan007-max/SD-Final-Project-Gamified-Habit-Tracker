const errorMiddleware = (err, req, res, next) => {
    console.error(err);

    // Postgres duplicate key
    if (err.code === "23505") {
        return res.status(409).json({
            success: false,
            message: "Resource already exists"
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
        message: "Internal Server Error"
    });

    next();
}

export default errorMiddleware;