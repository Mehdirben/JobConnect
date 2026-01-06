import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../../core/services/config.service';
import { JobPosting } from '../../../core/models';

@Component({
    selector: 'app-admin-jobs',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    template: `
        <div class="admin-jobs">
            <header class="page-header">
                <div class="header-content">
                    <a routerLink="/admin/dashboard" class="back-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back to Dashboard
                    </a>
                    <h1>Manage Jobs</h1>
                </div>
            </header>

            <div class="filters-bar">
                <div class="search-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Search jobs..." 
                        [(ngModel)]="searchQuery"
                        (input)="onSearch()"
                    />
                </div>
                <select [(ngModel)]="statusFilter" (change)="loadJobs()" class="status-filter">
                    <option value="">All Statuses</option>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Closed">Closed</option>
                </select>
            </div>

            @if (loading()) {
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading jobs...</p>
                </div>
            } @else if (jobs().length === 0) {
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    <h3>No Jobs Found</h3>
                    <p>No jobs match your current filters.</p>
                </div>
            } @else {
                <div class="jobs-table-container">
                    <table class="jobs-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Company</th>
                                <th>Status</th>
                                <th>Applications</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (job of jobs(); track job.id) {
                                <tr>
                                    <td class="job-title">{{ job.title }}</td>
                                    <td>{{ job.companyName }}</td>
                                    <td>
                                        <span class="status-badge" [class]="'status-' + job.status.toLowerCase()">
                                            {{ job.status }}
                                        </span>
                                    </td>
                                    <td>{{ job.applicationCount }}</td>
                                    <td>{{ job.createdAt | date:'mediumDate' }}</td>
                                    <td class="actions-cell">
                                        <a [routerLink]="['/admin/jobs', job.id, 'edit']" class="action-btn edit-btn" title="Edit">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </a>
                                        <button class="action-btn delete-btn" (click)="deleteJob(job)" title="Delete">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            }
        </div>
    `,
    styles: [`
        .admin-jobs {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .page-header {
            margin-bottom: 2rem;
        }

        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #6366f1;
            text-decoration: none;
            font-weight: 500;
            margin-bottom: 1rem;
            transition: color 0.2s;
        }

        .back-link:hover {
            color: #4f46e5;
        }

        .page-header h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #1e293b;
        }

        .filters-bar {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
        }

        .search-box {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            flex: 1;
            min-width: 250px;
        }

        .search-box svg {
            color: #94a3b8;
        }

        .search-box input {
            border: none;
            outline: none;
            width: 100%;
            font-size: 0.95rem;
        }

        .status-filter {
            padding: 0.75rem 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: white;
            font-size: 0.95rem;
            cursor: pointer;
        }

        .jobs-table-container {
            background: white;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
        }

        .jobs-table {
            width: 100%;
            border-collapse: collapse;
        }

        .jobs-table th {
            background: #f8fafc;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: #475569;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .jobs-table td {
            padding: 1rem;
            border-top: 1px solid #e2e8f0;
            color: #334155;
        }

        .job-title {
            font-weight: 600;
            color: #1e293b;
        }

        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .status-published {
            background: #dcfce7;
            color: #166534;
        }

        .status-draft {
            background: #fef3c7;
            color: #92400e;
        }

        .status-closed {
            background: #fee2e2;
            color: #991b1b;
        }

        .actions-cell {
            display: flex;
            gap: 0.5rem;
        }

        .action-btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }

        .edit-btn {
            background: #e0e7ff;
            color: #4338ca;
        }

        .edit-btn:hover {
            background: #c7d2fe;
        }

        .delete-btn {
            background: #fee2e2;
            color: #dc2626;
        }

        .delete-btn:hover {
            background: #fecaca;
        }

        .loading-state,
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: #64748b;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .empty-state svg {
            color: #94a3b8;
            margin-bottom: 1rem;
        }

        .empty-state h3 {
            font-size: 1.25rem;
            color: #475569;
            margin-bottom: 0.5rem;
        }

        @media (max-width: 768px) {
            .admin-jobs {
                padding: 1rem;
            }

            .jobs-table {
                font-size: 0.875rem;
            }

            .jobs-table th:nth-child(4),
            .jobs-table td:nth-child(4),
            .jobs-table th:nth-child(5),
            .jobs-table td:nth-child(5) {
                display: none;
            }
        }
    `]
})
export class AdminJobsComponent implements OnInit {
    jobs = signal<JobPosting[]>([]);
    loading = signal(true);
    searchQuery = '';
    statusFilter = '';
    private searchTimeout: any;

    constructor(
        private http: HttpClient,
        private configService: ConfigService
    ) { }

    ngOnInit() {
        this.loadJobs();
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

    onSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.loadJobs(), 300);
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
