const btn = document.getElementById("toggleBtn");
const text = document.getElementById("aboutText");

if (btn && text) {
btn.addEventListener("click", () => {
    text.classList.toggle("collapsed");

    btn.textContent = text.classList.contains("collapsed")
        ? "Read More"
        : "Read Less";
});
}


// contact page
const contactForm = document.getElementById("contactForm");
const feedback = document.getElementById("formFeedback");

if (contactForm) {
contactForm.addEventListener("submit", e => {
    e.preventDefault();
    console.log("Form works");


    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if(name && email && message){
        // Feedback to user
        feedback.textContent = "Thank you! Your message has been received.";
        feedback.style.color = "green";

        // Save to localStorage
        let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
        contacts.push({ name, email, message });
        localStorage.setItem("contacts", JSON.stringify(contacts));

        contactForm.reset();
    } else {
        feedback.textContent = "Please fill in all fields.";
        feedback.style.color = "red";
    }
});
}