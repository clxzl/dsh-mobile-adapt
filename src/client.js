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
		const CSS = __MOBILE_CSS__;

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
