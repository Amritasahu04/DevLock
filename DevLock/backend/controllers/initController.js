import User from "../models/User.js";

export const initUser = async (req, res) => {
  try {
    // Create a new anonymous user
    const user = await User.create({
      otpInbox: [],
      isPremium: false,
    });

    res.json({ userId: user._id.toString() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

