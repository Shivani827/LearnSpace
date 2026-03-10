const fs = require('fs');
const path = require('path');
const viewsDir = 'views';
const files = fs.readdirSync(viewsDir).filter(f => f.startsWith('admin-') && f.endsWith('.ejs') && f !== 'admin-daily-allocation.ejs');
let count = 0;

files.forEach(f => {
    const filePath = path.join(viewsDir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('/admin/daily-allocation')) return;

    const inject = `
                <li>
                    <a href="/admin/daily-allocation">
                        <span class="icon">📅</span> Daily Allocation
                    </a>
                </li>
            </ul>`;

    const injectSingle = `
                <li><a href="/admin/daily-allocation"><span>📅</span> Daily Allocation</a></li>
            </ul>`;

    if (f === 'admin-timetable.ejs') {
        content = content.replace('</ul>', injectSingle);
    } else {
        content = content.replace(/<\/ul>\s*<\/aside>/, inject + '\n        </aside>');
    }

    fs.writeFileSync(filePath, content);
    count++;
});

console.log('Updated ' + count + ' files.');
