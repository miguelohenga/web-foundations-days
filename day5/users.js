// ===== 1. Select Elements =====
const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const status = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

// ===== 2. Store loaded users =====
let allUsers = [];

// ===== 3. Fetch Users =====
async function loadUsers() {
    // Disable button and show loading
    loadBtn.disabled = true;
    status.textContent = "Loading...";
    usersList.innerHTML = "";

    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/users");

        if (!response.ok) {
            throw new Error("Request failed with status " + response.status);
        }

        const data = await response.json();
        allUsers = data;
        status.textContent = "Loaded " + data.length + " users.";
        renderUsers(allUsers);
    } catch (error) {
        status.textContent = "Error: " + error.message;
    } finally {
        loadBtn.disabled = false;
    }
}

// ===== 4. Render Users =====
function renderUsers(list) {
    usersList.innerHTML = "";

    if (list.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No users match your filter.";
        usersList.appendChild(li);
        return;
    }

    list.forEach(function (user) {
        const li = document.createElement("li");

        const name = document.createElement("h3");
        name.textContent = user.name;

        const email = document.createElement("p");
        email.textContent = "Email: " + user.email;

        const city = document.createElement("p");
        city.textContent = "City: " + user.address.city;

        const company = document.createElement("p");
        company.textContent = "Company: " + user.company.name;

        li.appendChild(name);
        li.appendChild(email);
        li.appendChild(city);
        li.appendChild(company);

        usersList.appendChild(li);
    });
}

// ===== 5. Button Click =====
loadBtn.addEventListener("click", loadUsers);

// ===== 6. Filter Input =====
filterInput.addEventListener("input", function () {
    const term = filterInput.value.trim().toLowerCase();
    const filtered = allUsers.filter(function (user) {
        return user.name.toLowerCase().includes(term);
    });
    renderUsers(filtered);
});