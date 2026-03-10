const fs = require('fs');

const dashboard = fs.readFileSync('views/admin-dashboard.ejs', 'utf-8');
const [head, tail] = dashboard.split('<main class="main-content">');
const footer = tail.substring(tail.lastIndexOf('</main>'));

const newMainContent = `
<%
  const safeEntry = typeof entry !== 'undefined' ? entry : {};
%>

<h2 style="margin:0 0 20px 0;">✏️ Edit Allocation Entry</h2>

<div style="background:#fef3c7;color:#92400e;padding:12px 16px;border-radius:8px;margin-bottom:20px;border:1px solid #f59e0b;">
  ⚠️ <strong>Class Shift Update:</strong> Use this to update the room when a class has shifted. The old room will be freed immediately after saving.
</div>

<div style="background:white;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <form method="POST" action="/admin/daily-allocation/edit/<%= safeEntry._id %>">
    <div style="display:flex;flex-wrap:wrap;gap:16px;">

      <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:200px;">
        <label style="font-size:13px;font-weight:600;">Date</label>
        <input type="date" name="date" value="<%= safeEntry.date %>" required 
          style="padding:10px;border:1px solid #d1d5db;border-radius:8px;" />
      </div>

      <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:200px;">
        <label style="font-size:13px;font-weight:600;">Period</label>
        <select name="period" required style="padding:10px;border:1px solid #d1d5db;border-radius:8px;">
          <% [1,2,3,4,5,6,7].forEach(p => { %>
            <option value="<%= p %>" <%- safeEntry.period === p ? 'selected' : '' %>>
              Period <%= p %>
            </option>
          <% }) %>
        </select>
      </div>

      <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:200px;">
        <label style="font-size:13px;font-weight:600;">Class</label>
        <input type="text" name="className" value="<%= safeEntry.className %>" required 
          placeholder="e.g. III CSE-B"
          style="padding:10px;border:1px solid #d1d5db;border-radius:8px;" />
      </div>

      <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:200px;">
        <label style="font-size:13px;font-weight:600;">New Room</label>
        <input type="text" name="roomNo" value="<%= safeEntry.roomNo %>" required 
          placeholder="e.g. A24"
          style="padding:10px;border:1px solid #d1d5db;border-radius:8px;" />
        <span style="font-size:11px;color:#64748b;">Change this to the new room the class has shifted to</span>
      </div>

    </div>

    <div style="margin-top:24px;background:#f0fdf4;padding:14px;border-radius:8px;border:1px solid #86efac;margin-bottom:20px;">
      <p style="font-size:13px;color:#166534;">
        <strong>Current:</strong> <%= safeEntry.className %> is in <strong><%= safeEntry.roomNo %></strong> for Period <%= safeEntry.period %><br/>
        <strong>After save:</strong> <%= safeEntry.roomNo %> will be freed and new room will be blocked
      </p>
    </div>

    <div style="display:flex;gap:12px;">
      <button type="submit" 
        style="padding:10px 24px;background:#1d4ed8;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
        💾 Save Changes
      </button>
      <a href="/admin/daily-allocation" 
        style="padding:10px 24px;background:#6b7280;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
        Cancel
      </a>
    </div>
  </form>
</div>
`;

const newFileContent = head + '<main class="main-content">' + newMainContent + footer;
fs.writeFileSync('views/admin-daily-allocation-edit.ejs', newFileContent);
console.log('Created views/admin-daily-allocation-edit.ejs');
