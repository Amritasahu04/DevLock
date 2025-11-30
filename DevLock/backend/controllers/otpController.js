import User from "../models/User.js";
import Alias from "../models/Alias.js";

export const receiveOTP = async (req, res) => {
  try {
    const { aliasId, content, sender, userId, alias } = req.body;
    
    // Extract OTP from content
    const otp = content.match(/\b\d{4,8}\b/)?.[0] || null;
    
    let targetUserId = userId;
    let targetAliasId = aliasId;

    // If userId is not provided, find it from the alias
    if (!targetUserId) {
      // Try to find alias by alias string (for webhook calls)
      if (alias) {
        const foundAlias = await Alias.findOne({ alias });
        if (foundAlias) {
          targetUserId = foundAlias.userId.toString();
          targetAliasId = foundAlias._id.toString();
        } else {
          return res.status(404).json({ error: "Alias not found" });
        }
      } else if (aliasId) {
        // Find alias by ID and get userId from it
        const foundAlias = await Alias.findById(aliasId);
        if (foundAlias) {
          targetUserId = foundAlias.userId.toString();
          targetAliasId = foundAlias._id.toString();
        } else {
          return res.status(404).json({ error: "Alias not found" });
        }
      } else {
        return res.status(400).json({ error: "Either userId, aliasId, or alias is required" });
      }
    } else {
      // If userId is provided, verify alias belongs to user
      if (aliasId) {
        const foundAlias = await Alias.findOne({ _id: aliasId, userId: targetUserId });
        if (!foundAlias) {
          return res.status(404).json({ error: "Alias not found or does not belong to user" });
        }
        targetAliasId = foundAlias._id.toString();
      } else if (alias) {
        // Find alias by string and verify it belongs to user
        const foundAlias = await Alias.findOne({ alias, userId: targetUserId });
        if (!foundAlias) {
          return res.status(404).json({ error: "Alias not found or does not belong to user" });
        }
        targetAliasId = foundAlias._id.toString();
      } else {
        return res.status(400).json({ error: "aliasId or alias is required" });
      }
    }

    // Add OTP to user's otpInbox
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otpMessage = {
      aliasId: targetAliasId,
      sender: sender || "Unknown",
      content,
      otp,
      receivedAt: new Date(),
    };

    user.otpInbox.push(otpMessage);
    await user.save();

    res.json(otpMessage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getOTPs = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const user = await User.findById(userId).populate("otpInbox.aliasId");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.otpInbox || []);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getOTP = async (req, res) => {
  try {
    const { userId } = req.query;
    const { aliasId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Filter OTPs by aliasId
    const otps = user.otpInbox.filter(
      (otp) => otp.aliasId?.toString() === aliasId
    );

    res.json(otps);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


