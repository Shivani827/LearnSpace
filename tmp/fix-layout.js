const fs = require('fs');

const dashboard = fs.readFileSync('views/admin-dashboard.ejs', 'utf-8');
let top = dashboard.substring(0, dashboard.indexOf('<main class="main-content">'));
let bottom = dashboard.substring(dashboard.lastIndexOf('</main>'));

// Fix active tab
top = top.replace('<a href="/admin" class="active">', '<a href="/admin">');
top = top.replace('<a href="/admin/daily-allocation">', '<a href="/admin/daily-allocation" class="active">');

const daily = fs.readFileSync('views/admin-daily-allocation.ejs', 'utf-8');
const mainStartIndex = daily.indexOf('<main class="main-content">');
const mainEndIndex = daily.lastIndexOf('</main>') + '</main>'.length;

const mainContent = daily.substring(mainStartIndex, mainEndIndex);

const newContent = top + mainContent + bottom;
fs.writeFileSync('views/admin-daily-allocation.ejs', newContent);
console.log('Fixed CSS and layout for admin-daily-allocation.ejs');
