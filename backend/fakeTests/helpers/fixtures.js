// backend/fakeTests/helpers/fixtures.js
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import Property from "../../models/Property.js";

process.env.JWT_SECRET ||= "test-jwt-secret-key";

let counter = 0;
const unique = (prefix) => `${prefix}${Date.now()}${++counter}`;

export async function createUser(overrides = {}) {
  return User.create({
    displayName: unique("User"),
    username: unique("user"),
    password: "Password123!",
    role: "user",
    ...overrides,
  });
}

export async function createAdminUser(overrides = {}) {
  return createUser({ role: "admin", ...overrides });
}

export function signToken(user, options = {}) {
  return jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, options);
}

export async function createProperty(overrides = {}) {
  const userId = overrides.userId ?? (await createUser())._id;

  return Property.create({
    userId,
    developerName: unique("Developer"),
    title: unique("Property"),
    description: "A test property description.",
    state: "Maharashtra",
    city: "Mumbai",
    locality: "Andheri",
    address: "123 Test Street",
    pincode: "400001",
    price: 5000000,
    propertyType: "Villa",
    status: "pending",
    ...overrides,
  });
}
