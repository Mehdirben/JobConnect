import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ConfigService } from '../../../core/services/config.service';
import { JobPosting } from '../../../core/models';
import { CustomDropdownComponent, DropdownOption } from '../../../shared/components/custom-dropdown/custom-dropdown.component';

@Component({
    selector: 'app-admin-jobs',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, CustomDropdownComponent],
    templateUrl: './admin-jobs.component.html',
    styleUrl: './admin-jobs.component.scss'
})
export class AdminJobsComponent implements OnInit {
    jobs = signal<JobPosting[]>([]);
    loading = signal(true);
    searchQuery = '';
    statusFilter = '';

    readonly statusOptions: DropdownOption[] = [
        { value: '', label: 'All Statuses', icon: '📋' },
        { value: 'Published', label: 'Published', icon: '✅' },
        { value: 'Draft', label: 'Draft', icon: '📝' },
        { value: 'Closed', label: 'Closed', icon: '🔒' }
    ];

    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    constructor(
        private http: HttpClient,
        private configService: ConfigService
    ) { }

    ngOnInit() {
        this.loadJobs();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.loadJobs();
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadJobs() {
        this.loading.set(true);
        let url = `${this.configService.apiUrl}/jobs/admin/all`;
        const params = new URLSearchParams();

        if (this.searchQuery) params.append('search', this.searchQuery);
        if (this.statusFilter) params.append('status', this.statusFilter);

        if (params.toString()) url += `?${params.toString()}`;

        this.http.get<JobPosting[]>(url).subscribe({
            next: (jobs) => {
                this.jobs.set(jobs);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }

    onSearchInput() {
        if (this.searchQuery.length === 0 || this.searchQuery.length >= 2) {
            this.searchSubject.next(this.searchQuery);
        }
    }

    onFilterChange() {
        this.loadJobs();
    }

    deleteJob(job: JobPosting) {
        if (confirm(`Are you sure you want to delete "${job.title}"?`)) {
            this.http.delete(`${this.configService.apiUrl}/jobs/admin/${job.id}`).subscribe({
                next: () => {
                    this.jobs.update(jobs => jobs.filter(j => j.id !== job.id));
                }
            });
        }
    }
}
