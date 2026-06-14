import React from 'react';
import AdminLayout from '../../components/AdminLayout';

export const metadata = {
  title: 'OpenCMS Admin Portal',
  description: 'WordPress + WooCommerce replica admin portal',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
