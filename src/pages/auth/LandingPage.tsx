// Re-export the new full landing page from the Landing module.
// App.tsx imports { LandingPage } from './pages/auth/LandingPage',
// so this file acts as the bridge.
export { LandingIndex as LandingPage } from '../Landing/index';
