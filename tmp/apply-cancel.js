const fs = require('fs');

const FILE_PATH = 'views/admin-approved.ejs';
let content = fs.readFileSync(FILE_PATH, 'utf-8');

// 1. Inject alerts
content = content.replace(
    '<h1 class="page-title">Approved Requests</h1>',
    `<h1 class="page-title">Approved Requests</h1>
            <%
              const safeSuccess = typeof success !== 'undefined' ? success : null;
              const safeError = typeof error !== 'undefined' ? error : null;
            %>
            <% if (safeSuccess) { %>
              <div style="background:#d1fae5;color:#065f46;padding:12px 16px;border-radius:8px;margin-bottom:16px;">
                ✅ <%= safeSuccess %>
              </div>
            <% } %>
            <% if (safeError) { %>
              <div style="background:#fee2e2;color:#991b1b;padding:12px 16px;border-radius:8px;margin-bottom:16px;">
                ❌ <%= safeError %>
              </div>
            <% } %>`
);

// 2. Inject form button
content = content.replace(
    /<span class="status-badge">Approved<\/span>/g,
    `<div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
                                            <span class="status-badge" style="margin-top:0;">Approved</span>
                                            <form method="POST" action="/admin/bookings/cancel/<%= booking._id %>" 
                                              style="display:inline;"
                                              onsubmit="return confirmCancel(this, '<%= booking.roomNo %>', '<%= new Date(booking.date).toLocaleDateString() %>')">
                                              <input type="hidden" name="cancelReason" class="cancelReasonInput" value="Booking cancelled by admin." />
                                              <button type="submit" 
                                                style="background:#ef4444;color:white;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">
                                                🚫 Cancel Booking
                                              </button>
                                            </form>
                                        </div>`
);

// 3. Inject script
content = content.replace(
    `    <script>
        const logoutBtn = document.getElementById('logoutBtn');`,
    `    <script>
        function confirmCancel(form, roomNo, date) {
          const reason = prompt(
            'Cancel booking for ' + roomNo + ' on ' + date + '?\\n\\nEnter reason for cancellation (will be sent to user):',
            'Booking cancelled by admin due to scheduling conflict.'
          );
          
          if (reason === null) {
            return false;
          }

          if (reason.trim() === '') {
            alert('Please enter a reason for cancellation.');
            return false;
          }

          form.querySelector('.cancelReasonInput').value = reason.trim();
          return true;
        }

        const logoutBtn = document.getElementById('logoutBtn');`
);

fs.writeFileSync(FILE_PATH, content);
console.log('Successfully injected cancel feature into admin-approved.ejs');
