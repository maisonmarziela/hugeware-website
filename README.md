# Hugeware

Cybersecurity for everyone. For consumers. By consumers.

An independent brand concept for personal protection, business security, and incident readiness.

## Website

The website is designed for **https://hugeware.tech** and runs entirely as static HTML, CSS, and JavaScript. There is no build step, server runtime, paid API, or external font dependency.

## Hosting

GitHub Pages publishes the `main` branch from the repository root. The `.nojekyll` file preserves the files as plain static content, and `CNAME` specifies `hugeware.tech`.

Push changes to `main` to update the site. GitHub Pages deployment progress appears in the repository's Actions and Settings → Pages sections.

## Domain

The domain uses Name.com DNS. Its apex A records point to GitHub Pages, and the `www` CNAME points to the owning GitHub account's `github.io` hostname. The domain is configured in the repository's Pages settings before changing DNS. HTTPS is enabled when the certificate is ready.

## Features

- Responsive navigation and original ASCII illustrations
- Reduced-motion support and a global animation control
- Personal, business, and readiness planning checklists
- A three-question brief builder with local text export
- Filterable security guides with source links
- Browser-local tools with no analytics or sign-up

Hugeware is a fictional corporation. Its planning tools are educational and do not provide live monitoring or incident response.
