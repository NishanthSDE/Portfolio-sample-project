gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Detect touch device IMMEDIATELY and add class to body
// This must run before anything else so CSS mobile styles apply right away
(function() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('is-touch');
    }
})();

window.sectionsReady = window.sectionsReady || Promise.resolve();

function initInteractiveCursor() {
    const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!supportsFinePointer) return;

    const cursor = document.querySelector("#interactive-cursor");
    if (!cursor) return;
    let lastX = 0;
    let lastY = 0;
    let isOverInteractive = false;

    const interactiveSelector = "a, button, [role='button'], input, textarea, select, .site-loader-slider, .site-loader-slider-thumb, .nav-links a";

    const onMove = (e) => {
        if (!document.body.classList.contains("is-loading")) {
            cursor.style.opacity = "0";
            return;
        }
        lastX = e.clientX;
        lastY = e.clientY;
        cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate3d(-50%, -50%, 0)`;
        cursor.style.opacity = "1";
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseover", (e) => {
        if (!document.body.classList.contains("is-loading")) {
            cursor.classList.remove("is-active", "is-hidden");
            cursor.style.opacity = "0";
            return;
        }
        const nowInteractive = !!(e.target && e.target.closest(interactiveSelector));
        if (nowInteractive === isOverInteractive) return;
        isOverInteractive = nowInteractive;

        if (nowInteractive) {
            cursor.classList.add("is-active", "is-hidden");
        } else {
            cursor.classList.remove("is-active", "is-hidden");
            cursor.style.transform = `translate3d(${lastX}px, ${lastY}px, 0) translate3d(-50%, -50%, 0)`;
            cursor.style.opacity = "1";
        }
    });
    document.addEventListener("mousedown", () => cursor.classList.add("is-pressed"));
    document.addEventListener("mouseup", () => cursor.classList.remove("is-pressed"));
    document.addEventListener("mouseleave", () => { cursor.style.opacity = "0"; });
}

function initSiteLoader() {
    const loader = document.querySelector("#site-loader");
    const stage = document.querySelector("#site-loader-stage");
    const crack = document.querySelector("#site-loader-crack");
    const title = document.querySelector("#site-loader-title");
    const sub = document.querySelector("#site-loader-sub");
    const percentEl = document.querySelector("#site-loader-percent");
    const progressFill = document.querySelector("#site-loader-progress-fill");
    const slider = document.querySelector("#site-loader-slider");
    const sliderFill = document.querySelector("#site-loader-slider-fill");
    const sliderThumb = document.querySelector("#site-loader-slider-thumb");
    const doorLeft = document.querySelector(".site-loader-door-left");
    const doorRight = document.querySelector(".site-loader-door-right");
    if (!loader || !window.gsap) return Promise.resolve();

    document.body.classList.add("is-loading");

    gsap.set([doorLeft, doorRight], { autoAlpha: 0 });
    gsap.set(crack, { opacity: 0, scaleY: 0 });
    gsap.set(title, { y: 0, scale: 1 });

    gsap.to(".site-loader-atmo", {
        scale: 1.08,
        xPercent: -2,
        yPercent: 2,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });

    let isReady = false;
    let entered = false;
    let progressValue = 1;
    let dragX = 0;
    let dragging = false;
    const progressState = { p: 1 };
    let bootTween = null;

    return new Promise((resolve) => {
        const updateProgress = (v) => {
            progressValue = Math.max(1, Math.min(100, Math.round(v)));
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
            const tl = gsap.timeline({
                defaults: { ease: "power3.inOut" },
                onComplete: () => {
                    document.body.classList.remove("is-loading");
                    document.body.classList.add("site-loader-done");
                    const customCursor = document.querySelector("#interactive-cursor");
                    if (customCursor) {
                        customCursor.style.opacity = "0";
                    }
                    loader.remove();
                    resolve();
                }
            });

            tl.to(slider, { y: 8, opacity: 0, duration: 0.35 }, 0)
              .to(".site-loader-progress", { opacity: 0, duration: 0.25 }, 0)
              .to(sub, { opacity: 0, duration: 0.25 }, 0)
              .to(title, { scale: 1.08, y: 0, duration: 0.55 }, 0.05)
              .to(stage, { autoAlpha: 1, duration: 0.01 }, 0.22)
              .to([doorLeft, doorRight], { autoAlpha: 1, duration: 0.2 }, 0.22)
              .to(crack, { opacity: 1, scaleY: 1, duration: 0.3, ease: "power2.out" }, 0.25)
              .to(crack, { opacity: 0.65, duration: 0.12, yoyo: true, repeat: 1 }, 0.56)
              .to(title, { opacity: 0, duration: 0.25 }, 0.62)
              .to(doorLeft, { rotationY: -78, xPercent: -8, duration: 1.05, ease: "power4.inOut" }, 0.62)
              .to(doorRight, { rotationY: 78, xPercent: 8, duration: 1.05, ease: "power4.inOut" }, 0.62)
              .to("#site-loader", { opacity: 0, duration: 0.48, ease: "power2.out" }, 1.28);
        };

        const setSliderPos = (x) => {
            if (!slider || !sliderThumb || !sliderFill) return;
            const max = slider.clientWidth - sliderThumb.clientWidth - 8;
            dragX = Math.max(0, Math.min(max, x));
            sliderThumb.style.transform = `translateX(${dragX}px)`;
            sliderFill.style.width = `${dragX + sliderThumb.clientWidth / 2 + 4}px`;
        };

        const resetSlider = () => {
            gsap.to({ x: dragX }, {
                x: 0,
                duration: 0.35,
                ease: "power2.out",
                onUpdate() { setSliderPos(this.targets()[0].x); }
            });
        };

        const bindSlider = () => {
            if (!slider || !sliderThumb) return;
            const onPointerMove = (e) => {
                if (!dragging || !isReady || entered) return;
                const rect = slider.getBoundingClientRect();
                const x = e.clientX - rect.left - sliderThumb.clientWidth / 2 - 4;
                setSliderPos(x);
            };

            const onPointerUp = () => {
                if (!dragging) return;
                dragging = false;
                const max = slider.clientWidth - sliderThumb.clientWidth - 8;
                const ratio = max > 0 ? dragX / max : 0;
                if (ratio > 0.92 && isReady) {
                    setSliderPos(max);
                    runOpenAnimation();
                } else {
                    resetSlider();
                }
                window.removeEventListener("pointermove", onPointerMove);
                window.removeEventListener("pointerup", onPointerUp);
            };

            sliderThumb.addEventListener("pointerdown", () => {
                if (!isReady || entered) return;
                dragging = true;
                window.addEventListener("pointermove", onPointerMove);
                window.addEventListener("pointerup", onPointerUp);
            });
        };

        bindSlider();

        // Standard boot progress
        bootTween = gsap.to(progressState, {
            p: 100,
            duration: 1.5,
            ease: "power1.inOut",
            onUpdate() { updateProgress(progressState.p); },
            onComplete: () => {
                updateProgress(100);
                setTimeout(armEntry, 100);
            }
        });

        // Ensure sections are loaded at least minimally
        window.sectionsReady.then(() => {
            if (progressValue >= 90) armEntry();
        });
    });
}

initInteractiveCursor();

initSiteLoader().finally(() => {
    // 1. Locomotive Scroll & ScrollTrigger Proxy
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Add class to body for reliable CSS targeting
    if (isTouchDevice) {
        document.body.classList.add('is-touch');
    }

    function initScroll() {
        const nav = document.querySelector("#nav");
        const cornerControls = document.querySelector("#corner-scroll-controls");
        const scrollTopBtn = document.querySelector("#scroll-to-top");
        const scrollFooterBtn = document.querySelector("#scroll-to-footer");

        if (isTouchDevice) {
            // MOBILE: Use native scroll — no LocomotiveScroll, no proxy
            // This is the fix for the black screen and lag on mobile
            const mainEl = document.querySelector("#main");
            if (mainEl) {
                mainEl.style.overflow = "visible";
                mainEl.style.height = "auto";
            }
            document.body.style.overflowY = "auto";
            document.body.style.overflowX = "hidden";

            // Use window scroll for ScrollTrigger on mobile
            ScrollTrigger.defaults({ scroller: window });

            // Native scroll event for nav / corner controls
            window.addEventListener("scroll", () => {
                const y = window.pageYOffset || document.documentElement.scrollTop;
                if (cornerControls) cornerControls.classList.toggle("visible", y > 120);
                if (nav) nav.classList.toggle("scrolled", y > 50);
            }, { passive: true });

            // Scroll-to handler for nav links on mobile
            const handleScrollToMobile = (e) => {
                const link = e.target.closest("[data-scroll-to]");
                if (!link) return;
                e.preventDefault();
                const targetSel = link.getAttribute("href");
                if (targetSel) {
                    const targetEl = document.querySelector(targetSel);
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: "smooth" });
                    }
                    const menuToggle = document.querySelector("#menu-toggle");
                    const linksContainer = document.querySelector(".nav-links");
                    if (menuToggle) menuToggle.classList.remove("active");
                    if (linksContainer) linksContainer.classList.remove("active");
                    if (nav) nav.classList.remove("nav-open");
                    document.body.classList.remove("menu-open");
                }
            };
            document.addEventListener("click", handleScrollToMobile);

            if (scrollTopBtn) {
                scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
            }
            if (scrollFooterBtn) {
                scrollFooterBtn.addEventListener("click", () => {
                    const footer = document.querySelector("#footer");
                    if (footer) footer.scrollIntoView({ behavior: "smooth" });
                });
            }

            if (typeof window.resolveScrollerReady === "function") {
                window.resolveScrollerReady();
            }
            return;
        }

        // DESKTOP: Use LocomotiveScroll as before
        const locoScroll = new LocomotiveScroll({
            el: document.querySelector("#main"),
            smooth: true,
            multiplier: 1,
            lerp: 0.1,
            smartphone: { smooth: false },
            tablet: { smooth: false }
        });

        locoScroll.on("scroll", ScrollTrigger.update);
        locoScroll.on("scroll", (args) => {
            const y = args && args.scroll ? args.scroll.y : (window.pageYOffset || document.documentElement.scrollTop);
            if (cornerControls) cornerControls.classList.toggle("visible", y > 120);
            if (nav) nav.classList.toggle("scrolled", y > 50);
        });

        ScrollTrigger.scrollerProxy("#main", {
            scrollTop(value) {
                if (arguments.length) {
                    locoScroll.scrollTo(value, 0, 0);
                }
                return locoScroll.scroll.instance.scroll.y;
            },
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            },
            pinType: document.querySelector("#main").style.transform ? "transform" : "fixed"
        });

        ScrollTrigger.addEventListener("refresh", () => locoScroll.update());
        ScrollTrigger.refresh();

        if (typeof window.resolveScrollerReady === "function") {
            window.resolveScrollerReady();
        }

        // Global scroll-to handler
        const handleScrollTo = (e) => {
            const link = e.target.closest("[data-scroll-to]");
            if (!link) return;

            e.preventDefault();
            const target = link.getAttribute("href");
            if (target) {
                locoScroll.scrollTo(target);
                
                // Close any open menus
                const menuToggle = document.querySelector("#menu-toggle");
                const linksContainer = document.querySelector(".nav-links");
                if (menuToggle) menuToggle.classList.remove("active");
                if (linksContainer) linksContainer.classList.remove("active");
                if (nav) nav.classList.remove("nav-open");
                document.body.classList.remove("menu-open");
            }
        };

        document.addEventListener("click", handleScrollTo);

        if (scrollTopBtn) {
            scrollTopBtn.addEventListener("click", () => { locoScroll.scrollTo("#page"); });
        }

        if (scrollFooterBtn) {
            scrollFooterBtn.addEventListener("click", () => { locoScroll.scrollTo("#footer"); });
        }
    }

    // 2. Canvas Animation
    function initCanvas() {
        const canvas = document.querySelector("#hero-canvas");
        if (!canvas) return;
        const context = canvas.getContext("2d");

        // =====================================================
        // MOBILE: Skip ALL pinning and complex scroll triggers.
        // Just show a static first frame. No position:fixed.
        // This is the fix for the black screen on mobile.
        // =====================================================
        if (isTouchDevice) {
            canvas.style.position = "absolute";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.zIndex = "5";
            canvas.style.pointerEvents = "none";
            canvas.style.opacity = "0.85";

            // Resize canvas to match parent
            function resizeCanvasMobile() {
                const parent = canvas.parentElement || document.body;
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
                canvas.style.width = "100%";
                canvas.style.height = "100%";
            }
            resizeCanvasMobile();
            window.addEventListener("resize", resizeCanvasMobile, { passive: true });

            // Load and display only the first frame — static image
            const firstFrame = new Image();
            firstFrame.onload = () => {
                const w = canvas.width, h = canvas.height;
                const hRatio = w / firstFrame.width;
                const vRatio = h / firstFrame.height;
                const ratio = Math.max(hRatio, vRatio) * 0.8;
                const cx = (w - firstFrame.width * ratio) / 2;
                const cy = (h - firstFrame.height * ratio) / 2;
                context.clearRect(0, 0, w, h);
                context.drawImage(firstFrame, 0, 0, firstFrame.width, firstFrame.height, cx, cy, firstFrame.width * ratio, firstFrame.height * ratio);
                
                // Fade canvas out as user scrolls away from hero
                gsap.to(canvas, {
                    opacity: 0,
                    ease: "none",
                    scrollTrigger: {
                        trigger: "#page",
                        scroller: window,
                        start: "bottom 80%",
                        end: "bottom top",
                        scrub: true,
                        onLeave: () => { canvas.style.visibility = "hidden"; },
                        onEnterBack: () => { canvas.style.visibility = "visible"; }
                    }
                });
            };
            firstFrame.onerror = () => { canvas.style.display = "none"; };
            firstFrame.src = "./CYBERFICTION-IMAGES/male0001.png";
            return; // Exit early on mobile — no desktop canvas animation
        }

        // =====================================================
        // DESKTOP: Full canvas scroll animation with pinning
        // =====================================================
        const getDpr = () => Math.min(window.devicePixelRatio || 1, 2);
        const totalFrames = 150;
        const heroPinEnd = "600% top";
        
        const frameCache = new Map();
        const maxCacheSize = 100;

        function resizeCanvas() {
            const dpr = getDpr();
            const parent = canvas.parentElement || document.body;
            const width = parent.clientWidth;
            const height = parent.clientHeight;
            canvas.width = Math.ceil(width * dpr);
            canvas.height = Math.ceil(height * dpr);
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        resizeCanvas();
        window.addEventListener("resize", () => { resizeCanvas(); render(); });

        const images = [];
        const imageSeq = { frame: 0 };
        let loadedCount = 0;

        function getFilePath(index) {
            return `./CYBERFICTION-IMAGES/male${(index + 1).toString().padStart(4, '0')}.png`;
        }

        function loadFrame(index) {
            return new Promise((resolve) => {
                if (frameCache.has(index)) {
                    images[index] = frameCache.get(index);
                    resolve();
                    return;
                }
                const img = new Image();
                img.onload = () => {
                    loadedCount++;
                    frameCache.set(index, img);
                    if (frameCache.size > maxCacheSize) {
                        const firstKey = frameCache.keys().next().value;
                        frameCache.delete(firstKey);
                    }
                    if (index === 0) render();
                    resolve();
                };
                img.onerror = resolve;
                img.src = getFilePath(index);
                images[index] = img;
            });
        }

        async function startLoading() {
            const initialFrames = 15;
            for (let i = 0; i < initialFrames; i++) await loadFrame(i);
            for (let i = initialFrames; i < totalFrames; i++) loadFrame(i);
        }

        startLoading();

        gsap.to(imageSeq, {
            frame: totalFrames - 1,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                scrub: 0.15,
                trigger: "#page",
                start: "top top",
                end: heroPinEnd,
                scroller: "#main",
            },
            onUpdate: render
        });

        function render() {
            const img = images[imageSeq.frame] || frameCache.get(imageSeq.frame);
            if (img && img.complete) {
                const dpr = getDpr();
                const hRatio = canvas.width / dpr / img.width;
                const vRatio = canvas.height / dpr / img.height;
                let ratio = Math.max(hRatio, vRatio);
                if (window.innerWidth < 1025) {
                    const scaleFactor = Math.min(1, window.innerWidth / 1024);
                    ratio = ratio * 0.85 * scaleFactor;
                }
                const centerShift_x = (canvas.width / dpr - img.width * ratio) / 2;
                const centerShift_y = (canvas.height / dpr - img.height * ratio) / 2;
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
            }
        }

        ScrollTrigger.create({
            trigger: "#hero-canvas",
            pin: true,
            scroller: "#main",
            start: "top top",
            end: heroPinEnd,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: () => render()
        });

        gsap.to(canvas, {
            opacity: 0,
            ease: "none",
            scrollTrigger: {
                trigger: "#page1",
                scroller: "#main",
                start: "bottom 60%",
                end: "bottom top",
                scrub: true,
                onLeave: () => { canvas.style.display = "none"; frameCache.clear(); },
                onEnterBack: () => { canvas.style.display = "block"; }
            }
        });
    }

    // 3. Pinning Pages & Reveal Animations
    function initAnimations() {
        if (!isTouchDevice) {
            ["#page1"].forEach(id => {
                const el = document.querySelector(id);
                if (el) {
                    ScrollTrigger.create({
                        trigger: el,
                        pin: true,
                        scroller: "#main",
                        start: "top top",
                        end: "bottom top"
                    });
                }
            });
        }

        const certCards = gsap.utils.toArray(".card-sticky");
        if (certCards.length > 0) {
            certCards.forEach((card, index) => {
                ScrollTrigger.create({
                    trigger: card,
                    scroller: isTouchDevice ? window : "#main",
                    start: () => isTouchDevice ? "top 10%" : "top " + (15 + (index * 5)) + "%",
                    endTrigger: ".card-container",
                    end: "bottom bottom",
                    pin: !isTouchDevice,
                    pinSpacing: false,
                    invalidateOnRefresh: true,
                });
            });
        }

        // PERFORMANCE: Optimize reveal animations for mobile
        gsap.utils.toArray(".transmission-reveal").forEach(el => {
            gsap.fromTo(el, {
                opacity: 0,
                y: isTouchDevice ? 20 : 40,
                clipPath: isTouchDevice ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)" : "polygon(0 0, 100% 0, 100% 0, 0 0)"
            }, {
                opacity: 1,
                y: 0,
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                duration: isTouchDevice ? 0.6 : 1.2,
                ease: isTouchDevice ? "power2.out" : "power4.out",
                scrollTrigger: {
                    trigger: el,
                    scroller: isTouchDevice ? window : "#main",
                    start: "top 92%",
                    toggleActions: isTouchDevice ? "play none none none" : "play none none reverse"
                }
            });
        });
    }

    function initNavbar() {
        const nav = document.querySelector("#nav");
        const menuToggle = document.querySelector("#menu-toggle");
        const arrowToggle = document.querySelector("#nav-arrow-toggle");
        const linksContainer = document.querySelector(".nav-links");

        // Mobile Menu Toggle
        if(menuToggle && linksContainer) {
            menuToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                menuToggle.classList.toggle("active");
                linksContainer.classList.toggle("active");
                document.body.classList.toggle("menu-open");
            });
        }

        // Desktop Arrow Toggle
        if(arrowToggle && nav) {
            arrowToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                nav.classList.toggle("nav-open");
                const expanded = nav.classList.contains("nav-open");
                arrowToggle.setAttribute("aria-expanded", expanded);
            });
        }
    }

    // 5. Project Slider
    function initProjectStack() {
        const slider = document.querySelector(".marvel-slider-section");
        if (!slider) return;

        const slides = slider.querySelectorAll(".slide");
        const nextBtn = slider.querySelector(".next");
        const prevBtn = slider.querySelector(".prev");
        const dots = slider.querySelectorAll(".dot");
        if (!slides.length || !nextBtn || !prevBtn || !dots.length) return;
        
        let currentIdx = 0;
        let isAnimating = false;

        function updateSlider(index) {
            if (isAnimating) return;
            isAnimating = true;
            slides[currentIdx].classList.remove("active");
            dots[currentIdx].classList.remove("active");
            currentIdx = index;
            slides[currentIdx].classList.add("active");
            dots[currentIdx].classList.add("active");
            setTimeout(() => { isAnimating = false; }, 500);
        }

        nextBtn.addEventListener("click", () => updateSlider((currentIdx + 1) % slides.length));
        prevBtn.addEventListener("click", () => updateSlider((currentIdx - 1 + slides.length) % slides.length));
        dots.forEach((dot, idx) => dot.addEventListener("click", () => updateSlider(idx)));
    }

    // 6. Experience Showcase
    function initExperienceShowcase() {
        const section = document.querySelector("#experience-section");
        if (!section) return;
        const items = section.querySelectorAll("[data-exp-item]");
        if (!items.length) return;
        
        items.forEach(item => {
            // Use mouseenter for automatic opening
            item.addEventListener("mouseenter", () => {
                // Close others to keep it clean
                items.forEach(it => { if(it !== item) it.classList.remove("is-open"); });
                // Open current
                item.classList.add("is-open");
            });

            // Use mouseleave for automatic closing
            item.addEventListener("mouseleave", () => {
                item.classList.remove("is-open");
            });

            // Keep click for mobile support
            const toggle = item.querySelector("[data-exp-toggle]");
            const close = item.querySelector("[data-exp-close]");
            
            if(toggle) {
                toggle.addEventListener("click", (e) => {
                    e.preventDefault();
                    item.classList.toggle("is-open");
                    // Refresh is only really needed on mobile where they are relative
                    if (window.innerWidth <= 1024) {
                        setTimeout(() => { ScrollTrigger.refresh(); }, 400);
                    }
                });
            }

            if(close) {
                close.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.classList.remove("is-open");
                    if (window.innerWidth <= 1024) {
                        setTimeout(() => { ScrollTrigger.refresh(); }, 400);
                    }
                });
            }
        });

        gsap.fromTo(items,
            { autoAlpha: 0, y: 30 },
            {
                autoAlpha: 1, y: 0, 
                stagger: isTouchDevice ? 0.05 : 0.1,
                duration: isTouchDevice ? 0.4 : 0.6,
                scrollTrigger: {
                    trigger: section,
                    scroller: isTouchDevice ? window : "#main",
                    start: "top 85%",
                }
            }
        );
    }

    // 7. Certificate 3D Tilt
    function initCertificateTilt() {
        // Skip 3D tilt effects on mobile devices for performance
        if (isTouchDevice) return;
        
        const cards = document.querySelectorAll(".card-inner");
        if (!cards.length) return;

        cards.forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Gentler tilt for subtle feel
                const rotateX = (centerY - y) / 15;
                const rotateY = (x - centerX) / 15;
                
                gsap.to(card, {
                    rotateX: rotateX,
                    rotateY: rotateY,
                    scale: 1.03,
                    duration: 0.4,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            });

            card.addEventListener("mouseleave", () => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    scale: 1,
                    duration: 0.6,
                    ease: "elastic.out(1, 0.7)",
                    overwrite: "auto"
                });
            });
        });
    }

    // Initialize all
    initScroll();
    initCanvas();
    initNavbar();

    window.sectionsReady.then(() => {
        initAnimations();
        initProjectStack();
        initExperienceShowcase();
        initCertificateTilt();
        initFooterAnimation();
        
        // Refresh ScrollTrigger to account for newly injected elements
        ScrollTrigger.refresh();
    });

    function initFooterAnimation() {
        if (document.querySelector('#footer')) {
            gsap.fromTo('#footer', 
                { opacity: 0, y: 20 },
                {
                    opacity: 1, y: 0, duration: isTouchDevice ? 0.4 : 0.8,
                    scrollTrigger: { 
                        trigger: '#footer', 
                        scroller: isTouchDevice ? window : '#main', 
                        start: "top 95%"
                    }
                }
            );
        }
    }
    
    // FINAL REFRESH
    setTimeout(() => { ScrollTrigger.refresh(); }, 1000);
});