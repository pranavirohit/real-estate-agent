"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

const ASSET = "/eigen-landing";

export function EigenLabsStyleLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openValue, setOpenValue] = useState<number | null>(0);

  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="body">
      {/* Desktop bar — wide Eigen-style strip */}
      <div
        data-collapse="medium"
        role="banner"
        className="navbar w-nav"
        style={{
          transform: "translate3d(0px, 0px, 0px)",
          opacity: 1,
        }}
      >
        <div className="container-navigation-2">
          <div className="navigation-left" style={{ transform: "translate3d(0px, 0px, 0px)" }}>
            <Image
              src={`${ASSET}/Eigen-L.svg`}
              alt=""
              width={400}
              height={40}
              className="image-35 max-h-[40px] w-auto"
            />
          </div>
          <div className="navigation-middle">
            <nav role="navigation" className="nav-menu-desktop w-nav-menu">
              <div className="why-eigen-desktop">
                <a href="#why-dokimos" className="nav-link-1 w-nav-link">
                  Why Dokimos
                </a>
              </div>
              <div className="life-at-desktop">
                <a href="#how-we-work" className="nav-link-1 w-nav-link">
                  How it works
                </a>
              </div>
              <div className="jobs-desktop">
                <a href="#get-started" className="nav-link-1 w-nav-link">
                  Get started
                </a>
              </div>
            </nav>
          </div>
          <div className="navigation-right-1" style={{ transform: "translate3d(0px, 0px, 0px)" }}>
            <Image
              src={`${ASSET}/R-Logo-Eigen.svg`}
              alt=""
              width={400}
              height={40}
              className="image-right max-h-[40px] w-auto"
            />
          </div>
        </div>
        <div className="w-nav-overlay" data-wf-ignore="" id="w-nav-overlay-0" />
      </div>

      {/* Mobile / compact nav */}
      <div
        data-collapse="medium"
        role="banner"
        className={`navbar-2 w-nav ${menuOpen ? "w--open" : ""}`}
      >
        <div className="container-2 w-container">
          <Link href="/" className="brand-2 w-nav-brand" onClick={closeMenu}>
            <Image
              src={`${ASSET}/EigenLabs-Logo.svg`}
              alt="Dokimos"
              width={180}
              height={32}
              className="image-37"
            />
          </Link>
          <nav
            role="navigation"
            className={`nav-menu-2 w-nav-menu ${menuOpen ? "w--nav-menu-open" : ""}`}
            style={menuOpen ? { display: "block" } : undefined}
          >
            <div className="why-eigen">
              <a href="#why-dokimos" className="nav-link w-nav-link" onClick={closeMenu}>
                Why Dokimos
              </a>
            </div>
            <div className="life-at">
              <a href="#how-we-work" className="nav-link w-nav-link" onClick={closeMenu}>
                How it works
              </a>
            </div>
            <div className="jobs">
              <a href="#get-started" className="nav-link w-nav-link" onClick={closeMenu}>
                Get started
              </a>
            </div>
          </nav>
          <button
            type="button"
            className="menu-btn w-nav-button"
            aria-label="menu"
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            <div className="menu-wrapper">
              <div className="top" />
              <div className="middle" />
              <div className="bot" />
            </div>
          </button>
        </div>
        <div className="w-nav-overlay" data-wf-ignore="" id="w-nav-overlay-1" />
      </div>

      {/* Hero */}
      <div className="w-layout-blockcontainer video-section w-container">
        <div className="padding-video">
          <div className="w-layout-grid video-columns-1 flex flex-col items-center gap-10 lg:flex-row lg:items-center">
            <div className="div-block-182 w-full max-w-[min(100%,620px)] shrink-0">
              <div className="background-video-2 eigen-hero-visual w-background-video w-background-video-atom">
                <Image
                  src={`${ASSET}/Eigenimage2.jpg`}
                  alt=""
                  width={1200}
                  height={750}
                  className="h-full w-full object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 620px"
                />
              </div>
            </div>
            <div id="w-node-f4ceb0bb-5433-bee4-dc41-ac7c0f13abe4-27682d16" className="video-text-wrap">
              <div className="m-text-wrap">
                <div>
                  <h2 className="heading">
                    We’re building trust
                    <br />
                    for a more verifiable internet.
                  </h2>
                </div>
                <div className="margin-top-1-5">
                  <div className="fade-in-description">
                    <div className="subhead hero-text">
                      Dokimos is the layer where users verify once—then approve exactly what each
                      request sees. <br />
                      TEE-backed processing, selective disclosure, cryptographic attestations.
                    </div>
                  </div>
                  <div className="div-block-183">
                    <Link href="/onboarding" className="button-explore w-button">
                      Start verifying
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission / vision */}
      <div id="why-dokimos" className="w-layout-blockcontainer mision-vision-section w-container scroll-mt-24">
        <div className="padding-video-mision">
          <div className="w-layout-grid grid-4">
            <div id="w-node-bb702dc9-ebf4-8018-f32d-cf6fbf367b18-27682d16" className="mision-vision-title">
              <div className="mision-title">
                <div className="mission-text">MISSION</div>
                <div className="_w-block-mision" />
                <div className="mission-text-2">&amp;</div>
              </div>
              <div className="vision-title-1">
                <div className="white-block-vision" />
                <div className="mission-text">VISION</div>
              </div>
            </div>
            <div id="w-node-5d87df9e-fbdc-0b35-cb7d-4394576bea86-27682d16" className="video-wrapp-desktop hidden md:block">
              <div className="clouds-video-desktop w-clearfix w-background-video w-background-video-atom relative aspect-[4/3] max-h-[420px] overflow-hidden">
                <Image
                  src={`${ASSET}/life-at-eigen-labs-3.png`}
                  alt=""
                  width={1200}
                  height={900}
                  className="h-full w-full object-cover"
                  sizes="(max-width: 768px) 0px, 50vw"
                />
              </div>
            </div>
            <div id="w-node-2c4d8430-e5a5-eb88-4150-7f29b9d336ec-27682d16" className="video-wrap-m-mobile md:hidden">
              <div className="clouds-video-mobile w-clearfix w-background-video w-background-video-atom relative aspect-video overflow-hidden">
                <Image
                  src={`${ASSET}/life-at-eigen-labs-3.png`}
                  alt=""
                  width={800}
                  height={450}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div id="w-node-12e964ee-240c-38f4-3a23-34b97d550d92-27682d16" className="description-wrapper-2">
              <div className="padding-right-6">
                <div>
                  <h2 className="heading-2">▋WHY WE’RE BUILDING</h2>
                </div>
                <div className="margin-top-1-5">
                  <div className="fade-in-description">
                    <div className="subhead color-secondary-dark">
                      Identity checks still ask people to overshare. Dokimos keeps verification in a
                      protected environment and puts users in control of what leaves it—so trust is
                      earned by design, not assumed.
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="heading-2">▋LONG-TERM VISION</h2>
                </div>
                <div className="margin-top-1-5">
                  <div className="fade-in-description">
                    <div className="subhead color-secondary-dark">
                      A world where proving who you are is routine, minimal, and cryptographically
                      grounded—from onboarding to high-assurance workflows—without turning every app
                      into a data broker.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How we work */}
      <div id="how-we-work" className="w-layout-blockcontainer how-we-work w-container scroll-mt-24">
        <div className="padding-how-work-1">
          <div className="how-we-work-1 hidden md:block">
            <div className="how-title">
              <div className="div-block-185">
                <div className="div-block-186">
                  <Image src={`${ASSET}/Arrow-Tablet.svg`} alt="" width={47} height={47} className="image-29" />
                </div>
                <div className="_w-block-how">
                  <div className="how-text">HOW</div>
                </div>
              </div>
            </div>
            <div className="we-title">
              <div className="b-block-text">
                <div className="we-text-1">USER-FIRST, PROOF-DRIVEN</div>
              </div>
              <div className="_w-block-we">
                <div className="we-text">WE</div>
              </div>
            </div>
            <div className="work-title">
              <div className="_w-block-work">
                <div className="work-text">WORK</div>
              </div>
            </div>
          </div>
          <div className="how-we-work-2 md:hidden">
            <div className="work-title-1">
              <div className="_w-block-work-copy">
                <div className="work-text-copy">HOW</div>
              </div>
            </div>
            <div className="we-title-1">
              <div className="b-block-text-1">
                <div className="we-text-2">
                  █ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;USER-FIRST, <br />
                  █&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PROOF-DRIVEN
                </div>
              </div>
              <div className="_w-block-we-1">
                <div className="we-text-copy">WE</div>
              </div>
            </div>
            <div className="how-title-1">
              <div className="div-block-how-copy">
                <Image src={`${ASSET}/Mobile-Arrow.svg`} alt="" width={30} height={30} className="image-arrow-mob" />
              </div>
              <div className="_w-block-how-1">
                <div className="how-text-1">WORK</div>
              </div>
            </div>
          </div>
          <div className="how-we-work-cards flex flex-col items-center justify-center gap-6 lg:flex-row lg:items-stretch">
            <div className="card-wrapper">
              <div className="margin-top-4 flex items-start justify-between gap-2">
                <h4 className="heading-4">Selective disclosure</h4>
                <Image src={`${ASSET}/Arrow.svg`} alt="" width={14} height={14} className="card-arrow" />
              </div>
              <div className="margin-top-5">
                <div className="subhead-secondary">
                  Share attributes—not whole documents—per request. Decline anything that does not
                  match the moment.
                </div>
              </div>
            </div>
            <div className="card-wrapper">
              <div className="margin-top-4 flex items-start justify-between gap-2">
                <h4 className="heading-4">TEE-backed flow</h4>
                <Image src={`${ASSET}/Arrow.svg`} alt="" width={14} height={14} className="card-arrow" />
              </div>
              <div className="margin-top-6">
                <div className="subhead-secondary">
                  Processing stays inside a protected environment with attestations you can verify—so
                  “trust me” is not the whole story.
                </div>
              </div>
            </div>
            <div className="card-wrapper">
              <div className="margin-top-4 flex items-start justify-between gap-2">
                <h4 className="heading-4">Built for builders</h4>
                <Image src={`${ASSET}/Arrow.svg`} alt="" width={14} height={14} className="card-arrow" />
              </div>
              <div className="margin-top-8">
                <div className="subhead-secondary">
                  One flow for users, clear hooks for your backend: request review, receipts, and
                  proofs that integrate with how you already ship.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values — accordion */}
      <section className="section-3">
        <div className="div-block-212">
          <div className="div-block-213">
            <div className="accordion-section-2">
              <div className="values-and-principles">
                <div className="div-block-201">
                  <div className="div-block-202">
                    <div className="values-title-1">
                      <div className="_w-block-values-1" />
                      <div className="value-text-1">VALUES &nbsp;&amp;</div>
                    </div>
                  </div>
                  <div className="div-block-203">
                    <div className="principles-title-2">
                      <div className="_w-block-principles-1" />
                      <div className="principles-text-12">PRINCIPLES</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="div-block-176">
                <div className="text-block-70">Product tenets</div>
              </div>

              {[
                {
                  title: "Privacy by default",
                  open: openValue === 0,
                  onToggle: () => setOpenValue((v) => (v === 0 ? null : 0)),
                  lines: [
                    "Minimize data: if a boolean is enough, we do not ask for a scan.",
                    "Users see requests in plain language before anything is released.",
                  ],
                },
                {
                  title: "Verifiable outcomes",
                  open: openValue === 1,
                  onToggle: () => setOpenValue((v) => (v === 1 ? null : 1)),
                  lines: [
                    "Attestations and execution context are designed to be checked—not just displayed.",
                    "Integrations should be boring on the outside, precise on the inside.",
                  ],
                },
                {
                  title: "Operational honesty",
                  open: openValue === 2,
                  onToggle: () => setOpenValue((v) => (v === 2 ? null : 2)),
                  lines: [
                    "Clear failure modes, clear logging, no theatrical security theater.",
                    "We ship, measure, and tighten loops—same as any serious infrastructure team.",
                  ],
                },
              ].map((item) => (
                <div key={item.title} className="accordion-item-principal">
                  <button
                    type="button"
                    className={
                      item.open ? "accordion-principal-open w-full text-left" : "accordion-principal-tab-b w-full text-left"
                    }
                    onClick={item.onToggle}
                  >
                    <h2 className="accordion-header-2">{item.title}</h2>
                    <div className="arrow-div-wrapper-2">
                      <Image
                        width={26}
                        height={26}
                        alt=""
                        src={`${ASSET}/Arrow.svg`}
                        loading="lazy"
                        className="image-arrow-open"
                        style={{
                          transform: item.open ? "rotate(45deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </div>
                  </button>
                  <div
                    className={item.open ? "accordion-pane-open" : "accordion-pane-2"}
                    style={item.open ? undefined : { height: 0, overflow: "hidden" }}
                  >
                    <div className="principles-title">
                      <div className="text-block-68">█ &nbsp;Details</div>
                    </div>
                    {item.lines.map((line) => (
                      <div key={line} className="accordion-item-sub">
                        <div className="accordion-subpane-reversed">
                          <div className="accordion-pane-content-3">
                            <p className="accordion-text-3">{line}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="div-block-198" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Perks → product capabilities */}
      <div className="w-layout-blockcontainer perks w-container">
        <div className="padding-perks">
          <div className="perks-1">
            <div className="perks-title">
              <div className="bw-block-text">
                <div className="perks-subtext">WHAT YOU GET</div>
                <div className="div-block-187" />
              </div>
              <div className="_w-block-perks">
                <div className="perks-text">CAPABILITIES</div>
              </div>
            </div>
          </div>
          <div className="perks-cards flex flex-wrap justify-center gap-4">
            <div className="card-wrapper-2">
              <Image width={57} height={57} alt="" src={`${ASSET}/Home-Icon.svg`} className="card-icon" />
              <div className="margin-top-9">
                <h2 className="heading-6">
                  Vaulted
                  <br />
                  <span className="text-span-7">review.</span>
                  <br />
                </h2>
              </div>
            </div>
            <div className="card-wrapper-2">
              <Image width={57} height={57} alt="" src={`${ASSET}/Airplane-Icon.svg`} className="card-icon" />
              <div className="margin-top-9">
                <h2 className="heading-7">
                  Per-request
                  <br />
                  <span className="text-span-2">approvals.</span>
                </h2>
              </div>
            </div>
            <div className="card-wrapper-2">
              <Image width={57} height={57} alt="" src={`${ASSET}/Computer-icon.svg`} className="card-icon" />
              <div className="margin-top-9">
                <h2 className="heading-8">
                  API-ready
                  <br />
                  <span className="text-span-3">flows.</span>
                </h2>
              </div>
            </div>
            <div className="card-wrapper-2">
              <Image width={57} height={57} alt="" src={`${ASSET}/Token-Icon.svg`} className="card-icon" />
              <div className="margin-top-9">
                <h2 className="heading-9">
                  Signed
                  <br />
                  <span className="text-span-4">attestations.</span>
                </h2>
              </div>
            </div>
          </div>
          <div className="perks-cards flex flex-wrap justify-center gap-4">
            <div className="card-wrapper-2">
              <Image width={57} height={57} alt="" src={`${ASSET}/Shield-Icon.svg`} className="card-icon" />
              <div className="margin-top-9">
                <h2 className="heading-6">
                  TEE-grounded
                  <br />
                  <span className="text-span-8">processing.</span>
                </h2>
              </div>
            </div>
            <div className="card-wrapper-2">
              <Image width={57} height={57} alt="" src={`${ASSET}/People-Icon.svg`} className="card-icon" />
              <div className="margin-top-9">
                <h2 className="heading-7">
                  Verifier
                  <br />
                  <span className="text-span-2">tools.</span>
                </h2>
              </div>
            </div>
            <div className="card-wrapper-2">
              <Image width={57} height={57} alt="" src={`${ASSET}/Book-Icon.svg`} className="card-icon" />
              <div className="margin-top-9">
                <h2 className="heading-8">
                  Audit-friendly
                  <br />
                  <span className="text-span-3">receipts.</span>
                </h2>
              </div>
            </div>
            <div className="card-wrapper-2">
              <Image width={57} height={57} alt="" src={`${ASSET}/Graphics-Icon.svg`} className="card-icon" />
              <div className="margin-top-9">
                <h2 className="heading-9">
                  Integration
                  <br />
                  <span className="text-span-4">docs.</span>
                </h2>
              </div>
            </div>
          </div>
          <div className="perks-cards-button">
            <Link href="/integration" className="button-perks w-button">
              Read the integration overview &nbsp;<span className="text-span-9">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Photo grid */}
      <div className="w-layout-blockcontainer image-container w-container">
        <div className="padding-6">
          <div className="w-layout-grid grid-3">
            <Image
              sizes="(max-width: 767px) 100vw, (max-width: 991px) 727px, 940px"
              src={`${ASSET}/TestEigen3.png`}
              alt=""
              width={956}
              height={600}
              loading="lazy"
              id="life-at-eigen"
              className="w-full object-cover"
            />
            <Image
              className="image-27 grayscale"
              src={`${ASSET}/Eigenimage2.jpg`}
              width={796}
              height={500}
              alt=""
              style={{ filter: "grayscale(100%)" }}
              sizes="(max-width: 767px) 100vw, 728px"
              loading="lazy"
            />
            <Image
              src={`${ASSET}/life-at-eigen-labs-3.png`}
              alt=""
              style={{ filter: "grayscale(100%)" }}
              width={1200}
              height={800}
              loading="lazy"
              className="grayscale"
              sizes="(max-width: 767px) 100vw, 940px"
            />
            <Image
              src={`${ASSET}/Eigen-Photo-6.jpg`}
              alt=""
              style={{ filter: "grayscale(100%)" }}
              width={1500}
              height={1000}
              loading="lazy"
              className="grayscale"
              sizes="(max-width: 767px) 100vw, 728px"
            />
            <Image
              src={`${ASSET}/Eigenlabsphoto1.jpg`}
              width={1371}
              alt=""
              style={{ filter: "grayscale(100%)" }}
              height={900}
              loading="lazy"
              className="grayscale"
              sizes="(max-width: 767px) 100vw, 940px"
            />
            <Image
              src={`${ASSET}/life-at-eigen-labs-4.jpg`}
              alt=""
              style={{ filter: "grayscale(100%)" }}
              width={1200}
              height={800}
              loading="lazy"
              className="grayscale"
              sizes="(max-width: 767px) 100vw, 940px"
            />
          </div>
        </div>
      </div>

      {/* Why Dokimos — static panel instead of embed */}
      <section id="why-dokimos-video" className="section-4">
        <div className="join-eigen-title">
          <div className="div-block-200">
            <div className="why-join-text">
              WHY <span className="text-span-5">DOKIMOS</span>?{" "}
            </div>
            <div className="_w-block-join" />
          </div>
        </div>
        <div className="join-eigen flex justify-center px-4">
          <div className="div-block-211 max-w-full !w-full">
            <div className="border border-white/20 bg-black/40 p-8 text-center md:p-12">
              <p className="subhead color-secondary-dark !text-center !pr-0 text-balance">
                Verification should feel like infrastructure: fast for good actors, expensive for
                abuse, and legible to security teams. Dokimos pairs user consent with proofs you can
                verify programmatically—so product, risk, and compliance can align on facts.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/business" className="button-explore w-button !inline-flex">
                  For teams
                </Link>
                <Link href="/integration" className="button w-button !inline-flex border border-white bg-transparent !text-white hover:!bg-[#00ff85] hover:!text-black">
                  For developers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="section-2">
        <div className="trusted-by-wrap">
          <div className="trusted-by-container">
            <div className="trusted-by-text">TRUSTED </div>
            <div className="_w-block-trusted" />
            <div className="trusted-by-text-1">BY</div>
          </div>
        </div>
        <section className="section-logo">
          <div className="page-padding s0">
            <div className="container-large">
              <div className="padding-vertical padding-xxlarge">
                <div className="logo_component-slider-desktop hidden flex-wrap justify-center gap-10 md:flex">
                  <Image width={300} height={80} alt="" src={`${ASSET}/a16crypto.svg`} className="logo-slider-img-2" />
                  <Image
                    width={300}
                    height={80}
                    alt=""
                    src={`${ASSET}/Blockchain-capital.svg`}
                    className="logo-slider-img-2"
                  />
                  <Image
                    width={250}
                    height={80}
                    alt=""
                    src={`${ASSET}/Polychain-capital.svg`}
                    className="logo-slider-img-2"
                  />
                  <Image
                    width={300}
                    height={80}
                    alt=""
                    src={`${ASSET}/Ethereal-ventures.svg`}
                    className="logo-slider-img-2"
                  />
                </div>
                <div className="logo_component-slider-mobile flex flex-wrap justify-center gap-8 md:hidden">
                  <Image width={260} height={70} alt="" src={`${ASSET}/a16crypto.svg`} className="logo-slider-img-2" />
                  <Image
                    width={260}
                    height={70}
                    alt=""
                    src={`${ASSET}/Blockchain-capital.svg`}
                    className="logo-slider-img-2"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="and-others">
            <div className="and-others-text">/ ECOSYSTEM INSPIRATION</div>
          </div>
        </section>
        <section className="section-logo-2">
          <div className="page-padding more">
            <div className="container-large">
              <div className="padding-vertical padding-xxlarge">
                <div className="logo_component-slider-desktop-1 hidden flex-wrap items-center justify-center gap-10 md:flex">
                  <Image width={300} height={80} alt="" src={`${ASSET}/Google.svg`} className="logo-slider-img-3" />
                  <Image width={300} height={80} alt="" src={`${ASSET}/Coinbase.svg`} className="logo-slider-img-3" />
                  <div className="div-block-210">
                    <Image width={300} height={80} alt="" src={`${ASSET}/consensys.svg`} className="logo-slider-img-3" />
                  </div>
                  <Image width={300} height={80} alt="" src={`${ASSET}/worldcoin.svg`} className="logo-slider-img-3" />
                  <Image width={300} height={80} alt="" src={`${ASSET}/layerzero.svg`} className="logo-slider-img-3" />
                  <Image width={300} height={80} alt="" src={`${ASSET}/elizaos.svg`} className="logo-slider-img-3" />
                </div>
                <div className="logo_component-slider-mobile flex flex-wrap justify-center gap-6 md:hidden">
                  <Image width={240} height={64} alt="" src={`${ASSET}/Google.svg`} className="logo-slider-img-3" />
                  <Image width={240} height={64} alt="" src={`${ASSET}/Coinbase.svg`} className="logo-slider-img-3" />
                  <Image width={240} height={64} alt="" src={`${ASSET}/consensys.svg`} className="logo-slider-img-3" />
                </div>
              </div>
            </div>
          </div>
          <div className="and-others">
            <div className="and-others-text">/ MODERN STACKS</div>
          </div>
        </section>
      </section>

      {/* Join */}
      <section id="join-us" className="section">
        <div className="join-us-wrap">
          <div className="div-block-206">
            <div className="join-us-title">
              <div className="join-us-text">JOIN</div>
              <div className="_w-block-join-us" />
              <Image src={`${ASSET}/Arrow-Tablet.svg`} alt="" width={47} height={47} className="image-30" />
            </div>
          </div>
        </div>
        <div className="div-block-189" />
        <div className="div-block-208">
          <Link href="/onboarding" className="join-us-button-desktop w-button">
            Open onboarding
          </Link>
          <Link href="/onboarding" className="join-us-button-mobile w-button">
            Onboarding
          </Link>
        </div>
      </section>

      {/* Get started */}
      <section id="get-started" className="section-open-roles scroll-mt-24">
        <div className="div-block-191">
          <div className="div-block-205">
            <div className="open-roles-title">
              <div className="open-text">NEXT</div>
              <div className="white-block-open-roles" />
              <div className="roles-text">STEPS</div>
            </div>
          </div>
        </div>
        <div className="div-block-209-up">
          <div className="div-block-bar-up" />
        </div>
        <div className="code-embed-4 w-embed w-script px-4 py-12 text-center">
          <p className="subhead color-secondary-dark !mx-auto !max-w-2xl !pr-0 text-center">
            Create a session, run through verification, and try selective disclosure against a real
            request path. The verifier dashboard shows what approvals look like on the other side.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/onboarding" className="join-us-button-desktop w-button">
              Start now
            </Link>
            <Link href="/app" className="button-explore w-button !bg-white !text-black">
              Verifier app
            </Link>
          </div>
        </div>
        <div className="div-block-209">
          <div className="div-block-bar" />
        </div>
      </section>

      {/* Before footer */}
      <section className="before-footer">
        <div className="div-block-image-bf" />
        <div className="div-block-194">
          <div className="columns w-row flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="w-col w-col-9">
              <Image
                src={`${ASSET}/Black-EigenLabs-logofooter.png`}
                alt="Dokimos"
                width={362}
                height={80}
                className="image-34"
                sizes="(max-width: 479px) 92vw, 362px"
              />
              <div className="text-block-71">
                Is where your
                <br />
                <span className="text-span-6">next proof begins.</span>
              </div>
            </div>
            <div className="column w-col w-col-3">
              <div className="div-block-button-join">
                <Link href="/onboarding" className="button-last w-button">
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="footer-section">
        <div className="container-regular">
          <Link href="/" className="footer-logo-link w-inline-block">
            <Image
              width={166}
              height={40}
              alt="Dokimos"
              src={`${ASSET}/Black-EigenLabs-logofooter.png`}
              loading="lazy"
              className="footer-logo"
              sizes="(max-width: 479px) 100vw, 166px"
            />
          </Link>
          <div className="footer-grid">
            <div className="w-layout-grid footer-left-column">
              <div className="footer-column">
                <div className="eigencloud-footer">
                  <Link href="/integration" className="footer-link">
                    Integration
                  </Link>
                </div>
                <div className="whyeigen-footer">
                  <Link href="#why-dokimos" className="footer-link">
                    Why Dokimos
                  </Link>
                </div>
                <div className="lifeat-footer">
                  <Link href="/app/how-it-works" className="footer-link">
                    How it works
                  </Link>
                </div>
                <div className="jobs-footer">
                  <Link href="/onboarding" className="footer-link">
                    Onboarding
                  </Link>
                </div>
              </div>
            </div>
            <div className="foooter-right-column">
              <div className="social-icons-wrap">
                <Link href="/" className="w-inline-block" aria-label="Home">
                  <span className="footer-icons-social inline-block rounded-full border border-white/30 px-3 py-2 text-xs text-white">
                    Home
                  </span>
                </Link>
              </div>
              <div className="footer-legal-text-wrapper">
                <div className="text-block-67">© {new Date().getFullYear()} Dokimos. All rights reserved.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
