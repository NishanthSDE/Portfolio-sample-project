gsap.registerPlugin(ScrollTrigger, TextPlugin);
console.log(">>> [VISUAL REDESIGN ACTIVE] 3D REMOVED & HERO OPTIMIZED <<<");

window.sectionsReady = window.sectionsReady || Promise.resolve();

function initInteractiveCursor() {
    const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!supportsFinePointer) return;

    const cursor = document.querySelector("#interactive-cursor");
    if (!cursor) return;
    let lastX = 0, lastY = 0;
    let isOverInteractive = false;

    const interactiveSelector = "a, button, [role='button'], .site-loader-slider, .nav-links a";

    document.addEventListener("pointermove", (e) => {
        if (!document.body.classList.contains("is-loading")) {
            cursor.style.opacity = "0";
            return;
        }
        lastX = e.clientX; lastY = e.clientY;
        cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate3d(-50%, -50%, 0)`;
        cursor.style.opacity = "1";
    }, { passive: true });

    document.addEventListener("mouseover", (e) => {
        if (!document.body.classList.contains("is-loading")) return;
        const nowInteractive = !!(e.target && e.target.closest(interactiveSelector));
        if (nowInteractive === isOverInteractive) return;
        isOverInteractive = nowInteractive;
        cursor.classList.toggle("is-active", nowInteractive);
    });
}

function initSiteLoader() {
    const loader = document.querySelector("#site-loader");
    const sub = document.querySelector("#site-loader-sub");
    const percentEl = document.querySelector("#site-loader-percent");
    const progressFill = document.querySelector("#site-loader-progress-fill");
    const slider = document.querySelector("#site-loader-slider");
    const sliderThumb = document.querySelector("#site-loader-slider-thumb");
    const sliderFill = document.querySelector("#site-loader-slider-fill");

    if (!loader) return Promise.resolve();

    document.body.classList.add("is-loading");

    let isReady = false, entered = false, progressValue = 1;
    const progressState = { p: 1 };

    return new Promise((resolve) => {
        const updateProgress = (v) => {
            progressValue = Math.round(v);
            if (percentEl) percentEl.textContent = `${progressValue}%`;
            if (progressFill) progressFill.style.width = `${progressValue}%`;
        };

        const armEntry = () => {
            isReady = true;
            if (sub) sub.textContent = "System ready - swipe to enter";
            if (slider) slider.classList.add("is-ready");
        };

        const runOpenAnimation = () => {
            if (entered) return;
            entered = true;
            gsap.to(".site-loader-core, .site-loader-bg-text-wrap", { opacity: 0, y: -20, duration: 0.5 });
            const tl = gsap.timeline({
                onComplete: () => {
                    document.body.classList.remove("is-loading");
                    loader.remove();
                    resolve();
                }
            });
            tl.to(".site-loader-door-left", { xPercent: -100, duration: 1.2, ease: "power4.inOut" }, 0)
              .to(".site-loader-door-right", { xPercent: 100, duration: 1.2, ease: "power4.inOut" }, 0)
              .to(loader, { opacity: 0, duration: 0.5 }, 0.8);
        };

        // Slider logic
        if (sliderThumb) {
            let dragging = false, dragX = 0;
            const onStart = () => { if (isReady) dragging = true; };
            const onMove = (e) => {
                if (!dragging) return;
                const rect = slider.getBoundingClientRect();
                const x = (e.clientX || e.touches[0].clientX) - rect.left - 25;
                const max = rect.width - 60;
                dragX = Math.max(0, Math.min(max, x));
                sliderThumb.style.transform = `translateX(${dragX}px)`;
                sliderFill.style.width = `${dragX + 30}px`;
                if (dragX >= max * 0.95) { dragging = false; runOpenAnimation(); }
            };
            const onEnd = () => {
                if (!dragging) return;
                dragging = false;
                gsap.to(sliderThumb, { x: 0, duration: 0.3 });
                gsap.to(sliderFill, { width: 0, duration: 0.3 });
            };
            sliderThumb.addEventListener("mousedown", onStart);
            sliderThumb.addEventListener("touchstart", onStart);
            window.addEventListener("mousemove", onMove);
            window.addEventListener("touchmove", onMove);
            window.addEventListener("mouseup", onEnd);
            window.addEventListener("touchend", onEnd);
        }

        gsap.to(progressState, {
            p: 100, duration: 1.2, ease: "power1.inOut",
            onUpdate: () => updateProgress(progressState.p),
            onComplete: armEntry
        });
    });
}

initInteractiveCursor();

initSiteLoader().finally(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    function initScroll() {
        const locoScroll = new LocomotiveScroll({
            el: document.querySelector("#main"),
            smooth: !isTouchDevice,
            multiplier: 1,
            lerp: 0.1,
            smartphone: { smooth: false },
            tablet: { smooth: false }
        });

        locoScroll.on("scroll", ScrollTrigger.update);
        ScrollTrigger.scrollerProxy("#main", {
            scrollTop(value) {
                if (arguments.length) locoScroll.scrollTo(value, 0, 0);
                return isTouchDevice ? (window.pageYOffset || document.documentElement.scrollTop) : locoScroll.scroll.instance.scroll.y;
            },
            getBoundingClientRect() { return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }; },
            pinType: document.querySelector("#main").style.transform ? "transform" : "fixed"
        });

        ScrollTrigger.addEventListener("refresh", () => locoScroll.update());
        ScrollTrigger.refresh();

        document.querySelectorAll("[data-scroll-to]").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                locoScroll.scrollTo(link.getAttribute("href"));
            });
        });
        
        const cornerControls = document.querySelector("#corner-scroll-controls");
        locoScroll.on("scroll", (args) => {
            const y = args && args.scroll ? args.scroll.y : (window.pageYOffset || document.documentElement.scrollTop);
            if (cornerControls) cornerControls.classList.toggle("visible", y > 120);
        });
    }

    function initHeroAnimations() {
        gsap.from(".hero-visual-bg", { opacity: 0, duration: 2, ease: "power2.out" });
        gsap.from(".hero-glow-orb", { scale: 0, opacity: 0, duration: 2.5, stagger: 0.3, ease: "elastic.out(1, 0.5)" });
        
        gsap.utils.toArray(".transmission-reveal").forEach(el => {
            gsap.fromTo(el, { opacity: 0, y: 30 }, {
                opacity: 1, y: 0, duration: 1, ease: "power3.out",
                scrollTrigger: { trigger: el, scroller: "#main", start: "top 90%" }
            });
        });

        gsap.to("#hero-scroll-arrow", { opacity: 1, y: 0, duration: 1, delay: 1 });
    }

    function initMobileMenu() {
        const toggle = document.querySelector("#menu-toggle");
        const linksContainer = document.querySelector(".nav-links");
        if (!toggle || !linksContainer) return;
        toggle.addEventListener("click", () => {
            toggle.classList.toggle("active");
            linksContainer.classList.toggle("active");
        });
        linksContainer.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                toggle.classList.remove("active");
                linksContainer.classList.remove("active");
            });
        });
    }

    // Standard initializers
    initScroll();
    initHeroAnimations();
    initMobileMenu();

    // Refresh everything
    window.sectionsReady.then(() => {
        setTimeout(() => { ScrollTrigger.refresh(); }, 1000);
    });
});
