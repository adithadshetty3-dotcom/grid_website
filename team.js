
/* GRID - Interactive Team Directory */

const teamGroups = [
    {
        id: "leads",
        title: "Leads",
        description: "Meet the leaders guiding GRID.",
        icon: "♛",
        count: 6
    },
    {
        id: "technical",
        title: "Technical",
        description: "Meet our technology and development team.",
        icon: "</>",
        count: 3
    },
    {
        id: "design",
        title: "Design",
        description: "Meet our creative minds.",
        icon: "✦",
        count: 3
    },
    {
        id: "marketing",
        title: "Marketing & Outreach",
        description: "Meet our marketing and outreach team.",
        icon: "↗",
        count: 3
    },
    {
        id: "events",
        title: "Event Management",
        description: "Meet the people behind our events.",
        icon: "▦",
        count: 3
    },
    {
        id: "social",
        title: "Social Media",
        description: "Meet our social media team.",
        icon: "#",
        count: 3
    }
];

const categories = document.getElementById("team-categories");
const membersView = document.getElementById("team-members-view");
const selectedMembers = document.getElementById("selected-members");
const selectedTitle = document.getElementById("selected-team-title");
const selectedDescription =
    document.getElementById("selected-team-description");

function openTeam(group) {

const teamMembers = {
    leads: [
        {
            name: "Member 1 Name",
            role: "Core Team Lead",
            photo: "images/team/lead1.jpeg",
            linkedin: "https://www.linkedin.com/"
        },
        {
            name: "Member 2 Name",
            role: "Core Team Lead",
            photo: "images/team/lead2.jpeg",
            linkedin: "https://www.linkedin.com/"
        },
        {
            name: "Member 3 Name",
            role: "Core Team Lead",
            photo: "images/team/lead3.jpeg",
            linkedin: "https://www.linkedin.com/"
        }
    ]
};


    categories.hidden = true;
    membersView.hidden = false;

    selectedTitle.textContent = group.title;
    selectedDescription.textContent = group.description;

    selectedMembers.innerHTML = "";

    for (let i = 1; i <= group.count; i++) {

        const card = document.createElement("article");
        card.className = "member-card";

        card.innerHTML = `
            <div class="member-image">
    ${
        group.id === "leads" && i <= 3
        ? `<img src="images/team/lead${i}.jpeg"
            alt="GRID Core Team Lead ${i}">`
        : `<div class="member-placeholder">
            ${String(i).padStart(2, "0")}
        </div>`
    }
</div>
    
</div>
                
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
        <span class="category-number">
            0${index + 1} / 06
        </span>

        <span class="category-icon">${group.icon}</span>

        <span class="category-title">${group.title}</span>

        <span class="category-count">
            ${group.count} Members
        </span>

        <span class="category-explore">
            EXPLORE TEAM ↗
        </span>
    `;

    box.addEventListener("click", () => openTeam(group));

    categories.appendChild(box);
});

// Back to categories

document.getElementById("back-to-teams")
    .addEventListener("click", () => {

        membersView.hidden = true;
        categories.hidden = false;

        window.scrollTo({
            top: document.querySelector(".members-section").offsetTop - 80,
            behavior: "smooth"
        });
    });
