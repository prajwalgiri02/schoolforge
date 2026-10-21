# Deploying {{schoolName}}

This is a Next.js site. Every page is prerendered, so it is fast and cheap to host.

Before deploying, set `seo.siteUrl` in `school.config.json` to the live address
(e.g. `https://www.myschool.edu.np`) and run `schoolforge sync`. It is used for the
sitemap, canonical links and share previews.

## Option 1: Vercel (recommended, free tier available)

1. Push this folder to a GitHub repository. SchoolForge Studio can do it for you:
   tick **Commit to git** on the Generate tab and enter the repository URL.
2. On https://vercel.com, choose **Add New → Project** and import the repository.
   No settings are needed; Vercel detects Next.js.
3. Under **Settings → Domains**, add the school's domain and follow the DNS instructions.
4. Optional: set `CONTACT_WEBHOOK_URL` under **Settings → Environment Variables** to
   receive contact form enquiries (Zapier, Make, Slack, a CRM...).
   Set `FORMS_WEBHOOK_URL` too to receive online admission and job applications,
   alumni registrations and testimonials, with their uploaded documents. Next.js
   sites do not store applications themselves; choose the Laravel target if the
   school wants an admin panel to review them and an application tracker.

Every push to the repository redeploys the site automatically.

## Option 2: Netlify

Import the repository at https://app.netlify.com. The Next.js runtime is detected
automatically. Add the domain under **Domain management**.

## Option 3: Your own server with Docker

```bash
docker build -t school-site .
docker run -d --restart unless-stopped -p 3000:3000 school-site
```

Put a reverse proxy with HTTPS in front of port 3000 (Caddy does this in one line:
`reverse_proxy localhost:3000`).

## Option 4: Any Node.js host

```bash
npm install
npm run build
npm start          # serves on port 3000
```

## Editing content without redeploying (SchoolForge Studio)

The site can read its content from SchoolForge Studio instead of the files it
was generated with. In Studio, open the school's **Publish** tab, turn on the
**Headless content API** and set the two variables it shows
(`SCHOOLFORGE_CONTENT_URL` and `SCHOOLFORGE_CONTENT_TOKEN`) on the host. Then each
time the school is published in Studio, the site refreshes its pages within
seconds; set `seo.siteUrl` so Studio knows where to send the refresh. If Studio
cannot be reached, the site keeps serving the content it was built with.

Theme, colours and components still come from the generated code: change those
in Studio, then generate and deploy again.
