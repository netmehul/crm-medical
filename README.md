# Medical CRM

A modern, full-featured Customer Relationship Management system built for medical clinics and healthcare practices. Manage patients, appointments, prescriptions, inventory, and medical representatives — all from a single, intuitive dashboard.

## Features

- **Dashboard** — Overview of key metrics with interactive charts (powered by Recharts), quick stats, and recent activity
- **Patient Management** — Add, view, search, and manage patient records with detailed profile pages
- **Appointments** — Schedule and track patient appointments
- **Prescriptions** — Create and manage prescriptions linked to patient records
- **Inventory** — Track medical supplies and equipment stock levels
- **Medical Representatives** — Manage pharma rep contacts and interactions
- **Patient History** — View complete visit and treatment history
- **Import/Export** — Bulk import patient data via Excel/CSV files (xlsx)
- **Dark Mode** — Full light/dark theme support via next-themes
- **Responsive Design** — Works seamlessly across desktop, tablet, and mobile
- **Landing Page** — Professional marketing page with feature showcase, pricing, testimonials, and CTAs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Auth (ready) | Supabase Auth Helpers |
| State | React Context + TanStack React Query |
| File Handling | react-dropzone, xlsx |
| Theming | next-themes |

## Project Structure

```
medical-crm/
├── app/
│   ├── (dashboard)/          # Authenticated dashboard routes
│   │   ├── dashboard/        # Main dashboard with stats & charts
│   │   ├── patients/         # Patient list & detail pages
│   │   ├── appointments/     # Appointment management
│   │   ├── prescriptions/    # Prescription management
│   │   ├── inventory/        # Inventory tracking
│   │   ├── medical-reps/     # Medical representative management
│   │   ├── history/          # Patient history
│   │   ├── settings/         # App settings
│   │   └── layout.tsx        # Dashboard shell (sidebar + header)
│   ├── auth/
│   │   ├── login/            # Login page
│   │   └── signup/           # Signup page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles & theme variables
├── components/
│   ├── landing/              # Landing page sections
│   ├── layout/               # Sidebar & header
│   ├── modules/              # Feature-specific components
│   └── ui/                   # Reusable UI primitives
├── lib/
│   ├── auth-context.tsx      # Authentication context
│   ├── toast-context.tsx     # Toast notification system
│   ├── mock-data.ts          # Sample data for development
│   ├── motion.ts             # Framer Motion presets
│   ├── types.ts              # TypeScript type definitions
│   └── utils.ts              # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18.17 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/netmehul/crm-medical.git
cd crm-medical

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
npm run build
npm start
```

## Deployment

This project is optimized for deployment on [Vercel](https://vercel.com). Simply import the repository and Vercel will auto-detect Next.js and configure the build settings.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/netmehul/crm-medical)

## License

This project is private and proprietary.
