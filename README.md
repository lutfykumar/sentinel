# Laravel React Inertia Boilerplate

A modern, full-stack boilerplate with Laravel, React, Inertia.js, TypeScript, Tailwind CSS v4, shadcn/ui components, and Two-Factor Authentication.

## ✨ Features

- **Laravel 12** - Latest Laravel framework
- **React 19** - Modern React with hooks and TypeScript
- **Inertia.js 2.0** - Build SPAs without complex routing
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Latest utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Two-Factor Authentication** - QR code based 2FA with Google Authenticator
- **Modern Authentication** - Login, register, password reset
- **Clean UI/UX** - Professional design with dark/light mode
- **Development Tools** - ESLint, Prettier, Pest testing
- **GitHub Actions** - CI/CD workflows included

## 🚀 Tech Stack

### Backend
- PHP 8.2+
- Laravel 12
- SQLite (default) / MySQL / PostgreSQL
- Inertia.js Laravel Adapter
- Google 2FA Laravel

### Frontend  
- React 19
- TypeScript
- Inertia.js React Adapter
- Tailwind CSS v4
- shadcn/ui Components
- Lucide React Icons
- Vite

### Development
- Pest (Testing)
- Laravel Pint (Code Style)
- ESLint & Prettier
- Concurrently (Development)

## 📋 Requirements

- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- SQLite (or MySQL/PostgreSQL)

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd laravel-react-inertia-boilerplate
```

### 2. Backend Setup
```bash
# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Create database (SQLite)
touch database/database.sqlite

# Run migrations
php artisan migrate
```

### 3. Frontend Setup
```bash
# Install Node.js dependencies
npm install

# Build assets
npm run build
```

### 4. Development
```bash
# Start development servers (Laravel + Vite + Queue)
composer run dev

# Or start individually:
php artisan serve       # Laravel server
npm run dev            # Vite dev server  
php artisan queue:work # Background jobs
```

Visit: http://localhost:8000

## 🔐 Two-Factor Authentication

The boilerplate includes a complete 2FA implementation:

1. **Setup**: Users can enable 2FA in their settings
2. **QR Code**: Generate QR codes for authenticator apps
3. **Backup Codes**: Recovery codes for account access
4. **Middleware**: Protect routes with 2FA verification

### 2FA Flow
1. User enables 2FA in settings
2. System generates secret key and QR code
3. User scans QR code with Google Authenticator
4. User enters verification code to confirm setup
5. 2FA required on subsequent logins

## 🎨 UI Components

Built with shadcn/ui components:
- Button, Input, Label, Select
- Dialog, Sheet, Tooltip, Dropdown Menu
- Avatar, Separator, Navigation Menu
- And many more...

All components are customizable and follow design system principles.

## 📁 Project Structure

```
├── app/
│   ├── Http/Controllers/     # API & Web Controllers
│   ├── Middleware/          # Custom middleware
│   ├── Models/             # Eloquent models
│   └── Providers/          # Service providers
├── database/
│   ├── factories/          # Model factories
│   ├── migrations/         # Database migrations  
│   └── seeders/           # Database seeders
├── resources/
│   ├── css/               # Styles (Tailwind)
│   ├── js/                # React components
│   │   ├── components/    # Reusable components
│   │   ├── layouts/       # Layout components
│   │   ├── pages/         # Page components
│   │   └── types/         # TypeScript types
│   └── views/             # Blade templates
├── routes/                # API & Web routes
└── tests/                # Pest tests
```

## 🧪 Testing

```bash
# Run all tests
composer test

# Run tests with coverage
php artisan test --coverage
```

## 🔧 Development Commands

```bash
# Backend
composer run dev          # Start all dev servers
php artisan serve         # Start Laravel server
php artisan queue:work    # Process background jobs
php artisan migrate       # Run migrations
php artisan test          # Run tests

# Frontend  
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run types            # Check TypeScript
```

## 📦 Production Deployment

### 1. Build Assets
```bash
npm run build
```

### 2. Optimize Laravel
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
composer install --optimize-autoloader --no-dev
```

### 3. Environment
- Set `APP_ENV=production`
- Set `APP_DEBUG=false`
- Configure database credentials
- Set up proper session/cache drivers

## 🛠 Customization

### Adding New Components
1. Use shadcn/ui CLI: `npx shadcn add <component>`
2. Components are added to `resources/js/components/ui/`
3. Import and use in your pages/layouts

### Database Changes
1. Create migration: `php artisan make:migration <name>`
2. Update models and factories
3. Run migration: `php artisan migrate`

### Adding Routes
1. Backend: Add to `routes/web.php` or `routes/api.php`
2. Frontend: Create page component in `resources/js/pages/`
3. Use Inertia routing conventions

## 📝 Environment Variables

Key environment variables:
```env
APP_NAME="Your App Name"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
# DB_HOST=127.0.0.1
# DB_DATABASE=your_database

MAIL_MAILER=log
MAIL_FROM_ADDRESS="hello@example.com"

# Add your specific configurations
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open-sourced software licensed under the [MIT license](LICENSE).

## 🙏 Acknowledgments

- [Laravel](https://laravel.com) - The PHP Framework
- [React](https://reactjs.org) - A JavaScript library for building user interfaces
- [Inertia.js](https://inertiajs.com) - Modern SPAs without the complexity
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Beautiful and accessible UI components

---

**Happy coding! 🎉**
