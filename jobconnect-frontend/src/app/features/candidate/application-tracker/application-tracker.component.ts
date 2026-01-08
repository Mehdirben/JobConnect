import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
<<<<<<< HEAD
import { RouterLink } from '@angular/router';
=======
>>>>>>> upstream/main
import { CandidateService } from '../../../core/services/candidate.service';
import { Application, ApplicationStatus } from '../../../core/models';

interface StatusStep {
    status: ApplicationStatus;
    label: string;
    icon: string;
}

@Component({
    selector: 'app-application-tracker',
    standalone: true,
<<<<<<< HEAD
    imports: [CommonModule, RouterLink],
=======
    imports: [CommonModule],
>>>>>>> upstream/main
    templateUrl: './application-tracker.component.html',
    styleUrl: './application-tracker.component.scss'
})
export class ApplicationTrackerComponent implements OnInit {
    applications = signal<Application[]>([]);
    loading = signal(true);
<<<<<<< HEAD
=======
    loadingMore = signal(false);
    hasMore = signal(false);
    totalCount = signal(0);
    currentPage = 1;
    readonly pageSize = 20;
>>>>>>> upstream/main

    readonly statusSteps: StatusStep[] = [
        { status: ApplicationStatus.Submitted, label: 'Submitted', icon: '📤' },
        { status: ApplicationStatus.Screening, label: 'Screening', icon: '🔍' },
        { status: ApplicationStatus.Interview, label: 'Interview', icon: '💬' },
        { status: ApplicationStatus.Offer, label: 'Offer', icon: '🎉' },
        { status: ApplicationStatus.Hired, label: 'Hired', icon: '✅' }
    ];

    constructor(private candidateService: CandidateService) { }

    ngOnInit() {
        this.loadApplications();
    }

    private loadApplications() {
<<<<<<< HEAD
        this.candidateService.getApplications().subscribe({
            next: (apps) => {
                this.applications.set(apps);
=======
        this.currentPage = 1;
        this.loading.set(true);
        this.candidateService.getApplications(this.currentPage, this.pageSize).subscribe({
            next: (result) => {
                this.applications.set(result.items);
                this.totalCount.set(result.totalCount);
                this.hasMore.set(result.hasMore);
>>>>>>> upstream/main
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

<<<<<<< HEAD
=======
    loadMore() {
        this.currentPage++;
        this.loadingMore.set(true);
        this.candidateService.getApplications(this.currentPage, this.pageSize).subscribe({
            next: (result) => {
                this.applications.update(current => [...current, ...result.items]);
                this.hasMore.set(result.hasMore);
                this.loadingMore.set(false);
            },
            error: () => this.loadingMore.set(false)
        });
    }

>>>>>>> upstream/main
    getStatusIndex(status: string): number {
        return this.statusSteps.findIndex(s => s.status === status);
    }

    isStepComplete(appStatus: string, stepStatus: ApplicationStatus): boolean {
        const appIndex = this.getStatusIndex(appStatus);
        const stepIndex = this.statusSteps.findIndex(s => s.status === stepStatus);
        return appIndex >= stepIndex;
    }

    isStepCurrent(appStatus: string, stepStatus: ApplicationStatus): boolean {
        return appStatus === stepStatus;
    }

    isRejected(status: string): boolean {
        return status === ApplicationStatus.Rejected;
    }

    getScoreClass(score: number): string {
        if (score >= 70) return 'score-high';
        if (score >= 40) return 'score-medium';
        return 'score-low';
    }

    getActiveCount(): number {
        return this.applications().filter(app =>
            app.status !== ApplicationStatus.Rejected &&
            app.status !== ApplicationStatus.Hired
        ).length;
    }

    getInterviewCount(): number {
        return this.applications().filter(app =>
            app.status === ApplicationStatus.Interview
        ).length;
    }
}
