import Alias from "../models/Alias.js";
import User from "../models/User.js";
import generateAlias from "../utils/generateAlias.js";
import { getAliasMeta } from "../utils/aliasHelpers.js";

export const createAlias = async (req, res) => {
  try {
    const { userId, type, expiryDuration: clientExpiryDuration } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = Date.now();

    // expiryDuration is provided by the client in milliseconds (e.g. 1h, 6h, 24h, 7d)
    const expiryDuration =
      typeof clientExpiryDuration === "number" && clientExpiryDuration > 0
        ? clientExpiryDuration
        : 3600000; // fallback to 1 hour if not provided

    const expiresAt = new Date(now + expiryDuration);

    const alias = await Alias.create({
      alias: generateAlias(userId),
      userId: userId,
      type: type || "email",
      createdAt: new Date(now),
      expiresAt,
      expiryDuration,
      isPremium: user?.isPremium ?? false,
    });

    const meta = getAliasMeta(alias);

    res.json({ ...alias.toObject(), ...meta });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAliases = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const aliases = await Alias.find({ userId });

    const enrichedAliases = aliases.map((alias) => {
      const meta = getAliasMeta(alias);
      return { ...alias.toObject(), ...meta };
    });

    res.json(enrichedAliases);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteAlias = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Only delete aliases that belong to the user
    const alias = await Alias.findOneAndDelete({
      _id: id,
      userId: userId,
    });

    if (!alias) {
      return res
        .status(404)
        .json({ error: "Alias not found or does not belong to user" });
    }

    return res.json({ success: true, message: "Alias deleted" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getAliasStats = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const aliases = await Alias.find({ userId });

    const metas = aliases.map((alias) => getAliasMeta(alias));

    const totalCreated = metas.length;
    const expiredCount = metas.filter((m) => m.isExpired).length;
    const activeCount = totalCreated - expiredCount;

    res.json({
      totalCreated,
      activeCount,
      expiredCount,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

