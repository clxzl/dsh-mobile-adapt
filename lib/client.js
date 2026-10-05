window.__ModuleLoader__.load({
	id: "@clxzl/dsh-mobile-adapt",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		/** Plugin id, reused as the owning style tag's `data-plugin` value. */
		const PLUGIN_ID = "dsh-mobile-adapt";
		/** Style tag identity consumed by the client HMR driver's unload bookkeeping. */
		const STYLE_ID = "dsh-mobile-adapt/mobile.css";
		/** Viewport widths strictly below this are treated as phones. */
		const MOBILE_MAX_WIDTH = 768;
		/** A coarse pointer widens the phone band up to this width (tablets, touch laptops). */
		const COARSE_MAX_WIDTH = 1024;
		/** Soft-keyboard inset above which the keyboard is considered open. */
		const KEYBOARD_MIN_INSET = 80;

		/**
		 * The whole adaptation layer. Anchors are the shell's public `data-slot`
		 * hosts and its `data-composer-*` / `data-conversation-*` hooks — never
		 * the hashed CSS-module class names, which change between builds.
		 */
		const CSS = "/* ==========================================================================\n   dsh-mobile-adapt — phone/tablet adaptation for the DSH Web GUI\n   Everything is gated on html[data-dsh-mobile], which the plugin sets from\n   the live viewport; a desktop window keeps the stock experience untouched.\n   ========================================================================== */\n\n/* --- 0. Touch fundamentals ------------------------------------------------ */\nhtml[data-dsh-mobile] {\n  -webkit-tap-highlight-color: transparent;\n  -webkit-text-size-adjust: 100%;\n  text-size-adjust: 100%;\n}\nhtml[data-dsh-mobile] button,\nhtml[data-dsh-mobile] [role=\"button\"],\nhtml[data-dsh-mobile] a,\nhtml[data-dsh-mobile] [data-slot] {\n  touch-action: manipulation;\n}\n/* The composer's own scroller keeps native panning. */\nhtml[data-dsh-mobile] [data-input-scroll],\nhtml[data-dsh-mobile] [data-conversation-scroll] {\n  touch-action: pan-y;\n  overscroll-behavior: contain;\n}\n\n/* --- 1. Dynamic viewport -------------------------------------------------- */\n/* The stock sheet pins html/body/#root to height:100%, which on a phone means\n   the desktop-sized viewport: the bottom of the shell can sit under the\n   browser chrome. dvh tracks the *current* visible viewport instead. */\n@supports (height: 100dvh) {\n  html[data-dsh-mobile],\n  html[data-dsh-mobile] body,\n  html[data-dsh-mobile] #root {\n    height: 100dvh;\n    max-height: 100dvh;\n  }\n}\n/* While the soft keyboard is open the app frame gives up exactly the keyboard\n   inset, so the composer stays glued above the keyboard. */\nhtml[data-dsh-mobile] #root > [data-slot=\"root\"] > div {\n  height: calc(100% - var(--dsh-mobile-keyboard-inset, 0px));\n  transition: height 140ms ease-out;\n}\nhtml[data-dsh-mobile][data-dsh-mobile-keyboard] #root > [data-slot=\"root\"] > div {\n  transition: none;\n}\n\n/* --- 2. Single-column layout --------------------------------------------- */\n/* The frame's columns come from an inline grid-template-columns written by\n   AppFrame's JS solver (56px rail + centre + optional right track). On a phone\n   that 56px rail alone eats 15% of the screen, so the columns are flattened\n   and the centre takes everything. The sidebar itself becomes an overlay\n   drawer (section 3) and therefore costs no layout width. */\nhtml[data-dsh-mobile] #root > [data-slot=\"root\"] > div {\n  grid-template-columns: 0px minmax(0, 1fr) 0px !important;\n}\n/* The drawer is taken out of the grid flow by position:fixed, so auto\n   placement would shift the centre and right items one track to the left\n   (centre landing in the 0px track). Pin every column explicitly. */\nhtml[data-dsh-mobile] [data-dsh-mobile-center] {\n  grid-column: 2;\n}\nhtml[data-dsh-mobile] [data-rightbar-col] {\n  grid-column: 3;\n}\n/* Width drag handles are pointer-only affordances. */\nhtml[data-dsh-mobile] [data-side] {\n  display: none !important;\n}\n\n/* --- 3. Sidebar drawer ---------------------------------------------------- */\nhtml[data-dsh-mobile] [data-dsh-mobile-sidebar] {\n  position: fixed !important;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  right: auto !important;\n  width: min(86vw, 340px) !important;\n  min-width: 0 !important;\n  max-width: 86vw !important;\n  height: 100% !important;\n  margin: 0 !important;\n  z-index: 62;\n  display: block !important;\n  overflow: hidden;\n  box-sizing: border-box;\n  padding-top: env(safe-area-inset-top, 0px);\n  padding-bottom: env(safe-area-inset-bottom, 0px);\n  background: var(--dsw-specific-sidebar-fill, var(--dsw-alias-bg-base));\n  border-right: 0.5px solid var(--dsw-alias-border-l3);\n  box-shadow: 0 12px 48px rgb(0 0 0 / 42%);\n  transform: translate3d(-102%, 0, 0);\n  transition: transform 260ms cubic-bezier(0.32, 0.72, 0, 1);\n  will-change: transform;\n}\nhtml[data-dsh-mobile] [data-dsh-mobile-sidebar][data-dsh-mobile-drawer=\"open\"] {\n  transform: translate3d(0, 0, 0);\n}\n/* The drawer owns the full height; the stock column's chrome offset is dropped. */\nhtml[data-dsh-mobile] [data-dsh-mobile-sidebar] > * {\n  max-height: 100%;\n}\n/* While the drawer is open the page behind must not scroll. The\n   data-dsh-mobile gate matters: the drawer state is also mirrored on desktop\n   (where the shell's own sidebar is simply expanded), and locking the page\n   there would break normal scrolling. */\nhtml[data-dsh-mobile][data-dsh-mobile-drawer=\"open\"],\nhtml[data-dsh-mobile][data-dsh-mobile-drawer=\"open\"] body {\n  overflow: hidden !important;\n}\n\n/* Scrim behind the drawer. */\nhtml[data-dsh-mobile] [data-dsh-mobile-scrim] {\n  display: block;\n}\n[data-dsh-mobile-scrim] {\n  display: none;\n  position: fixed;\n  inset: 0;\n  z-index: 61;\n  background: rgb(0 0 0 / 46%);\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity 260ms ease;\n  -webkit-tap-highlight-color: transparent;\n}\nhtml[data-dsh-mobile][data-dsh-mobile-drawer=\"open\"] [data-dsh-mobile-scrim] {\n  opacity: 1;\n  pointer-events: auto;\n}\n\n/* Drawer launcher (hamburger). Sits in the safe-area corner. */\n[data-dsh-mobile-launcher] {\n  display: none;\n  position: fixed;\n  top: calc(env(safe-area-inset-top, 0px) + 8px);\n  left: calc(env(safe-area-inset-left, 0px) + 8px);\n  z-index: 60;\n  width: 40px;\n  height: 40px;\n  padding: 0;\n  align-items: center;\n  justify-content: center;\n  border: 0.5px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-md, 8px);\n  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base));\n  color: var(--dsw-alias-label-primary);\n  box-shadow: var(--dsw-elevation-panel, 0 2px 10px rgb(0 0 0 / 20%));\n  cursor: pointer;\n  -webkit-tap-highlight-color: transparent;\n}\nhtml[data-dsh-mobile] [data-dsh-mobile-launcher] {\n  display: flex;\n}\nhtml[data-dsh-mobile][data-dsh-mobile-drawer=\"open\"] [data-dsh-mobile-launcher] {\n  display: none;\n}\n[data-dsh-mobile-launcher] svg {\n  display: block;\n  pointer-events: none;\n}\n/* Give the conversation header room for the launcher, and keep it clear of the\n   notch when the PWA runs standalone behind a translucent status bar. */\nhtml[data-dsh-mobile] [data-slot=\"conversation.header\"] > header {\n  padding-left: 56px;\n  padding-top: env(safe-area-inset-top, 0px);\n}\n\n/* --- 4. Readability ------------------------------------------------------- */\n/* 14px is a desktop body size; phones want a step up. The token ladder\n   (--dsh-content-font-delta*) is derived in CSS, so headings and secondary\n   text follow automatically. */\nhtml[data-dsh-mobile] body {\n  --dsh-content-font-size: 15px !important;\n}\n/* Long code lines and wide tables must scroll inside their own box instead of\n   stretching the conversation column past the screen. */\nhtml[data-dsh-mobile] [data-slot=\"main.conversation\"] pre {\n  overflow-x: auto !important;\n  max-width: 100% !important;\n  -webkit-overflow-scrolling: touch;\n}\nhtml[data-dsh-mobile] [data-slot=\"main.conversation\"] table {\n  display: block;\n  width: max-content;\n  max-width: 100%;\n  overflow-x: auto;\n  -webkit-overflow-scrolling: touch;\n}\nhtml[data-dsh-mobile] [data-slot=\"main.conversation\"] img,\nhtml[data-dsh-mobile] [data-slot=\"main.conversation\"] video,\nhtml[data-dsh-mobile] [data-slot=\"main.conversation\"] canvas {\n  max-width: 100% !important;\n  height: auto;\n}\nhtml[data-dsh-mobile] [data-slot=\"main.conversation\"] a,\nhtml[data-dsh-mobile] [data-slot=\"main.conversation\"] code {\n  overflow-wrap: anywhere;\n}\n\n/* --- 5. Touch targets and text-entry -------------------------------------- */\n@media (pointer: coarse) {\n  html[data-dsh-mobile] [data-slot=\"conversation.header\"] button,\n  html[data-dsh-mobile] [data-slot=\"conversation.composer\"] button[aria-label],\n  html[data-dsh-mobile] [data-slot=\"sidebar\"] button[aria-label] {\n    min-width: 40px;\n    min-height: 40px;\n  }\n}\n/* iOS Safari zooms the whole page when a control smaller than 16px takes\n   focus; the composer is a contenteditable, so it is covered too. */\nhtml[data-dsh-mobile] [data-composer-input],\nhtml[data-dsh-mobile] [contenteditable=\"true\"],\nhtml[data-dsh-mobile] textarea,\nhtml[data-dsh-mobile] input {\n  font-size: 16px !important;\n}\n/* Keep the composer above the home indicator. */\nhtml[data-dsh-mobile] [data-composer-seat] {\n  padding-bottom: env(safe-area-inset-bottom, 0px);\n}\n/* Menus and popovers never exceed the screen. */\nhtml[data-dsh-mobile] [data-dsh-mobile-surface] {\n  max-width: calc(100vw - 16px) !important;\n}\n\n/* --- 6. Let the shell's single-line previews wrap ------------------------- */\n/* Flow and tool summaries are authored as ONE nowrap line, sized for a desktop\n   column: measured 1000-4000px wide inside a 390px viewport. Two traps here:\n   the slot host above them is display: contents (so overflow on it does\n   nothing), and the line itself is an inline span (so max-width on it does\n   nothing either). What actually happens is the shell's own column clips it,\n   leaving the reader roughly the first third of every preview with no\n   ellipsis. Wrapping is the only fix that keeps the information. */\nhtml[data-dsh-mobile] [data-slot=\"main.conversation\"] [class*=\"summary\"],\nhtml[data-dsh-mobile] [data-slot=\"main.conversation\"] [class*=\"summary\"] * {\n  white-space: normal !important;\n  overflow-wrap: anywhere;\n}\n/* Backstop on the real grid box — not on the slot host, which is contents. */\nhtml[data-dsh-mobile] [data-dsh-mobile-center] {\n  overflow-x: clip;\n}\n\n/* --- 7. Code blocks ------------------------------------------------------- */\n/* The desktop sheet pins code at 11px through the font shorthand; that is\n   simply unreadable on a phone. */\nhtml[data-dsh-mobile] [data-slot=\"main.conversation\"] pre {\n  font-size: 13px !important;\n  line-height: 1.5 !important;\n}\n\n/* --- 8. Tap areas --------------------------------------------------------- */\n@media (pointer: coarse) {\n  /* Flow / tool rows render 25px tall at desktop density, yet they are the\n     primary way to expand a step on a touch screen. */\n  html[data-dsh-mobile] [data-slot=\"main.conversation\"] [class*=\"row\"] {\n    min-height: 36px;\n  }\n  /* Code-block toolbars and message feedback buttons ship at 24-29px. */\n  html[data-dsh-mobile] [data-slot=\"main.conversation\"] button {\n    min-width: 36px;\n    min-height: 36px;\n  }\n}\n\n/* --- 9. Settings dialog: two desktop columns do not fit a phone ----------- */\n/* The stock panel is a two-column dialog: a fixed 188px nav rail beside the\n   options. In a 390px viewport that leaves ~154px for the content, so every\n   option label wraps one character per line — measured, the section box came\n   out 101px wide and 3562px tall with its column clipping. Collapse it to a\n   single column with the nav as a horizontal strip on top.\n   :has(> nav) keys off the dialog's own structure rather than a hashed\n   class name; only the settings panel has a nav rail as a direct child. */\nhtml[data-dsh-mobile] [role=\"dialog\"]:has(> nav) {\n  position: fixed !important;\n  inset: 0 !important;\n  z-index: 100 !important;\n  width: auto !important;\n  height: auto !important;\n  max-width: none !important;\n  max-height: none !important;\n  margin: 0 !important;\n  border: 0 !important;\n  border-radius: 0 !important;\n  flex-direction: column !important;\n  padding-top: env(safe-area-inset-top, 0px) !important;\n  padding-bottom: env(safe-area-inset-bottom, 0px) !important;\n}\n/* nav rail -> top strip */\nhtml[data-dsh-mobile] [role=\"dialog\"]:has(> nav) > nav {\n  flex: none !important;\n  width: 100% !important;\n  height: auto !important;\n  max-height: none !important;\n  flex-direction: column !important;\n  border-right: 0 !important;\n  border-bottom: 0.5px solid var(--dsw-alias-border-l3) !important;\n  padding: 0 !important;\n}\n/* the rail's own title row is redundant: the panel header already reads 设置 */\nhtml[data-dsh-mobile] [role=\"dialog\"]:has(> nav) > nav > :first-child {\n  display: none !important;\n}\nhtml[data-dsh-mobile] [role=\"dialog\"]:has(> nav) > nav > :last-child {\n  flex-direction: row !important;\n  width: 100% !important;\n  height: auto !important;\n  max-height: none !important;\n  gap: 0 !important;\n  padding: 0 8px !important;\n  overflow-x: auto !important;\n  overflow-y: hidden !important;\n  scrollbar-width: none;\n}\nhtml[data-dsh-mobile] [role=\"dialog\"]:has(> nav) > nav > :last-child::-webkit-scrollbar {\n  display: none;\n}\nhtml[data-dsh-mobile] [role=\"dialog\"]:has(> nav) > nav > :last-child > button {\n  flex: none !important;\n  width: auto !important;\n  min-width: 0 !important;\n  height: 46px !important;\n  padding: 0 14px !important;\n  white-space: nowrap !important;\n}\nhtml[data-dsh-mobile] [role=\"dialog\"]:has(> nav) > nav > :last-child > button span {\n  width: auto !important;\n  max-width: none !important;\n  font-size: 13px !important;\n  white-space: nowrap !important;\n  overflow: visible !important;\n}\n/* the options column takes everything that is left */\nhtml[data-dsh-mobile] [role=\"dialog\"]:has(> nav) > :last-child,\nhtml[data-dsh-mobile] [role=\"dialog\"]:has(> nav) > :last-child > * {\n  flex: 1 1 auto !important;\n  width: 100% !important;\n  min-width: 0 !important;\n  min-height: 0 !important;\n  /* the stock options column is content-box: width:100% plus its own\n     horizontal padding would exceed the panel and add a stray scrollbar */\n  box-sizing: border-box !important;\n}\n@media (pointer: coarse) {\n  /* the preset rows ship a 28x32 查看配置 button */\n  html[data-dsh-mobile] [role=\"dialog\"]:has(> nav) button {\n    min-width: 32px;\n    min-height: 36px;\n  }\n  html[data-dsh-mobile] [role=\"dialog\"]:has(> nav) [class*=\"close\"] {\n    min-width: 40px !important;\n    min-height: 40px !important;\n  }\n  /* the font-size stepper ships as 17x32 */\n  html[data-dsh-mobile] [role=\"dialog\"]:has(> nav) [aria-label=\"增大字号\"],\n  html[data-dsh-mobile] [role=\"dialog\"]:has(> nav) [aria-label=\"减小字号\"] {\n    min-width: 32px !important;\n  }\n}\n\n/* --- 10. Drawer internals ------------------------------------------------- */\n/* The drawer column is sized by this plugin (min(86vw, 340px)) while the\n   shell's sidebar component still renders at its desktop width of 280px,\n   leaving a dead gutter on the right. Let the component own the full drawer. */\nhtml[data-dsh-mobile] [data-slot=\"sidebar\"] > * {\n  width: 100% !important;\n  min-width: 0 !important;\n  max-width: none !important;\n}\n/* The keyboard shortcut hint (Ctrl+Alt+N) means nothing on a phone, and it is\n   what squeezes the 新会话 label into a clipped mask. */\nhtml[data-dsh-mobile] [data-slot=\"sidebar\"] [class*=\"hortcut\"],\nhtml[data-dsh-mobile] [data-slot=\"sidebar\"] kbd {\n  display: none !important;\n}\n/* The workspace header's action cluster is pinned to a 60px width while its\n   buttons need ~90px, so the last one gets clipped; free it and let the flex\n   row place it. */\nhtml[data-dsh-mobile] [data-slot=\"sidebar\"] [class*=\"headerActions\"] {\n  flex: none !important;\n  width: auto !important;\n  max-width: none !important;\n}\n@media (pointer: coarse) {\n  /* Session and project rows are div role=treeitem, not buttons, so the button\n     sizing rule never reached them: they shipped at 32-34px tall. */\n  html[data-dsh-mobile] [data-slot=\"sidebar\"] [role=\"treeitem\"] {\n    min-height: 40px;\n  }\n  html[data-dsh-mobile] [data-slot=\"sidebar\"] [class*=\"searchSlot\"] button,\n  html[data-dsh-mobile] [data-slot=\"sidebar\"] [class*=\"searchButton\"] {\n    min-width: 36px;\n    min-height: 36px;\n  }\n}\n";

		/** Mint the plugin-owned stylesheet; returns the node, or null when already present. */
		function injectStyles() {
			if (typeof document === "undefined") return null;
			if (document.querySelector("style[data-plugin-css=" + JSON.stringify(STYLE_ID) + "]") !== null) return null;
			const tag = document.createElement("style");
			tag.dataset.plugin = PLUGIN_ID;
			tag.dataset.pluginCss = STYLE_ID;
			tag.textContent = CSS;
			document.head.appendChild(tag);
			return tag;
		}

		/** The shell's frame: the only element child under the root slot host. */
		function findFrame() {
			return document.querySelector('#root > [data-slot="root"] > div');
		}

		/** The sidebar slot host, whose transparent ancestors lead to the grid column. */
		function findSidebarSlot() {
			return document.querySelector('#root [data-slot="sidebar"]');
		}

		/** The main slot host, whose transparent ancestors lead to the centre column. */
		function findCenterSlot() {
			return document.querySelector('#root [data-slot="main"]');
		}

		/**
		 * Walk up from a slot host to the real layout box. Slot hosts render with
		 * `display: contents`, so the first ancestor that contributes a box is the
		 * grid item the frame sized.
		 * @param host - the slot host element.
		 * @returns the owning column element, or null.
		 */
		function columnOf(host) {
			const view = host.ownerDocument.defaultView;
			let node = host.parentElement;
			while (node !== null && node !== document.body) {
				const display = view === null ? "" : view.getComputedStyle(node).display;
				if (display !== "contents") return node;
				node = node.parentElement;
			}
			return null;
		}

		/**
		 * Read a cross-plugin service without tripping the cordis proxy: touching
		 * an unregistered service name throws, so every access is guarded.
		 * @param ctx - the plugin context.
		 * @param name - the service name.
		 * @returns the service, or null when unavailable.
		 */
		function serviceOf(ctx, name) {
			try {
				if (ctx === undefined || ctx === null) return null;
				if (ctx[name] !== undefined) return ctx[name];
			} catch (error) {
				/* fall through to the reflective lookups */
			}
			try {
				if (typeof ctx.get === "function") {
					const direct = ctx.get(name);
					if (direct !== undefined && direct !== null) return direct;
				}
			} catch (error) {
				/* fall through */
			}
			try {
				if (ctx.reflect !== undefined && typeof ctx.reflect.get === "function") {
					const reflected = ctx.reflect.get(name);
					if (reflected !== undefined && reflected !== null) return reflected;
				}
			} catch (error) {
				/* unavailable */
			}
			return null;
		}

		/**
		 * Build the whole adapter and return its teardown.
		 * @param ctx - the client plugin context.
		 * @returns the disposer registered through `ctx.effect`.
		 */
		function createAdapter(ctx) {
			const cleanup = [];
			const styleEl = injectStyles();
			if (styleEl !== null) cleanup.push(() => styleEl.remove());

			/* The stock viewport meta has no viewport-fit=cover, so env(safe-area-*)
			   would resolve to 0 on notched phones. */
			const meta = document.querySelector('meta[name="viewport"]');
			if (meta !== null) {
				const previous = meta.getAttribute("content");
				meta.setAttribute("content", "width=device-width, initial-scale=1, viewport-fit=cover");
				cleanup.push(() => {
					if (previous === null) meta.removeAttribute("content");
					else meta.setAttribute("content", previous);
				});
			}

			const coarse = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)") : null;
			let mobile = false;
			let frameEl = null;
			let sidebarCol = null;
			let centerCol = null;
			let frameObserver = null;
			let bootObserver = null;

			/** Whether the current viewport should get the phone layout. */
			function measureMobile() {
				const width = window.innerWidth || document.documentElement.clientWidth || 0;
				if (width === 0) return false;
				if (width < MOBILE_MAX_WIDTH) return true;
				return coarse !== null && coarse.matches && width < COARSE_MAX_WIDTH;
			}

			/* --- injected chrome ------------------------------------------- */
			const launcher = document.createElement("button");
			launcher.type = "button";
			launcher.setAttribute("data-dsh-mobile-launcher", "");
			launcher.setAttribute("aria-label", "打开侧边栏");
			launcher.innerHTML =
				'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
				'stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
				'<path d="M3 6h18M3 12h18M3 18h18"/></svg>';
			document.body.appendChild(launcher);
			cleanup.push(() => launcher.remove());

			const scrim = document.createElement("div");
			scrim.setAttribute("data-dsh-mobile-scrim", "");
			document.body.appendChild(scrim);
			cleanup.push(() => scrim.remove());

			/* --- drawer state --------------------------------------------- */
			/** The shell reports a collapsed sidebar through this frame attribute. */
			function drawerOpen() {
				return frameEl !== null && !frameEl.hasAttribute("data-sidebar-collapsed");
			}

			/** Mirror the shell's own collapsed flag onto the plugin's CSS hooks. */
			function syncDrawer() {
				const open = drawerOpen();
				if (sidebarCol !== null) sidebarCol.setAttribute("data-dsh-mobile-drawer", open ? "open" : "closed");
				/* The html-level flag drives the scrim and the scroll lock, so it
				   must only ever be set in the phone layout: on desktop the shell's
				   sidebar is simply expanded and nothing should change. */
				if (open && mobile) document.documentElement.setAttribute("data-dsh-mobile-drawer", "open");
				else document.documentElement.removeAttribute("data-dsh-mobile-drawer");
			}

			/** Ask the layout service to flip the sidebar; it owns the real state. */
			function toggleSidebar() {
				const layout = serviceOf(ctx, "layout");
				if (layout === null || typeof layout.toggleSidebar !== "function") return;
				try {
					layout.toggleSidebar();
				} catch (error) {
					/* the shell refused the toggle: leave the current state alone */
				}
			}

			/** Bind to the frame and both layout columns once they exist. */
			function attach() {
				const frame = findFrame();
				const slot = findSidebarSlot();
				const centerSlot = findCenterSlot();
				if (frame === null || slot === null || centerSlot === null) return false;
				const column = columnOf(slot);
				const center = columnOf(centerSlot);
				if (column === null || center === null) return false;

				if (frameObserver !== null) frameObserver.disconnect();
				if (sidebarCol !== null && sidebarCol !== column) sidebarCol.removeAttribute("data-dsh-mobile-sidebar");
				if (centerCol !== null && centerCol !== center) centerCol.removeAttribute("data-dsh-mobile-center");

				frameEl = frame;
				sidebarCol = column;
				centerCol = center;
				column.setAttribute("data-dsh-mobile-sidebar", "");
				center.setAttribute("data-dsh-mobile-center", "");

				frameObserver = new MutationObserver(syncDrawer);
				frameObserver.observe(frame, { attributes: true, attributeFilter: ["data-sidebar-collapsed"] });
				syncDrawer();
				return true;
			}

			/* --- soft keyboard -------------------------------------------- */
			/** Track the visual viewport so the composer clears the keyboard. */
			function syncKeyboard() {
				const vv = window.visualViewport;
				if (vv === undefined || vv === null) return;
				const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
				const open = inset > KEYBOARD_MIN_INSET;
				document.documentElement.style.setProperty("--dsh-mobile-keyboard-inset", (open ? inset : 0) + "px");
				if (open) document.documentElement.setAttribute("data-dsh-mobile-keyboard", "");
				else document.documentElement.removeAttribute("data-dsh-mobile-keyboard");
			}

			/* --- environment flag ----------------------------------------- */
			/** Publish the measured environment onto <html>. */
			function render() {
				if (mobile) document.documentElement.setAttribute("data-dsh-mobile", "");
				else document.documentElement.removeAttribute("data-dsh-mobile");
				if (!mobile) {
					if (sidebarCol !== null) sidebarCol.removeAttribute("data-dsh-mobile-drawer");
					document.documentElement.removeAttribute("data-dsh-mobile-drawer");
				} else {
					syncDrawer();
				}
			}

			/** Re-measure on resize: crossing the breakpoint swaps the whole layer. */
			function onResize() {
				const next = measureMobile();
				if (next !== mobile) {
					mobile = next;
					render();
				}
				syncKeyboard();
			}

			/* --- interaction ---------------------------------------------- */
			const onLauncher = (event) => {
				event.preventDefault();
				event.stopPropagation();
				toggleSidebar();
			};
			launcher.addEventListener("click", onLauncher);
			cleanup.push(() => launcher.removeEventListener("click", onLauncher));

			const onScrim = () => {
				if (drawerOpen()) toggleSidebar();
			};
			scrim.addEventListener("click", onScrim);
			cleanup.push(() => scrim.removeEventListener("click", onScrim));

			/* Edge-swipe: reveal from the left edge, dismiss with a left swipe. */
			let touchX = 0;
			let touchY = 0;
			let tracking = false;
			const onTouchStart = (event) => {
				if (!mobile) return;
				const touch = event.touches[0];
				if (touch === undefined) return;
				touchX = touch.clientX;
				touchY = touch.clientY;
				tracking = true;
			};
			const onTouchEnd = (event) => {
				if (!mobile || !tracking) return;
				tracking = false;
				const touch = event.changedTouches[0];
				if (touch === undefined) return;
				const dx = touch.clientX - touchX;
				const dy = touch.clientY - touchY;
				if (Math.abs(dx) < 56 || Math.abs(dy) > Math.abs(dx)) return;
				const open = drawerOpen();
				if (!open && touchX <= 28 && dx > 0) toggleSidebar();
				else if (open && dx < 0) toggleSidebar();
			};
			document.addEventListener("touchstart", onTouchStart, { passive: true });
			document.addEventListener("touchend", onTouchEnd, { passive: true });
			cleanup.push(() => {
				document.removeEventListener("touchstart", onTouchStart);
				document.removeEventListener("touchend", onTouchEnd);
			});

			window.addEventListener("resize", onResize);
			cleanup.push(() => window.removeEventListener("resize", onResize));

			if (coarse !== null) {
				const onPointerChange = () => onResize();
				if (typeof coarse.addEventListener === "function") {
					coarse.addEventListener("change", onPointerChange);
					cleanup.push(() => coarse.removeEventListener("change", onPointerChange));
				}
			}

			if (window.visualViewport !== undefined && window.visualViewport !== null) {
				const vv = window.visualViewport;
				vv.addEventListener("resize", syncKeyboard);
				vv.addEventListener("scroll", syncKeyboard);
				cleanup.push(() => {
					vv.removeEventListener("resize", syncKeyboard);
					vv.removeEventListener("scroll", syncKeyboard);
				});
			}

			/* A cheap safety net: React remounts the frame on session switches and
			   HMR, and the bound nodes can be replaced without any resize event. */
			const guard = setInterval(() => {
				if (
					frameEl === null || !frameEl.isConnected ||
					sidebarCol === null || !sidebarCol.isConnected ||
					centerCol === null || !centerCol.isConnected
				) {
					if (attach() && mobile) render();
				}
			}, 1500);
			cleanup.push(() => clearInterval(guard));

			/* --- boot ----------------------------------------------------- */
			mobile = measureMobile();
			render();
			if (!attach()) {
				/* React has not mounted the shell yet. Retry on the next DOM
				   mutation instead of waiting for the guard tick, so the phone
				   layout settles in the same frame the shell appears. */
				let scheduled = false;
				bootObserver = new MutationObserver(() => {
					if (scheduled) return;
					scheduled = true;
					requestAnimationFrame(() => {
						scheduled = false;
						if (attach()) {
							bootObserver.disconnect();
							bootObserver = null;
							if (mobile) render();
						}
					});
				});
				bootObserver.observe(document.documentElement, { childList: true, subtree: true });
			}
			syncKeyboard();
			document.documentElement.setAttribute("data-dsh-mobile-adapt", PLUGIN_ID);

			return () => {
				if (frameObserver !== null) frameObserver.disconnect();
				if (bootObserver !== null) bootObserver.disconnect();
				if (sidebarCol !== null) {
					sidebarCol.removeAttribute("data-dsh-mobile-sidebar");
					sidebarCol.removeAttribute("data-dsh-mobile-drawer");
				}
				if (centerCol !== null) centerCol.removeAttribute("data-dsh-mobile-center");
				document.documentElement.removeAttribute("data-dsh-mobile");
				document.documentElement.removeAttribute("data-dsh-mobile-drawer");
				document.documentElement.removeAttribute("data-dsh-mobile-keyboard");
				document.documentElement.removeAttribute("data-dsh-mobile-adapt");
				document.documentElement.style.removeProperty("--dsh-mobile-keyboard-inset");
				for (const dispose of cleanup) {
					try {
						dispose();
					} catch (error) {
						/* teardown must not throw */
					}
				}
			};
		}

		/** Required client services: none — the layer is pure DOM + its own stylesheet. */
		const inject = [];

		/**
		 * Client plugin body: one effect owning the whole adaptation layer.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.effect(() => createAdapter(ctx), "dsh-mobile-adapt: mobile layer");
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
