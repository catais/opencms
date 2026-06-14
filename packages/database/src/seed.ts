import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-computed bcrypt hash of "admin123" to bypass bcrypt dependencies in prisma run
const ADMIN_PASSWORD_HASH = '$2a$10$TcFirrIIHeAY3WoXgg9wmuaFT1EeUsXhPnUBkB6u6wkJrEpxZaiX.';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean up existing records (Cascade delete handles child relations)
  await prisma.rolePermission.deleteMany({});
  await prisma.userWorkspace.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.webhookDelivery.deleteMany({});
  await prisma.webhook.deleteMany({});
  await prisma.apiKey.deleteMany({});
  await prisma.orderNote.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.taxRate.deleteMany({});
  await prisma.shippingMethod.deleteMany({});
  await prisma.theme.deleteMany({});
  await prisma.plugin.deleteMany({});
  await prisma.setting.deleteMany({});
  await prisma.productVariation.deleteMany({});
  await prisma.productAttribute.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.productTag.deleteMany({});
  await prisma.page.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.media.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.workspace.deleteMany({});

  console.log('🧹 Cleaned existing database tables successfully.');

  // 2. Create Permissions
  const permissionsList = [
    { name: 'manage_all', description: 'Access to all platform settings, commerce, and developers' },
    { name: 'manage_settings', description: 'Modify website title, general options, commerce setup' },
    { name: 'manage_users', description: 'Create, modify, and delete admin users' },
    { name: 'manage_roles', description: 'Manage custom system permissions' },
    { name: 'manage_pages', description: 'Create and edit static pages' },
    { name: 'manage_posts', description: 'Create, draft, and publish blog posts' },
    { name: 'manage_media', description: 'Upload and delete media files' },
    { name: 'manage_products', description: 'Configure simple and variable products' },
    { name: 'manage_orders', description: 'Fulfill, cancel, or refund customer sales orders' },
    { name: 'manage_customers', description: 'View customers and transaction histories' },
    { name: 'manage_coupons', description: 'Create percentage and fixed checkout codes' },
    { name: 'manage_themes', description: 'Upload, toggle, and configure website design layouts' },
    { name: 'manage_plugins', description: 'Toggle, edit, and adjust API extensions' },
    { name: 'manage_api_keys', description: 'Generate and revoke development API keys' },
    { name: 'manage_webhooks', description: 'Configure active REST webhooks' },
    { name: 'view_analytics', description: 'Review sales graphs, health, and user metrics' },
  ];

  const permissions: Record<string, any> = {};
  for (const perm of permissionsList) {
    permissions[perm.name] = await prisma.permission.create({ data: perm });
  }
  console.log(`✅ Seeded ${permissionsList.length} system permissions.`);

  // 3. Create Roles
  const superAdminRole = await prisma.role.create({
    data: { name: 'Super Admin', description: 'Full root server access' },
  });
  const adminRole = await prisma.role.create({
    data: { name: 'Admin', description: 'General administration and site operations' },
  });
  const managerRole = await prisma.role.create({
    data: { name: 'Store Manager', description: 'Fulfill orders and manage products' },
  });
  const editorRole = await prisma.role.create({
    data: { name: 'Editor', description: 'Publish and review pages, posts, and media' },
  });
  const authorRole = await prisma.role.create({
    data: { name: 'Author', description: 'Write and publish their own posts' },
  });
  const customerRole = await prisma.role.create({
    data: { name: 'Customer', description: 'Standard storefront user' },
  });
  const developerRole = await prisma.role.create({
    data: { name: 'Developer', description: 'Build themes, plugins, and manage API keys' },
  });

  // Attach Permissions to Roles
  await prisma.rolePermission.createMany({
    data: [
      { roleId: superAdminRole.id, permissionId: permissions['manage_all'].id },
      { roleId: adminRole.id, permissionId: permissions['manage_settings'].id },
      { roleId: adminRole.id, permissionId: permissions['manage_users'].id },
      { roleId: adminRole.id, permissionId: permissions['manage_pages'].id },
      { roleId: adminRole.id, permissionId: permissions['manage_posts'].id },
      { roleId: adminRole.id, permissionId: permissions['manage_media'].id },
      { roleId: adminRole.id, permissionId: permissions['manage_products'].id },
      { roleId: adminRole.id, permissionId: permissions['manage_orders'].id },
      { roleId: adminRole.id, permissionId: permissions['manage_customers'].id },
      { roleId: adminRole.id, permissionId: permissions['manage_coupons'].id },
      { roleId: adminRole.id, permissionId: permissions['manage_themes'].id },
      { roleId: adminRole.id, permissionId: permissions['manage_plugins'].id },
      { roleId: adminRole.id, permissionId: permissions['view_analytics'].id },
      
      { roleId: managerRole.id, permissionId: permissions['manage_products'].id },
      { roleId: managerRole.id, permissionId: permissions['manage_orders'].id },
      { roleId: managerRole.id, permissionId: permissions['manage_customers'].id },
      { roleId: managerRole.id, permissionId: permissions['manage_coupons'].id },
      { roleId: managerRole.id, permissionId: permissions['view_analytics'].id },
      
      { roleId: editorRole.id, permissionId: permissions['manage_pages'].id },
      { roleId: editorRole.id, permissionId: permissions['manage_posts'].id },
      { roleId: editorRole.id, permissionId: permissions['manage_media'].id },
      
      { roleId: authorRole.id, permissionId: permissions['manage_posts'].id },
      { roleId: authorRole.id, permissionId: permissions['manage_media'].id },
      
      { roleId: developerRole.id, permissionId: permissions['manage_themes'].id },
      { roleId: developerRole.id, permissionId: permissions['manage_plugins'].id },
      { roleId: developerRole.id, permissionId: permissions['manage_api_keys'].id },
      { roleId: developerRole.id, permissionId: permissions['manage_webhooks'].id },
    ],
  });
  console.log('✅ Wired roles and permissions.');

  // 4. Create Workspace (The active Site)
  const workspace = await prisma.workspace.create({
    data: {
      name: 'OpenCMS Sandbox Site',
      slug: 'my-site',
      domain: 'localhost:3000',
    },
  });
  console.log(`✅ Seeded default workspace: "${workspace.name}"`);

  // 5. Create Default Super Admin User
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@opencms.com',
      passwordHash: ADMIN_PASSWORD_HASH,
      name: 'Admin Strator',
      roleId: superAdminRole.id,
    },
  });

  // Bind Super Admin to Workspace
  await prisma.userWorkspace.create({
    data: {
      userId: superAdmin.id,
      workspaceId: workspace.id,
    },
  });
  console.log(`✅ Created Super Admin account: email: "admin@opencms.com" / password: "admin123"`);

  // 6. Create Media Assets (Unsplash premium placeholders)
  const mediaList = [
    {
      name: 'Product - Premium Hoodie',
      url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80',
      path: '/media/hoodie.jpg',
      mimeType: 'image/jpeg',
      size: 153024,
      width: 600,
      height: 800,
      altText: 'Premium OpenCMS Hoodie design',
    },
    {
      name: 'Product - Wireless Headphones',
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      path: '/media/headphones.jpg',
      mimeType: 'image/jpeg',
      size: 184512,
      width: 600,
      height: 600,
      altText: 'UltraTech Headphones product shot',
    },
    {
      name: 'Product - Desk Lamp',
      url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
      path: '/media/lamp.jpg',
      mimeType: 'image/jpeg',
      size: 94210,
      width: 600,
      height: 800,
      altText: 'A modern desk lamp sitting on table',
    },
    {
      name: 'CMS - Next.js Development banner',
      url: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=800&q=80',
      path: '/media/nextjs.jpg',
      mimeType: 'image/jpeg',
      size: 242001,
      width: 800,
      height: 450,
      altText: 'Vibrant modern programming banner',
    },
    {
      name: 'CMS - WordPress and commerce banner',
      url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
      path: '/media/wordpress.jpg',
      mimeType: 'image/jpeg',
      size: 320412,
      width: 800,
      height: 450,
      altText: 'Clean modern software designer layouts',
    },
  ];

  const media: Record<string, any> = {};
  for (const m of mediaList) {
    media[m.name] = await prisma.media.create({
      data: {
        ...m,
        workspaceId: workspace.id,
      },
    });
  }
  console.log(`✅ Seeded ${mediaList.length} realistic media library assets.`);

  // 7. Create Blog Categories & Tags
  const catTech = await prisma.category.create({
    data: { workspaceId: workspace.id, name: 'Technology', slug: 'technology', description: 'Latest news, engineering designs, and code reviews' },
  });
  const catLife = await prisma.category.create({
    data: { workspaceId: workspace.id, name: 'Lifestyle', slug: 'lifestyle', description: 'Design aesthetics, coffee, and daily developer life hacks' },
  });
  const catBiz = await prisma.category.create({
    data: { workspaceId: workspace.id, name: 'Business', slug: 'business', description: 'Scaling ecommerce operations, SEO guidelines, and customer relations' },
  });

  const tagNext = await prisma.tag.create({
    data: { workspaceId: workspace.id, name: 'NextJS', slug: 'nextjs' },
  });
  const tagReact = await prisma.tag.create({
    data: { workspaceId: workspace.id, name: 'React', slug: 'react' },
  });
  const tagEcom = await prisma.tag.create({
    data: { workspaceId: workspace.id, name: 'Ecommerce', slug: 'ecommerce' },
  });

  console.log('✅ Seeded CMS categories and tags.');

  // 8. Create Static Pages
  await prisma.page.create({
    data: {
      workspaceId: workspace.id,
      title: 'Welcome to OpenCMS',
      slug: 'home',
      content: `# Welcome to your brand new site!\n\nOpenCMS is an API-first Next.js, Node.js, and TypeScript replacement for WordPress + WooCommerce.\n\nUse this block to edit your landing page directly.`,
      htmlContent: '<h1>Welcome to your brand new site!</h1><p>OpenCMS is an API-first Next.js, Node.js, and TypeScript replacement for WordPress + WooCommerce.</p>',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      publishedAt: new Date(),
    },
  });

  await prisma.page.create({
    data: {
      workspaceId: workspace.id,
      title: 'About Us',
      slug: 'about',
      content: `# Our Story\n\nWe build next-generation internet solutions. Speed, visual beauty, and developer experience are our main virtues.`,
      htmlContent: '<h1>Our Story</h1><p>We build next-generation internet solutions. Speed, visual beauty, and developer experience are our main virtues.</p>',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      publishedAt: new Date(),
    },
  });
  console.log('✅ Seeded core static pages.');

  // 9. Create Blog Posts
  await prisma.post.create({
    data: {
      workspaceId: workspace.id,
      title: 'Welcome to OpenCMS - Rebuilding WordPress in 2026',
      slug: 'welcome-opencms',
      content: `### Welcome to OpenCMS!\n\nThis is a blog post written directly in markdown. In the admin dashboard, you can edit it with a beautiful dual Markdown/Visual panel, assign featured images, write tags, and categorize your writing.\n\nEnjoy the future of web design!`,
      status: 'PUBLISHED',
      excerpt: 'Discover why we built a WordPress + WooCommerce replica in Next.js and how it benefits developers worldwide.',
      authorId: superAdmin.id,
      featuredImageId: media['CMS - WordPress and commerce banner'].id,
      publishedAt: new Date(),
      categories: { connect: [{ id: catTech.id }] },
      tags: { connect: [{ id: tagNext.id }, { id: tagReact.id }] },
    },
  });

  await prisma.post.create({
    data: {
      workspaceId: workspace.id,
      title: '10 Reasons Next.js App Router is King',
      slug: 'nextjs-app-router-king',
      content: `Next.js App Router completely changes the game with:\n1. Server Components (zero client JS overhead by default)\n2. Incremental Static Regeneration\n3. Layout nesting\n4. Optimized assets pipeline\n\nRead more details in our developer portal.`,
      status: 'PUBLISHED',
      excerpt: 'A technical deep-dive into Nest.js layout structures, server rendering, and hydration boundaries.',
      authorId: superAdmin.id,
      featuredImageId: media['CMS - Next.js Development banner'].id,
      publishedAt: new Date(),
      categories: { connect: [{ id: catTech.id }] },
      tags: { connect: [{ id: tagNext.id }] },
    },
  });
  console.log('✅ Seeded blog posts with relationships.');

  // 10. Create WooCommerce Product Categories
  const pCatElectronics = await prisma.productCategory.create({
    data: { workspaceId: workspace.id, name: 'Electronics', slug: 'electronics', description: 'Tech gadgets, headphones, clocks, smart devices' },
  });
  const pCatApparel = await prisma.productCategory.create({
    data: { workspaceId: workspace.id, name: 'Apparel', slug: 'apparel', description: 'Sweaters, tshirts, hoodies, active wear' },
  });
  const pCatDigital = await prisma.productCategory.create({
    data: { workspaceId: workspace.id, name: 'Digital Goods', slug: 'digital-goods', description: 'Ebooks, theme templates, layout kits' },
  });

  const pTagGadget = await prisma.productTag.create({
    data: { workspaceId: workspace.id, name: 'gadgets', slug: 'gadgets' },
  });
  const pTagWear = await prisma.productTag.create({
    data: { workspaceId: workspace.id, name: 'wear', slug: 'wear' },
  });

  console.log('✅ Seeded commerce categories and tags.');

  // 11. Create Products
  // A. Simple Product (Physical)
  const productHoodie = await prisma.product.create({
    data: {
      workspaceId: workspace.id,
      type: 'SIMPLE',
      name: 'OpenCMS Premium Hoodie',
      slug: 'opencms-premium-hoodie',
      description: 'Wrap yourself in absolute comfort. Our signature hoodie is made of heavy 450GSM organic French terry cotton, dyed in our classic flat slate color, featuring a double-lined hood and invisible side-seam pockets.',
      shortDescription: 'The premium weighted hoodie, custom-dyed and optimized for cozy developer nights.',
      sku: 'OC-HD-001',
      price: 65.00,
      salePrice: 48.00,
      manageStock: true,
      stockQuantity: 45,
      stockStatus: 'IN_STOCK',
      lowStockAmount: 5,
      shippingWeight: 0.85,
      featuredImageId: media['Product - Premium Hoodie'].id,
      categories: { connect: [{ id: pCatApparel.id }] },
      tags: { connect: [{ id: pTagWear.id }] },
    },
  });

  // B. Simple Product (Digital)
  const productThemePack = await prisma.product.create({
    data: {
      workspaceId: workspace.id,
      type: 'DIGITAL',
      name: 'OpenCMS Developer Theme Pack',
      slug: 'opencms-developer-theme-pack',
      description: 'Get immediate access to 5 beautiful premium theme components tailored specifically for Next.js and Tailwind. Package includes customizable variables, clean folder modules, and clean designs ready to deploy.',
      shortDescription: '5 responsive and developer-friendly storefront templates to customize your Next.js commerce app.',
      sku: 'OC-TP-DEV',
      price: 89.00,
      manageStock: false,
      stockStatus: 'IN_STOCK',
      categories: { connect: [{ id: pCatDigital.id }] },
    },
  });

  // C. Variable Product
  const productHeadphones = await prisma.product.create({
    data: {
      workspaceId: workspace.id,
      type: 'VARIABLE',
      name: 'UltraTech Wireless Headphones',
      slug: 'ultratech-wireless-headphones',
      description: 'Experience pure sonic performance. Featuring hybrid Active Noise Cancelling (ANC), custom 40mm beryllium drivers, 45-hour battery capacity, and a sleek ultra-minimalist sand-blasted matte finish.',
      shortDescription: 'Audiophile grade sound quality with premium active noise cancellation.',
      sku: 'OC-HP-VAR',
      price: 199.00,
      manageStock: false,
      stockStatus: 'IN_STOCK',
      featuredImageId: media['Product - Wireless Headphones'].id,
      categories: { connect: [{ id: pCatElectronics.id }] },
      tags: { connect: [{ id: pTagGadget.id }] },
    },
  });

  // Product Attributes for Variable Product
  const attrColor = await prisma.productAttribute.create({
    data: {
      productId: productHeadphones.id,
      name: 'Color',
      valuesJson: JSON.stringify(['Obsidian Black', 'Midnight Blue']),
      isVariation: true,
      isVisible: true,
      position: 0,
    },
  });

  const attrSize = await prisma.productAttribute.create({
    data: {
      productId: productHeadphones.id,
      name: 'Size',
      valuesJson: JSON.stringify(['Standard', 'Pro Over-Ear']),
      isVariation: true,
      isVisible: true,
      position: 1,
    },
  });

  // Product Variations
  await prisma.productVariation.create({
    data: {
      productId: productHeadphones.id,
      sku: 'OC-HP-BLK-STD',
      price: 199.00,
      salePrice: 169.00,
      manageStock: true,
      stockQuantity: 12,
      stockStatus: 'IN_STOCK',
      attributesJson: JSON.stringify({ Color: 'Obsidian Black', Size: 'Standard' }),
      imageId: media['Product - Wireless Headphones'].id,
    },
  });

  await prisma.productVariation.create({
    data: {
      productId: productHeadphones.id,
      sku: 'OC-HP-BLU-PRO',
      price: 249.00,
      manageStock: true,
      stockQuantity: 4,
      stockStatus: 'IN_STOCK',
      attributesJson: JSON.stringify({ Color: 'Midnight Blue', Size: 'Pro Over-Ear' }),
      imageId: media['Product - Wireless Headphones'].id,
    },
  });

  // D. Simple Physical (low stock alert)
  const productLamp = await prisma.product.create({
    data: {
      workspaceId: workspace.id,
      type: 'PHYSICAL',
      name: 'Ergonomic Desktop Architect Lamp',
      slug: 'ergonomic-desktop-architect-lamp',
      description: 'An elegant heavy-duty aluminum counterweight lamp featuring a high CRI panel to ease eye fatigue, adjustable arms, color temperature options, and a touch slider interface.',
      shortDescription: 'Industrial grade design lamp, optimal lighting for designers and developers.',
      sku: 'OC-LM-005',
      price: 120.00,
      manageStock: true,
      stockQuantity: 3, // Low stock quantity!
      stockStatus: 'IN_STOCK',
      lowStockAmount: 4, // Triggers alert!
      featuredImageId: media['Product - Desk Lamp'].id,
      categories: { connect: [{ id: pCatElectronics.id }] },
    },
  });

  console.log('✅ Seeded ecommerce products, attributes, and variations.');

  // 12. Seed Coupons
  const couponPercent = await prisma.coupon.create({
    data: {
      workspaceId: workspace.id,
      code: 'OPENCMS20',
      type: 'PERCENTAGE',
      amount: 20.00,
      expiryDate: new Date('2028-12-31'),
      usageLimit: 100,
      usageCount: 14,
    },
  });

  const couponFixed = await prisma.coupon.create({
    data: {
      workspaceId: workspace.id,
      code: 'WELCOME10',
      type: 'FIXED_CART',
      amount: 10.00,
      usageLimit: 500,
      usageCount: 22,
    },
  });
  console.log('✅ Seeded coupons.');

  // 13. Seed Customers & Addresses
  const customerList = [
    { email: 'sarah.connor@gmail.com', firstName: 'Sarah', lastName: 'Connor', phone: '+15551234' },
    { email: 'bruce.wayne@waynecorp.com', firstName: 'Bruce', lastName: 'Wayne', phone: '+19997777' },
    { email: 'peter.parker@dailybugle.com', firstName: 'Peter', lastName: 'Parker', phone: '+12228888' },
  ];

  const customers: Record<string, any> = {};
  for (const cust of customerList) {
    customers[cust.email] = await prisma.customer.create({
      data: {
        ...cust,
        workspaceId: workspace.id,
        totalSpent: 0,
        ordersCount: 0,
      },
    });

    // Create billing address
    await prisma.address.create({
      data: {
        customerId: customers[cust.email].id,
        type: 'BILLING',
        firstName: cust.firstName,
        lastName: cust.lastName,
        address1: '123 Core Ave',
        city: 'Metropolis',
        state: 'NY',
        postcode: '10001',
        country: 'US',
        phone: cust.phone,
      },
    });

    // Create shipping address
    await prisma.address.create({
      data: {
        customerId: customers[cust.email].id,
        type: 'SHIPPING',
        firstName: cust.firstName,
        lastName: cust.lastName,
        address1: '456 Delivery Rd',
        city: 'Gotham',
        state: 'NJ',
        postcode: '07001',
        country: 'US',
        phone: cust.phone,
      },
    });
  }
  console.log(`✅ Seeded ${customerList.length} billing/shipping customer records.`);

  // 14. Seed Orders & Items (Historical orders to render gorgeous graphs!)
  // Order 1: Bruce Wayne - Completed - Big Purchase
  const order1 = await prisma.order.create({
    data: {
      workspaceId: workspace.id,
      number: 'OC-1001',
      status: 'COMPLETED',
      customerId: customers['bruce.wayne@waynecorp.com'].id,
      paymentMethod: 'Stripe Credit Card',
      paymentId: 'ch_stripe_9921',
      shippingMethod: 'Courier Premium Air',
      shippingTotal: 15.00,
      taxTotal: 12.38,
      discountTotal: 0.00,
      subtotal: 150.00,
      total: 177.38,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      productId: productHoodie.id,
      name: productHoodie.name,
      price: 65.00,
      quantity: 1,
      subtotal: 65.00,
      total: 65.00,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      productId: productThemePack.id,
      name: productThemePack.name,
      price: 85.00,
      quantity: 1,
      subtotal: 85.00,
      total: 85.00,
    },
  });

  // Order 2: Sarah Connor - Processing
  const order2 = await prisma.order.create({
    data: {
      workspaceId: workspace.id,
      number: 'OC-1002',
      status: 'PROCESSING',
      customerId: customers['sarah.connor@gmail.com'].id,
      paymentMethod: 'Stripe Credit Card',
      paymentId: 'ch_stripe_8824',
      shippingMethod: 'Flat Rate Ground',
      shippingTotal: 5.00,
      taxTotal: 14.77,
      discountTotal: 10.00,
      couponCode: 'WELCOME10',
      subtotal: 179.00, // Black headphones standard
      total: 188.77,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      productId: productHeadphones.id,
      name: 'UltraTech Wireless Headphones (Obsidian Black, Standard)',
      price: 179.00,
      quantity: 1,
      subtotal: 179.00,
      total: 169.00, // discounted price
    },
  });

  // Order 3: Peter Parker - Pending Payment - Low value
  const order3 = await prisma.order.create({
    data: {
      workspaceId: workspace.id,
      number: 'OC-1003',
      status: 'PENDING',
      customerId: customers['peter.parker@dailybugle.com'].id,
      paymentMethod: 'PayPal Express',
      shippingMethod: 'Flat Rate Ground',
      shippingTotal: 5.00,
      taxTotal: 3.96,
      discountTotal: 9.60, // 20% off hoodie (48.00 * 20%)
      couponCode: 'OPENCMS20',
      subtotal: 48.00,
      total: 47.36,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order3.id,
      productId: productHoodie.id,
      name: productHoodie.name,
      price: 48.00,
      quantity: 1,
      subtotal: 48.00,
      total: 38.40,
    },
  });

  // Order Notes
  await prisma.orderNote.create({
    data: { orderId: order1.id, note: 'Payment processed and confirmed.', isCustomerNote: false },
  });
  await prisma.orderNote.create({
    data: { orderId: order1.id, note: 'Courier tracked package dispatched.', isCustomerNote: true },
  });
  await prisma.orderNote.create({
    data: { orderId: order2.id, note: 'Stripe authorized charge successfully.', isCustomerNote: false },
  });

  // Update Customer aggregates
  await prisma.customer.update({
    where: { id: customers['bruce.wayne@waynecorp.com'].id },
    data: { totalSpent: 177.38, ordersCount: 1 },
  });
  await prisma.customer.update({
    where: { id: customers['sarah.connor@gmail.com'].id },
    data: { totalSpent: 188.77, ordersCount: 1 },
  });
  await prisma.customer.update({
    where: { id: customers['peter.parker@dailybugle.com'].id },
    data: { totalSpent: 0, ordersCount: 1 }, // Pending doesn't add to spent
  });

  console.log('✅ Seeded historical customer orders and line items.');

  // 15. Seed Themes & Plugins
  await prisma.theme.create({
    data: {
      workspaceId: workspace.id,
      name: 'Minimal SaaS Storefront (Default)',
      slug: 'minimal-saas',
      description: 'A modern, premium SaaS-oriented theme featuring thin elegant borders, soft gray grids, rich Inter typography, and absolute responsiveness.',
      version: '1.0.0',
      author: 'OpenCMS Design Team',
      isActive: true,
      settingsJson: JSON.stringify({ primaryColor: '#2563EB', fontFamily: 'Inter' }),
    },
  });

  await prisma.theme.create({
    data: {
      workspaceId: workspace.id,
      name: 'Retro Coffee Vibe',
      slug: 'retro-coffee',
      description: 'Warm earth tones, thick shadows, rounded buttons, and heavy borders. Perfect for boutique coffee roasters, vintage clothing, and cozy bakeries.',
      version: '1.1.2',
      author: 'Rustic Integration Co.',
      isActive: false,
    },
  });

  await prisma.plugin.create({
    data: {
      workspaceId: workspace.id,
      name: 'SEO Optimizer Pro',
      slug: 'seo-optimizer',
      description: 'Automatically structures search-engine schemas, appends titles, indexes XML sitemaps, and audits layout content for optimal web visibility.',
      version: '1.2.0',
      author: 'OpenCMS Team',
      isActive: true,
    },
  });

  await prisma.plugin.create({
    data: {
      workspaceId: workspace.id,
      name: 'Stripe Checkout Gateway',
      slug: 'stripe-gateway',
      description: 'Enables quick, secure credit card transactions at checkout. Supports Stripe checkout cards, Apple Pay, Google Pay, and sandboxed test mode.',
      version: '2.1.4',
      author: 'Stripe Integration Group',
      isActive: true,
    },
  });

  console.log('✅ Seeded Active extensions.');

  // 16. Seed Shipping Methods and Tax Classes
  await prisma.shippingMethod.create({
    data: { workspaceId: workspace.id, name: 'flat_rate', title: 'Flat Rate Ground Delivery', cost: 5.00, enabled: true },
  });
  await prisma.shippingMethod.create({
    data: { workspaceId: workspace.id, name: 'free_shipping', title: 'Free Express Courier', cost: 0.00, enabled: true },
  });

  await prisma.taxRate.create({
    data: { workspaceId: workspace.id, name: 'Standard Store Sales Tax', rate: 0.0825, country: 'US', taxClass: 'standard', enabled: true },
  });

  console.log('✅ Seeded delivery fees and tax rates.');

  // 17. Seed Configuration Settings
  const defaultSettings = [
    { key: 'site_title', value: 'OpenCMS Sandbox Store' },
    { key: 'site_tagline', value: 'A Next.js, Node.js, and TypeScript headless WooCommerce alternative.' },
    { key: 'admin_email', value: 'admin@opencms.com' },
    { key: 'currency', value: 'USD' },
    { key: 'timezone', value: 'UTC' },
    { key: 'language', value: 'en' },
    { key: 'store_address', value: '123 Infinite Loop, Cupertino, CA' },
    { key: 'store_city', value: 'Silicon Valley' },
    { key: 'store_country', value: 'US' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.create({
      data: {
        workspaceId: workspace.id,
        key: s.key,
        value: s.value,
      },
    });
  }
  console.log('✅ Seeded key site configuration settings.');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding process:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
