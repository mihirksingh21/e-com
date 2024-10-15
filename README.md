# README.md

## Payload E-Commerce Template

This is the official [Payload E-Commerce Template](https://github.com/payloadcms/payload/blob/main/templates/ecommerce). Use it to power e-commerce businesses and online stores of all sizes. This repository includes a fully-working backend, enterprise-grade admin panel, and a beautifully designed, production-ready website.

This template is suitable for selling:

- Physical products like clothing or merchandise
- Digital assets like ebooks or videos
- Access to content like courses or premium articles

### Core Features

- [Pre-configured Payload Config](#how-it-works)
- [Authentication](#users-authentication)
- [Access Control](#access-control)
- [Shopping Cart](#shopping-cart)
- [Checkout](#checkout)
- [Paywall](#paywall)
- [Layout Builder](#layout-builder)
- [SEO](#seo)
- [Website](#website)

## Quick Start

To spin up this example locally, follow these steps:

### Clone

If you haven't done so already, you need a standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

#### Method 1 (recommended)

Go to Payload Cloud and [clone this template](https://payloadcms.com/new/clone/ecommerce). This will create a new repository on your GitHub account with this template's code, which you can then clone to your own machine.

#### Method 2

Use the `create-payload-app` CLI to clone this template directly to your machine:

```bash
npx create-payload-app@latest my-project -t ecommerce
```

#### Method 3

Use the `git` CLI to clone this template directly to your machine:

```bash
git clone -n --depth=1 --filter=tree:0 https://github.com/payloadcms/payload my-project && cd my-project && git sparse-checkout set --no-cone templates/ecommerce && git checkout && rm -rf .git && git init && git add . && git mv -f templates/ecommerce/{.,}* . && git add . && git commit -m "Initial commit"
```

### Development

1. First, [clone the repo](#clone) if you haven't done so already.
2. Run `cd my-project && cp .env.example .env` to copy the example environment variables.
3. Run `yarn && yarn dev` to install dependencies and start the dev server.
4. Open `http://localhost:3000` in your browser.

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to log in and create your first admin user. To begin accepting payments, follow the [Stripe](#stripe) guide. Then check out [Production](#production) once you're ready to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

## How It Works

The Payload config is tailored specifically to the needs of most e-commerce businesses. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

#### Users (Authentication)

Users are auth-enabled and encompass both admins and customers based on their `roles` field. Only `admin` users can access your admin panel to manage your store, whereas `customer` can authenticate on your front-end to create [shopping carts](#shopping-cart) and place [orders](#orders) but have limited access to the platform. See [Access Control](#access-control) for more details.

For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

#### Products

Products are linked to Stripe via a custom select field that is dynamically populated in the sidebar of each product. This field fetches all available products in the background and displays them as options. Once a product has been selected, prices get automatically synced between Stripe and Payload through [Payload Hooks](https://payloadcms.com/docs/hooks) and [Stripe Webhooks](https://stripe.com/docs/webhooks). See [Stripe](#stripe) for more details.

All products are layout builder enabled so you can generate unique pages for each product using layout building blocks; see [Layout Builder](#layout-builder) for more details.

Products can also restrict access to content or digital assets behind a paywall (gated content); see [Paywall](#paywall) for more details.

#### Orders

Orders are created when a user successfully completes a checkout. They contain all data about the order including the products purchased, total price, and user who placed the order. See [Checkout](#checkout) for more details.

#### Pages

All pages are layout builder enabled so you can generate unique layouts for each page using layout-building blocks; see [Layout Builder](#layout-builder) for more details.

#### Media

This is the uploads-enabled collection used by products and pages to contain media like images, videos, downloads, and other assets.

#### Categories

A taxonomy used to group products together. Categories can be nested inside one another; for example, "Courses > Technology". See the official [Payload Nested Docs Plugin](https://github.com/payloadcms/plugin-nested-docs) for more details.

### Globals

See the [Globals](https://payloadcms.com/docs/configuration/globals) docs for details on how to extend this functionality.

- **Header**: The data required by the header on your front-end like nav links.
- **Footer**: Same as above but for the footer of your site.

## Access Control

Basic role-based access control is set up to determine what users can and cannot do based on their roles:

- **admin**: They can access the Payload admin panel to manage your store. They can see all data and perform all operations.
- **customer**: They cannot access the Payload admin panel and can perform limited operations based on their user (see below).

This applies to each collection in the following ways:

- **users**: Only admins and users themselves can access their profiles. Anyone can create a user but only admins can delete users.
- **products**: Everyone can access products, but only admins can create, update, or delete them. Paywall-enabled products may also have content that is only accessible to users who have purchased the product. See [Paywall](#paywall) for more details.

For more details on how to extend this functionality, see the official [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control) docs.

## Shopping Cart

Logged-in users can have their shopping carts saved to their profiles as they shop. This way they can continue shopping at a later date or on another device. When not logged in, the cart can be saved to local storage and synced with Payload on the next login.

```ts
{
  name: 'cart',
  label: 'Shopping Cart',
  type: 'object',
  fields: [
    {
      name: 'items',
      label: 'Items',
      type: 'array',
      fields: [
        // product, quantity, etc
      ]
    },
    // other metadata like `createdOn`, etc
  ]
}
```

## Stripe

Payload itself handles no currency exchange. All payments are processed and billed using [Stripe](https://stripe.com). You must have access to a Stripe account via an API key; see [Connect Stripe](#connect-stripe) for how to get one.

When you create a product in Payload that you wish to sell, it must be connected to a Stripe product by selecting one from the field in the product's sidebar; see [Products](#products) for more details.

Once set, data is automatically synced between both platforms through various webhooks and hooks as detailed in their respective sections.

### Connect Stripe

To integrate with Stripe, follow these steps:

1. Create a [Stripe account](https://stripe.com) if you do not already have one.
2. Retrieve your [Stripe API keys](https://dashboard.stripe.com/test/apikeys) and paste them into your `.env` file:
   ```bash
   STRIPE_SECRET_KEY=
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   ```
3. In another terminal, listen for webhooks (optional):
   ```bash
   stripe login # follow prompts
   yarn stripe:webhooks
   ```
4. Paste the given webhook signing secret into your `.env`:
   ```bash
   STRIPE_WEBHOOKS_SIGNING_SECRET=
   ```
5. Reboot Payload to ensure that Stripe connects and webhooks are registered.

## Checkout

A custom endpoint is opened at `POST /api/create-payment-intent`, which initiates the checkout process by totaling your cart and creating a Stripe Payment Intent. The total price is recalculated on the server for accuracy and security before passing back a `client_secret` response for finalizing payment.

Once payment succeeds, an Order will be created in Payload with associated data recorded against user profiles while clearing their cart automatically.

## Paywall

Products can optionally restrict access behind a paywall requiring purchase before data/resources are accessible. A purchases field tracks user purchase history:

```ts
{
  name: 'purchases',
  label: 'Purchases',
  type: 'array',
  fields: [
    {
      name: 'product',
      label: 'Product',
      type: 'relationship',
      relationTo: 'products',
    },
    // other metadata like `createdOn`, etc
  ]
}
```

Each product has an associated paywall field with read access control checking user purchases before returning data upon request.

## Layout Builder

Create unique layouts using powerful layout building blocks pre-configured within this template:

- Hero
- Content
- Media
- Call To Action
- Archive

Each block is fully designed and integrated into the front-end website that comes with this template; see [Website](#website) for more details.

## Draft Preview

All pages/products are draft-enabled allowing preview before publishing using Versions with drafts set as true. This means new content saves as drafts until published while enabling secure previews via custom URLs redirecting front-end fetching draft versions of content.

## SEO

This template comes pre-configured with complete SEO control using the official Payload SEO Plugin integrated into both admin panel and front-end website; see [Website](#website) for more details.

## Redirects

If migrating existing sites or moving content URLs, use redirects collection ensuring proper request status codes return while preventing broken links through pre-configured redirects plugin integrated into both admin panel and front-end website; see [Website](#website) for more details.

## Website

This template includes a beautifully designed front-end built with Next.js App Router served alongside Payload app within a single Express server allowing simultaneous deployment or hosting separately if preferred through easy ejection processes detailed below:

### Cache 

Payload Cloud proxies/caches files through Cloudflare eliminating need for Next.js caching by default unless hosting outside Payload Cloud where re-enabling caching mechanisms requires removing specific directives from fetch requests/files as detailed in Next.js caching documentation.

### Eject 

For those preferring another front-end framework or standalone CMS usage, ejecting front-end from template is straightforward via running `yarn eject`. This removes Next.js dependencies/files while updating routing configurations accordingly—note potential issues if significant modifications occurred prior; compare dependencies/file structure against template if needed.

For setup guidance regarding custom servers refer back above sections detailing examples provided within repository links mentioned throughout documentations above!

## Development 

Spin up locally following steps outlined under Quick Start section then connect Stripe enabling payments while seeding database with sample products/pages utilizing yarn seed command alongside available GET endpoint options provided within admin panel interface!

### Docker 

Alternatively utilize Docker standardizing development environments across teams quickly spinning up instances locally following outlined procedures above ensuring seamless integration across workflows!

### Seed 

Seeding database drops existing data repopulating fresh templates—only run if starting anew or able afford loss current datasets!

### Conflicting Routes 

In monorepo setups routes may conflict necessitating unique naming conventions avoiding overlaps with Payload's routes—recommend renaming custom routes accordingly!

## Production 

To run Payload production build/admin panels follow outlined steps invoking build scripts generating production-ready bundles serving Node instances accordingly when ready go live transitioning accounts into live modes adjusting keys/settings as necessary!

---

