document.addEventListener("DOMContentLoaded", function () {

    /* ===============================
       FORM FUNCTIONALITY
    =============================== */

    const form = document.querySelector(".seller-form form");

    // Create results section dynamically
    const resultsSection = document.createElement("section");
    resultsSection.classList.add("results");
    document.querySelector(".home").appendChild(resultsSection);

    form.addEventListener("submit", function (e) {
        e.preventDefault(); // Prevent page reload

        const sellerName = document.getElementById("seller-name").value.trim();
        const period = document.getElementById("period").value;

        if (sellerName === "") {
            alert("Please enter a seller name.");
            return;
        }

        // Simulated analysis output
        const sales = Math.floor(Math.random() * 10000) + 1000;
        const inventory = Math.floor(Math.random() * 500) + 50;
        const growth = (Math.random() * 20).toFixed(2);

        resultsSection.innerHTML = `
            <h3>Business Analysis for ${sellerName}</h3>
            <div class="result-card">
                <p><strong>Period:</strong> ${period}</p>
                <p><strong>Total Sales:</strong> KES ${sales.toLocaleString()}</p>
                <p><strong>Inventory Remaining:</strong> ${inventory} items</p>
                <p><strong>Growth Rate:</strong> ${growth}%</p>
            </div>
        `;
    });


    /* ===============================
       NAVBAR COLLAPSE ON SCROLL
    =============================== */

    const navbar = document.querySelector(".navbar");
    let lastScrollTop = 0;

    window.addEventListener("scroll", function () {
        let currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        if (currentScroll > lastScrollTop) {
            // Scrolling down → hide navbar
            navbar.style.top = "-100px";
        } else {
            // Scrolling up → show navbar
            navbar.style.top = "0";
        }

        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });

    // Show navbar when hovering at top area
    document.addEventListener("mousemove", function (e) {
        if (e.clientY < 50) {
            navbar.style.top = "0";
        }
    });

});
