let notes= [
    { id: 1, text: "Buy milk and bread", category: "personal" },
    { id: 2, text: "Finish the day 3assignment", category: "study" },
    { id: 3, text: "Email the project report to Grace", category: "work" },
    { id: 4, text: "Revise JavaScript arrays", category: "study" },
    { id: 5, text: "Call mum", category: "personal" }
];


function searchNotes(word) {
    return notes.filter(note => 
note.text.toLowerCase().includes(word.toLowerCase()));
}

console.log("searchNotes('milk'):", searchNotes("milk"));
//Expected: [{ id: 1, text: "Buy milk and bread", category: "personal" }]

console.log("searchNotes('xyz'): ", searchNotes("xyz"));
//Expected: []

function longestNote() {
    if (notes.length === 0) return null;
    
    let longest = notes[0];
    for (let note of notes) {
        if (note.text.length>longest.text.length) {
            longest = note;
        }
    }
    return longest;
    
}
console.log("longestNote():",
longestNote());
//Expected: { id: 3, text: "Email the project report to Grace", category: "work"}

function countByCategory() {
    const counts = {};
    for (let note of notes) {
        if (counts[note.category]) {
            counts[note.category]++;
        } else {
            counts[note.category] = 1;    
        }
    }
    return counts;
}

console.log("countByCategory():",
countByCategory());
// Expected: { personal: 2, work: 1, study: 2 }

function getSummary() {
    const counts = countByCategory();
    const total = notes.length;
    const noun = total === 1 ? "note" : "notes";
    const part = Object.entries(counts)
        .map(([cat, num]) => `${num} ${cat}`)
        .join(", ");
    return `${total} ${noun}: ${part}.` ;    
}

console.log("getSummary():",
getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

function isDuplicate(text) {
    const clean = text.trim().toLowerCase();
    return notes.some(note => note.text.trim().toLowerCase() === clean);
}

console.log("isDuplicate('Buy milk and bread'):", isDuplicate("Buy milk and bread"));
// Expected: true
console.log("isDuplicate('something new'):", isDuplicate("something new"));
// Expected: false

function addNote(text, category) {
    const validCategories = ["personal", "work", "study"];

    if (text.length < 1 || text.length >200) {
        console.log("Rejected: text must be 1-200 characters.");
        return false;
    }
    if (isDuplicate(text)) {
        console.log("Rejected: duplicate note");
        return false;
    }
    if (!validCategories.includes(category)) {
        console.log("Rejected: invalid category.");
        return false;
    }
    const newId = notes.length ? Math.max(...notes.map(n =>n.id)) + 1 : 1;
    notes.push({ id: newId, text: text, category: category })
    return true;
}

console.log("addNote('New task', 'work'):", addNote("New task", "Work"));
// Expected: true
console.log("addNote('', 'work'):", addNote("", "work"));
// Expected: false (logs "Rejected: text must be 1-200 characters.")
console.log("addNote('Buy milk and bread', 'personal'):", addNote("Buy milk and bread", "personal"))
// Expected: false (logs "Rejected: duplicate notes.")
console.log("addNote('Another task', 'invalid'):", addNote("Another task", "invalid"));
// Expected: false (logs "Rejected: invalid category.")

