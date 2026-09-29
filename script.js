const blrAreas = [
    "Agara Junction", "Airport Road", "Attibele Toll", "Banashankari", "Basavanagudi", "Basaveshwaranagar", "Bellandur", "Bommanahalli",
    "Brookefield", "BTM Layout", "CV Raman Nagar", "Electronic City", "HAL",
    "Hebbal", "HSR Layout", "Indiranagar", "Jalahalli", "Jayanagar", "JP Nagar",
    "K R Puram", "Kengeri", "Koramangala", "Madiwala", "Mahadevapura", "Majestic",
    "Malleshwaram", "Marathahalli", "Mathikere", "MG Road", "Nagarbhavi",
    "Padmanabhanagar", "Peenya", "Rajajinagar", "Rajarajeshwari Nagar", "Ramamurthy Nagar",
    "Richmond Town", "RT Nagar", "Sahakara Nagar", "Shanti Nagar", "Shivajinagar",
    "Silk Board", "Subramanyapura", "Ulsoor", "Uttarahalli", "Varthur", "Vidyaranyapura",
    "Vijayanagar", "Whitefield", "Yelahanka", "Yeshwanthpur"
];
["startLocation", "destination"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = '<option value="" disabled selected>Select ' + (id === 'startLocation' ? 'Starting Location' : 'Destination') + '</option>';
        blrAreas.forEach(a => el.add(new Option(a, a)));
    }
});

