//models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  
  // clerkId: {
  //     type: String,
  //     unique: true,
  //     required: true,
  //     index: true,
  //   },
  
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


      password: { type: String, required: true },


  // --- Role & Permissions ---
    // role is source of truth here for your app logic
    // permissions array mirrors what you set in Clerk publicMetadata   //just added this for nolemailer
  role: { type:String, enum:['user','admin'] , default:'user'},
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

    isActive: {
      type: Boolean,
      default: true, // set false to soft-ban a developer without touching Clerk
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
 