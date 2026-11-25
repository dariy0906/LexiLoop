import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={
  title:'LexiLoop — Learn it. Use it. Remember it.',
  description:'Your vocabulary notebook, thoughtful review, and everyday practice.',
  appleWebApp:{capable:true,title:'LexiLoop',statusBarStyle:'default'},
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
