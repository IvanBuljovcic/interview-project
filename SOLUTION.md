# Debugging image preview

## Recreating the issue

The initial flow was to follow the instructions in the provided README.md, test what happens and see if I get the correct issue as mentioned.

Before encountering the actual *preview issue* I had a problem with running `docker-compose up` that it failed when trying to copy the *public* folder because it did not exist nor is it created when running the `npm run dev` script. It is created with the `build` script.

I chalked this up to a oversight, not the actual part of the task.

I then created the public folder manually and ran the docker script again. It worked as expected, that is, when the page opens, and an image is uploaded, the preview of the uploaded image is not shown because the file is not found (error 404). Thus confirming that the issue/bug is actually present.

## Debugging

My first steps with trying to solve this was to start `npm run dev` script and see if the images get uploaded to the */public/uploads* folder.

Seeing as the images are created, I deleted the folder and every generated file/folder (.next, public) and ran the `npm run build` script.

After this I started `npm run start` and tried to upload an image on the *localhost:3000*

My initial thought was that there was an issue with the setup of the project, that I needed to enable images being served from `localhost` so I tried adding it to the `next.config.ts` file but after running the `start` script I noticed that image files were not stored in the *public* folder nor was any change in `.tsx` files detected. Which led me to re-discover that the `start` script only serves as a production server i.e. it relies on `npm run build`.

To verify this I tried to view the docker image and see its local files.

Realizing this, I changed the last line in the `Dockerfile` to run the `dev` script instead of `start`

`CMD ["npm", "run", "dev"]`

After this it was a case of missing dev dependencies so the NODE_END needed to be changed and to remove the `--omit=dev` from the `RUN npm ci`

Then an error was thrown that `app` folder was missing, which is why I also added the `COPY` line to copy it to the docker image as well.

And lastly CSS was not applied so the `postcss` config needed copying as well.

After all this, docker is now running a development build and giving the preview of uploaded images.

## Root cause

Next.js production builds (`npm run start`) only serve static files from `public/` that existed at build time. Files uploaded after the build are not served because they were not included in the static asset compilation. This is why dev mode works (it reads from disk on each request) but production mode does not.

## Different approaches

After finishing with the dev mode solution I expected that this was not the optimal one since docker is serving development builds and not production.

I asked Claude what could be the possible reason for the initial bug and to give a possible solution.

It came up with a route based approach i.e. to have `app/api/images/[filename]/route.ts` serve each file back to the app, with the files being saved to a different *uploads* folder **outside** of the *public* folder. This solution is on the branch `roude-solution`.

The route-based approach is the better solution for production since it allows running `npm run start` while still serving dynamically uploaded files.

## Changes made

### Main branch (dev mode approach)

- Changed Dockerfile to run `npm run dev` instead of `npm run start`
- Set `NODE_ENV=development`
- Added copies of `app/` and `postcss.config.mjs` to the runner stage
- Volume mount for uploads: `./public/uploads:/app/public/uploads`

### Route-based branch

- Upload route saves files to `/app/uploads` (outside public folder)
- Upload route returns path as `/api/images/${fileName}`
- Added new API route `app/api/images/[filename]/route.ts` to serve images
- Dockerfile creates `/app/uploads` directory
- Volume mount: `./uploads:/app/uploads`

## Testing commands

```bash
# Build and run with docker
docker-compose up --build

# Test in browser
# Open http://localhost:3000
# Upload an image
# Verify the preview displays correctly

# Test persistence (restart container)
docker-compose down
docker-compose up
# Previously uploaded images should still be visible
```