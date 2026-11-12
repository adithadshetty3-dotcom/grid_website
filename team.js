
/* GRID - Interactive Team Directory */

const teamGroups = [
    { id: "leads", title: "GRID Core Team Leads", description: "Meet the leaders guiding GRID.", icon: "♛", count: 6 },
    { id: "technical", title: "Technical", description: "Meet our technology and development team.", icon: "⌘", count: 3 },
    { id: "design", title: "Design", description: "Meet our creative minds.", icon: "✦", count: 3 },
    { id: "marketing", title: "Marketing & Outreach", description: "Meet our marketing and outreach team.", icon: "↗", count: 3 },
    { id: "events", title: "Event Management", description: "Meet the people behind our events.", icon: "▦", count: 3 },
    { id: "social", title: "Social Media", description: "Meet our social media team.", icon: "#", count: 3 }
];



const teamMembers = {
    leads: [
        { name: "Shraddha T R", role: "GRID Lead", photo: "images/team/lead1.jpeg", linkedin: "Linkedin:https://www.linkedin.com/in/shraddha-tr?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
        { name: "Vishal M", role: "Design Team Lead", photo: "images/team/lead2.jpeg", linkedin: "https://www.linkedin.com/in/vishal-m-266bb6331?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
        { name: "Aditha D Shetty", role: "Technical team Lead", photo: "images/team/lead3.jpeg", linkedin: "https://www.linkedin.com/in/adithadshetty?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
        { name: "Srusti M C", role: "Marketing and Outreach Team Lead", photo: "images/team/lead4.jpeg", linkedin: "https://www.linkedin.com/in/srusti-m-c-/" },
        { name: "Rida Shariff", role: "Event Management Team Lead", photo: "images/team/lead5.jpeg", linkedin: "https://www.linkedin.com/in/rida-shariff/" },
        { name: "Iha Rao", role: "Social Media Team Lead", photo: "images/team/lead6.jpeg", linkedin: "https://www.linkedin.com/in/iha-rao/" }
    ],

    technical: [
        { name: "Madesh H S", role: "Technical Team", photo: "images/team/technical1.jpeg", linkedin: "https://www.linkedin.com/in/madesh-h-s-2aa0153a0?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
        { name: " K Vineel ", role: "Technical Team", photo: "images/team/technical2.jpeg", linkedin: "https://www.linkedin.com/in/k-vineel-9132863a4/" },
        { name: "Avanija ", role: "Technical Team", photo: "images/team/technical3.jpeg", linkedin: "https://www.linkedin.com/in/avanija-mantena-454919367?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],

    design: [
        { name: "V Tarun Yadav", role: "Design Team", photo: "images/team/design1.jpeg", linkedin: "https://www.linkedin.com/in/v-tarun-yadav-1533b9387?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
        { name: "HithaShree", role: "Design Team", photo: "images/team/design2.jpeg", linkedin: "https://www.linkedin.com/in/hitasree-gowda-14564744a?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
        { name: "Design Member 3", role: "Design Team", photo: "", linkedin: "" }
    ],

    marketing: [
        { name: "Skandana Iyengar", role: "Marketing & Outreach", photo: "images/team/marketing1.jpeg", linkedin: "https://www.linkedin.com/in/skandana-iyengar-76793b327?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
        { name: "Neha N", role: "Marketing & Outreach", photo: "images/team/marketing2.jpeg", linkedin: " https://www.linkedin.com/in/neha-n-6420503b3?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
        { name: "Pooja K", role: "Marketing & Outreach", photo: "images/team/marketing3.jpeg", linkedin: "https://www.linkedin.com/in/pooja-k-71ba453a8?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],

    events: [
        { name: "Gowthami S", role: "Event Management", photo: "images/team/events1.jpeg", linkedin: "https://www.linkedin.com/in/gowthami--s/" },
        { name: "Lavanya R", role: "Event Management", photo: "images/team/events2.jpeg", linkedin: "https://www.linkedin.com/in/lavanyaravi8106?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
        { name: "Samrah Mohmood ", role: "Event Management", photo: "images/team/events3.jpeg", linkedin: "https://www.linkedin.com/in/samrah-mahmood-8342a0367" }
    ],

    social: [
        { name: "Sanjana H S", role: "Social Media", photo: "images/team/social1.jpeg", linkedin: "https://www.linkedin.com/in/sanjana-hs-193126371?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
        { name: "Keerthana D", role: "Social Media", photo: "images/team/social2.jpeg", linkedin: "https://www.linkedin.com/in/keerthana-d-66361b429?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
        { name: "Hithesh B V", role: "Social Media", photo: "images/team/social3.jpeg", linkedin: "https://www.linkedin.com/in/hitesh-bv-38822437b?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ]
};



const categories = document.getElementById("team-categories");
const membersView = document.getElementById("team-members-view");
const selectedMembers = document.getElementById("selected-members");
const selectedTitle = document.getElementById("selected-team-title");
const selectedDescription = document.getElementById("selected-team-description");

function openTeam(group) {
    categories.hidden = true;
    membersView.hidden = false;

    selectedTitle.textContent = group.title;
    selectedDescription.textContent = group.description;
    selectedMembers.innerHTML = "";

    for (let i = 1; i <= group.count; i++) {
        const member = teamMembers[group.id]?.[i - 1] || {
            name: `Member ${i} Name`,
            role: group.title,
            photo: "",
            linkedin: "https://www.linkedin.com/"
        };

        const card = document.createElement("article");
        card.className = "member-card";

        card.innerHTML = `
            <div class="member-image">
                ${
                    member.photo
                    ? `<img src="${member.photo}" alt="${member.name}">`
                    : `<div class="member-placeholder">${String(i).padStart(2, "0")}</div>`
                }
            </div>

            <div class="member-info">
                <p class="member-role">${member.role}</p>
                <h3>${member.name}</h3>
                <a href="${member.linkedin}"
                   class="btn btn-primary"
                   target="_blank"
                   rel="noopener noreferrer">
                   LinkedIn Profile ↗
                </a>
            </div>
        `;

        selectedMembers.appendChild(card);
    }

    window.scrollTo({
        top: document.querySelector(".members-section").offsetTop - 80,
        behavior: "smooth"
    });
}

// Generate six category boxes
teamGroups.forEach((group, index) => {
    const box = document.createElement("button");
    box.className = "team-category-card";
    box.type = "button";

    box.innerHTML = `
        
        <span class="category-icon">${group.icon}</span>
        <span class="category-title">${group.title}</span>
    
        <span class="category-explore">EXPLORE TEAM ↗</span>
    `;

    box.addEventListener("click", () => openTeam(group));
    categories.appendChild(box);
});

// Back to categories
document.getElementById("back-to-teams").addEventListener("click", () => {
    membersView.hidden = true;
    categories.hidden = false;

    window.scrollTo({
        top: document.querySelector(".members-section").offsetTop - 80,
        behavior: "smooth"
    });
});
