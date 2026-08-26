import './globals.css';

export const metadata = {
  title: 'Client Book',
  description: 'Manage massage clients, appointments, and reminders.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
