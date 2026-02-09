import axios from "axios";

const AUTH_BASE_URL =
  process.env.AUTH_BASE_URL || "http://igokochi-auth-service:8081";

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const response = await axios.post(`${AUTH_BASE_URL}/login`, {
      username,
      password,
    });

    if (response.status === 200) {
      const { token, isActive, isAdmin } = response.data;

      return res.status(200).json({
        message: "Login successful!",
        token,
        isActive,
        isAdmin,
      });
    }

    return res.status(response.status).json({ message: "Login failed!" });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data?.message || "Login failed",
      });
    }

    console.log("Unexpected error:", error.message);
    return res.status(500).json({ message: "An internal error occurred" });
  }
};

export const register = async (req, res) => {
  const { username, password } = req.body;

  try {
    const response = await axios.post(`${AUTH_BASE_URL}/register`, {
      username,
      password,
    });

    if (response.status === 201) {
      return res.status(201).json({ message: "successful" });
    }

    return res.status(response.status).json({ message: "Register failed!" });
  } catch (error) {
    console.log("Register error:", username, error.response?.data);
    return res
      .status(error.response?.status || 500)
      .json({ message: error.response?.data?.message || "Register failed" });
  }
};

export const changepassword = async (req, res) => {
  const { username, password } = req.body;

  try {
    const response = await axios.post(`${AUTH_BASE_URL}/changepassword`, {
      username,
      password,
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: "Internal server error" };

    console.error("Change password error:", username, message);
    return res.status(status).json(message);
  }
};
