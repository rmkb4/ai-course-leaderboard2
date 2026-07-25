gsap.registerPlugin(ScrollTrigger);

// ==========================================================
// SCROLLTRIGGER ANIMATIONS FOR CSS VISUALIZERS
// ==========================================================
// Since the main container handles the scrolling via snap, we hook ScrollTrigger to the main container
ScrollTrigger.defaults({
  scroller: ".snap-container"
});

// Section 1: Face Detection
ScrollTrigger.create({
  trigger: "#section-1",
  start: "top center",
  onEnter: () => {
    document.querySelector('.face-visualizer').classList.add('animate-face');
  },
  onLeaveBack: () => {
    document.querySelector('.face-visualizer').classList.remove('animate-face');
  }
});

// Section 2: Age & Gender Scanner
ScrollTrigger.create({
  trigger: "#section-2",
  start: "top center",
  onEnter: () => {
    document.querySelector('.scanner-visualizer').classList.add('animate-scan');
    // Animate digital counter from 0 to 14
    let counterObj = { val: 0 };
    gsap.to(counterObj, {
      val: 14,
      duration: 1.5,
      delay: 1.5,
      roundProps: "val",
      onUpdate: () => {
        document.getElementById('age-counter').innerText = counterObj.val;
      }
    });
  },
  onLeaveBack: () => {
    document.querySelector('.scanner-visualizer').classList.remove('animate-scan');
    document.getElementById('age-counter').innerText = '0';
  }
});

// Section 3: Object Detection Bounding Boxes
const s3Tl = gsap.timeline({ paused: true });
s3Tl.to("#section-3 .bounding-box", { opacity: 1, stagger: 0.5, duration: 0.2, ease: "steps(1)" });
ScrollTrigger.create({
  trigger: "#section-3",
  start: "top center",
  onEnter: () => s3Tl.restart(),
  onLeaveBack: () => s3Tl.pause(0)
});

// Section 4: OCR
ScrollTrigger.create({
  trigger: "#section-4",
  start: "top center",
  onEnter: () => {
    document.querySelector('.ocr-visualizer').classList.add('animate-ocr');
  },
  onLeaveBack: () => {
    document.querySelector('.ocr-visualizer').classList.remove('animate-ocr');
  }
});

// Section 5: Pose Tracking (Arm Wave & Skeleton)
ScrollTrigger.create({
  trigger: "#section-5",
  start: "top center",
  onEnter: () => {
    document.querySelector('.pose-visualizer').classList.add('animate-pose');
  },
  onLeaveBack: () => {
    document.querySelector('.pose-visualizer').classList.remove('animate-pose');
  }
});

// Section 6: Custom ML Models
ScrollTrigger.create({
  trigger: "#section-6",
  start: "top center",
  onEnter: () => {
    document.querySelector('.ml-canvas').classList.add('animate-ml');
  },
  onLeaveBack: () => {
    document.querySelector('.ml-canvas').classList.remove('animate-ml');
  }
});

// ==========================================================
// CSV INGESTION & DATA PROCESSING
// ==========================================================
let allStudents = [];

async function loadData() {
  const fetchAndParse = (url, sectionName) => {
    return new Promise((resolve) => {
      Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = results.data.map(row => ({
            name: row.Name || row.name,
            points: parseInt(row.Points || row.points || 0, 10),
            section: sectionName
          }));
          resolve(parsed);
        },
        error: () => {
          console.warn(`Failed to load ${url}, ensure it's in the public folder!`);
          resolve([]);
        }
      });
    });
  };

  const onlineStudents = await fetchAndParse('./Students_Rating_A_Online.csv', 'Online Section A');
  const karkhStudents = await fetchAndParse('./Students_Rating_C_Karkh.csv', 'Karkh Section C');

  allStudents = [...onlineStudents, ...karkhStudents]
    .filter(s => s.name && !isNaN(s.points))
    .sort((a, b) => b.points - a.points)
    .map((s, index) => ({ ...s, rank: index + 1 }));

  // Fallback data
  if (allStudents.length === 0) {
    allStudents = [
      { name: "Ali Mohammed", points: 15200, section: "Online Section A", rank: 1 },
      { name: "Zahraa Ahmed", points: 14850, section: "Karkh Section C", rank: 2 },
      { name: "Yousef Ali", points: 13900, section: "Online Section A", rank: 3 },
      { name: "Fatima Hussein", points: 12500, section: "Karkh Section C", rank: 4 },
      { name: "Mustafa Qasim", points: 11000, section: "Online Section A", rank: 5 },
      { name: "Sara Kadem", points: 10500, section: "Karkh Section C", rank: 6 },
      { name: "Noor Hassan", points: 9500, section: "Online Section A", rank: 7 },
      { name: "Mina Saad", points: 8500, section: "Karkh Section C", rank: 8 },
      { name: "Ahmed Salman", points: 8000, section: "Online Section A", rank: 9 },
      { name: "Rana Ali", points: 7200, section: "Karkh Section C", rank: 10 }
    ];
  }

  populatePodium(allStudents);
  renderLeaderboard(allStudents);
}

// ==========================================================
// PODIUM SETUP & ANIMATION (Triggered in Section 7)
// ==========================================================
function populatePodium(students) {
  if (students.length < 3) return;

  const top3 = students.slice(0, 3);
  
  const setPodium = (rank, student) => {
    const r = rank; 
    document.getElementById(`name-${r}`).innerText = student.name;
    document.getElementById(`points-${r}`).innerText = `⭐ ${student.points.toLocaleString()} pts`;
    document.getElementById(`avatar-${r}`).src = `https://api.dicebear.com/7.x/micah/svg?seed=${student.name}&backgroundColor=transparent`;
  };

  setPodium(1, top3[0]);
  setPodium(2, top3[1]);
  setPodium(3, top3[2]);

  // Initial state setup for Podium
  gsap.set('.podium-block', { scaleY: 0, transformOrigin: "bottom" });
  gsap.set('.podium-avatar', { y: 50, opacity: 0 });
  gsap.set('#crown-icon', { y: -30, opacity: 0, rotation: -20 });
  gsap.set('.podium-info', { opacity: 0 });

  // ScrollTrigger for Podium Reveal when snapped
  ScrollTrigger.create({
    trigger: "#podium-section",
    start: "top center", 
    onEnter: () => {
      fireConfetti();
      
      const tl = gsap.timeline();
      const block3 = document.querySelector('.podium-block.rank-3');
      const block2 = document.querySelector('.podium-block.rank-2');
      const block1 = document.querySelector('.podium-block.rank-1');
      const avatar3 = document.querySelector('.podium-avatar.rank-3');
      const avatar2 = document.querySelector('.podium-avatar.rank-2');
      const avatar1 = document.querySelector('.podium-avatar.rank-1');

      tl.to(block3, { scaleY: 1, duration: 0.6, ease: "back.out(1.5)" })
        .to(avatar3, { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }, "-=0.3")
        .to(block2, { scaleY: 1, duration: 0.6, ease: "back.out(1.5)" }, "-=0.2")
        .to(avatar2, { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }, "-=0.3")
        .to(block1, { scaleY: 1, duration: 0.6, ease: "back.out(1.5)" }, "-=0.2")
        .to(avatar1, { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }, "-=0.3")
        .to('#crown-icon', { y: 0, opacity: 1, rotation: 10, duration: 0.6, ease: "back.out(2)" }, "-=0.2")
        .to('.podium-info', { opacity: 1, duration: 0.5 }, "-=0.3");
    },
    onLeaveBack: () => {
      // Optional: reset if you want it to trigger again when scrolling back up
    }
  });
}

function fireConfetti() {
  const duration = 4000;
  const end = Date.now() + duration;
  (function frame() {
    confetti({ particleCount: 8, angle: 60, spread: 60, origin: { x: 0 }, colors: ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b'] });
    confetti({ particleCount: 8, angle: 120, spread: 60, origin: { x: 1 }, colors: ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b'] });
    if (Date.now() < end) requestAnimationFrame(frame);
  }());
}

// ==========================================================
// LEADERBOARD RENDERING (Section 8)
// ==========================================================
const leaderboardList = document.getElementById('leaderboard-list');

function renderLeaderboard(students) {
  leaderboardList.innerHTML = '';
  
  students.forEach((student, i) => {
    let rankColor = 'var(--color-primary)';
    if (student.rank === 1) rankColor = 'var(--color-gold)';
    if (student.rank === 2) rankColor = 'var(--color-secondary)';
    if (student.rank === 3) rankColor = 'var(--color-danger)';

    const row = document.createElement('div');
    row.className = 'student-row';
    
    row.innerHTML = `
      <div class="rank-badge" style="background-color: ${rankColor}">${student.rank}</div>
      <div class="student-list-avatar">
        <img src="https://api.dicebear.com/7.x/micah/svg?seed=${student.name}&backgroundColor=transparent" alt="Avatar" />
      </div>
      <div class="student-info">
        <div class="name">${student.name}</div>
        <div class="section">${student.section}</div>
      </div>
      <div class="points-badge">
        <span>⭐ ${student.points.toLocaleString()} pts</span>
      </div>
    `;
    leaderboardList.appendChild(row);
  });
}

// Toggle Filters
const pillBtns = document.querySelectorAll('.pill-btn');
let currentFilter = 'All';

function applyFilters() {
  const filtered = allStudents
    .filter(s => currentFilter === 'All' || s.section === currentFilter);
  renderLeaderboard(filtered);
}

pillBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    pillBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    applyFilters();
  });
});

// Header fade out on scroll down past Section 1
document.querySelector('.snap-container').addEventListener('scroll', (e) => {
  const scrollTop = e.target.scrollTop;
  const header = document.getElementById('app-header');
  if(scrollTop > 100) {
    header.style.opacity = '0';
  } else {
    header.style.opacity = '1';
  }
});

// Init
window.addEventListener('DOMContentLoaded', loadData);
