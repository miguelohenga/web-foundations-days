// 1. Select all elements
const textarea = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

const MAX_CHARS = 200;

// 2. Update the counters
function updateCounts() {
    const text = textarea.value;
    const charLength = text.length;
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

    charCount.textContent = `${charLength} / ${MAX_CHARS} characters`;
    wordCount.textContent = `${words} word${words === 1 ? "" : "s"}`;

    // warning and over classes
    charCount.classList.remove("warning", "over");
    if (charLength > MAX_CHARS) {
        charCount.classList.add("over");
    } else if (charLength > 180) {
        charCount.classList.add("warning");
    }
}

// 3. Save the draft to localStorage
function saveDraft() {
    localStorage.setItem("quicknotes-draft", textarea.value);
}

// 4. Clear everything
function clearAll() {
    textarea.value = "";
    localStorage.removeItem("quicknotes-draft");
    updateCounts();
}

// 5. Toggle dark mode
function applyTheme(isDark) {
    document.body.classList.toggle("dark", isDark);
    themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}

// 6. Listen for input
textarea.addEventListener("input", () => {
    updateCounts();
    saveDraft();
});

// 7. Clear button
clearBtn.addEventListener("click", clearAll);

// 8. Escape key inside textarea clears
textarea.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        clearAll();
    }
});

// 9. Theme toggle button
themeToggle.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");
    applyTheme(isDark);
    localStorage.setItem("quicknotes-theme", isDark ? "dark" : "light");
});

// 10. On page load — restore draft and theme
window.addEventListener("load", () => {
    const savedDraft = localStorage.getItem("quicknotes-draft");
    if (savedDraft) {
        textarea.value = savedDraft;
    }

    const savedTheme = localStorage.getItem("quicknotes-theme");
    applyTheme(savedTheme === "dark");

    updateCounts();
});