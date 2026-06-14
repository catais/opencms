exports.id=4105,exports.ids=[4105],exports.modules={1361:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,4424,23)),Promise.resolve().then(r.t.bind(r,7752,23)),Promise.resolve().then(r.t.bind(r,5275,23)),Promise.resolve().then(r.t.bind(r,9842,23)),Promise.resolve().then(r.t.bind(r,1633,23)),Promise.resolve().then(r.t.bind(r,9224,23))},6017:()=>{},3320:(e,t,r)=>{"use strict";r.d(t,{default:()=>d,m:()=>l});var a=r(3227),o=r(3677),s=r(649),n=r(1043);let i=(0,o.createContext)({activeThemeSlug:"minimal-saas",themeConfig:null,plugins:[]}),l=()=>(0,o.useContext)(i);function d({children:e}){let t=(0,n.usePathname)(),[r,l]=(0,o.useState)(0),[d,m]=(0,o.useState)(!1),[c,h]=(0,o.useState)(!1),[x,p]=(0,o.useState)("minimal-saas"),[b,f]=(0,o.useState)(null),[u,g]=(0,o.useState)([]),v=[{name:"Home",href:"/"},{name:"Shop Catalog",href:"/shop"},{name:"Blog",href:"/blog"},{name:"Account Portal",href:"/account"},{name:"Admin Dashboard",href:"/admin"}],j=b?.primaryColor||"#2563EB",y=b?.secondaryColor||"#0F172A",N=b?.backgroundColor||(c?"#090D16":"#F8FAFC"),k=b?.textColor||(c?"#E2E8F0":"#1E293B"),w=b?.fontFamily||"Inter, sans-serif";return a.jsx(i.Provider,{value:{activeThemeSlug:x,themeConfig:b,plugins:u},children:(0,a.jsxs)("div",{className:`min-h-screen flex flex-col theme-font theme-bg-override transition-colors duration-300 ${c?"dark bg-slate-950 text-slate-100":"bg-slate-50 text-slate-900"}`,children:[a.jsx("style",{dangerouslySetInnerHTML:{__html:`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Georgia:ital,wght@0,400;0,700;1,400&family=Share+Tech+Mono&display=swap');
          
          :root {
            --theme-primary: ${j};
            --theme-secondary: ${y};
            --theme-background: ${N};
            --theme-text: ${k};
            --theme-font: ${w};
            --theme-border-color: ${c?"rgba(255, 255, 255, 0.1)":"rgba(0, 0, 0, 0.06)"};
            --theme-header-bg: ${c?"rgba(9, 13, 22, 0.85)":"rgba(255, 255, 255, 0.85)"};
          }

          .theme-font, body, input, select, textarea, button {
            font-family: var(--theme-font), system-ui, -apple-system, sans-serif !important;
          }

          .theme-bg-override {
            background-color: var(--theme-background) !important;
            color: var(--theme-text) !important;
          }

          body {
            background-color: var(--theme-background) !important;
            color: var(--theme-text) !important;
          }

          .theme-primary-bg {
            background-color: var(--theme-primary) !important;
          }

          .theme-primary-text {
            color: var(--theme-primary) !important;
          }

          .theme-primary-border {
            border-color: var(--theme-primary) !important;
          }

          header.theme-header {
            background-color: var(--theme-header-bg) !important;
            border-color: var(--theme-border-color) !important;
          }

          .theme-nav-link:hover {
            color: var(--theme-primary) !important;
          }

          /* --- Retro Coffee Override Styles --- */
          ${"retro-coffee"===x?`
            :root {
              --theme-primary: #B45309;
              --theme-secondary: #78350F;
              --theme-background: #FEF3C7;
              --theme-text: #451A03;
              --theme-font: 'Georgia', serif;
            }
            body, .theme-font, p, span, input, select, button, textarea {
              font-family: 'Georgia', serif !important;
            }
            .theme-card {
              border: 3px solid #451A03 !important;
              border-radius: 0px !important;
              background-color: #FFFDF5 !important;
              box-shadow: 5px 5px 0px 0px #451A03 !important;
              color: #451A03 !important;
              transition: all 0.15s ease !important;
            }
            .theme-card:hover {
              transform: translate(-3px, -3px) !important;
              box-shadow: 8px 8px 0px 0px #451A03 !important;
            }
            .theme-btn, .theme-button, .theme-btn-primary {
              background-color: #B45309 !important;
              color: #FEF3C7 !important;
              border: 3px solid #451A03 !important;
              border-radius: 0px !important;
              box-shadow: 4px 4px 0px 0px #451A03 !important;
              font-weight: 800 !important;
              transition: all 0.1s ease !important;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .theme-btn:hover, .theme-button:hover, .theme-btn-primary:hover {
              transform: translate(-1px, -1px) !important;
              box-shadow: 5px 5px 0px 0px #451A03 !important;
              filter: brightness(1.05) !important;
            }
            .theme-btn:active, .theme-button:active, .theme-btn-primary:active {
              transform: translate(3px, 3px) !important;
              box-shadow: 1px 1px 0px 0px #451A03 !important;
            }
            .theme-border {
              border: 3px solid #451A03 !important;
              border-radius: 0px !important;
            }
            header.theme-header {
              background-color: #FEF3C7 !important;
              border-bottom: 4px solid #451A03 !important;
              color: #451A03 !important;
            }
            footer.theme-footer {
              background-color: #FFFBEB !important;
              border-top: 4px solid #451A03 !important;
              color: #451A03 !important;
            }
          `:"dark-midnight"===x?`
            /* --- Dark Midnight Override Styles --- */
            :root {
              --theme-primary: #6366F1;
              --theme-secondary: #0E1322;
              --theme-background: #090D16;
              --theme-text: #E2E8F0;
              --theme-font: 'system-ui', sans-serif;
            }
            body, .theme-font {
              font-family: 'system-ui', -apple-system, sans-serif !important;
            }
            .theme-card {
              border: 1px solid rgba(99, 102, 241, 0.25) !important;
              border-radius: 0.75rem !important;
              background-color: #0E1322 !important;
              box-shadow: 0 0 15px rgba(99, 102, 241, 0.05) !important;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            .theme-card:hover {
              border-color: rgba(99, 102, 241, 0.6) !important;
              box-shadow: 0 0 25px rgba(99, 102, 241, 0.35) !important;
              transform: translateY(-3px) !important;
            }
            .theme-btn, .theme-button, .theme-btn-primary {
              background-color: #6366F1 !important;
              color: #ffffff !important;
              border: 1px solid rgba(255, 255, 255, 0.15) !important;
              border-radius: 0.5rem !important;
              box-shadow: 0 0 15px rgba(99, 102, 241, 0.2) !important;
              transition: all 0.2s ease !important;
            }
            .theme-btn:hover, .theme-button:hover, .theme-btn-primary:hover {
              box-shadow: 0 0 25px rgba(99, 102, 241, 0.5) !important;
              background-color: #4F46E5 !important;
              transform: translateY(-1px) !important;
            }
            .theme-border {
              border-color: rgba(99, 102, 241, 0.2) !important;
            }
            header.theme-header {
              background-color: rgba(9, 13, 22, 0.9) !important;
              border-bottom: 1px solid rgba(99, 102, 241, 0.2) !important;
              backdrop-blur: 12px;
            }
            footer.theme-footer {
              background-color: #05070B !important;
              border-top: 1px solid rgba(99, 102, 241, 0.2) !important;
            }
          `:`
            /* --- Minimal SaaS Styles (Default) --- */
            .theme-card {
              border: 1px solid rgba(0, 0, 0, 0.06) !important;
              border-radius: 1rem !important;
              background-color: #ffffff !important;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
              transition: all 0.2s ease !important;
            }
            .theme-card:hover {
              transform: translateY(-2px) !important;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
            }
            .theme-btn, .theme-button, .theme-btn-primary {
              background-color: var(--theme-primary) !important;
              color: #ffffff !important;
              border-radius: 0.75rem !important;
              transition: all 0.2s ease !important;
            }
            .theme-btn:hover, .theme-button:hover, .theme-btn-primary:hover {
              filter: brightness(0.95) !important;
              transform: translateY(-1px) !important;
            }
            .theme-border {
              border-color: rgba(0, 0, 0, 0.06) !important;
            }
            header.theme-header {
              background-color: rgba(255, 255, 255, 0.85) !important;
              border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
            }
            footer.theme-footer {
              background-color: rgba(255, 255, 255, 0.4) !important;
              border-top: 1px solid rgba(0, 0, 0, 0.06) !important;
            }
          `}
        `}}),a.jsx("header",{className:`h-20 ${"retro-coffee"===x?"relative border-b-4 border-[#451A03]":"sticky border-b backdrop-blur-md"} top-0 z-40 transition-colors theme-header ${c?"bg-slate-950/80 border-slate-800":"bg-white/85 border-slate-100"}`,children:(0,a.jsxs)("div",{className:"max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between",children:[(0,a.jsxs)(s.default,{href:"/",className:"flex items-center gap-2",children:[a.jsx("div",{className:`h-9 w-9 ${"retro-coffee"===x?"rounded-none border-2 border-[#451A03] bg-[#B45309]":"dark-midnight"===x?"rounded-md bg-indigo-600 shadow-[0_0_10px_#6366F1]":"rounded-xl theme-primary-bg shadow-md shadow-blue-600/20"} flex items-center justify-center text-white font-extrabold`,children:"O"}),(0,a.jsxs)("span",{className:`font-extrabold text-xl tracking-tight ${"retro-coffee"===x?"text-[#451A03]":"text-slate-900 dark:text-white"}`,children:["Open","retro-coffee"===x?a.jsx("span",{className:"text-[#B45309]",children:"CMS"}):a.jsx("span",{className:"theme-primary-text",children:"CMS"})]})]}),a.jsx("nav",{className:"hidden md:flex items-center gap-6",children:v.map((e,r)=>{let o=t===e.href;return a.jsx(s.default,{href:e.href,className:`text-sm font-semibold transition-colors theme-nav-link ${o?"retro-coffee"===x?"text-[#B45309] font-black underline decoration-[#B45309] decoration-2":"theme-primary-text font-bold":"retro-coffee"===x?"text-[#451A03]":"text-slate-600 dark:text-slate-300"}`,children:e.name},r)})}),(0,a.jsxs)("div",{className:"flex items-center gap-4",children:["minimal-saas"===x&&a.jsx("button",{onClick:()=>{"minimal-saas"===x&&(c?(document.documentElement.classList.remove("dark"),localStorage.setItem("theme","light"),h(!1)):(document.documentElement.classList.add("dark"),localStorage.setItem("theme","dark"),h(!0)))},className:"p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-colors",children:a.jsx("i",{className:c?"ri-sun-line text-lg":"ri-moon-line text-lg"})}),"retro-coffee"===x&&a.jsx("span",{className:"hidden lg:inline text-xxs font-bold text-[#B45309] bg-[#FDE68A] border-2 border-[#451A03] px-2 py-1",children:"☕ Open 8am - 10pm"}),"dark-midnight"===x&&a.jsx("span",{className:"hidden lg:inline text-xxs font-mono text-[#6366F1] bg-[#1E1B4B] border border-[#6366F1]/30 px-2 py-1 rounded",children:"SYS: ONLINE"}),(0,a.jsxs)(s.default,{href:"/cart",className:`p-2 transition-colors relative flex items-center gap-1.5 ${"retro-coffee"===x?"border-2 border-[#451A03] rounded-none bg-[#FFFDF5] text-[#451A03] font-bold":"dark-midnight"===x?"border border-indigo-500/30 rounded bg-[#0E1322] text-slate-200":`border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${c?"border-slate-800 text-slate-200":"border-slate-200 text-slate-700"}`}`,children:[a.jsx("i",{className:"ri-shopping-cart-2-line text-lg"}),a.jsx("span",{className:"hidden sm:inline text-xs font-bold",children:"Cart"}),r>0&&a.jsx("span",{className:`absolute -top-1.5 -right-1.5 h-5 w-5 text-white rounded-full flex items-center justify-center text-3xs font-extrabold shadow-sm ${"retro-coffee"===x?"bg-[#B45309] border border-[#451A03]":"theme-primary-bg shadow-blue-500/30"}`,children:r})]}),a.jsx("button",{onClick:()=>m(!d),className:`p-2 rounded-lg transition-colors md:hidden ${"retro-coffee"===x?"border-2 border-[#451A03] text-[#451A03]":"text-slate-600 dark:text-slate-300"}`,children:a.jsx("i",{className:d?"ri-close-line text-xl":"ri-menu-3-line text-xl"})})]})]})}),d&&a.jsx("div",{className:`md:hidden border-b py-4 px-4 flex flex-col gap-4 absolute top-20 left-0 w-full z-30 shadow-md ${c?"bg-slate-900 border-slate-800":"bg-white border-slate-100"}`,style:{backgroundColor:"var(--theme-background)",borderColor:"var(--theme-border-color)"},children:v.map((e,r)=>a.jsx(s.default,{href:e.href,onClick:()=>m(!1),className:`text-sm font-semibold py-1.5 theme-nav-link ${t===e.href?"theme-primary-text font-bold":"text-slate-600 dark:text-slate-300"}`,children:e.name},r))}),a.jsx("main",{className:"flex-1 w-full",children:e}),(0,a.jsxs)("footer",{className:`border-t py-12 px-4 md:px-6 transition-colors theme-footer ${c?"bg-slate-900/40 border-slate-800 text-slate-400":"bg-white border-slate-100 text-slate-500"}`,children:[(0,a.jsxs)("div",{className:`max-w-7xl mx-auto grid grid-cols-1 ${"retro-coffee"===x?"md:grid-cols-3":"dark-midnight"===x?"md:grid-cols-2":"md:grid-cols-4"} gap-8`,children:[(0,a.jsxs)("div",{className:"space-y-4",children:[(0,a.jsxs)(s.default,{href:"/",className:"flex items-center gap-2",children:[a.jsx("div",{className:`h-8 w-8 ${"retro-coffee"===x?"rounded-none border-2 border-[#451A03] bg-[#B45309]":"rounded-lg theme-primary-bg"} flex items-center justify-center text-white font-extrabold`,children:"O"}),(0,a.jsxs)("span",{className:`font-extrabold text-lg ${"retro-coffee"===x?"text-[#451A03]":"text-slate-900 dark:text-white"}`,children:["Open","retro-coffee"===x?a.jsx("span",{className:"text-[#B45309]",children:"CMS"}):a.jsx("span",{className:"theme-primary-text",children:"CMS"})]})]}),a.jsx("p",{className:"text-xs leading-relaxed max-w-xs",children:"A premium, open-source headless CMS and e-commerce layout platform built with Next.js, TypeScript, and Tailwind CSS. Modern, lightning fast, and secure."}),(0,a.jsxs)("div",{className:"flex gap-3 text-slate-400",children:[a.jsx("i",{className:"ri-github-fill text-lg cursor-pointer hover:text-blue-500"}),a.jsx("i",{className:"ri-twitter-x-fill text-lg cursor-pointer hover:text-blue-500"}),a.jsx("i",{className:"ri-youtube-fill text-lg cursor-pointer hover:text-blue-500"})]})]}),(0,a.jsxs)("div",{className:"space-y-3",children:[a.jsx("span",{className:`text-xs font-bold uppercase tracking-wider ${"retro-coffee"===x?"text-[#451A03]":"text-slate-800 dark:text-slate-200"}`,children:"Shop Catalog"}),(0,a.jsxs)("ul",{className:"text-xs space-y-2",children:[a.jsx("li",{children:a.jsx(s.default,{href:"/shop",className:"hover:underline",children:"Apparel & Shirts"})}),a.jsx("li",{children:a.jsx(s.default,{href:"/shop",className:"hover:underline",children:"Audio Gadgets"})}),a.jsx("li",{children:a.jsx(s.default,{href:"/shop",className:"hover:underline",children:"Software Licences"})}),a.jsx("li",{children:a.jsx(s.default,{href:"/shop",className:"hover:underline",children:"Featured Releases"})})]})]}),"dark-midnight"!==x&&(0,a.jsxs)("div",{className:"space-y-3",children:[a.jsx("span",{className:`text-xs font-bold uppercase tracking-wider ${"retro-coffee"===x?"text-[#451A03]":"text-slate-800 dark:text-slate-200"}`,children:"Developer Resources"}),(0,a.jsxs)("ul",{className:"text-xs space-y-2",children:[a.jsx("li",{children:a.jsx(s.default,{href:"/admin/developers",className:"hover:underline",children:"API Documentation"})}),a.jsx("li",{children:a.jsx(s.default,{href:"/admin/developers",className:"hover:underline",children:"REST Webhook Setup"})}),a.jsx("li",{children:a.jsx(s.default,{href:"/admin/developers",className:"hover:underline",children:"Developer Keys"})}),a.jsx("li",{children:a.jsx(s.default,{href:"/admin/plugins",className:"hover:underline",children:"Plugin Core Guides"})})]})]}),"minimal-saas"===x&&(0,a.jsxs)("div",{className:"space-y-3",children:[a.jsx("span",{className:"text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider",children:"Subscribe"}),a.jsx("p",{className:"text-xs",children:"Stay updated with the latest in OpenCMS."}),(0,a.jsxs)("div",{className:"flex rounded-lg overflow-hidden border dark:border-slate-800",children:[a.jsx("input",{type:"email",placeholder:"developer@opencms.com",className:"bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 w-full focus:outline-none"}),a.jsx("button",{className:"theme-primary-bg text-white text-xs px-3 font-semibold theme-button",children:"Join"})]})]})]}),(0,a.jsxs)("div",{className:`max-w-7xl mx-auto border-t mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xxs ${"retro-coffee"===x?"border-[#451A03] text-[#451A03]/80":"border-slate-200 dark:border-slate-800 text-slate-400"}`,children:[a.jsx("p",{children:"\xa9 2026 OpenCMS Core. Rebuilding the web, one block at a time."}),(0,a.jsxs)("div",{className:"flex gap-4",children:[a.jsx("span",{className:"cursor-pointer hover:underline",children:"Privacy Policy"}),a.jsx("span",{className:"cursor-pointer hover:underline",children:"Terms of Service"}),a.jsx("span",{className:"cursor-pointer hover:underline",children:"Sitemap index"})]})]})]})]})})}},1043:(e,t,r)=>{"use strict";var a=r(2854);r.o(a,"useParams")&&r.d(t,{useParams:function(){return a.useParams}}),r.o(a,"usePathname")&&r.d(t,{usePathname:function(){return a.usePathname}}),r.o(a,"useRouter")&&r.d(t,{useRouter:function(){return a.useRouter}})},7718:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>i,metadata:()=>n});var a=r(9013),o=r(3219),s=r.n(o);r(5556);let n={title:"OpenCMS - Modern CMS & Commerce Platform",description:"A Next.js, Node.js, TypeScript and Tailwind CSS WordPress + WooCommerce replica."};function i({children:e}){return(0,a.jsxs)("html",{lang:"en",children:[a.jsx("head",{children:a.jsx("link",{href:"https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css",rel:"stylesheet"})}),a.jsx("body",{className:s().className,children:e})]})}},5556:()=>{}};