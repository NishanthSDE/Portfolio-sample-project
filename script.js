gsap.registerPlugin(ScrollTrigger, TextPlugin);

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

        bootTween = gsap.to(progressState, {
            p: 88,
            duration: 2.6,
            ease: "power1.inOut",
            onUpdate() { updateProgress(progressState.p); }
        });

        Promise.all([
            window.sectionsReady,
            new Promise((done) => {
                if (document.readyState === "complete") done();
                else window.addEventListener("load", done, { once: true });
            })
        ])
            .then(() => {
                if (bootTween) bootTween.kill();
                gsap.to(progressState, {
                    p: 100,
                    duration: 1.1,
                    ease: "power2.out",
                    onUpdate() { updateProgress(progressState.p); },
                    onComplete: () => {
                        updateProgress(100);
                        if (progressFill) progressFill.style.width = "100%";
                        setTimeout(armEntry, 250);
                    }
                });
            })
            .catch(() => armEntry());
    });
}

initInteractiveCursor();

initSiteLoader().finally(() => window.sectionsReady.then(() => {
    // 1. Locomotive Scroll & ScrollTrigger Proxy
    function initScroll() {
        const locoScroll = new LocomotiveScroll({
            el: document.querySelector("#main"),
            smooth: true,
            multiplier: 1,
            lerp: 0.1
        });

        const cornerControls = document.querySelector("#corner-scroll-controls");
        const scrollTopBtn = document.querySelector("#scroll-to-top");
        const scrollFooterBtn = document.querySelector("#scroll-to-footer");

        locoScroll.on("scroll", ScrollTrigger.update);
        locoScroll.on("scroll", (args) => {
            if (!cornerControls) return;
            const y = args && args.scroll ? args.scroll.y : 0;
            cornerControls.classList.toggle("visible", y > 120);
        });

        ScrollTrigger.scrollerProxy("#main", {
            scrollTop(value) {
                return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
            },
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            },
            // Since we are using Locomotive Scroll, we MUST use "transform" pinType
            pinType: "transform"
        });

        ScrollTrigger.addEventListener("refresh", () => locoScroll.update());
        ScrollTrigger.refresh();

        // Signal that the scroller and proxy are ready for section-specific animations
        if (typeof window.resolveScrollerReady === "function") {
            window.resolveScrollerReady();
        }

        // Smooth Scroll to Sections
        document.querySelectorAll("[data-scroll-to]").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const target = link.getAttribute("href");
                locoScroll.scrollTo(target);
            });
        });

        if (scrollTopBtn) {
            scrollTopBtn.addEventListener("click", () => {
                locoScroll.scrollTo("#page");
            });
        }

        if (scrollFooterBtn) {
            scrollFooterBtn.addEventListener("click", () => {
                locoScroll.scrollTo("#footer");
            });
        }
    }

    // 2. Canvas Animation (Cyberfiction Style)
    function initCanvas() {
        const canvas = document.querySelector("canvas");
        if (!canvas) return;
        const context = canvas.getContext("2d");
        const getDpr = () => Math.min(window.devicePixelRatio || 1, 2);
        const isMobile = window.innerWidth < 1030;
        const totalFrames = 150;
        const desktopPinPercent = Math.round((totalFrames / 300) * 600); // keep original pacing relative to 300-frame setup
        const heroPinEnd = isMobile ? "100% top" : `${desktopPinPercent}% top`;
        const loaderText = document.querySelector("#hero-footer h4");

        function resizeCanvas() {
            const dpr = getDpr();
            canvas.width = Math.ceil(window.innerWidth * dpr);
            canvas.height = Math.ceil(window.innerHeight * dpr);
            canvas.style.width = "100vw";
            canvas.style.height = "100vh";
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        resizeCanvas();

        window.addEventListener("resize", () => {
            resizeCanvas();
            render();
        });

        // Optimization: Mobile uses fewer frames to save memory (every 2nd frame)
        const frameStep = isMobile ? 2 : 1;
        const framesToLoad = [];
        
        for (let i = 1; i <= totalFrames; i += frameStep) {
            framesToLoad.push(i);
        }

        const frameCount = framesToLoad.length;
        const images = [];
        const imageSeq = { frame: 0 };
        let loadedCount = 0;

        function getFilePath(index) {
            const frameNum = framesToLoad[index];
            return `./CYBERFICTION-IMAGES/male${frameNum.toString().padStart(4, '0')}.png`;
        }

        // Progressively load images: Priority for first 50 frames
        const PRIORITY_COUNT = Math.min(50, frameCount);
        
        function updateLoaderUI() {
            if (loaderText) {
                const progress = Math.round((loadedCount / frameCount) * 100);
                loaderText.innerText = `..SYNCING NEURAL INTERFACE: ${progress}%`;
                if (progress === 100) {
                    gsap.to(loaderText, {
                        text: "SCROLL TO EXPLORE MORE",
                        duration: 1,
                        delay: 0.5,
                        onComplete: () => {
                            gsap.to("#hero-scroll-arrow", {
                                opacity: 1,
                                y: 0,
                                duration: 0.8,
                                ease: "power2.out"
                            });
                        }
                    });
                }
            }
        }

        function loadFrame(index) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    loadedCount++;
                    updateLoaderUI();
                    if (index === 0) render(); // Render first frame immediately
                    resolve();
                };
                img.onerror = resolve; // Continue even if one fails
                img.src = getFilePath(index);
                images[index] = img;
            });
        }

        async function startLoading() {
            // Step 1: Load Priority Frames (first 50) sequentially for instant feedback
            for (let i = 0; i < PRIORITY_COUNT; i++) {
                await loadFrame(i);
            }

            // Step 2: Load remaining frames in small batches to not block main thread
            const batchSize = 5;
            for (let i = PRIORITY_COUNT; i < frameCount; i += batchSize) {
                const batch = [];
                for (let j = 0; j < batchSize && (i + j) < frameCount; j++) {
                    batch.push(loadFrame(i + j));
                }
                await Promise.all(batch);
                // Optional: delay slightly between batches on mobile
                if (isMobile) await new Promise(r => setTimeout(r, 50));
            }
        }

        startLoading();

        // 3D Model Frame Animation
        gsap.to(imageSeq, {
            frame: frameCount - 1,
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
            const img = images[imageSeq.frame];
            if (img && img.complete) {
                scaleImage(img, context);
            }
        }

        function scaleImage(img, ctx) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const hRatio = viewportWidth / img.width;
            const vRatio = viewportHeight / img.height;
            
            // On desktop, we want a 'cover' effect, on mobile/tablet we want 'contain'
            let ratio = window.innerWidth < 1030 ? Math.min(hRatio, vRatio) * 0.9 : Math.max(hRatio, vRatio);

            const centerShift_x = (viewportWidth - img.width * ratio) / 2;
            const centerShift_y = (viewportHeight - img.height * ratio) / 2;

            ctx.clearRect(0, 0, viewportWidth, viewportHeight);
            ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
        }

        // Canvas Pinning Logic
        ScrollTrigger.create({
            trigger: "#page canvas",
            pin: true,
            scroller: "#main",
            start: "top top",
            end: heroPinEnd,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: () => render()
        });
    }

    // 3. Pinning Pages & Reveal Animations
    function initAnimations() {
        const isMobile = window.innerWidth < 1030;

        // On desktop, we pin the intro pages. On mobile, they stack normally.
        if (!isMobile) {
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

        // Certificates Sticky Stack Animation
        const certCards = gsap.utils.toArray(".card-sticky");

        if(certCards.length > 0) {
            certCards.forEach((card, index) => {
                ScrollTrigger.create({
                    trigger: card,
                    scroller: "#main",
                    start: () => isMobile ? "top 10%" : "top " + (15 + (index * 5)) + "%",
                    endTrigger: ".card-container",
                    end: "bottom bottom",
                    pin: !isMobile,
                    pinSpacing: false,
                    invalidateOnRefresh: true,
                });
            });
        }

        // Restore Transmission Reveals
        gsap.utils.toArray(".transmission-reveal").forEach(el => {
            gsap.fromTo(el, {
                opacity: 0,
                y: 40,
                clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)"
            }, {
                opacity: 1,
                y: 0,
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                duration: 1.2,
                ease: "power4.out",
                scrollTrigger: {
                    trigger: el,
                    scroller: "#main",
                    start: "top 90%",
                    toggleActions: "play none none reverse"
                }
            });
        });
    }

    // 4. Interactive HUD Elements (Magnetic Button)
    function initMagneticButtons() {
        const btn = document.querySelector(".nav-btn");
        if(!btn) return;
        
        btn.addEventListener("mousemove", (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(btn, {
                x: x * 0.4,
                y: y * 0.4,
                duration: 0.3,
                ease: "power2.out"
            });
        });
        
        btn.addEventListener("mouseleave", () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.3)"
            });
        });
    }

    // 5. Mobile Menu Logic
    function initMobileMenu() {
        const nav = document.querySelector("#nav");
        const navArrow = document.querySelector("#nav-arrow-toggle");
        const toggle = document.querySelector("#menu-toggle");
        const linksContainer = document.querySelector(".nav-links");
        const links = document.querySelectorAll(".nav-links a");

        if (nav && navArrow && linksContainer) {
            navArrow.addEventListener("click", () => {
                const isDesktop = window.innerWidth > 1024;
                if (!isDesktop) return;

                nav.classList.toggle("nav-open");
                const expanded = nav.classList.contains("nav-open");
                navArrow.setAttribute("aria-expanded", expanded ? "true" : "false");
            });
        }

        if(toggle && linksContainer) {
            toggle.addEventListener("click", () => {
                toggle.classList.toggle("active");
                linksContainer.classList.toggle("active");
            });

            links.forEach(link => {
                link.addEventListener("click", () => {
                    toggle.classList.remove("active");
                    linksContainer.classList.remove("active");
                    if (nav && window.innerWidth > 1024) {
                        nav.classList.remove("nav-open");
                        if (navArrow) navArrow.setAttribute("aria-expanded", "false");
                    }
                });
            });
        }
    }

    // 6. Marvel-Style Project Slider
    function initProjectStack() {
        const slider = document.querySelector(".marvel-slider-section");
        if (!slider) return;

        const slides = slider.querySelectorAll(".slide");
        const nextBtn = slider.querySelector(".next");
        const prevBtn = slider.querySelector(".prev");
        const dots = slider.querySelectorAll(".dot");
        const sidebar = slider.querySelector(".slider-sidebar");
        if (!slides.length || !nextBtn || !prevBtn || !dots.length) return;
        
        let currentIdx = 0;
        let isAnimating = false;
        const isMobile = window.innerWidth <= 1024;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function wrapDustChars(root) {
            if (!root || root.dataset.dustReady === "1") return;

            const walk = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.nodeValue || "";
                    if (!text.trim() && !text.includes(" ")) return;
                    const frag = document.createDocumentFragment();
                    for (const ch of text) {
                        const span = document.createElement("span");
                        span.className = "dust-char";
                        span.textContent = ch === " " ? "\u00A0" : ch;
                        frag.appendChild(span);
                    }
                    node.parentNode.replaceChild(frag, node);
                    return;
                }

                if (node.nodeType === Node.ELEMENT_NODE) {
                    Array.from(node.childNodes).forEach(walk);
                }
            };

            walk(root);
            root.dataset.dustReady = "1";
        }

        function prepareSlideDust(slide) {
            if (!slide) return;
            [".slide-title", ".slide-subtitle"].forEach((sel) => {
                const el = slide.querySelector(sel);
                if (el) wrapDustChars(el);
            });
        }

        function dustOut(slide, direction = 1) {
            if (!slide || reduceMotion) return;
            const chars = slide.querySelectorAll(".slide-title .dust-char, .slide-subtitle .dust-char");
            if (!chars.length) return;

            gsap.killTweensOf(chars);
            gsap.to(chars, {
                x: () => (Math.random() * 26 + 8) * direction,
                y: () => -Math.random() * 22 + Math.random() * 16,
                rotation: () => (Math.random() * 70 - 35) * direction,
                scale: () => 0.55 + Math.random() * 0.25,
                opacity: 0,
                filter: "blur(5px)",
                duration: 0.7,
                stagger: { each: 0.002, from: "random" },
                ease: "power2.in"
            });
        }

        function dustIn(slide) {
            if (!slide || reduceMotion) return;
            const chars = slide.querySelectorAll(".slide-title .dust-char, .slide-subtitle .dust-char");
            if (!chars.length) return;

            gsap.killTweensOf(chars);
            gsap.fromTo(chars,
                {
                    x: () => Math.random() * 16 - 8,
                    y: () => Math.random() * 18 - 10,
                    rotation: () => Math.random() * 24 - 12,
                    scale: 0.78,
                    opacity: 0,
                    filter: "blur(4px)"
                },
                {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    scale: 1,
                    opacity: 1,
                    filter: "blur(0px)",
                    duration: 0.85,
                    stagger: { each: 0.0025, from: "random" },
                    ease: "power2.out"
                }
            );
        }

        function animateSlideIn(slide, direction = 1) {
            if (!slide || reduceMotion) return;

            const leftInfo = slide.querySelector(".slide-left-info");
            const rightHeading = slide.querySelector(".slide-right-heading");
            const title = slide.querySelector(".slide-title");
            const bgText = slide.querySelector(".slide-bg-text");
            const subtitle = slide.querySelector(".slide-subtitle");
            const desc = slide.querySelector(".slide-desc");
            const tags = slide.querySelectorAll(".slide-tags span");

            const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
            tl.fromTo(leftInfo, { x: -18 * direction, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.72 }, 0)
              .fromTo(rightHeading, { x: 22 * direction, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.85 }, 0.04)
              .fromTo(bgText, { scale: 0.97, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.95 }, 0.02)
              .fromTo(tags, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.48 }, 0.24);
            dustIn(slide);
        }

        function animateSlideOut(slide, direction = 1) {
            if (!slide || reduceMotion) return;
            dustOut(slide, direction);
            gsap.to(slide.querySelectorAll(".slide-left-info, .slide-right-heading"), {
                x: -8 * direction,
                autoAlpha: 0,
                duration: 0.28,
                ease: "power2.in"
            });
        }

        function updateSlider(index) {
            if (isAnimating) return;
            isAnimating = true;
            const previousIdx = currentIdx;
            const previousSlide = slides[previousIdx];
            const direction = index > previousIdx || (previousIdx === slides.length - 1 && index === 0) ? 1 : -1;

            // Remove active class from current
            animateSlideOut(previousSlide, direction);
            slides[currentIdx].classList.remove("active");
            dots[currentIdx].classList.remove("active");

            currentIdx = index;

            // Add active class to new
            slides[currentIdx].classList.add("active");
            dots[currentIdx].classList.add("active");
            animateSlideIn(slides[currentIdx], direction);
            gsap.fromTo(dots[currentIdx], { scale: 0.9 }, { scale: 1.45, duration: 0.28, yoyo: true, repeat: 1, ease: "power2.out" });

            // Update sidebar color
            // Color switching disabled per design preference.

            setTimeout(() => {
                isAnimating = false;
            }, 800);
        }

        slides.forEach(prepareSlideDust);

        nextBtn.addEventListener("click", () => {
            let next = (currentIdx + 1) % slides.length;
            updateSlider(next);
        });

        prevBtn.addEventListener("click", () => {
            let prev = (currentIdx - 1 + slides.length) % slides.length;
            updateSlider(prev);
        });

        dots.forEach((dot, idx) => {
            dot.addEventListener("click", () => {
                updateSlider(idx);
            });
        });

        [nextBtn, prevBtn].forEach((btn, idx) => {
            btn.addEventListener("mouseenter", () => {
                if (reduceMotion) return;
                gsap.to(btn, {
                    y: -2,
                    rotate: idx === 0 ? 5 : -5,
                    duration: 0.32,
                    ease: "power2.out"
                });
            });
            btn.addEventListener("mouseleave", () => {
                if (reduceMotion) return;
                gsap.to(btn, { y: 0, rotate: 0, duration: 0.36, ease: "power2.out" });
            });
            btn.addEventListener("click", () => {
                if (reduceMotion) return;
                gsap.fromTo(btn, { scale: 0.95 }, { scale: 1, duration: 0.22, ease: "power2.out" });
            });
        });

        slider.addEventListener("keydown", (event) => {
            if (event.key === "ArrowRight") {
                updateSlider((currentIdx + 1) % slides.length);
            } else if (event.key === "ArrowLeft") {
                updateSlider((currentIdx - 1 + slides.length) % slides.length);
            }
        });

        if (!isMobile && !reduceMotion) {
            slider.addEventListener("mousemove", (event) => {
                const activeSlide = slides[currentIdx];
                if (!activeSlide) return;
                const rect = slider.getBoundingClientRect();
                const px = (event.clientX - rect.left) / rect.width - 0.5;
                const py = (event.clientY - rect.top) / rect.height - 0.5;

                gsap.to(activeSlide.querySelector(".slide-left-info"), {
                    x: px * 6,
                    y: py * 4,
                    duration: 0.62,
                    ease: "power3.out"
                });
                gsap.to(activeSlide.querySelector(".slide-right-heading"), {
                    x: px * 8,
                    y: py * 5,
                    duration: 0.72,
                    ease: "power3.out"
                });
                gsap.to(activeSlide.querySelector(".slide-bg-text"), {
                    x: px * 12,
                    y: py * 8,
                    duration: 0.9,
                    ease: "power3.out"
                });
            });

            slider.addEventListener("mouseleave", () => {
                const activeSlide = slides[currentIdx];
                if (!activeSlide) return;
                gsap.to(activeSlide.querySelectorAll(".slide-left-info, .slide-right-heading, .slide-bg-text"), {
                    x: 0,
                    y: 0,
                    duration: 0.75,
                    ease: "power3.out"
                });
            });
        }

        if (!reduceMotion) {
            gsap.to(slides[currentIdx].querySelector(".slide-bg-text"), {
                yPercent: -8,
                ease: "none",
                scrollTrigger: {
                    trigger: slider,
                    scroller: "#main",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });
        }

        animateSlideIn(slides[currentIdx], 1);

        // Optional: Auto-slide
        // setInterval(() => updateSlider((currentIdx + 1) % slides.length), 5000);
    }


    // 7. Experience Showcase (floating pills + animated card reveal)
    function initExperienceShowcase() {
        const section = document.querySelector("#experience-section");
        if (!section) return;
        const isCompactExperience = window.innerWidth <= 1024;

        const stage = section.querySelector("#expx-stage");
        const items = Array.from(section.querySelectorAll("[data-exp-item]"));
        const bgOrbs = Array.from(section.querySelectorAll(".expx-bg-orb"));
        const ring = section.querySelector(".expx-ring");
        if (!stage || !items.length) return;

        function setIconState(item, asClose) {
            const icon = item.querySelector("[data-exp-icon]");
            if (!icon) return;
            gsap.killTweensOf(icon);
            icon.classList.toggle("is-close", asClose);
            gsap.to(icon, {
                opacity: 0,
                scale: 0.72,
                rotate: asClose ? 70 : -70,
                duration: 0.34,
                ease: "power2.inOut",
                onComplete: () => {
                    icon.textContent = asClose ? "\u00D7" : "\u2192";
                    gsap.fromTo(
                        icon,
                        {
                            opacity: 0,
                            scale: 0.72,
                            rotate: asClose ? -70 : 70
                        },
                        {
                            opacity: 1,
                            scale: 1,
                            rotate: 0,
                            duration: 0.42,
                            ease: "power3.out"
                        }
                    );
                }
            });
        }

        function openItem(item) {
            items.forEach((it) => {
                const isCurrent = it === item;
                it.classList.toggle("is-open", isCurrent);
                setIconState(it, isCurrent);
                gsap.to(it, {
                    y: isCompactExperience ? 0 : (isCurrent ? -6 : 0),
                    duration: 0.8,
                    ease: "power3.out"
                });
            });
        }

        function closeItem(item) {
            item.classList.remove("is-open");
            setIconState(item, false);
            gsap.to(item, { y: 0, duration: 0.72, ease: "power3.out" });
        }

        items.forEach((item) => {
            const toggle = item.querySelector("[data-exp-toggle]");
            if (!toggle) return;
            let closeTimer = null;

            if (!isCompactExperience) {
                // Hover opens inline details on same card
                item.addEventListener("mouseenter", () => {
                    if (closeTimer) {
                        clearTimeout(closeTimer);
                        closeTimer = null;
                    }
                    if (!item.classList.contains("is-open")) openItem(item);
                });

                // Delay close slightly so hover-out doesn't feel abrupt
                item.addEventListener("mouseleave", () => {
                    closeTimer = setTimeout(() => {
                        if (item.classList.contains("is-open")) closeItem(item);
                    }, 220);
                });
            }

            // Click on cross closes same card and restores arrow
            toggle.addEventListener("click", (e) => {
                e.preventDefault();
                if (item.classList.contains("is-open")) {
                    closeItem(item);
                } else {
                    openItem(item);
                }
            });

            const inlineClose = item.querySelector("[data-exp-close]");
            if (inlineClose) {
                inlineClose.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeItem(item);
                });
            }
        });

        // Base offsets so movement stays bounded and never drifts out of range
        const baseOffsets = items.map((_, i) => ({
            x: isCompactExperience ? 0 : (i === 2 ? -8 : 8),
            y: isCompactExperience ? 0 : (i === 1 ? -10 : -14)
        }));
        const pointerTargets = items.map(() => ({ x: 0, y: 0 }));
        const pointerCurrent = items.map(() => ({ x: 0, y: 0 }));
        const floatPhase = items.map((_, i) => i * 1.3);
        const floatAmp = items.map((_, i) => ({ x: 3 + i * 0.6, y: 5 + i * 0.8 }));

        items.forEach((item, i) => {
            gsap.set(item, { x: baseOffsets[i].x, y: baseOffsets[i].y });
        });

        // Cursor-follow drift
        stage.addEventListener("mousemove", (event) => {
            if (isCompactExperience) return;
            const rect = stage.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width - 0.5;
            const py = (event.clientY - rect.top) / rect.height - 0.5;

            items.forEach((item, i) => {
                pointerTargets[i].x = px * (7 + i * 1.6);
                pointerTargets[i].y = py * (6 + i * 1.8);
            });

            if (ring) {
                gsap.to(ring, {
                    x: px * 20,
                    y: py * 18,
                    duration: 0.85,
                    ease: "power3.out"
                });
            }
        });

        stage.addEventListener("mouseleave", () => {
            if (!isCompactExperience) {
                items.forEach((item) => {
                    if (item.classList.contains("is-open")) closeItem(item);
                });
            }
            items.forEach((item, i) => {
                pointerTargets[i].x = 0;
                pointerTargets[i].y = 0;
            });
            if (ring) gsap.to(ring, { x: 0, y: 0, duration: 0.4, ease: "power2.out" });
        });

        // Single smooth motion loop: float + pointer influence (no jitter, no jump)
        if (!isCompactExperience) {
            gsap.ticker.add(() => {
                const t = gsap.ticker.time;
                items.forEach((item, i) => {
                    pointerCurrent[i].x += (pointerTargets[i].x - pointerCurrent[i].x) * 0.08;
                    pointerCurrent[i].y += (pointerTargets[i].y - pointerCurrent[i].y) * 0.08;

                    const fx = Math.sin(t * (0.75 + i * 0.08) + floatPhase[i]) * floatAmp[i].x;
                    const fy = Math.cos(t * (0.62 + i * 0.07) + floatPhase[i]) * floatAmp[i].y;

                    gsap.set(item, {
                        x: baseOffsets[i].x + fx + pointerCurrent[i].x,
                        y: baseOffsets[i].y + fy + pointerCurrent[i].y
                    });
                });
            });
        }

        // Section entrance
        gsap.fromTo(section.querySelectorAll(".expx-item"),
            { autoAlpha: 0, y: 36 },
            {
                autoAlpha: 1,
                y: 0,
                stagger: 0.12,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: section,
                    scroller: "#main",
                    start: "top 75%",
                    toggleActions: "play none none reverse"
                }
            }
        );

        // Parallax drift
        bgOrbs.forEach((orb, i) => {
            gsap.to(orb, {
                yPercent: i === 0 ? -20 : 18,
                xPercent: i === 0 ? 10 : -10,
                ease: "none",
                scrollTrigger: {
                    trigger: section,
                    scroller: "#main",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });
        });

        if (ring) {
            gsap.to(ring, {
                rotation: 12,
                transformOrigin: "50% 50%",
                ease: "none",
                scrollTrigger: {
                    trigger: section,
                    scroller: "#main",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });
        }
    }

    // Initialize all
    initScroll();
    initCanvas();
    initAnimations();
    initMagneticButtons();
    initMobileMenu();
    initProjectStack();
    initExperienceShowcase();

    function initFooterAnimation() {
        if (document.querySelector('#footer')) {
            gsap.fromTo('#footer', 
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: '#footer',
                        scroller: '#main',
                        start: "top 95%",
                    }
                }
            );
        }
    }

    function updateFooterTime() {
        const timeEl = document.getElementById('footer-time');
        if (!timeEl) return;
        
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        
        timeEl.textContent = `${hours}:${minutes} ${ampm}`;
    }

    // Update time every minute
    setInterval(updateFooterTime, 60000);
    updateFooterTime();
    
    initFooterAnimation();
    
    // Explicit refresh after a small delay to ensure DOM is fully painted
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 100);
}));
