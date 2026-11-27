// backend/fakeTests/listingMedia.test.js
//
// Photo/brochure uploads for listings (Cloudflare R2):
//   - services/mediaStorage.js signs links the way S3/R2 expects
//   - POST …/media/sign only serves accounts that may post, within the limits
//   - saving a listing only accepts the poster's own finished uploads
// R2 itself is never contacted: headObject is replaced with a fake.
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from "vitest";
import request from "supertest";

const { verifyIdToken, headObject } = vi.hoisted(() => ({ verifyIdToken: vi.fn(), headObject: vi.fn() }));
vi.mock("../config/firebaseAdmin.js", () => ({
  default: { auth: () => ({ verifyIdToken }) },
}));
vi.mock("../services/mediaStorage.js", async (importOriginal) => ({
  ...(await importOriginal()),
  headObject,
}));

const { default: app } = await import("./helpers/roleSystemApp.js");
const { startTestDb, stopTestDb, clearTestDb } = await import("./helpers/db.js");
const { CONSENT, createCustomer, createUser, createProperty, signToken } = await import("./helpers/fixtures.js");
const { default: Property } = await import("../models/Property.js");
const { presignUrl } = await vi.importActual("../services/mediaStorage.js");
const { youtubeVideoId } = await import("../validators/propertyInputValidator.js");

const R2_ENV = {
  ENABLE_MEDIA_UPLOAD: "true",
  R2_ACCOUNT_ID: "testaccount",
  R2_ACCESS_KEY_ID: "test-key-id",
  R2_SECRET_ACCESS_KEY: "test-secret",
  R2_BUCKET: "listing-media",
  R2_PUBLIC_BASE_URL: "https://media.example.test",
};
const MEDIA = "https://media.example.test";

const acceptTestTokens = () =>
  verifyIdToken.mockImplementation(async (token) => {
    if (!token.startsWith("token-for-")) {
      throw Object.assign(new Error("bad token"), { code: "auth/argument-error" });
    }
    return { uid: token.slice("token-for-".length) };
  });

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(() => {
  Object.assign(process.env, R2_ENV);
  acceptTestTokens();
  headObject.mockResolvedValue({ size: 300_000, contentType: "image/webp" });
});
afterEach(async () => {
  await clearTestDb();
  vi.clearAllMocks();
  for (const name of Object.keys(R2_ENV)) delete process.env[name];
});

const bearer = (customer) => `Bearer token-for-${customer.firebaseUid}`;
const verifiedCustomer = (overrides = {}) => createCustomer({ emailVerified: true, ...overrides });

const CUSTOMER_SIGN = "/api/customers/listings/media/sign";
const DEVELOPER_SIGN = "/api/properties/media/sign";
const PHOTO = { kind: "image", contentType: "image/webp", size: 300_000 };

const LISTING = {
  ...CONSENT,
  title: "2BHK in Andheri",
  description: "Sunny flat, close to the station.",
  state: "Maharashtra",
  city: "Mumbai",
  locality: "Andheri",
  address: "12 Test Road",
  pincode: "400053",
  price: 9500000,
  propertyType: "Villa",
  furnishing: "Unfurnished",
  possessionStatus: "Ready to Move",
  unitsAvailable: 1,
};

const ownFile = (customer, name = "abc-image.webp") => `${MEDIA}/listings/customer/${customer._id}/${name}`;

describe("presignUrl", () => {
  // "Authenticating Requests: Using Query Parameters (AWS Signature Version 4)",
  // the worked example in the Amazon S3 API reference.
  it("produces the signature from the AWS S3 documentation example", () => {
    const url = presignUrl({
      method: "GET",
      url: "https://examplebucket.s3.amazonaws.com/test.txt",
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      region: "us-east-1",
      expiresIn: 86400,
      now: new Date("2013-05-24T00:00:00Z"),
    });
    expect(url).toContain(
      "X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404"
    );
    expect(url).toContain("X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request");
  });
});