// ==========================================
// SAFEROUTE AI - JAVASCRIPT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // Fetch live dashboard telemetry
    fetch("http://127.0.0.1:5000/dashboard-data")
        .then(res => res.json())
        .then(data => {
            // Render Mini Hero Stats
            if (document.getElementById('mini-risks')) document.getElementById('mini-risks').textContent = data.high_risk_areas || 0;
            if (document.getElementById('mini-accidents')) document.getElementById('mini-accidents').textContent = data.total_accidents || 0;
            if (document.getElementById('mini-score')) document.getElementById('mini-score').textContent = (data.confidence_score || 0) + "/100";

            // Render Main Dashboard Stats
            if (document.getElementById('stat-total')) document.getElementById('stat-total').textContent = (data.total_accidents || 0).toLocaleString();
            if (document.getElementById('stat-risks')) document.getElementById('stat-risks').textContent = data.high_risk_areas || 0;
            if (document.getElementById('stat-poor')) document.getElementById('stat-poor').textContent = data.poor_road_conditions || 0;
            if (document.getElementById('stat-confidence')) document.getElementById('stat-confidence').textContent = (data.confidence_score || 0) + "%";
        }).catch(e => console.log("Dashboard Stats Fetch Error:", e));

    // ==========================================
    // 1. MOBILE MENU
    // ==========================================

    const menuButton = document.getElementById("menuButton");
    const mobileMenu = document.getElementById("mobileMenu");

    if (menuButton && mobileMenu) {

        menuButton.addEventListener("click", function () {

            mobileMenu.classList.toggle("hidden");

        });

    }


    // Close mobile menu after clicking a link

    if (mobileMenu) {

        const mobileLinks = mobileMenu.querySelectorAll("a");

        mobileLinks.forEach(function (link) {

            link.addEventListener("click", function () {

                mobileMenu.classList.add("hidden");

            });

        });

    }


    // ==========================================
    // 2. RISK PREDICTION
    // ==========================================

    const riskForm = document.getElementById("riskForm");

    if (riskForm) {

        riskForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const startLoc = document.getElementById("startLocation").value;
            const destLoc = document.getElementById("destination").value;
            const road = document.getElementById("road").value;
            const time = document.getElementById("time").value;

            // Show loading state
            const submitBtn = riskForm.querySelector("button[type='submit']");
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = "Engaging Neural Net...";
            submitBtn.disabled = true;

            try {
                const response = await fetch("http://127.0.0.1:5000/predict", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        start: startLoc,
                        destination: destLoc,
                        road: road,
                        time: time
                    })
                });

                if (!response.ok) {
                    throw new Error("API Connection Failed.");
                }

                const data = await response.json();
                const score = data.risk_score;

                // Get result elements
                const result = document.getElementById("predictionResult");
                const resultTitle = document.getElementById("riskResult");
                const resultMessage = document.getElementById("riskMessage");
                const resultScore = document.getElementById("riskScore");
                const riskBar = document.getElementById("riskBar");
                const routeRec = document.getElementById("routeRecommendation");
                const recTitle = document.getElementById("recTitle");
                const recMessage = document.getElementById("recMessage");

                // Apply results from Flask API
                resultScore.textContent = score + "%";
                resultTitle.textContent = data.risk_level + " Risk";
                resultMessage.innerHTML = "AI Analysis: " + data.recommendation + "<br><br><span class='text-cyan-600 dark:text-cyan-400 font-semibold mb-1 block'>Predicted Traffic Density: " + data.predicted_traffic + "</span><span class='text-indigo-500 dark:text-indigo-400 font-semibold'>Autonomously Sensed Weather: " + (data.live_weather || 'Clear') + "</span>";

                if (window.showToast) window.showToast("Analysis Complete", `Navigating from ${startLoc} to ${destLoc}`, false);

                // Draw dynamic Map Route line
                if (window.mainLeafletMap && typeof L.Routing !== 'undefined') {
                    if (window.routingControl) { window.mainLeafletMap.removeControl(window.routingControl); }
                    window.routingControl = L.Routing.control({
                        waypoints: [L.latLng(data.start_coords[0], data.start_coords[1]), L.latLng(data.dest_coords[0], data.dest_coords[1])],
                        createMarker: function () { return null; },
                        routeWhileDragging: false,
                        addWaypoints: false,
                        show: false, // hide textual routing widget
                        lineOptions: { styles: [{ color: '#06b6d4', opacity: 0.9, weight: 6, dashArray: '10, 10' }] }
                    }).addTo(window.mainLeafletMap);
                }

                if (data.action === "none") {
                    resultTitle.className = "text-4xl font-bold mt-2 text-green-600";
                    riskBar.className = "h-full bg-green-500 rounded-full transition-all duration-1000 ease-out";
                    routeRec.classList.add("hidden");
                } else if (data.action === "suggest_alternative" || data.action === "reroute") {
                    const isHighRisk = data.action === "reroute";

                    resultTitle.className = isHighRisk ? "text-4xl font-bold mt-2 text-red-600" : "text-4xl font-bold mt-2 text-yellow-600";
                    riskBar.className = isHighRisk ? "h-full bg-red-500 rounded-full transition-all duration-1000 ease-out" : "h-full bg-yellow-500 rounded-full transition-all duration-1000 ease-out";

                    routeRec.classList.remove("hidden");

                    if (data.alternative) {
                        recTitle.textContent = "⚠️ Recommended Action";
                        recTitle.className = isHighRisk ? "font-bold text-lg text-red-700 dark:text-red-400" : "font-bold text-lg text-yellow-700 dark:text-yellow-400";
                        recMessage.innerHTML = `
                        <strong class="text-slate-800 dark:text-slate-100">${data.alternative.action_text}</strong><br><br>
                        Alternative Route: <span class="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded mx-1">${data.alternative.route_name}</span><br>
                        Estimated Risk: <strong class="${isHighRisk ? 'text-yellow-600' : 'text-green-600'}">${data.alternative.estimated_risk}%</strong>
                    `;
                    }
                }

                // Show result
                result.classList.remove("hidden");

                // Timeout to animate width properly if transitioning
                setTimeout(() => {
                    riskBar.style.width = score + "%";
                }, 50);

            } catch (error) {
                if (window.showToast) window.showToast("API Error", "Could not reach Flask Neural Net.", true);
                else alert("Error connecting to the ML API. Is the Flask server running?");
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }


            // Scroll to result

            result.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        });

    }


    // ==========================================
    // 3. ACCIDENT AREA SEARCH (Dynamically Bound Now)
    // ==========================================

    // 4. NAVIGATION
    // ==========================================

    const navLinks =
        document.querySelectorAll(".nav-link");

    const sections =
        document.querySelectorAll("section");


    window.addEventListener("scroll", function () {

        let currentSection = "";


        sections.forEach(function (section) {

            const sectionTop =
                section.offsetTop;

            const sectionHeight =
                section.clientHeight;


            if (
                window.scrollY >=
                sectionTop - sectionHeight / 3
            ) {

                currentSection =
                    section.getAttribute("id");

            }

        });


        navLinks.forEach(function (link) {

            link.classList.remove(
                "text-violet-400"
            );


            if (
                link.getAttribute("href") ===
                "#" + currentSection
            ) {

                link.classList.add(
                    "text-violet-400"
                );

            }

        });

    });


    // ==========================================
    // 5. PHASE 2 - ADVANCED FEATURES
    // ==========================================

    // 5.1 Dark Mode Toggle
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
        darkModeToggle.addEventListener("click", () => {
            document.documentElement.classList.toggle("dark");
            const isDark = document.documentElement.classList.contains("dark");
            darkModeToggle.textContent = isDark ? "☀️" : "🌙";
        });
    }

    // Helper function to get real geolocation
    function getUserLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve("Geolocation not supported by browser");
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => resolve(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`),
                () => resolve("Location access denied/failed")
            );
        });
    }

    // 5.2 SOS and Hazard Modals
    const btnSos = document.getElementById("btnSos");
    const sosModal = document.getElementById("sosModal");
    const closeSos = document.getElementById("closeSos");
    if (btnSos && sosModal) {
        btnSos.addEventListener("click", async () => {
            sosModal.classList.remove("hidden");

            // Fetch real GPS location
            const realLocation = await getUserLocation();

            // Trigger backend SOS alert logic
            try {
                await fetch("http://127.0.0.1:5000/sos-alert", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ service: "Emergency UI Opened", location: realLocation })
                });
            } catch (e) {
                console.log("SOS API Ping Failed:", e);
            }
        });
        closeSos.addEventListener("click", () => {
            sosModal.classList.add("hidden");
        });
    }

    const btnReportHazard = document.getElementById("btnReportHazard");
    if (btnReportHazard) {
        btnReportHazard.addEventListener("click", async () => {
            const originalText = btnReportHazard.textContent;
            btnReportHazard.textContent = "Locating GPS...";

            const realLocation = await getUserLocation();
            btnReportHazard.textContent = "Reporting...";

            try {
                const resp = await fetch("http://127.0.0.1:5000/report-incident", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "Road Hazard",
                        location: realLocation,
                        timestamp: new Date().toISOString()
                    })
                });
                const data = await resp.json();
                alert("API SUCCESS: " + data.message + "\nTracking ID: " + data.incident_id);
            } catch (e) {
                alert("Error reporting hazard to API. Is Flask running?");
            } finally {
                btnReportHazard.textContent = originalText;
            }
        });
    }

    // 5.3 Chart.js & Leaflet Initialization
    window.addEventListener("DOMContentLoaded", async () => {

        // Fetch Dynamic Dashboard Metrics
        let chartTrendData = [120, 190, 150, 210, 180, 240];
        let chartSegmentsData = [25, 45, 30];

        try {
            const dashResponse = await fetch("http://127.0.0.1:5000/dashboard-data");
            if (dashResponse.ok) {
                const dashData = await dashResponse.json();

                chartTrendData = dashData.monthly_trend;
                chartSegmentsData = dashData.risk_segments;

                const statTotal = document.getElementById("stat-total");
                if (statTotal) statTotal.textContent = dashData.total_accidents.toLocaleString();

                const statRisks = document.getElementById("stat-risks");
                if (statRisks) statRisks.textContent = dashData.high_risk_areas;

                const statPoor = document.getElementById("stat-poor");
                if (statPoor) statPoor.textContent = dashData.poor_road_conditions;

                const statConfidence = document.getElementById("stat-confidence");
                if (statConfidence) statConfidence.textContent = dashData.confidence_score + "%";
            }
        } catch (e) {
            console.log("Using fallback chart data, API not reachable: ", e);
        }

        // Chart.js
        const monthlyCtx = document.getElementById('monthlyTrendChart');
        if (monthlyCtx && typeof Chart !== 'undefined') {
            const ctx2d = monthlyCtx.getContext('2d');
            const gradient = ctx2d.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(6, 182, 212, 0.6)');   // Cyan at top
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');  // Violet transparent at bottom

            Chart.defaults.color = '#94a3b8';
            Chart.defaults.font.family = 'Inter';

            new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Accidents',
                        data: chartTrendData,
                        borderColor: '#06b6d4',
                        backgroundColor: gradient,
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#8b5cf6',
                        pointBorderColor: '#ffffff',
                        pointHoverBackgroundColor: '#ffffff',
                        pointHoverBorderColor: '#8b5cf6',
                        pointRadius: 5,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index',
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleColor: '#f8fafc',
                            bodyColor: '#cbd5e1',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 8,
                            titleFont: { size: 13, weight: 'bold' }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false, drawBorder: false },
                        },
                        y: {
                            grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false, borderDash: [5, 5] },
                        }
                    }
                }
            });
        }

        const segmentsCtx = document.getElementById('riskSegmentsChart');
        if (segmentsCtx && typeof Chart !== 'undefined') {
            new Chart(segmentsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
                    datasets: [{
                        data: chartSegmentsData,
                        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                        hoverBackgroundColor: ['#f87171', '#fbbf24', '#34d399'],
                        hoverOffset: 8,
                        borderWidth: 2,
                        borderColor: 'rgba(255,255,255,0.05)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 8
                        }
                    }
                }
            });
        }

        // Leaflet.js
        const mapContainer = document.getElementById("interactiveMap");
        if (mapContainer && typeof L !== 'undefined') {
            const map = L.map('interactiveMap').setView([12.9716, 77.5946], 11); // Center on Bangalore
            window.mainLeafletMap = map; // Provide Global Access for Routing Machine
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);

            // Pre-defined markers fallback
            let hotspots = [
                { name: "Silk Board", coords: [12.9176, 77.6231], risk: "High", type: "Unknown" },
                { name: "Marathahalli", coords: [12.9569, 77.7011], risk: "Medium", type: "Unknown" },
                { name: "Hebbal", coords: [13.0354, 77.5988], risk: "High", type: "Unknown" },
                { name: "Electronic City", coords: [12.8399, 77.6770], risk: "Medium", type: "Unknown" }
            ];

            try {
                const incResponse = await fetch("http://127.0.0.1:5000/live-incidents");
                if (incResponse.ok) {
                    const incData = await incResponse.json();
                    if (incData.incidents) {
                        hotspots = incData.incidents;
                    }
                }
            } catch (e) {
                console.log("Using fallback map data, API not reachable: ", e);
            }

            hotspots.forEach(spot => {
                const color = spot.risk === "High" ? "red" : (spot.risk === "Medium" ? "orange" : "green");
                L.circleMarker(spot.coords, {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.6,
                    radius: 12
                }).addTo(map).bindPopup(`<b>${spot.name}</b><br/>Status: ${spot.risk} Risk<br/><small>${spot.type || 'Activity reported'}</small>`);
            });

            // Generative HTML DOM Area Cards
            const areaList = document.getElementById("areaList");
            if (areaList) {
                areaList.innerHTML = ""; // Clear static data
                hotspots.forEach((spot, index) => {
                    const badgeColor = spot.risk === "High" ? "bg-red-100 text-red-700" : (spot.risk === "Medium" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700");
                    const defaultDisplay = index < 5 ? "block" : "none"; // Only show top 5 areas

                    const html = `
                <div class="group area-card bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] cursor-pointer" data-area="${spot.name.toLowerCase()}" data-index="${index}" style="display: ${defaultDisplay};">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-bold text-lg">${spot.name}</h3>
                            <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Bengaluru, Karnataka</p>
                        </div>
                        <span class="${badgeColor} px-3 py-1 rounded-full text-xs font-semibold">${spot.risk} Risk</span>
                    </div>
                    <div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                         <span class="text-xs text-slate-500 font-semibold">${spot.type || "Reported"}</span>
                         <span class="text-xs text-slate-500">${spot.coords[0].toFixed(3)}, ${spot.coords[1].toFixed(3)}</span>
                    </div>
                </div>`;
                    areaList.innerHTML += html;
                });

                // Bind the live search locally now that DOM has cards
                const searchInput = document.getElementById("areaSearch");
                if (searchInput) {
                    searchInput.addEventListener("input", function () {
                        const searchValue = searchInput.value.toLowerCase().trim();
                        const newCards = document.querySelectorAll(".area-card");

                        newCards.forEach(function (card) {
                            const areaName = card.dataset.area;
                            const idx = parseInt(card.dataset.index);

                            if (searchValue === "") {
                                // If search is empty, go back to only showing top 5
                                card.style.display = (idx < 5) ? "block" : "none";
                            } else {
                                // If searching, show any match
                                if (areaName.includes(searchValue)) {
                                    card.style.display = "block";
                                } else {
                                    card.style.display = "none";
                                }
                            }
                        });
                    });
                }
            }
        }
    });

    // ==========================================
    // 6. SCROLL REVEAL ANIMATIONS
    // ==========================================
    window.addEventListener("DOMContentLoaded", () => {
        const revealElements = document.querySelectorAll('.reveal');
        const revealCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        };

        const revealOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        };

        const revealObserver = new IntersectionObserver(revealCallback, revealOptions);
        revealElements.forEach(el => revealObserver.observe(el));
    });

    // ==========================================
    // 7. TOAST NOTIFICATION ENGINE
    // ==========================================
    window.showToast = function (title, message, isError = false) {
        const container = document.getElementById("toast-container");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = `p-4 flex flex-col gap-1 rounded-xl shadow-lg border backdrop-blur-md text-sm text-white transform transition-all duration-500 translate-x-[120%] opacity-0 ${isError ? 'bg-red-500/80 border-red-500' : 'bg-slate-800/90 border-slate-700'}`;
        toast.innerHTML = `<h4 class="font-bold text-base flex items-center gap-2">${title}</h4><p class="opacity-90 leading-tight">${message}</p>`;
        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            setTimeout(() => toast.classList.remove("translate-x-[120%]", "opacity-0"), 50);
        });
        // Animate out
        setTimeout(() => {
            toast.classList.add("translate-x-[120%]", "opacity-0");
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    };

    // ==========================================
    // 8. ACADEMIC EVENT MAPPINGS (Assignment Requirement)
    // ==========================================

    // 1. KEYBOARD EVENT (Escape Key)
    document.addEventListener("keydown", (e) => {
        const sosModal = document.getElementById("sosModal");
        if (e.key === "Escape" && sosModal && !sosModal.classList.contains("hidden")) {
            sosModal.classList.add("hidden");
            if (window.showToast) window.showToast("Canceled", "Emergency SOS modal dismissed via Escape key.", false);
        }
    });

    // 2. MOUSE EVENT (Double Click)
    const mapNode = document.getElementById("interactiveMap");
    if (mapNode) {
        mapNode.addEventListener("dblclick", () => {
            if (window.showToast) window.showToast("Map Interactive", "Double click registered on Live AI Tracking Map.", false);
        });
    }

    // 3. CLIPBOARD EVENT (Copy)
    const riskResultNode = document.getElementById("predictionResult");
    if (riskResultNode) {
        riskResultNode.addEventListener("copy", (e) => {
            const selection = document.getSelection();
            e.clipboardData.setData('text/plain', selection.toString() + "\n\n-- Generated autonomously by SafeRoute Neural Engine API");
            e.preventDefault();
            if (window.showToast) window.showToast("Data Secured", "Copied AI output to clipboard with verification watermark.", false);
        });
    }

    // 4. FORM EVENTS (Focus & Blur)
    const destSelect = document.getElementById("destination");
    const aiSubmitBtn = document.querySelector("#riskForm button[type='submit']");
    if (destSelect && aiSubmitBtn) {
        destSelect.addEventListener("focus", () => {
            aiSubmitBtn.classList.add("ring-4", "ring-cyan-500", "ring-offset-2", "scale-105");
        });
        destSelect.addEventListener("blur", () => {
            aiSubmitBtn.classList.remove("ring-4", "ring-cyan-500", "ring-offset-2", "scale-105");
        });
    }

}); // End of Full DOMContentLoaded Wrapper