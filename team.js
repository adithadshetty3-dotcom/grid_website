
/* =====================================
   GRID - CORE TEAM INTERACTIONS
===================================== */

// Scroll reveal animation
const cards = document.querySelectorAll(".member-card");

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.15
});

cards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 150}ms`;
    card.classList.add("reveal");
    observer.observe(card);
});


// 3D card hover effect
cards.forEach((card) => {

    card.addEventListener("mousemove", (event) => {

        const rect = card.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (centerY - y) / 25;
        const rotateY = (x - centerX) / 25;

        card.style.transform =
            `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "";
    });

});
