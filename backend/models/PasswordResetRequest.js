import mongoose from 'mongoose';

const passwordResetRequestSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    note: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ['pending', 'contacted', 'resolved'], default: 'pending' },
  },
  { timestamps: true }
);

passwordResetRequestSchema.index({ status: 1 });
passwordResetRequestSchema.index({ createdAt: -1 });

export default mongoose.model('PasswordResetRequest', passwordResetRequestSchema);