(function () {
  const slots = Array.from(document.querySelectorAll("[data-section]"));
  
  // Create a promise that resolves when ScrollTrigger and Locomotive Scroll are initialized in script.js
  let resolveScrollerReady;
  window.scrollerReady = new Promise(resolve => {
      resolveScrollerReady = resolve;
  });
  window.resolveScrollerReady = resolveScrollerReady;

  const fallbackSections = {
    "sections/about.html": `<section id="aboutus"><div class="about-wrapper"><h3>CYBERSEC / ABOUT US</h3><h1>BUILDING TRUST THROUGH SECURITY</h1><p>We secure digital infrastructure with proactive defense, smart monitoring, and fast incident response so organizations can operate with confidence.</p></div></section>`,
    "sections/education.html": `<div id="education-section" class="fluid-page cyber-mission-theme"><div class="section-container"><div class="header-trace"><h3 class="p7-accent font-shark transmission-reveal">MISSION LOG</h3><h1 class="p7-accent font-shark transmission-reveal">ACADEMIC<br>CHRONOLOGY</h1></div><div class="timeline-v3"><div class="timeline-scanner"></div><div class="timeline-spine"></div><div class="timeline-v3-item left transmission-reveal"><div class="spine-anchor"><div class="anchor-glow"></div></div><div class="v3-content-wrapper"><div class="v3-date-tag">2022 - 2023</div><div class="v3-card"><div class="card-edge top-left"></div><div class="card-edge bottom-right"></div><h4 class="v3-location">WIN IN LIFE ACADEMY</h4><h2 class="v3-title">CYBER SECURITY INTERN</h2><div class="v3-body"><p>OFFENSIVE SECURITY INTERNSHIP. MASTERED <span class="v3-highlight">KALI LINUX</span>, <span class="v3-highlight">WIRESHARK</span>, AND AUTOMATED VULNERABILITY SCANNING VIA PYTHON.</p></div></div></div></div><div class="timeline-v3-item right transmission-reveal"><div class="spine-anchor"><div class="anchor-glow"></div></div><div class="v3-content-wrapper"><div class="v3-date-tag">2022 - 2025</div><div class="v3-card"><div class="card-edge top-left"></div><div class="card-edge bottom-right"></div><h4 class="v3-location">GOVT ARTS & SCIENCE COLLEGE, GUDALUR</h4><h2 class="v3-title">B.COM (IT)</h2><div class="v3-score-badge">CGPA: 8.2</div><div class="v3-body"><p>SPECIALIZED IN <span class="v3-highlight">INFORMATION TECHNOLOGY</span> FUNDAMENTALS, MERGING DATA ANALYTICS WITH MODERN BUSINESS STRATEGY.</p></div></div></div></div></div></div></div>`,
    "sections/projects.html": `<div id="page5"><div id="project-container"><h3>CYBERSEC / PROJECTS</h3><div class="project-grid"><div class="project-card"><div class="project-number">01</div><h2>NETWORK SECURITY MONITOR</h2><p>A real-time network traffic analysis and intrusion detection system built with Python and machine learning algorithms.</p><div class="project-tags"><span>Python</span><span>ML</span><span>Snort</span></div></div><div class="project-card"><div class="project-number">02</div><h2>VULNERABILITY SCANNER</h2><p>Automated vulnerability assessment tool that identifies and categorizes security weaknesses in web applications.</p><div class="project-tags"><span>Python</span><span>Nmap</span><span>REST API</span></div></div><div class="project-card"><div class="project-number">03</div><h2>ENCRYPTION SUITE</h2><p>Military-grade file encryption tool using AES-256 and RSA algorithms for secure data transmission.</p><div class="project-tags"><span>Crypto</span><span>AES-256</span><span>RSA</span></div></div><div class="project-card"><div class="project-number">04</div><h2>INCIDENT RESPONSE FRAMEWORK</h2><p>Automated incident response playbook system for handling security breaches and cyber attacks.</p><div class="project-tags"><span>Automation</span><span>SIEM</span><span>SOAR</span></div></div></div></div></div>`,
    "sections/certificates.html": `<div id="certificates-section" class="fluid-page pair-red-grey">
        <div class="section-container">
            <h3 class="highlight">VALIDATED EXPERTISE</h3>
            <h1 class="font-theater grad-red-grey">CERTIFICATES</h1>
            <div class="certs-list card-container">
                <div class="cert-item card-sticky">
                    <div class="card-inner" style="--index: 0;">
                        <div class="cert-header">
                            <div class="cert-title text-red">OSCP</div>
                            <div class="cert-number">01</div>
                        </div>
                        <div class="cert-details">
                            <div class="detail-item"><span class="detail-label">CREDENTIAL ID</span><span class="detail-value">OSCP-48921-X</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`,
    "sections/footer.html": `<div id="footer"><div id="footer-content"><div class="footer-left"><h3><b>CYBER</b>SECURE*</h3><p>Protecting digital assets in an interconnected world.</p></div><div class="footer-links"><a href="#">HOME</a><a href="#">PROJECTS</a><a href="#">CONTACT</a></div><div class="footer-bottom"><p>&copy; 2024 CYBERSECURE. ALL RIGHTS RESERVED.</p></div></div></div>`
  };

  window.sectionsReady = Promise.all(
    slots.map(async (slot) => {
      const path = slot.getAttribute("data-section");
      if (!path) return;

      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to load ${path}: ${response.status}`);
        }

        const html = await response.text();
        slot.innerHTML = html;
        // Re-execute any inline scripts inserted via innerHTML
        slot.querySelectorAll('script').forEach(orig => {
          const s = document.createElement('script');
          s.textContent = orig.textContent;
          orig.parentNode.replaceChild(s, orig);
        });
      } catch (error) {
        console.error(error);
        slot.innerHTML = fallbackSections[path] || "";
        slot.querySelectorAll('script').forEach(orig => {
          const s = document.createElement('script');
          s.textContent = orig.textContent;
          orig.parentNode.replaceChild(s, orig);
        });
      }
    })
  );
})();
