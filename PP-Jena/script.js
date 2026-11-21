        /* --- STATE & MOCK INITIALIZATION --- */
        const DEFAULT_USERS = [
            { name: "Demo Guest", email: "guest@grandstaycation.com", password: "guest123", role: "guest" },
            { name: "Sarah Receptionist", email: "reception@grandstaycation.com", password: "reception123", role: "reception" },
            { name: "Michael Housekeeper", email: "clean@grandstaycation.com", password: "clean123", role: "housekeeping" },
            { name: "Admin Manager", email: "admin@grandstaycation.com", password: "admin123", role: "admin" }
        ];

        const DEFAULT_ROOMS = [
            { id: "101", type: "Executive Standard", price: 3500, status: "Clean", capacity: "1 Guest + Full Bed" },
            { id: "102", type: "Executive Standard", price: 3500, status: "Clean", capacity: "1 Guest + Full Bed" },
            { id: "103", type: "Executive Standard", price: 3500, status: "Dirty", capacity: "1 Guest + Full Bed" },
            { id: "104", type: "Executive Standard", price: 3500, status: "Clean", capacity: "1 Guest + Full Bed" },
            { id: "105", type: "Deluxe Ocean View", price: 6500, status: "Clean", capacity: "2 Guests + Queen Bed" },
            { id: "106", type: "Deluxe Ocean View", price: 6500, status: "Clean", capacity: "2 Guests + Queen Bed" },
            { id: "107", type: "Deluxe Ocean View", price: 6500, status: "Maintenance", capacity: "2 Guests + Queen Bed" },
            { id: "108", type: "Deluxe Ocean View", price: 6500, status: "Clean", capacity: "2 Guests + Queen Bed" },
            { id: "201", type: "Presidential Suite", price: 14500, status: "Clean", capacity: "4 Guests + 2 King Beds" },
            { id: "202", type: "Presidential Suite", price: 14500, status: "Occupied", capacity: "4 Guests + 2 King Beds" },
            { id: "203", type: "Presidential Suite", price: 14500, status: "Clean", capacity: "4 Guests + 2 King Beds" },
            { id: "204", type: "Executive Suite", price: 9500, status: "Clean", capacity: "2 Guests + 1 King Bed" },
            { id: "205", type: "Executive Suite", price: 9500, status: "Occupied", capacity: "2 Guests + 1 King Bed" },
            { id: "206", type: "Executive Suite", price: 9500, status: "Clean", capacity: "2 Guests + 1 King Bed" }
        ];

        const DEFAULT_BOOKINGS = [
            { ref: "GSS-90214", guestName: "Demo Guest", email: "guest@grandstaycation.com", roomType: "Executive Suite", roomId: "202", downPayment: 2850, status: "Checked-In", date: "2026-11-08" }
        ];

        function initStorage() {
            const version = localStorage.getItem('gss_version');
            if (version !== 'v3') {
                localStorage.setItem('gss_users', JSON.stringify(DEFAULT_USERS));
                localStorage.setItem('gss_rooms', JSON.stringify(DEFAULT_ROOMS));
                localStorage.setItem('gss_bookings', JSON.stringify(DEFAULT_BOOKINGS));
                localStorage.setItem('gss_version', 'v3');
            }
        }

        initStorage();

        let currentUser = JSON.parse(localStorage.getItem('gss_session')) || null;

        window.addEventListener('DOMContentLoaded', () => {
            if (currentUser) {
                appLoginSuccess(currentUser);
            }
        });

        /* --- AUTHENTICATION & REGISTRATION LOGIC --- */
        function switchAuthTab(tab) {
            document.querySelectorAll('.auth-tab').forEach(el => el.classList.remove('active'));
            if (tab === 'login') {
                document.querySelectorAll('.auth-tab')[0].classList.add('active');
                document.getElementById('login-form').style.display = 'block';
                document.getElementById('register-form').style.display = 'none';
            } else {
                document.querySelectorAll('.auth-tab')[1].classList.add('active');
                document.getElementById('login-form').style.display = 'none';
                document.getElementById('register-form').style.display = 'block';
            }
        }

        function handleLogin(e) {
            e.preventDefault();
            playClickSound();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value.trim();

            const users = JSON.parse(localStorage.getItem('gss_users'));
            const found = users.find(u => u.email === email && u.password === pass);

            if (found) {
                currentUser = found;
                localStorage.setItem('gss_session', JSON.stringify(currentUser));
                showToast(`Welcome back, ${found.name}!`);
                appLoginSuccess(found);
            } else {
                showToast("Invalid email or password. Please try again.");
            }
        }

        function handleRegister(e) {
            e.preventDefault();
            playClickSound();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value.trim();
            const role = document.getElementById('reg-role').value;

            let users = JSON.parse(localStorage.getItem('gss_users'));
            if (users.some(u => u.email === email)) {
                showToast("Email address is already registered.");
                return;
            }

            const newUser = { name, email, password, role };
            users.push(newUser);
            localStorage.setItem('gss_users', JSON.stringify(users));

            currentUser = newUser;
            localStorage.setItem('gss_session', JSON.stringify(currentUser));
            showToast("Account created successfully!");
            appLoginSuccess(currentUser);
        }

        function quickDemoLogin(email, pass) {
            document.getElementById('login-email').value = email;
            document.getElementById('login-password').value = pass;
            handleLogin(new Event('submit'));
        }

        function logout() {
            localStorage.removeItem('gss_session');
            currentUser = null;
            document.getElementById('app-container').style.display = 'none';
            document.getElementById('auth-overlay').style.display = 'flex';
            showToast("Signed out successfully.");
        }

        function appLoginSuccess(user) {
            document.getElementById('auth-overlay').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';

            document.getElementById('nav-user-name').innerText = user.name;
            document.getElementById('nav-user-role').innerText = user.role.toUpperCase();

            setupNavigation(user.role);
            renderAllViews();
        }

        /* --- NAVIGATION & RBAC --- */
        function setupNavigation(role) {
            const navContainer = document.getElementById('dynamic-nav-links');
            let html = `<button class="nav-btn active" onclick="switchView('booking', this)">Booking Portal</button>`;
            html += `<button class="nav-btn" onclick="switchView('checkin', this)">QR Pass & Check-In</button>`;

            if (role === 'reception' || role === 'admin' || role === 'housekeeping') {
                html += `<button class="nav-btn" onclick="switchView('housekeeping', this)">Housekeeping</button>`;
            }
            if (role === 'reception' || role === 'admin') {
                html += `<button class="nav-btn" onclick="switchView('analytics', this)">Revenue Analytics</button>`;
            }

            navContainer.innerHTML = html;
        }

        function switchView(viewName, clickedBtn = null) {
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

            if (viewName === 'booking') {
                document.getElementById('view-booking').classList.add('active');
            } else if (viewName === 'checkin') {
                document.getElementById('view-checkin').classList.add('active');
            } else if (viewName === 'housekeeping') {
                document.getElementById('view-housekeeping').classList.add('active');
            } else if (viewName === 'analytics') {
                document.getElementById('view-analytics').classList.add('active');
            }

            if (clickedBtn) {
                clickedBtn.classList.add('active');
            } else {
                const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.getAttribute('onclick')?.includes(viewName));
                if (btn) btn.classList.add('active');
            }
        }

        /* --- RENDER LOGIC & MODULES --- */
        function renderAllViews() {
            renderBookingCatalog();
            renderDigitalPass();
            renderHousekeepingGrid();
            renderAnalytics();
        }

        function getRoomImage(roomId) {
            const images = {
                "101": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80",
                "102": "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=600&q=80",
                "103": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80",
                "104": "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80",
                "105": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
                "106": "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=600&q=80",
                "107": "https://www.bing.com/th/id/OIP.6dOjVVnSyYi8YRpS2uiaKAHaEH?w=199&h=128&c=8&rs=1&qlt=90&o=6&pid=ImgAns&rm=2",
                "108": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
                "201": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80",
                "202": "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=600&q=80",
                "203": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&q=80",
                "204": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
                "205": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80",
                "206": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=600&q=80"
            };
            return images[roomId] || "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=600&q=80";
        }

        function renderBookingCatalog() {
            const rooms = JSON.parse(localStorage.getItem('gss_rooms'));
            const grid = document.getElementById('room-catalog-grid');
            const categoryFilter = document.getElementById('filter-category') ? document.getElementById('filter-category').value : 'all';
            grid.innerHTML = '';

            let filteredRooms = rooms;
            if (categoryFilter !== 'all') {
                filteredRooms = rooms.filter(r => r.type === categoryFilter);
            }

            if (filteredRooms.length === 0) {
                grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No rooms found matching the selected category.</p>`;
                return;
            }

            filteredRooms.forEach(room => {
                const isAvailable = room.status === 'Clean';
                grid.innerHTML += `
                    <div class="card room-card">
                        <div>
                            <img src="${getRoomImage(room.id)}" class="room-img" alt="Room">
                            <span class="badge ${room.status === 'Clean' ? 'badge-clean' : 'badge-occupied'}">${room.status}</span>
                            <h3 class="serif-font" style="margin-top: 10px;">${room.type} (Room ${room.id})</h3>
                            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 5px;">${room.capacity}</p>
                        </div>
                        <div class="room-meta">
                            <span class="price-tag">₱${room.price.toLocaleString()}<span style="font-size:0.8rem; color:var(--text-muted)">/night</span></span>
                            <button class="btn-gold" style="padding: 8px 16px; width: auto;" ${!isAvailable ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} onclick="bookRoom('${room.id}')">Reserve Now</button>
                        </div>
                    </div>
                `;
            });
        }

        function bookRoom(roomId) {
            let rooms = JSON.parse(localStorage.getItem('gss_rooms'));
            let room = rooms.find(r => r.id === roomId);
            if (!room) return;

            const arrival = document.getElementById('filter-arrival') ? document.getElementById('filter-arrival').value : new Date().toISOString().split('T')[0];
            const departure = document.getElementById('filter-departure') ? document.getElementById('filter-departure').value : new Date().toISOString().split('T')[0];

            const refCode = 'GSS-' + Math.floor(10000 + Math.random() * 90000);
            const downPay = Math.round(room.price * 0.3);

            const newBooking = {
                ref: refCode,
                guestName: currentUser.name,
                email: currentUser.email,
                roomType: room.type,
                roomId: room.id,
                downPayment: downPay,
                status: 'Reserved',
                date: arrival,
                departure: departure
            };

            let bookings = JSON.parse(localStorage.getItem('gss_bookings'));
            bookings.push(newBooking);
            localStorage.setItem('gss_bookings', JSON.stringify(bookings));

            // Mark room occupied
            room.status = 'Occupied';
            localStorage.setItem('gss_rooms', JSON.stringify(rooms));

            showToast(`Room ${roomId} successfully booked! Ref: ${refCode}`);
            renderAllViews();
            
            // Switch to check-in pass view
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.getElementById('view-checkin').classList.add('active');
        }

        function renderDigitalPass() {
            const bookings = JSON.parse(localStorage.getItem('gss_bookings'));
            const myBooking = bookings.slice().reverse().find(b => b.email === currentUser.email);
            const container = document.getElementById('user-digital-pass-container');

            if (!myBooking) {
                container.innerHTML = `<p style="color: var(--text-muted); text-align:center; padding: 30px;">No active reservations found. Book a room to generate your digital QR pass.</p>`;
                return;
            }

            container.innerHTML = `
                <div class="qr-card-display">
                    <p style="font-size: 0.8rem; letter-spacing: 0.1em; color: var(--gold); text-transform: uppercase;">Verified Pass</p>
                    <h3 class="serif-font" style="margin: 5px 0 15px;">${myBooking.roomType}</h3>
                    <div class="qr-placeholder">
                        <!-- Inline SVG QR Code Simulation -->
                        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                            <rect width="100" height="100" fill="#fff"/>
                            <rect x="10" y="10" width="30" height="30" fill="#000"/>
                            <rect x="60" y="10" width="30" height="30" fill="#000"/>
                            <rect x="10" y="60" width="30" height="30" fill="#000"/>
                            <rect x="45" y="45" width="20" height="20" fill="#000"/>
                            <rect x="70" y="70" width="20" height="20" fill="#000"/>
                        </svg>
                    </div>
                    <p style="font-size: 0.9rem; font-weight: 700; color: var(--text-main);">Ref: ${myBooking.ref}</p>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;">Room ID: ${myBooking.roomId} | Status: ${myBooking.status}</p>
                </div>
            `;
        }

        function verifyAndCheckInBooking() {
            const refId = document.getElementById('lookup-booking-id').value.trim();
            let bookings = JSON.parse(localStorage.getItem('gss_bookings'));
            let booking = bookings.find(b => b.ref === refId);
            const resultBox = document.getElementById('lookup-result-box');

            if (!booking) {
                resultBox.innerHTML = `<p style="color: #FCA5A5; font-size: 0.85rem;">Booking reference not found.</p>`;
                return;
            }

            booking.status = 'Checked-In';
            localStorage.setItem('gss_bookings', JSON.stringify(bookings));

            resultBox.innerHTML = `
                <div style="background: rgba(6, 78, 59, 0.4); border: 1px solid #059669; padding: 15px; border-radius: 8px;">
                    <p style="color: #34D399; font-weight: 600; font-size: 0.9rem;">✓ Guest Checked-In Successfully</p>
                    <p style="font-size: 0.85rem; margin-top: 5px;">Guest: ${booking.guestName}</p>
                    <p style="font-size: 0.85rem;">Room Assigned: ${booking.roomId}</p>
                </div>
            `;
            showToast(`Checked in guest ${booking.guestName}`);
            renderAllViews();
        }

        function renderHousekeepingGrid() {
            const rooms = JSON.parse(localStorage.getItem('gss_rooms'));
            const grid = document.getElementById('housekeeping-room-grid');
            grid.innerHTML = '';

            rooms.forEach(room => {
                let badgeClass = 'badge-clean';
                if (room.status === 'Dirty') badgeClass = 'badge-dirty';
                if (room.status === 'Occupied') badgeClass = 'badge-occupied';
                if (room.status === 'Maintenance') badgeClass = 'badge-maintenance';

                grid.innerHTML += `
                    <div class="card">
                        <img src="${getRoomImage(room.id)}" class="room-img" alt="Room" style="height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 12px; width: 100%;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h3 class="serif-font">Room ${room.id}</h3>
                            <span class="badge ${badgeClass}">${room.status}</span>
                        </div>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px;">Type: ${room.type}</p>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-demo" style="flex:1;" onclick="updateRoomStatus('${room.id}', 'Clean')">Mark Clean</button>
                            <button class="btn-demo" style="flex:1;" onclick="updateRoomStatus('${room.id}', 'Maintenance')">Maintenance</button>
                        </div>
                    </div>
                `;
            });
        }

        function updateRoomStatus(roomId, newStatus) {
            let rooms = JSON.parse(localStorage.getItem('gss_rooms'));
            let room = rooms.find(r => r.id === roomId);
            if (room) {
                room.status = newStatus;
                localStorage.setItem('gss_rooms', JSON.stringify(rooms));
                showToast(`Room ${roomId} updated to ${newStatus}`);
                renderAllViews();
            }
        }

        function renderAnalytics() {
            const bookings = JSON.parse(localStorage.getItem('gss_bookings'));
            const rooms = JSON.parse(localStorage.getItem('gss_rooms'));

            let totalRev = bookings.reduce((sum, b) => sum + (b.downPayment * 3), 0);
            let pendingBal = bookings.reduce((sum, b) => sum + b.downPayment, 0);
            let occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
            let occupancyRate = Math.round((occupiedRooms / rooms.length) * 100);

            // ADR & RevPAR calculation
            let adr = bookings.length > 0 ? Math.round(totalRev / bookings.length) : 180;
            let revpar = Math.round(adr * (occupancyRate / 100));

            document.getElementById('kpi-revenue').innerText = `₱${totalRev.toLocaleString()}`;
            document.getElementById('kpi-pending').innerText = `₱${pendingBal.toLocaleString()}`;
            document.getElementById('kpi-occupancy').innerText = `${occupancyRate}%`;
            document.getElementById('kpi-bookings').innerText = bookings.length;
            document.getElementById('kpi-adr').innerText = `₱${adr.toLocaleString()}`;
            document.getElementById('kpi-revpar').innerText = `₱${revpar.toLocaleString()}`;

            const tbody = document.getElementById('transactions-table-body');
            tbody.innerHTML = '';

            bookings.forEach(b => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${b.ref}</strong></td>
                        <td>${b.guestName}</td>
                        <td>${b.roomType}</td>
                        <td>₱${b.downPayment.toLocaleString()}</td>
                        <td><span class="badge badge-clean">${b.status}</span></td>
                        <td><button class="btn-logout" onclick="checkoutBooking('${b.ref}', '${b.roomId}')">Check-Out</button></td>
                    </tr>
                `;
            });
        }

        function exportSystemLogs() {
            const data = {
                users: JSON.parse(localStorage.getItem('gss_users')),
                rooms: JSON.parse(localStorage.getItem('gss_rooms')),
                bookings: JSON.parse(localStorage.getItem('gss_bookings')),
                exportDate: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'GrandStaycation_System_Logs.json';
            a.click();
            showToast("System logs exported successfully.");
        }

        function resetToDemoState() {
            if (confirm("Are you sure you want to reset all data to default demo state?")) {
                localStorage.clear();
                window.location.reload();
            }
        }

        function checkoutBooking(refCode, roomId) {
            let bookings = JSON.parse(localStorage.getItem('gss_bookings'));
            let rooms = JSON.parse(localStorage.getItem('gss_rooms'));

            // Remove or update booking status
            let booking = bookings.find(b => b.ref === refCode);
            if (booking) booking.status = 'Completed';
            localStorage.setItem('gss_bookings', JSON.stringify(bookings));

            // Set room to Dirty for Housekeeping turnaround
            let room = rooms.find(r => r.id === roomId);
            if (room) room.status = 'Dirty';
            localStorage.setItem('gss_rooms', JSON.stringify(rooms));

            showToast(`Guest checked out. Room ${roomId} marked DIRTY for housekeeping.`);
            renderAllViews();
        }

        /* --- SOUND EFFECTS (Web Audio API) --- */
        let audioCtx = null;
        function getAudioContext() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            return audioCtx;
        }

        function playClickSound() {
            try {
                const ctx = getAudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } catch(e) {}
        }

        function playSuccessSound() {
            try {
                const ctx = getAudioContext();
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.1);
                osc.frequency.setValueAtTime(783.99, now + 0.2);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(now + 0.4);
            } catch(e) {}
        }

        function playErrorSound() {
            try {
                const ctx = getAudioContext();
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.setValueAtTime(164.81, now + 0.15);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(now + 0.3);
            } catch(e) {}
        }

        /* --- TOAST NOTIFICATIONS --- */
        function showToast(message) {
            playClickSound();
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerText = message;
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }