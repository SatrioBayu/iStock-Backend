const { Admin } = require("../models");
const jwt = require("jsonwebtoken");

const authorize = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(401).json({
        errors: [
          {
            code: "E-003",
            message: "Not Authorized",
          },
        ],
      });
    }

    const token = auth.split(" ")[1];
    const decoded = decodeToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      errors: [
        {
          code: "E-004",
          message: error.message,
        },
      ],
    });
  }
};

const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const user = req.user; // sudah di-set di authorize
      if (!user) {
        return res.status(401).json({
          errors: [{ code: "E-005", message: "User not found in request" }],
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          errors: [{ code: "E-006", message: "Forbidden: insufficient role" }],
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        errors: [{ code: "E-007", message: error.message }],
      });
    }
  };
};

const handleLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Admin.findOne({
      where: { username },
    });
    if (!user) {
      return res.status(404).json({
        errors: [
          {
            code: "E-001",
            message: "Wrong Username/Password",
          },
        ],
      });
    }
    const isPasswordValid = password === user.password ? true : false;
    if (!isPasswordValid) {
      return res.status(401).json({
        errors: [
          {
            code: "E-001",
            message: "Wrong Username/Password",
          },
        ],
      });
    }
    const token = createToken(user);
    return res.status(200).json({
      token,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET
  );
};

const decodeToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { handleLogin, authorize, checkRole };
