gsap.registerPlugin(ScrollTrigger, TextPlugin);
console.log(">>> [MOBILE STABILITY FIX] RESTORING 3D & NATIVE TOUCH SCROLL <<<");

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

    function initScroll() {
        // ACTUAL MOBILE DEVICE FIX: 
        // Virtual smooth scroll often breaks on real phones. 
        // We only enable it if NOT on a touch device.
        const locoScroll = new LocomotiveScroll({
            el: document.querySelector("#main"),
            smooth: !isTouchDevice,
            multiplier: 1,
            lerp: 0.1,
            smartphone: { smooth: false },
            tablet: { smooth: false }
        });

        const cornerControls = document.querySelector("#corner-scroll-controls");
        const scrollTopBtn = document.querySelector("#scroll-to-top");
        const scrollFooterBtn = document.querySelector("#scroll-to-footer");

        locoScroll.on("scroll", ScrollTrigger.update);
        locoScroll.on("scroll", (args) => {
            if (!cornerControls) return;
            const y = args && args.scroll ? args.scroll.y : (window.pageYOffset || document.documentElement.scrollTop);
            cornerControls.classList.toggle("visible", y > 120);
        });

        ScrollTrigger.scrollerProxy("#main", {
            scrollTop(value) {
                if (arguments.length) {
                    locoScroll.scrollTo(value, 0, 0);
                }
                return isTouchDevice ? (window.pageYOffset || document.documentElement.scrollTop) : locoScroll.scroll.instance.scroll.y;
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

        document.querySelectorAll("[data-scroll-to]").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const target = link.getAttribute("href");
                locoScroll.scrollTo(target);
            });
        });

        if (scrollTopBtn) {
            scrollTopBtn.addEventListener("click", () => { locoScroll.scrollTo("#page"); });
        }

        if (scrollFooterBtn) {
            scrollFooterBtn.addEventListener("click", () => { locoScroll.scrollTo("#footer"); });
        }
    }

    // 2. RESTORED: Canvas Animation
    function initCanvas() {
        const canvas = document.querySelector("#hero-canvas");
        if (!canvas) return;
        const context = canvas.getContext("2d");
        const getDpr = () => isTouchDevice ? 1 : Math.min(window.devicePixelRatio || 1, 2);
        const totalFrames = 150;
        const heroPinEnd = isTouchDevice ? "100% top" : "600% top";
        const loaderText = document.querySelector("#hero-footer h4");

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
        window.addEventListener("resize", () => {
            resizeCanvas();
            render();
        });

        const images = [];
        const imageSeq = { frame: 0 };
        let loadedCount = 0;

        function getFilePath(index) {
            return `./CYBERFICTION-IMAGES/male${(index + 1).toString().padStart(4, '0')}.png`;
        }

        function loadFrame(index) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    loadedCount++;
                    if (index === 0) render(); 
                    resolve();
                };
                img.onerror = resolve; 
                img.src = getFilePath(index);
                images[index] = img;
            });
        }

        async function startLoading() {
            // Load first 10 frames fast, then rest in bg
            for (let i = 0; i < 10; i++) await loadFrame(i);
            for (let i = 10; i < totalFrames; i++) loadFrame(i);
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
            const img = images[imageSeq.frame];
            if (img && img.complete) {
                const dprFactor = isTouchDevice ? 1 : getDpr();
                const hRatio = canvas.width / dprFactor / img.width;
                const vRatio = canvas.height / dprFactor / img.height;
                let ratio = Math.max(hRatio, vRatio);

                // Dynamically scale down the 3D model on screen sizes below 1025px
                if (window.innerWidth < 1025) {
                    const scaleFactor = Math.min(1, window.innerWidth / 1024);
                    ratio = ratio * 0.85 * scaleFactor;
                }

                const centerShift_x = (canvas.width / dprFactor - img.width * ratio) / 2;
                const centerShift_y = (canvas.height / dprFactor - img.height * ratio) / 2;
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

        // Fade out canvas completely as soon as #page1 bottom exits viewport
        gsap.to(canvas, {
            opacity: 0,
            ease: "none",
            scrollTrigger: {
                trigger: "#page1",
                scroller: "#main",
                start: "bottom 60%",
                end: "bottom top",
                scrub: true,
                onLeave: () => { canvas.style.display = "none"; },
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

    function initMobileMenu() {
        const nav = document.querySelector("#nav");
        const toggle = document.querySelector("#menu-toggle");
        const linksContainer = document.querySelector(".nav-links");
        const links = document.querySelectorAll(".nav-links a");

        if(toggle && linksContainer) {
            toggle.addEventListener("click", () => {
                toggle.classList.toggle("active");
                linksContainer.classList.toggle("active");
                document.body.classList.toggle("menu-open");
            });

            links.forEach(link => {
                link.addEventListener("click", () => {
                    toggle.classList.remove("active");
                    linksContainer.classList.remove("active");
                    document.body.classList.remove("menu-open");
                });
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
        
        items.forEach(item => {
            const toggle = item.querySelector("[data-exp-toggle]");
            const close = item.querySelector("[data-exp-close]");
            
            if(toggle) {
                toggle.addEventListener("click", () => {
                    items.forEach(it => { if(it !== item) it.classList.remove("is-open"); });
                    item.classList.toggle("is-open");
                });
            }
            if(close) {
                close.addEventListener("click", (e) => {
                    e.stopPropagation();
                    item.classList.remove("is-open");
                });
            }
        });

        gsap.fromTo(section.querySelectorAll(".expx-item"),
            { autoAlpha: 0, y: 30 },
            {
                autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.6,
                scrollTrigger: {
                    trigger: section,
                    scroller: "#main",
                    start: "top 80%",
                }
            }
        );
    }

    // Initialize all
    initScroll();
    initCanvas();
    initAnimations();
    initMobileMenu();
    initProjectStack();
    initExperienceShowcase();

    function initFooterAnimation() {
        if (document.querySelector('#footer')) {
            gsap.fromTo('#footer', 
                { opacity: 0, y: 30 },
                {
                    opacity: 1, y: 0, duration: 0.8,
                    scrollTrigger: { trigger: '#footer', scroller: '#main', start: "top 95%" }
                }
            );
        }
    }
    initFooterAnimation();
    
    // FINAL REFRESH
    setTimeout(() => { ScrollTrigger.refresh(); }, 1000);
});