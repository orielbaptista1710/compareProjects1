//models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../constants/roles.js';

const userSchema = new mongoose.Schema({
  // --- Profile ---
    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    phone: { 
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },


      // Never returned by queries unless asked for with .select('+password') (AUTH-13).
      password: { type: String, required: true, select: false },

  // --- Role & Permissions ---
    // role is source of truth here for your app logic
    // permissions array mirrors what you set in Clerk publicMetadata   //just added this for nolemailer
  // 'user' is the legacy name for 'developer' — kept valid until
  // scripts/migrateRoles.js renames existing accounts. See constants/roles.js.
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    // Switch to USER_ROLES.DEVELOPER once migrateRoles.js has run in production.
    default: USER_ROLES.LEGACY_DEVELOPER,
  },
  permissions: {
      type: [String],
      enum: [
        'manage_listings',
        'manage_users',
        'manage_developers',
        'view_analytics',
        'publish_listings',
        'manage_own_listings',
      ],
      default: ['manage_own_listings'], // safe default for new developers
    },

  // --- Developer-specific business data ---
    companyName: {
      type: String,
      trim: true,
    },

    migrationSource: {
    type: String,
    enum: ["manual", "scraper-import", "test"]
    },

    isActive: {
      type: Boolean,
      default: true, 
    },
},
{
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.index({ role: 1 });
// userSchema.index({ clerkId: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model('User', userSchema);
export default User;
 