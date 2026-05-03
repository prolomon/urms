const roleMiddleware = (roles) => {
  return (req, res, next) => {
    // This is a placeholder for role-based access control.
    // In a real application, you would get the user's roles from the request object (e.g., from a JWT).
    const userRoles = ['user', "admin"]; // Example user roles

    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ message: 'Forbidden: You do not have the required role.' });
    }

    next();
  };
};

export {roleMiddleware};
