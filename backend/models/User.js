//models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  displayName: { type: String, required: true },
  username: { type: String, required: true, unique: true},
  password: { type: String, required: true },
  phone: { type: String,  unique: true, sparse: true}, //sms
  email: { type: String,  unique: true, sparse: true, lowercase: true },     //just added this for nolemailer
  role: { type:String, enum:['user','admin'] , default:'user'}
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
 