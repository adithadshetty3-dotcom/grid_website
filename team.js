
/* GRID - Interactive Team Directory */

const teamGroups = [
    {
        id: "leads",
        title: "Leads",
        description: "Meet the leaders guiding GRID.",
        icon: "♛",
        count: 5
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
                <div class="member-placeholder">
                    ${String(i).padStart(2, "0")}
                </div>
                <span class="member-number">
                    GRID / ${String(i).padStart(2, "0")}
                </span>
            </div>

            <div class="member-info">
                <p class="member-role">${group.title}</p>
                <h3>Member Name</h3>
                <p class="member-desc">Profile coming soon</p>
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
