## What's actually happening (in plain language)

Your camera **did** scan the barcode correctly — the session shows it picked up `8906010500566` (an Indian product) in a couple of seconds. The error you saw, **"Product lookup failed"**, is a different step: after reading the barcode number, the app asks the free OpenFoodFacts database "what product is this?" — and that database simply doesn't have this item on file. Most Indian/regional packaged foods aren't in it yet.

So the fix isn't the scanner — it's making the app behave nicely when the database doesn't recognize a barcode, instead of just throwing a scary red error.

## Plan

1. **Better error messages in `analyzeBarcode`** (`src/lib/scans.functions.ts`)
   - Distinguish three failure modes: network error, product-not-found (status ≠ 1 / 404), and no-ingredients-on-file.
   - Return a structured `{ notFound: true, barcode }` result instead of throwing for the "not in database" case, so the UI can react instead of showing a generic toast.

2. **Graceful UI fallback** (`src/routes/index.tsx`)
   - When `notFound` comes back, show a friendly inline card: "We scanned barcode 8906010500566, but it isn't in our food database yet. Snap a photo of the ingredients list instead — we'll analyze it the same way." with a primary button that jumps straight to the photo-upload flow (and pre-opens the file picker).
   - Keep the toast only for real errors (network, AI failure).

3. **Scanner UX polish** (`src/components/BarcodeScanner.tsx`)
   - Restrict formats to actual product barcodes (EAN-13, EAN-8, UPC-A, UPC-E, CODE-128) by passing `DecodeHintType.POSSIBLE_FORMATS` to `BrowserMultiFormatReader`. Right now it also tries QR/Aztec/Data Matrix on every frame, which is what's spamming those `MultiFormatReader` warnings in the console and slowing detection on weaker phones.
   - Prefer the rear camera explicitly (`facingMode: "environment"`) and request a higher resolution constraint so distant/small barcodes decode faster.
   - Add a small "torch" toggle when the device supports it (uses `MediaStreamTrack.applyConstraints({ advanced: [{ torch: true }] })`) — helps a lot in low light.
   - Show a brief success flash + haptic vibration (`navigator.vibrate(50)`) the moment a code is detected, so the user knows the scan worked even before the analysis returns.

## Files touched

- `src/lib/scans.functions.ts` — change `analyzeBarcode` return shape for not-found, sharpen error strings.
- `src/components/BarcodeScanner.tsx` — format hints, rear-camera + resolution constraints, optional torch button, success feedback.
- `src/routes/index.tsx` — handle `notFound` response with an inline "use photo instead" card, narrow toast usage to real errors.

## Out of scope

- Adding a second product database (e.g., a paid API). We can revisit if "not in database" happens often.
- Storing previously-scanned barcodes (would need auth, which we removed).