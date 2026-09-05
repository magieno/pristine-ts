# Changelog — @pristine-ts/express

## 4.0.12

- **`RequestMapper` carries the raw request bytes.** `Request.rawBody` used to be
  `expressRequest.body`, which is the already-parsed object on JSON routes, so it was only "raw"
  when the app happened to mount `express.raw()` for that path. It is now the exact bytes when
  they are available, and never the parsed object:
  1. the `Buffer` captured by body-parser's `verify` hook (see below);
  2. otherwise the body itself when a parser left it as a `Buffer` (`express.raw()`) or a
     `string` (`express.text()`);
  3. otherwise `undefined`.

  `request.body` is unchanged: whatever the app's parser produced.

- **New `RawBodyCapture`.** A body-parser `verify` hook that stores the un-decoded `Buffer` on the
  Express request. Mount every parser with it, and add a catch-all `express.raw()` after them so
  bodies no JSON/text parser accepts (audio, images, octet-stream) are read at all:

  ```ts
  app.use(express.json({verify: RawBodyCapture.verify}));
  app.use(express.raw({type: () => true, verify: RawBodyCapture.verify}));
  ```

  `ExpressRequestWithRawBody` types the augmented request.
