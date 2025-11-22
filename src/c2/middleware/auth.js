export function authMiddleware(apiKey) {
    return (req, res, next) => {
        const providedKey = req.headers['x-api-key'] || req.query.apiKey;
        
        if (!providedKey || providedKey !== apiKey) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - Invalid API key'
            });
        }
        
        next();
    };
}

export function validateRequest(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }
        
        next();
    };
}
