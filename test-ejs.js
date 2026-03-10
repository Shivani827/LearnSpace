const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'views', 'organiser-create-booking.ejs');
const template = fs.readFileSync(templatePath, 'utf8');

const mockUser = {
    name: 'Test Organiser',
    userId: 'ORG123',
    email: 'test@example.com'
};

try {
    ejs.render(template, { user: mockUser });
    console.log('✅ Template compiled successfully with email');

    ejs.render(template, { user: { name: 'No Email', userId: 'ORG456' } });
    console.log('✅ Template compiled successfully without email');
} catch (error) {
    console.error('❌ EJS Compilation Error:', error.message);
}