describe("POST media/sign", () => {
  it("rejects a request with no login (customer and developer)", async () => {
    verifyIdToken.mockRejectedValue(Object.assign(new Error("bad"), { code: "auth/argument-error" }));
    const customerRes = await request(app).post(CUSTOMER_SIGN).send({ files: [PHOTO] });
    const developerRes = await request(app).post(DEVELOPER_SIGN).send({ files: [PHOTO] });
    expect(customerRes.status).toBe(401);
    expect(developerRes.status).toBe(401);
  });

  it("rejects a customer who may not post (email not verified)", async () => {
    const customer = await createCustomer({ emailVerified: false });
    const res = await request(app).post(CUSTOMER_SIGN).set("Authorization", bearer(customer)).send({ files: [PHOTO] });
    expect(res.status).toBe(403);
  });

  it("answers 503 while uploads are switched off", async () => {
    process.env.ENABLE_MEDIA_UPLOAD = "false";
    const customer = await verifiedCustomer();
    const res = await request(app).post(CUSTOMER_SIGN).set("Authorization", bearer(customer)).send({ files: [PHOTO] });
    expect(res.status).toBe(503);
  });

  it("gives a write-once link inside the caller's own folder", async () => {
    const customer = await verifiedCustomer();
    const res = await request(app)
      .post(CUSTOMER_SIGN)
      .set("Authorization", bearer(customer))
      .send({ files: [PHOTO, { kind: "thumb", contentType: "image/jpeg", size: 20_000 }] });

    expect(res.status).toBe(200);
    expect(res.body.uploads).toHaveLength(2);
    const [photo, thumb] = res.body.uploads;
    expect(photo.url).toMatch(new RegExp(`^${MEDIA}/listings/customer/${customer._id}/[0-9a-f-]{36}-image\\.webp$`));
    expect(thumb.url).toMatch(/-thumb\.jpg$/);

    const upload = new URL(photo.uploadUrl);
    expect(upload.host).toBe("testaccount.r2.cloudflarestorage.com");
    expect(upload.pathname.startsWith(`/listing-media/listings/customer/${customer._id}/`)).toBe(true);
    // Size, type and "don't overwrite" are all part of the signature.
    expect(upload.searchParams.get("X-Amz-SignedHeaders")).toBe("content-length;content-type;host;if-none-match");
    expect(upload.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(photo.headers).toEqual({ "Content-Type": "image/webp", "If-None-Match": "*" });
    // The secret never leaves the server.
    expect(JSON.stringify(res.body)).not.toContain("test-secret");
  });

  it("works for a developer, in the developer's folder", async () => {
    const dev = await createUser();
    const res = await request(app)
      .post(DEVELOPER_SIGN)
      .set("Authorization", `Bearer ${signToken(dev)}`)
      .send({ files: [{ kind: "brochure", contentType: "application/pdf", size: 2_000_000 }] });
    expect(res.status).toBe(200);
    expect(res.body.uploads[0].url).toContain(`/listings/user/${dev._id}/`);
  });

  it.each([
    ["a file over the size limit", { files: [{ ...PHOTO, size: 5_000_000 }] }],
    ["a type that isn't allowed", { files: [{ ...PHOTO, contentType: "image/svg+xml" }] }],
    ["a PDF sent as a photo", { files: [{ ...PHOTO, contentType: "application/pdf" }] }],
    ["an unknown kind", { files: [{ ...PHOTO, kind: "video" }] }],
    ["a client-chosen file name", { files: [{ ...PHOTO, key: "listings/customer/other/x.webp" }] }],
    ["no files", { files: [] }],
    ["too many files at once", { files: Array(5).fill(PHOTO) }],
  ])("refuses %s", async (_label, body) => {
    const customer = await verifiedCustomer();
    const res = await request(app).post(CUSTOMER_SIGN).set("Authorization", bearer(customer)).send(body);
    expect(res.status).toBe(400);
  });

  it("refuses a brochure for an owner listing", async () => {
    const customer = await verifiedCustomer();
    const res = await request(app)
      .post(CUSTOMER_SIGN)
      .set("Authorization", bearer(customer))
      .send({ files: [{ kind: "brochure", contentType: "application/pdf", size: 1000 }] });
    expect(res.status).toBe(403);
  });
});

describe("saving a listing with media", () => {
  const post = (customer, media) =>
    request(app).post("/api/customers/listings").set("Authorization", bearer(customer)).send({ ...LISTING, ...media });

  it("saves the poster's own uploaded photos with their category", async () => {
    const customer = await verifiedCustomer();
    headObject.mockImplementation(async (key) =>
      key.endsWith("-thumb.webp") ? { size: 20_000, contentType: "image/webp" } : { size: 300_000, contentType: "image/webp" }
    );
    const photo = { url: ownFile(customer), thumbnail: ownFile(customer, "abc-thumb.webp"), category: "kitchen" };
    const res = await post(customer, { galleryImages: [photo], coverImage: { url: photo.url, thumbnail: photo.thumbnail } });

    expect(res.status).toBe(201);
    const saved = await Property.findById(res.body.property._id).lean();
    expect(saved.galleryImages[0]).toMatchObject(photo);
    expect(saved.coverImage.url).toBe(photo.url);
    expect(headObject).toHaveBeenCalledWith(`listings/customer/${customer._id}/abc-image.webp`);
  });

  it("refuses a photo from another account's folder", async () => {
    const customer = await verifiedCustomer();
    const other = await verifiedCustomer();
    const res = await post(customer, { galleryImages: [{ url: ownFile(other) }] });
    expect(res.status).toBe(400);
    expect(headObject).not.toHaveBeenCalled();
    expect(await Property.countDocuments()).toBe(0);
  });

  it("refuses a new photo link that isn't from our uploads", async () => {
    const customer = await verifiedCustomer();
    const res = await post(customer, { galleryImages: [{ url: "https://res.cloudinary.com/someone/image/upload/x.jpg" }] });
    expect(res.status).toBe(400);
  });

  it("refuses a link that tries to step out of the folder", async () => {
    const customer = await verifiedCustomer();
    const res = await post(customer, {
      galleryImages: [{ url: `${MEDIA}/listings/customer/${customer._id}/../../x.webp` }],
    });
    expect(res.status).toBe(400);
    expect(headObject).not.toHaveBeenCalled();
  });

  it("refuses a photo that was never uploaded", async () => {
    const customer = await verifiedCustomer();
    headObject.mockResolvedValue(null);
    const res = await post(customer, { galleryImages: [{ url: ownFile(customer) }] });
    expect(res.status).toBe(400);
  });

  it.each([
    ["too large", { size: 9_000_000, contentType: "image/webp" }],
    ["the wrong type", { size: 1000, contentType: "text/html" }],
  ])("refuses a stored file that is %s", async (_label, stored) => {
    const customer = await verifiedCustomer();
    headObject.mockResolvedValue(stored);
    const res = await post(customer, { galleryImages: [{ url: ownFile(customer) }] });
    expect(res.status).toBe(400);
    expect(await Property.countDocuments()).toBe(0);
  });

  it("answers 503 and saves nothing when storage can't be reached", async () => {
    const customer = await verifiedCustomer();
    headObject.mockRejectedValue(new Error("timeout"));
    const res = await post(customer, { galleryImages: [{ url: ownFile(customer) }] });
    expect(res.status).toBe(503);
    expect(await Property.countDocuments()).toBe(0);
  });

  it("lets an older listing keep the photos it already had when edited", async () => {
    const customer = await verifiedCustomer();
    const old = "https://res.cloudinary.com/demo/image/upload/old.jpg";
    const listing = await createProperty({
      userId: customer._id,
      ownerModel: "Customer",
      listedBy: "owner",
      developerName: undefined,
      galleryImages: [{ url: old }],
    });
    const res = await request(app)
      .put(`/api/customers/listings/${listing._id}`)
      .set("Authorization", bearer(customer))
      .send({ ...CONSENT, title: "A new title for the flat", galleryImages: [{ url: old }, { url: ownFile(customer) }] });

    expect(res.status).toBe(200);
    expect(headObject).toHaveBeenCalledTimes(1); // only the new photo is checked
    expect((await Property.findById(listing._id).lean()).galleryImages).toHaveLength(2);
  });

  it("removes the cover photo and brochure when the form sends them empty", async () => {
    const customer = await verifiedCustomer();
    const listing = await createProperty({
      userId: customer._id,
      ownerModel: "Customer",
      listedBy: "owner",
      developerName: undefined,
      coverImage: { url: "https://res.cloudinary.com/demo/image/upload/cover.jpg" },
      brochure: { url: "https://res.cloudinary.com/demo/raw/upload/b.pdf" },
    });
    const res = await request(app)
      .put(`/api/customers/listings/${listing._id}`)
      .set("Authorization", bearer(customer))
      .send({ ...CONSENT, coverImage: { url: "" }, brochure: { url: "" } });

    expect(res.status).toBe(200);
    expect(res.body.unchanged).toBeUndefined();
    const saved = await Property.findById(listing._id).lean();
    expect(saved.coverImage?.url).toBeUndefined();
    expect(saved.brochure?.url).toBeUndefined();
  });

  it("refuses a photo category that doesn't exist", async () => {
    const customer = await verifiedCustomer();
    const res = await post(customer, { galleryImages: [{ url: ownFile(customer), category: "garage" }] });
    expect(res.status).toBe(400);
  });
});

describe("YouTube links", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/channel/UC123", null],
    ["https://www.youtube.com/redirect?q=https://evil.test", null],
    ["https://www.youtube.com/watch?v=short", null],
    ["https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ", null],
    ["not a link", null],
  ])("%s → %s", (link, id) => {
    expect(youtubeVideoId(link)).toBe(id);
  });

  it("refuses a YouTube link that isn't one video", async () => {
    const customer = await verifiedCustomer();
    const res = await request(app)
      .post("/api/customers/listings")
      .set("Authorization", bearer(customer))
      .send({ ...LISTING, virtualTours: [{ type: "video", url: "https://www.youtube.com/redirect?q=https://evil.test" }] });
    expect(res.status).toBe(400);
  });
});
