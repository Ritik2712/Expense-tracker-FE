import './globals.css';

export const metadata = {
  title: 'Expense Tracker Frontend',
  description: 'Next.js frontend for Expense Tracker API',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
