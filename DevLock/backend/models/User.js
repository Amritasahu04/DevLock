import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Allow multiple null values
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: false, minlength: 8, select: false },
    isPremium: { type: Boolean, default: false },
    otpInbox: [
      {
        aliasId: { type: mongoose.Schema.Types.ObjectId, ref: "Alias" },
        sender: String,
        content: String,
        otp: String,
        receivedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const doc = this.toObject();
  delete doc.password;
  return doc;
};

export default mongoose.model("User", userSchema);