import pool from './db.mjs';
import bcrypt from 'bcrypt';

async function seedDatabase() {
    try {
        console.log('1. Creating database tables...');
        await pool.query(`
            DROP TABLE IF EXISTS deployments, projects, users;
            
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL
            );

            CREATE TABLE projects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                team VARCHAR(100) NOT NULL
            );

            CREATE TABLE deployments (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id),
                environment VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL,
                git_commit VARCHAR(40),
                deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('2. Encrypting mock passwords...');
        const adminHash = await bcrypt.hash('admin123', 10);
        const mobileHash = await bcrypt.hash('mobile123', 10);

        console.log('3. Inserting Mock Users (RBAC)...');
        await pool.query(`
            INSERT INTO users (email, password_hash, role) VALUES 
            ('admin@company.com', $1, 'Admin'),
            ('mobile@company.com', $2, 'MobileTeamLead')
        `, [adminHash, mobileHash]);

        console.log('4. Inserting Mock Projects...');
        await pool.query(`
            INSERT INTO projects (name, team) VALUES 
            ('Global Billing Gateway', 'Finance'),
            ('iOS App Redesign', 'Mobile'),
            ('Android Push Service', 'Mobile')
        `);

        console.log('✅ Database successfully seeded!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();