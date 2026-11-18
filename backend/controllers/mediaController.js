// controllers/mediaController.js
//
// Hands out short-lived upload links for listing photos and brochures.
//
//   POST /api/properties/media/sign          [developer]
//   POST /api/customers/listings/media/sign  [owner / agent]
//
// Routes run the same auth, owner and posting gates as creating a listing, so
// only an account that may post can get a link. The file name and folder are
// chosen here (req.listingOwner), never by the client.
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { LISTED_BY } from '../constants/roles.js';
import { MEDIA_KINDS, MAX_SIGN_BATCH, UPLOAD_URL_TTL_SECONDS } from '../constants/media.js';
import {
  isMediaStorageEnabled,
  newObjectKey,
  presignUpload,
  publicUrlFor,
} from '../services/mediaStorage.js';

const signBodySchema = z
  .object({
    files: z
      .array(
        z
          .object({
            kind: z.enum(Object.keys(MEDIA_KINDS)),
            contentType: z.string().max(50),
            size: z.number().int().positive(),
          })
          .strict()
      )
      .min(1)
      .max(MAX_SIGN_BATCH),
  })
  .strict();

const signUploads = asyncHandler(async (req, res) => {
  if (!isMediaStorageEnabled()) {
    return res.status(503).json({ success: false, message: 'Uploads are not available yet.' });
  }

  const parsed = signBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid upload request.' });
  }

  const owner = req.listingOwner;
  const { files } = parsed.data;

  for (const file of files) {
    const rule = MEDIA_KINDS[file.kind];
    if (!rule.types.includes(file.contentType) || file.size > rule.maxBytes) {
      return res.status(400).json({
        success: false,
        message: 'That file is too large or not an allowed type.',
      });
    }
    // An owner sells one home; brochures are for projects and agents' listings.
    if (file.kind === 'brochure' && owner.listedBy === LISTED_BY.OWNER) {
      return res.status(403).json({ success: false, message: 'Brochures are not available for owner listings.' });
    }
  }

  const uploads = files.map(({ kind, contentType, size }) => {
    const key = newObjectKey(owner, kind, contentType);
    // uploadUrl + the headers the browser must send with the PUT
    return { kind, ...presignUpload({ key, contentType, size }), url: publicUrlFor(key) };
  });

  res.json({ success: true, expiresIn: UPLOAD_URL_TTL_SECONDS, uploads });
});

export { signUploads };
