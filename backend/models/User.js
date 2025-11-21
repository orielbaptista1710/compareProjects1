const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.index({  role: 1, username:1,password:1, displayName: 1 });

module.exports = mongoose.model('User', userSchema);
 