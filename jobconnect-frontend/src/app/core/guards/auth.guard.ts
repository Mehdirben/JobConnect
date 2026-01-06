import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    router.navigate(['/login']);
    return false;
};

export const guestGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        return true;
    }

    router.navigate(['/jobs']);
    return false;
};

export const candidateGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.userRole() === 'Candidate') {
        return true;
    }

    router.navigate(['/']);
    return false;
};

export const companyGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.userRole() === 'Company') {
        return true;
    }

    router.navigate(['/']);
    return false;
};

export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.userRole() === 'Admin') {
        return true;
    }

    router.navigate(['/']);
    return false;
};

// Guard to redirect admin users from public jobs page to admin jobs page
export const redirectAdminFromJobsGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.userRole() === 'Admin') {
        router.navigate(['/admin/jobs']);
        return false;
    }

    return true;
};

// Guard to redirect PWA standalone users away from landing page
export const pwaGuard: CanActivateFn = () => {
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    // Only check on browser platform
    if (isPlatformBrowser(platformId)) {
        // Check if running as PWA standalone
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true
            || document.referrer.includes('android-app://');

        if (isStandalone) {
            // PWA mode: redirect to jobs page
            router.navigate(['/jobs']);
            return false;
        }
    }

    // Browser mode: allow access to landing page
    return true;
};
