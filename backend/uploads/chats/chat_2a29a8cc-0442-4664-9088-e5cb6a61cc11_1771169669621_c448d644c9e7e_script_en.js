// === 🌫️ SMOOTH HEADER OSCILLATION AND BACKGROUND FADE ===
const header = document.querySelector("header");

let lastScrollY = window.scrollY;
let currentShift = 0;
let targetShift = 0;
let rafId = null;

function smoothAnimateHeader() {
  // Smoothly approaching the target position
  currentShift += (targetShift - currentShift) * 0.1;
  header.style.transform = `translateY(${currentShift}px)`;

  if (Math.abs(targetShift - currentShift) > 0.2) {
    rafId = requestAnimationFrame(smoothAnimateHeader);
  } else {
    header.style.transform = `translateY(0px)`; // return to point
    rafId = null;
  }
}

function updateHeader() {
  const currentScroll = window.scrollY;
  const diff = currentScroll - lastScrollY;

  // Calculating the shift (soft oscillation)
  targetShift = Math.max(Math.min(diff * 0.5, 10), -10);

  // Launch smooth animation
  if (!rafId) rafId = requestAnimationFrame(smoothAnimateHeader);

  // If scrolling down — add background
  if (currentScroll > 30) {
    header.classList.add("filled");
  } else {
    header.classList.remove("filled"); // remove background when at top
  }

  lastScrollY = currentScroll;
}

// Optimized listener
let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateHeader();
        ticking = false;
      });
      ticking = true;
    }
  },
  { passive: true }
);

// === SMOOTH MENU NAVIGATION ===
document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      const target = item.getAttribute("data-target");
      const section = document.getElementById(target);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
});

// === BLOCKS APPEARANCE ANIMATION ===
document.addEventListener("DOMContentLoaded", () => {
  const blocks = document.querySelectorAll(".seccondinfo .block, .seccondinfo .block1, .seccondinfo .block2, .seccondinfo .block3");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("show");
        }, index * 200);
      }
    });
  }, { threshold: 0.2 });

  blocks.forEach(block => observer.observe(block));
});

// === ACTIVE LINK HIGHLIGHT (by page) ===
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();
  const links = document.querySelectorAll(".nav-link");

  links.forEach(link => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    if (
      (currentPage === "" && href.includes("index.html")) ||
      href === currentPage
    ) {
      link.classList.add("active");
    }
  });
});

// === TRANSITION AND HIGHLIGHT FOR "TEAM" SECTION ===
document.addEventListener("DOMContentLoaded", () => {
  const teamSection = document.getElementById("team");
  const teamLink = document.querySelector('a[href="index.html#team"], a[href="#team"]');

  if (!teamSection || !teamLink) return;

  // Smooth highlight on scroll
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    const sectionTop = teamSection.offsetTop - 300;
    const sectionBottom = sectionTop + teamSection.offsetHeight;

    if (scrollY >= sectionTop && scrollY < sectionBottom) {
      teamLink.classList.add("active");
    } else {
      teamLink.classList.remove("active");
    }
  });

  // If came from another page (#team)
  if (window.location.hash === "#team") {
    setTimeout(() => {
      teamSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }

  // Smooth scroll when on main page
  teamLink.addEventListener("click", (e) => {
    e.preventDefault();
    teamSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// === TEAM MEMBERS MODAL WINDOWS ===
document.addEventListener("DOMContentLoaded", () => {
  const modalOverlay = document.getElementById("modalOverlay");
  const modal = document.getElementById("modal");
  const closeBtn = document.getElementById("closeBtn");
  const modalContent = document.getElementById("modalContent");

  const peopleData = {
    I: {
      name: "Artyom",
      role: "Frontend Developer",
      info: "Project creator and lead frontend developer. Responsible for UI, visual effects, and overall company direction.",
      img: "im/im.jpg",
      isBoss: true
    },
    V: {
      name: "Vladimir",
      role: "Backend Developer",
      info: "Server-side specialist. Ensures everything works smoothly and quickly inside.",
      img: "im/vova.jpg"
    },
    T: {
      name: "Timofey",
      role: "Project Manager",
      info: "Organizes the team's work, plans tasks, and monitors progress. The brain of the project.",
      img: "im/tim.jpg"
    },
    M: {
      name: "Mikhail",
      role: "Marketer & Copywriter",
      info: "Responsible for creativity, content, and promotion. Makes sure everyone knows about the project.",
      img: "im/mih.jpg"
    },
    G: {
      name: "Georgy",
      role: "Designer",
      info: "Creates visual style and graphics. Every pixel is under control.",
      img: "im/gorg.jpg"
    },
    N: {
      name: "Nikita",
      role: "Tester",
      info: "Ensures product stability. No bug will go unnoticed.",
      img: "im/nek.jpg"
    }
  };

  // Click on team member
  document.querySelectorAll(".I, .V, .T, .M, .G, .N").forEach(person => {
    person.addEventListener("click", () => {
      const id = person.classList[0];
      const data = peopleData[id];
      if (data) {
        modalContent.innerHTML = `
          <img src="${data.img}" alt="${data.name}" class="person-photo">
          <h2>
            ${data.isBoss ? '<span class="crown" title="Company Founder"></span>' : ""}
            ${data.name}
          </h2>
          <h4 class="person-role">${data.role}</h4>
          <p>${data.info}</p>
        `;
        modalOverlay.style.display = "flex";
      }
    });
  });

  // Close modal
  closeBtn.addEventListener("click", () => {
    modalOverlay.style.display = "none";
  });

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.style.display = "none";
    }
  });

  // Star effect around the cool creator
  const ilya = document.querySelector(".I");
  if (ilya) {
    const sparkleContainer = document.createElement("div");
    sparkleContainer.classList.add("sparkles");
    ilya.appendChild(sparkleContainer);

    for (let i = 0; i < 8; i++) {
      const star = document.createElement("div");
      star.classList.add("star");
      sparkleContainer.appendChild(star);
    }
  }
});

// === 📱 BURGER MENU ===
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burger");
  const nav = document.querySelector("header ul");

  if (!burger || !nav) return;

  // Toggle open/close on burger click
  burger.addEventListener("click", () => {
    burger.classList.toggle("active");
    nav.classList.toggle("active");
  });

  // Close when clicking on any menu link
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      burger.classList.remove("active");
      nav.classList.remove("active");
    });
  });

  // Close when clicking outside the menu
  document.addEventListener("click", (e) => {
    if (
      nav.classList.contains("active") &&
      !nav.contains(e.target) &&
      !burger.contains(e.target)
    ) {
      burger.classList.remove("active");
      nav.classList.remove("active");
    }
  });
});
